using System.Text.Json;
using Npgsql;
using server;
using server.Classes;
using server.Services;
using server.Config;
using server.Extensions;
using Microsoft.AspNetCore.Mvc;

// skapar en ny ASP.NET Core applikation
var builder = WebApplication.CreateBuilder(args);

// sessionshantering för att spara användarinformation mellan anrop
// viktigt för att kunna hålla reda på inloggade användare utan att behöva skicka inloggningsuppgifter varje gång
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
  options.IdleTimeout = TimeSpan.FromMinutes(20);
  options.Cookie.HttpOnly = true;
  options.Cookie.IsEssential = true;
});

Database database = new Database();
NpgsqlDataSource db = database.Connection();
builder.Services.AddSingleton(db);
builder.Services.AddSingleton(database);  // Lägg till denna rad för att registrera Database-klassen

// Mailkit
// e-posttjänst för att skicka bekräftelser och välkomstmeddelanden
// viktigt för användarregistrering och chattokenfunktionalitet
var emailSettings = builder.Configuration.GetSection("Email").Get<EmailSettings>();
if (emailSettings != null)
{
  builder.Services.AddSingleton(emailSettings);
}
else
{
  throw new InvalidOperationException("Email settings are not configured properly.");
}
builder.Services.AddScoped<IEmailService, EmailService>();

var app = builder.Build();

app.UseSession();

// API-endpoints för autentisering 
// kontrollerar om användaren är inloggad 
app.MapGet("/api/login", (Func<HttpContext, Task<IResult>>)GetLogin);
// loggar in användaren
app.MapPost("/api/login", (Func<HttpContext, LoginRequest, NpgsqlDataSource, Task<IResult>>)Login);
// loggar ut användaren
app.MapDelete("/api/login", (Func<HttpContext, Task<IResult>>)Logout);


// hämtar information om den inloggade användaren från sessionen
// används för att verifiera inloggningsstatus och hämta användarinformation
static async Task<IResult> GetLogin(HttpContext context)
{
  Console.WriteLine("GetSession is called..Getting session");
  var key = await Task.Run(() => context.Session.GetString("User"));
  if (key == null)
  {
    return Results.NotFound(new { message = "No one is logged in." });
  }
  var user = JsonSerializer.Deserialize<User>(key);
  Console.WriteLine("user: " + user);
  return Results.Ok(user);
}

