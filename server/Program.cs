using System.Text.Json;
using Npgsql;
using server;
using server.Classes;
using server.Services;
using server.Config;

var builder = WebApplication.CreateBuilder(args);

// Sessionshantering
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


// Mailkit
// Konfigurerar e-posttjänst för att skicka bekräftelser och välkomstmeddelanden
// Kritisk för användarregistrering och chattokenfunktionalitet
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
app.MapGet("/", () => "Hello World!");
app.MapGet("/api/login", (Func<HttpContext, Task<IResult>>)GetLogin);
app.MapPost("/api/login", (Func<HttpContext, LoginRequest, NpgsqlDataSource, Task<IResult>>)Login);
app.MapDelete("/api/login", (Func<HttpContext, Task<IResult>>)Logout);


//app.MapGet("/api/admin/data", () => "This is very secret admin data here..").RequireRole(Role.ADMIN);
//app.MapGet("/api/user/data", () => "This is data that users can look at. Its not very secret").RequireRole(Role.USER);


static async Task<IResult> PostForm(FormRequest form)
{
  Console.WriteLine("Form is posted..");
  Console.WriteLine("Company: " + form.Company);
  Console.WriteLine("Email: " + form.Email);
  Console.WriteLine("Subject: " + form.Subject);
  Console.WriteLine("Message: " + form.Message);
  return Results.Ok(new { message = "Form is posted." });
}


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

static async Task<IResult> Login(HttpContext context, LoginRequest request, NpgsqlDataSource db)
{
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

  return Results.NotFound(new { message = "Felaktigt användarnamn eller lösenord, eller så har du inte behörighet att logga in" });
}

static async Task<IResult> Logout(HttpContext context)
{
  if (context.Session.GetString("User") == null)
  {
    return Results.Conflict(new { message = "No login found." });
  }
  Console.WriteLine("ClearSession is called..Clearing session");
  await Task.Run(context.Session.Clear);
  return Results.Ok(new { message = "Logged out." });
}




// Mailkit

app.MapPost("/api/email", SendEmail);

static async Task<IResult> SendEmail(EmailRequest request, IEmailService email)
{
  Console.WriteLine("SendEmail is called..Sending email");

  await email.SendEmailAsync(request.To, request.Subject, request.Body);

  Console.WriteLine("Email sent to: " + request.To + " with subject: " + request.Subject + " and body: " + request.Body);
  return Results.Ok(new { message = "Email sent." });
}



