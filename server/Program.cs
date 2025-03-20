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
app.MapGet("/api/chat/{chatToken}", async (string chatToken, NpgsqlDataSource db) =>
{
  try
  {
    // Hämta status och id för ärendet
    await using var ticketCmd = db.CreateCommand(@"
      SELECT id, status FROM tickets 
      WHERE chat_token = @chatToken::uuid");

    ticketCmd.Parameters.AddWithValue("@chatToken", chatToken);

    int ticketId = 0;
    string ticketStatus = "";

    await using var ticketReader = await ticketCmd.ExecuteReaderAsync();
    if (await ticketReader.ReadAsync())
    {
      ticketId = ticketReader.GetInt32(0);
      ticketStatus = ticketReader.GetString(1);
    }
    else
    {
      return Results.NotFound();
    }

    // Hämta meddelanden
    await using var msgCmd = db.CreateCommand(@"
      SELECT id, sender_type, message_text, created_at 
      FROM messages 
      WHERE ticket_id = @ticketId
      ORDER BY created_at ASC");

    msgCmd.Parameters.AddWithValue("@ticketId", ticketId);

    List<Dictionary<string, object>> messages = new();

    await using var reader = await msgCmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
      var message = new Dictionary<string, object>
      {
        { "id", reader.GetInt32(0) },
        { "sender_type", reader.GetString(1) },
        { "message_text", reader.GetString(2) },
        { "created_at", reader.GetDateTime(3) }
      };

      messages.Add(message);
    }

    return Results.Ok(new
    {
      ticket_id = ticketId,
      ticket_status = ticketStatus,
      messages = messages
    });
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching messages: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
});

// lägger till ett nytt meddelande i ett befintligt ärende
// behöver uppdateras för att hantera olika avsändartyper (USER, SUPPORT, ADMIN)
app.MapPost("/api/chat/{chatToken}/message", async (string chatToken, MessageRequest request, NpgsqlDataSource db) =>
{
  // validera senderType för att säkerställa att det är ett giltigt värde
  // defaultar till USER om inget annat anges för att förhindra felaktiga värden
  string senderType = request.SenderType ?? "USER";

  // kontrollera att senderType är ett giltigt role värde
  if (!Enum.TryParse<Role>(senderType, out _))
  {
    senderType = "USER"; // fallback till USER om ogiltig roll
  }

  // Kontrollera först om ärendet är stängt
  await using var statusCmd = db.CreateCommand(@"
        SELECT status FROM tickets 
        WHERE chat_token = @chatToken::uuid");

  statusCmd.Parameters.AddWithValue("@chatToken", chatToken);
  var status = await statusCmd.ExecuteScalarAsync() as string;

  // Om ärendet är stängt, tillåt inte nya meddelanden
  if (status == "STÄNGD" && senderType == "USER")
  {
    return Results.BadRequest(new { message = "Ärendet är stängt. Vänligen lämna feedback istället." });
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
    // Hämta tidigare status
    string oldStatus = "";
    await using var getStatusCmd = db.CreateCommand(@"
      SELECT status FROM tickets WHERE id = @id");
    getStatusCmd.Parameters.AddWithValue("@id", id);
    var result = await getStatusCmd.ExecuteScalarAsync();
    if (result != null)
    {
      oldStatus = result.ToString();
    }

    // Uppdatera status
    await using var cmd = db.CreateCommand(@"
            UPDATE tickets 
            SET status = @status::ticket_status,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
            RETURNING id");

    cmd.Parameters.AddWithValue("@id", id);
    cmd.Parameters.AddWithValue("@status", request.Status);

    var ticketId = await cmd.ExecuteScalarAsync();

    if (ticketId == null)
    {
      return Results.NotFound();
    }

    // Om ärendet stängs, lägg till ett systemmeddelande
    if (request.Status == "STÄNGD" && oldStatus != "STÄNGD")
    {
      await using var msgCmd = db.CreateCommand(@"
                INSERT INTO messages (ticket_id, sender_type, message_text)
                VALUES (@ticketId, 'SUPPORT', 'Detta ärende har nu stängts. Vänligen lämna feedback på din upplevelse.')");
      msgCmd.Parameters.AddWithValue("@ticketId", id);
      await msgCmd.ExecuteNonQueryAsync();
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

    // filtrera tickets baserat på företag
    if ((user.Role == Role.SUPPORT || user.Role == Role.ADMIN) && companyIdResult != null && companyIdResult != DBNull.Value)
    {
      query += " WHERE products.company_id = @companyId";
    }

    query += " ORDER BY tickets.created_at DESC";

    await using var cmd = db.CreateCommand(query);

    // parameter för filtrering av företag
    if ((user.Role == Role.SUPPORT || user.Role == Role.ADMIN) && companyIdResult != null && companyIdResult != DBNull.Value)
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

// denhär koden Skapar  api-som tar emot data för att skapa nya support 
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



// Hämta alla supportanvändare
app.MapGet("/api/support-users", async (NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.company_id
      FROM users u
      WHERE u.role = 'SUPPORT'
      ORDER BY u.username");

    var users = new List<Dictionary<string, object>>();
    await using var reader = await cmd.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
      users.Add(new Dictionary<string, object>
      {
        { "id", reader.GetInt32(0) },
        { "username", reader.GetString(1) },
        { "email", reader.GetString(2) },
        { "company_id", reader.GetInt32(3) }
      });
    }

    return Results.Ok(users);
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching support users: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// Uppdatera en supportanvändare
app.MapPut("/api/support-users/{id}", async (int id, UserUpdateRequest request, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
      UPDATE users 
      SET 
        username = @username, 
        email = @email, 
        company_id = @companyId
      WHERE id = @id AND role = 'SUPPORT'
      RETURNING 
        id, 
        username, 
        email, 
        company_id");

    cmd.Parameters.AddWithValue("@id", id);
    cmd.Parameters.AddWithValue("@username", request.Username);
    cmd.Parameters.AddWithValue("@email", request.Email);
    cmd.Parameters.AddWithValue("@companyId", request.CompanyId);

    // Kolla om användaren existerar och uppdatera den
    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
      var user = new Dictionary<string, object>
      {
        { "id", reader.GetInt32(0) },
        { "username", reader.GetString(1) },
        { "email", reader.GetString(2) },
        { "company_id", reader.GetInt32(3) }
      };

      return Results.Ok(user);
    }
    else
    {
      return Results.NotFound(new { message = "Användaren hittades inte" });
    }
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error updating support user: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// Ta bort en supportanvändare
app.MapDelete("/api/support-users/{id}", async (int id, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
      DELETE FROM users 
      WHERE id = @id AND role = 'SUPPORT'
      RETURNING id");

    cmd.Parameters.AddWithValue("@id", id);

    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
      return Results.Ok(new { message = "Användaren har tagits bort" });
    }
    else
    {
      return Results.NotFound(new { message = "Användaren hittades inte" });
    }
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error deleting support user: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// Lägga till en ny produkt för ett företag
app.MapPost("/api/companies/{companyId}/products", async (int companyId, ProductRequest request, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
      INSERT INTO products (name, description, company_id)
      VALUES (@name, @description, @companyId)
      RETURNING id, name, description");

    cmd.Parameters.AddWithValue("@name", request.Name);
    cmd.Parameters.AddWithValue("@description", request.Description);
    cmd.Parameters.AddWithValue("@companyId", companyId);

    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
      var product = new Dictionary<string, object>
      {
        { "id", reader.GetInt32(0) },
        { "name", reader.GetString(1) },
        { "description", reader.GetString(2) }
      };

      return Results.Ok(product);
    }
    else
    {
      return Results.BadRequest(new { message = "Kunde inte lägga till produkt" });
    }
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error adding product: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// Uppdatera en produkt
app.MapPut("/api/companies/{companyId}/products/{productId}", async (int companyId, int productId, ProductRequest request, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
      UPDATE products 
      SET name = @name, description = @description
      WHERE id = @productId AND company_id = @companyId
      RETURNING id, name, description");

    cmd.Parameters.AddWithValue("@productId", productId);
    cmd.Parameters.AddWithValue("@companyId", companyId);
    cmd.Parameters.AddWithValue("@name", request.Name);
    cmd.Parameters.AddWithValue("@description", request.Description);

    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
      var product = new Dictionary<string, object>
      {
        { "id", reader.GetInt32(0) },
        { "name", reader.GetString(1) },
        { "description", reader.GetString(2) }
      };

      return Results.Ok(product);
    }
    else
    {
      return Results.NotFound(new { message = "Produkten hittades inte" });
    }
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error updating product: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// Ta bort en produkt
app.MapDelete("/api/companies/{companyId}/products/{productId}", async (int companyId, int productId, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
      DELETE FROM products 
      WHERE id = @productId AND company_id = @companyId
      RETURNING id");

    cmd.Parameters.AddWithValue("@productId", productId);
    cmd.Parameters.AddWithValue("@companyId", companyId);

    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
      return Results.Ok(new { message = "Produkten har tagits bort" });
    }
    else
    {
      return Results.NotFound(new { message = "Produkten hittades inte" });
    }
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error deleting product: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// Hämta användardetaljer inklusive företags-ID
app.MapGet("/api/users/{id}", async (int id, NpgsqlDataSource db, HttpContext context) =>
{
  try
  {
    // Kontrollera att användaren är inloggad och har rätt att se informationen
    var userJson = context.Session.GetString("User");
    if (userJson == null)
    {
      return Results.Unauthorized();
    }

    var sessionUser = JsonSerializer.Deserialize<User>(userJson);

    // Endast admin eller användaren själv kan se informationen
    if (sessionUser.Role != Role.ADMIN && sessionUser.Id != id)
    {
      return Results.Forbid();
    }

    await using var cmd = db.CreateCommand(@"
      SELECT id, username, email, role, company_id 
      FROM users 
      WHERE id = @id");
    cmd.Parameters.AddWithValue("@id", id);

    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
      return Results.Ok(new
      {
        id = reader.GetInt32(0),
        username = reader.GetString(1),
        email = reader.GetString(2),
        role = reader.GetString(3),
        company_id = reader.GetInt32(4)
      });
    }

    return Results.NotFound();
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching user details: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
}).RequireRole(Role.ADMIN);

// API endpoint för användarstatistik - Returnerar antalet användare per roll
app.MapGet("/api/statistics/user-counts", async (NpgsqlDataSource db) =>
{
  try
  {
    // Dictionary för att lagra roll (nyckel) och antal användare (värde)
    var result = new Dictionary<string, int>();

    // Hämta antal användare per roll från databasen
    await using var cmd = db.CreateCommand(@"
            SELECT role::text, COUNT(*) 
            FROM users 
            GROUP BY role;");

    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
      // Lägg till varje roll och dess antal i resultatet
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

// API endpoint för registrerade kunder
app.MapGet("/api/statistics/dashboard", async (NpgsqlDataSource db) =>
{
  try
  {
    // Hämta totalt antal kunder från customer_profiles
    await using var totalCmd = db.CreateCommand(@"
            SELECT COUNT(*) FROM customer_profiles;");
    var totalCustomers = Convert.ToInt32(await totalCmd.ExecuteScalarAsync() ?? 0);

    // Hämta antal kunder som har registrerats idag
    await using var todayCmd = db.CreateCommand(@"
            SELECT COUNT(*) FROM customer_profiles 
            WHERE DATE(created_at) = CURRENT_DATE;");
    var customersToday = Convert.ToInt32(await todayCmd.ExecuteScalarAsync() ?? 0);

    // Hämta aktiva användare (besökt sidan senaste timmen)
    await using var activeCmd = db.CreateCommand(@"
            SELECT COUNT(*) FROM (
              SELECT customer_profile_id 
              FROM tickets 
              WHERE updated_at > NOW() - INTERVAL '1 hour'
              UNION
              SELECT customer_profile_id 
              FROM tickets 
              WHERE id IN (
                SELECT ticket_id 
                FROM messages 
                WHERE created_at > NOW() - INTERVAL '1 hour'
              )
            ) as active_users;");
    var activeNow = Convert.ToInt32(await activeCmd.ExecuteScalarAsync() ?? 0);

    // Returnera all statistik i ett objekt
    return Results.Ok(new
    {
      totalCustomers,
      customersToday,
      activeNow
    });
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error fetching dashboard statistics: " + ex.Message);
    return Results.Problem($"Internal server error: {ex.Message}");
  }
});

// Endpoint för att spara feedback
app.MapPost("/api/feedback", async (FeedbackForm form, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
            INSERT INTO feedback (ticket_id, rating, comment)
            VALUES (@ticketId, @rating, @comment)
            RETURNING id");

    cmd.Parameters.AddWithValue("@ticketId", form.TicketId);
    cmd.Parameters.AddWithValue("@rating", form.Rating);
    cmd.Parameters.AddWithValue("@comment", form.Comment);

    var feedbackId = await cmd.ExecuteScalarAsync();

    return Results.Ok(new { id = feedbackId, message = "Tack för din feedback!" });
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error saving feedback: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
});

// Kontrollera om feedback redan har lämnats för ett visst ärende
app.MapGet("/api/feedback/exists/{ticketId}", async (int ticketId, NpgsqlDataSource db) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
            SELECT COUNT(*) FROM feedback 
            WHERE ticket_id = @ticketId");

    cmd.Parameters.AddWithValue("@ticketId", ticketId);

    var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());

    return Results.Ok(new { exists = count > 0 });
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error checking feedback: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
});

await app.RunAsync();