// hanterar inloggningsförsök genom att validera användaruppgifter mot databasen
// begränsar inloggning till endast SUPPORT och ADMIN-roller så att USER inte kan logga in
static async Task<IResult> Login(HttpContext context, LoginRequest request, NpgsqlDataSource db)
{
  // förhindrar dubbla inloggningar i samma session
  if (context.Session.GetString("User") != null)
  {
    return Results.BadRequest(new { message = "Someone is already logged in." });
  }
  Console.WriteLine("SetSession is called..Setting session");

  await using var cmd = db.CreateCommand(@"
        SELECT * FROM users 
        WHERE username = @username AND password = @password 
        AND role IN ('SUPPORT', 'ADMIN')");
  cmd.Parameters.AddWithValue("@username", request.Username);
  cmd.Parameters.AddWithValue("@password", request.Password);

  await using (var reader = await cmd.ExecuteReaderAsync())
  {
    if (reader.HasRows)
    {
      while (await reader.ReadAsync())
      {
        string email = reader.GetString(reader.GetOrdinal("email"));
        User user = new User(
            reader.GetInt32(reader.GetOrdinal("id")),
            reader.GetString(reader.GetOrdinal("username")),
            email,
            Enum.Parse<Role>(reader.GetString(reader.GetOrdinal("role")))
            );
        // sparar användarinformation i session för framtida anrop
        await Task.Run(() => context.Session.SetString("User", JsonSerializer.Serialize(user)));
        return Results.Ok(new
        {
          id = user.Id,
          username = user.Username,
          email = user.Email,
          role = user.Role.ToString()
        });
      }
    }
  }
  // om användaren inte finns i databasen så returnerar vi ett felmeddelande
  return Results.NotFound(new { message = "Felaktigt användarnamn eller lösenord, eller så har du inte behörighet att logga in" });
}

// loggar ut användaren genom att rensa sessionen
static async Task<IResult> Logout(HttpContext context)
{
  if (context.Session.GetString("User") == null)
  {
    return Results.Conflict(new { message = "Ingen inloggning hittad." });
  }
  Console.WriteLine("ClearSession is called..Clearing session");
  await Task.Run(context.Session.Clear);
  return Results.Ok(new { message = "Utloggad." });
}




// Mailkit

// skickar ett e-postmeddelande
app.MapPost("/api/email", SendEmail);

static async Task<IResult> SendEmail(EmailRequest request, IEmailService email)
{
  Console.WriteLine("SendEmail is called..Sending email");

  await email.SendEmailAsync(request.To, request.Subject, request.Body);

  Console.WriteLine("Email sent to: " + request.To + " with subject: " + request.Subject + " and body: " + request.Body);
  return Results.Ok(new { message = "Email sent." });
}



// skapa customer_profiles, ticket och chattoken 
// formulärhantering för att skapa nya ärenden
app.MapPost("/api/form", async (FormRequest form, NpgsqlDataSource db) =>
{
  try
  {
    // 1. skapar eller uppdaterar kundprofil baserat på e-postadress
    // detta gör så att kunder kan använda systemet utan att skapa ett lösenord
    await using var cmd1 = db.CreateCommand(@"
            INSERT INTO customer_profiles (email)
            VALUES (@email)
            ON CONFLICT (email) DO UPDATE 
            SET email = EXCLUDED.email
            RETURNING id");
    cmd1.Parameters.AddWithValue("@email", form.Email);
    var customerId = await cmd1.ExecuteScalarAsync();

    // 2. skapar en ny ticket och genererar en unik chat_token
    // denna token används för att kunderna ska ha en länk till sitt ärende och chatta med support utan att behöva skapa ett konto
    await using var cmd2 = db.CreateCommand(@"
            INSERT INTO tickets (customer_profile_id, subject, status, product_id)
            VALUES (@customerId, @subject, 'NY', @productId)
            RETURNING chat_token");
    cmd2.Parameters.AddWithValue("@customerId", customerId);
    cmd2.Parameters.AddWithValue("@subject", form.Subject);
    cmd2.Parameters.AddWithValue("@productId", form.ProductId);
    var chatToken = await cmd2.ExecuteScalarAsync();

    // 3. spara första meddelandet från kunden så att vi kan visa det i chatten direkt
    await using var cmd3 = db.CreateCommand(@"
            INSERT INTO messages (ticket_id, sender_type, message_text)
            VALUES ((SELECT id FROM tickets WHERE chat_token = @chatToken), 'USER', @message)");
    cmd3.Parameters.AddWithValue("@chatToken", chatToken);
    cmd3.Parameters.AddWithValue("@message", form.Message);
    await cmd3.ExecuteNonQueryAsync();

    Console.WriteLine("Chat token generated: " + chatToken);

    return Results.Ok(new { chatToken, message = "Ärendet har skapats." });
  }
  catch (Exception ex)
  {
    // loggar fel för felsökning och returnerar felmeddelande till kunden
    Console.WriteLine("Error: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
});




// hämtar meddelandehistorik för ett specifikt ärende baserat på chat_token
// används av chattgränssnittet för att visa alla meddelanden i ett ärende
app.MapGet("/api/messages/{chatToken}", async (string chatToken, NpgsqlDataSource db) =>
{
  await using var cmd = db.CreateCommand(@"
        SELECT messages.id, messages.ticket_id, messages.sender_type, messages.message_text, messages.created_at
        FROM messages
        JOIN tickets ON tickets.id = messages.ticket_id
        WHERE tickets.chat_token = @chatToken::uuid
        ORDER BY messages.created_at"); // behöver konvertera textsträngen till en UUID innan vi jämför den med databasen därför ::uuid
  cmd.Parameters.AddWithValue("@chatToken", chatToken);

  // skapar en lista för att lagra meddelanden detta behövs för att kunna returnera meddelanden
  var messages = new List<Dictionary<string, object>>();
  await using var reader = await cmd.ExecuteReaderAsync();
  while (await reader.ReadAsync())
  {
    messages.Add(new Dictionary<string, object>
        {
            { "id", reader.GetInt32(0) },
            { "ticket_id", reader.GetInt32(1) },
            { "sender_type", reader.GetString(2) },
            { "message_text", reader.GetString(3) },
            { "created_at", reader.GetDateTime(4) }
        });
  }
  return Results.Ok(messages);
});

// lägger till ett nytt meddelande i ett befintligt ärende
// behöver uppdateras för att hantera olika avsändartyper (USER, SUPPORT, ADMIN)
app.MapPost("/api/messages/{chatToken}", async (string chatToken, MessageRequest request, NpgsqlDataSource db) =>
{
  // validera senderType för att säkerställa att det är ett giltigt värde
  // defaultar till USER om inget annat anges för att förhindra felaktiga värden
  string senderType = request.SenderType ?? "USER";

  // kontrollera att senderType är ett giltigt role värde
  if (!Enum.TryParse<Role>(senderType, out _))
  {
    senderType = "USER"; // fallback till USER om ogiltig roll
  }

  await using var cmd = db.CreateCommand(@"
        INSERT INTO messages (ticket_id, sender_type, message_text)
        VALUES ((SELECT id FROM tickets WHERE chat_token = @chatToken::uuid), @senderType::role, @message)");

  cmd.Parameters.AddWithValue("@chatToken", chatToken);
  cmd.Parameters.AddWithValue("@senderType", senderType);
  cmd.Parameters.AddWithValue("@message", request.Message);
  await cmd.ExecuteNonQueryAsync();
  return Results.Ok();
});

// Uppdatera status för ett ärende
// endast SUPPORT och ADMIN bör kunna uppdatera ärendestatus
app.MapPatch("/api/tickets/{id}/status", async (int id, TicketStatusUpdate request, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
            UPDATE tickets 
            SET status = @status::ticket_status,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = @id");

    cmd.Parameters.AddWithValue("@id", id);
    cmd.Parameters.AddWithValue("@status", request.Status);

    int rowsAffected = await cmd.ExecuteNonQueryAsync();

    // kontrollerar om ärendet finns i databasen
    if (rowsAffected == 0)
    {
      return Results.NotFound();
    }

    return Results.Ok();
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error updating ticket status: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.SUPPORT);


// hämtar alla ärenden för översikt
// används i ärendelistan för att visa alla aktiva ärenden
// endast SUPPORT och ADMIN bör ha tillgång till denna data
app.MapGet("/api/tickets", async (NpgsqlDataSource db, HttpContext context) =>
{
  try
  {
    // Hämta användarinformation från sessionen
    var userJson = context.Session.GetString("User");
    if (userJson == null)
    {
      return Results.Unauthorized();
    }

    var user = JsonSerializer.Deserialize<User>(userJson);

    // Hämta användarens company_id från databasen för att kunna filtrera tickets
    await using var userCmd = db.CreateCommand(@"
            SELECT company_id FROM users WHERE id = @userId");
    userCmd.Parameters.AddWithValue("@userId", user.Id);
    var companyIdResult = await userCmd.ExecuteScalarAsync();

    string query = @"
            SELECT tickets.id, tickets.status, tickets.subject, tickets.chat_token,
                   customer_profiles.email as customer_email,
                   companies.name as company_name
            FROM tickets
            JOIN customer_profiles ON tickets.customer_profile_id = customer_profiles.id
            JOIN products ON tickets.product_id = products.id
            JOIN companies ON products.company_id = companies.id";

    // Om användaren är support och har ett företag, filtrera tickets baserat på företag
    if (user.Role == Role.SUPPORT && companyIdResult != null && companyIdResult != DBNull.Value)
    {
      query += " WHERE products.company_id = @companyId";
    }

    query += " ORDER BY tickets.created_at DESC";

    await using var cmd = db.CreateCommand(query);

    // Lägg till parameter om vi filtrerar på företag
    if (user.Role == Role.SUPPORT && companyIdResult != null && companyIdResult != DBNull.Value)
    {
      cmd.Parameters.AddWithValue("@companyId", companyIdResult);
    }

    var tickets = new List<Dictionary<string, object>>();
    await using var reader = await cmd.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
      tickets.Add(new Dictionary<string, object>
      {
        { "id", reader.GetInt32(0) },
        { "status", reader.GetString(1) },
        { "subject", reader.GetString(2) },
        { "chat_token", reader.GetGuid(3) },
        { "customer_email", reader.GetString(4) },
        { "company_name", reader.GetString(5) }
      });
    }

    return Results.Ok(tickets);
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching tickets: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.SUPPORT);

// endpoint för att hämta produkter för ett specifikt företag
// används i formuläret för att låta kunder välja vilken produkt ärendet gäller
app.MapGet("/api/companies/{companyId}/products", async (int companyId, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
            SELECT id, name, description
            FROM products
            WHERE company_id = @companyId
            ORDER BY name");

    cmd.Parameters.AddWithValue("@companyId", companyId);

    var products = new List<Dictionary<string, object>>();
    await using var reader = await cmd.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
      products.Add(new Dictionary<string, object>
            {
                { "id", reader.GetInt32(0) },
                { "name", reader.GetString(1) },
                { "description", reader.GetString(2) }
            });
    }

    return Results.Ok(products);
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching products: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
});

// endpoint för att hämta alla företag
// används i formuläret för att låta kunder välja vilket företag de vill kontakta
app.MapGet("/api/companies", async (NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
            SELECT id, name, domain
            FROM companies
            ORDER BY name");

    var companies = new List<Dictionary<string, object>>();
    await using var reader = await cmd.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
      companies.Add(new Dictionary<string, object>
            {
                { "id", reader.GetInt32(0) },
                { "name", reader.GetString(1) },
                { "domain", reader.GetString(2) }
            });
    }

    return Results.Ok(companies);
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching companies: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
});

// Byta lösenord
// endast inloggade användare bör kunna ändra lösenord
app.MapPost("/api/Newpassword", async (PasswordRequest request, NpgsqlDataSource db) =>
{
  try
  {
    // Verifiera att användaren finns och att nuvarande lösenord är korrekt
    await using var verifyCmd = db.CreateCommand(@"
            SELECT id FROM users 
            WHERE email = @email AND password = @password");

    verifyCmd.Parameters.AddWithValue("@email", request.email);
    verifyCmd.Parameters.AddWithValue("@password", request.password);

    var userId = await verifyCmd.ExecuteScalarAsync();

    if (userId == null)
    {
      return Results.BadRequest(new { message = "Felaktigt lösenord eller e-post" });
    }

    // Uppdatera lösenordet
    await using var updateCmd = db.CreateCommand(@"
            UPDATE users 
            SET password = @newPassword
            WHERE id = @userId");

    updateCmd.Parameters.AddWithValue("@newPassword", request.newPassword);
    updateCmd.Parameters.AddWithValue("@userId", userId);

    int rowsAffected = await updateCmd.ExecuteNonQueryAsync();

    if (rowsAffected > 0)
    {
      return Results.Ok(new { message = "Lösenord uppdaterat" });
    }

    return Results.BadRequest(new { message = "Kunde inte uppdatera lösenordet" });
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error updating password: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.SUPPORT);

// denhär koden Skapar  api-som tar emot data för att skapa nya användare
// När någon skickar data hit körs koden nedan för att spara användaren i databasen
app.MapPost("/api/admin", async (AdminRequest admin, NpgsqlDataSource db) => // Tar emot användardata 
{
  try
  {
    // Skapar en SQL-fråga för att lägga till en ny användare i databasen
    await using var cmd = db.CreateCommand(@"
            INSERT INTO users (username, password, email, role, company_id)
            VALUES (@username, @password, @email, @role::role, @companyId)");
    // Lägger till parametrar för att förhindra SQL-injektion
    cmd.Parameters.AddWithValue("@username", admin.Username);
    cmd.Parameters.AddWithValue("@password", admin.Password);
    cmd.Parameters.AddWithValue("@email", admin.Email);
    cmd.Parameters.AddWithValue("@role", admin.Role); // Konverterar rolltexten till databastypen "role" för att säkerställa giltigt värde
    cmd.Parameters.AddWithValue("@companyId", admin.CompanyId); // Lägger till company_id-parametern
    await cmd.ExecuteNonQueryAsync();

    return Results.Ok(new { message = "Support user created." });
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// API endpoint för användarstatistik - Antal användare per roll
app.MapGet("/api/statistics/user-counts", async (NpgsqlDataSource db) =>
{
  try
  {
    var result = new Dictionary<string, int>();

    await using var cmd = db.CreateCommand(@"
            SELECT role::text, COUNT(*) 
            FROM users 
            GROUP BY role;");

    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
      string role = reader.GetString(0);
      int count = reader.GetInt32(1);
      result[role] = count;
    }

    return Results.Ok(result);
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching user statistics: " + ex.Message);
    return Results.Problem($"Internal server error: {ex.Message}");
  }
});

await app.RunAsync();