// Skapa customer_profiles, ticket och chattoken
// Formulärhantering för att skapa nya kundärenden
app.MapPost("/api/form", async (FormRequest form, NpgsqlDataSource db) =>
{
  try
  {
    // 1. Skapar eller uppdaterar kundprofil baserat på e-postadress
    // Detta möjliggör att kunder kan använda systemet utan att skapa ett lösenord
    await using var cmd1 = db.CreateCommand(@"
            INSERT INTO customer_profiles (email)
            VALUES (@email)
            ON CONFLICT (email) DO UPDATE 
            SET email = EXCLUDED.email
            RETURNING id");
    cmd1.Parameters.AddWithValue("@email", form.Email);
    var customerId = await cmd1.ExecuteScalarAsync();

    // 2. Skapar en ny ticket och genererar en unik chat_token
    // Denna token används för att identifiera ärendet i chattfunktionen
    await using var cmd2 = db.CreateCommand(@"
            INSERT INTO tickets (customer_profile_id, subject, status, product_id)
            VALUES (@customerId, @subject, 'NY', @productId)
            RETURNING chat_token");
    cmd2.Parameters.AddWithValue("@customerId", customerId);
    cmd2.Parameters.AddWithValue("@subject", form.Subject);
    cmd2.Parameters.AddWithValue("@productId", form.ProductId);
    var chatToken = await cmd2.ExecuteScalarAsync();

    // 3. Spara första meddelandet
    await using var cmd3 = db.CreateCommand(@"
            INSERT INTO messages (ticket_id, sender_type, message_text)
            VALUES ((SELECT id FROM tickets WHERE chat_token = @chatToken), 'USER', @message)");
    cmd3.Parameters.AddWithValue("@chatToken", chatToken);
    cmd3.Parameters.AddWithValue("@message", form.Message);
    await cmd3.ExecuteNonQueryAsync();

    Console.WriteLine("Chat token generated: " + chatToken); // För debugging
                                                             // Returnerar chat_token till klienten för att möjliggöra fortsatt kommunikation
    return Results.Ok(new { chatToken, message = "Form is posted." });
  }
  catch (Exception ex)
  {
    // Loggar fel för felsökning och returnerar felmeddelande till klienten
    Console.WriteLine("Error: " + ex.Message);
    return Results.BadRequest(new { message = ex.Message });
  }
});




// Hämtar meddelandehistorik för ett specifikt ärende baserat på chat_token
// Används av chattgränssnittet för att visa konversationshistorik
app.MapGet("/api/messages/{chatToken}", async (string chatToken, NpgsqlDataSource db) =>
{
  await using var cmd = db.CreateCommand(@"
        SELECT m.* 
        FROM messages m
        JOIN tickets t ON t.id = m.ticket_id
        WHERE t.chat_token = @chatToken::uuid
        ORDER BY m.created_at"); //  behöver konvertera textsträngen till en UUID innan vi jämför den med databasen därför ::uuid
  cmd.Parameters.AddWithValue("@chatToken", chatToken);

  var messages = new List<Dictionary<string, object>>();
  await using var reader = await cmd.ExecuteReaderAsync();
  while (await reader.ReadAsync())
  {
    messages.Add(new Dictionary<string, object>
        {
            { "id", reader.GetInt32(0) },
            { "message_text", reader.GetString(3) },
            { "sender_type", reader.GetString(2) },
            { "created_at", reader.GetDateTime(4) }
        });
  }
  return Results.Ok(messages);
});

// Lägger till ett nytt meddelande i ett befintligt ärende
// Behöver uppdateras för att hantera olika avsändartyper (USER, SUPPORT, ADMIN)
app.MapPost("/api/messages/{chatToken}", async (string chatToken, MessageRequest request, NpgsqlDataSource db) =>
{
  // Validera senderType för att säkerställa att det är ett giltigt värde
  string senderType = request.SenderType ?? "USER";

  // Kontrollera att senderType är ett giltigt role-värde
  if (!Enum.TryParse<Role>(senderType, out _))
  {
    senderType = "USER"; // Fallback till USER om ogiltig roll
  }

  await using var cmd = db.CreateCommand(@"
        INSERT INTO messages (ticket_id, sender_type, message_text)
        VALUES (
            (SELECT id FROM tickets WHERE chat_token = @chatToken::uuid),
            @senderType::role,
            @message
        )"); //  lagt till ::role efter @senderType för att konvertera textsträngen till enum-typen role annars kommer det att ge ett fel
  cmd.Parameters.AddWithValue("@chatToken", chatToken);
  cmd.Parameters.AddWithValue("@senderType", senderType);
  cmd.Parameters.AddWithValue("@message", request.Message);
  await cmd.ExecuteNonQueryAsync();
  return Results.Ok();
});

// Uppdatera status för ett ärende
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
});

app.MapGet("/api/tickets", async (NpgsqlDataSource db, HttpContext context) =>
{
  try
  {
    await using var cmd = db.CreateCommand(@"
            SELECT 
                t.id,
                t.status,
                t.subject,
                t.chat_token,
                cp.email as customer_email,
                c.name as company_name
            FROM tickets t
            JOIN customer_profiles cp ON t.customer_profile_id = cp.id
            JOIN products p ON t.product_id = p.id
            JOIN companies c ON p.company_id = c.id
            ORDER BY t.created_at DESC");

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
});

// Endpoint för att hämta produkter för ett specifikt företag
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

// Endpoint för att hämta alla företag
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
});

await app.RunAsync();