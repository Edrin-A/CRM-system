using System.Text.Json;
using Npgsql;
using server;
using server.Classes;
using server.Services;
using server.Config;

var builder = WebApplication.CreateBuilder(args);

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

  await using var cmd = db.CreateCommand("SELECT * FROM users WHERE username = @username and password = @password");
  cmd.Parameters.AddWithValue("@username", request.Username);
  cmd.Parameters.AddWithValue("@password", request.Password);

  await using (var reader = await cmd.ExecuteReaderAsync())
  {
    if (reader.HasRows)
    {
      while (await reader.ReadAsync())
      {
        User user = new User(
            reader.GetInt32(reader.GetOrdinal("id")),
            reader.GetString(reader.GetOrdinal("username")),
            Enum.Parse<Role>(reader.GetString(reader.GetOrdinal("role")))
            );
        await Task.Run(() => context.Session.SetString("User", JsonSerializer.Serialize(user)));
        return Results.Ok(new { username = user.Username });
      }
    }
  }

  return Results.NotFound(new { message = "No user found." });
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

app.MapPost("/api/form", async (FormRequest form, NpgsqlDataSource db) =>
{
  try
  {
    // 1. Skapa eller hämta customer_profile
    await using var cmd1 = db.CreateCommand(@"
            INSERT INTO customer_profiles (email)
            VALUES (@email)
            ON CONFLICT (email) DO UPDATE 
            SET email = EXCLUDED.email
            RETURNING id");
    cmd1.Parameters.AddWithValue("@email", form.Email);
    var customerId = await cmd1.ExecuteScalarAsync();

    // 2. Skapa ticket och få tillbaka chat_token
    await using var cmd2 = db.CreateCommand(@"
            INSERT INTO tickets (customer_profile_id, subject, status)
            VALUES (@customerId, @subject, 'NY')
            RETURNING chat_token");
    cmd2.Parameters.AddWithValue("@customerId", customerId);
    cmd2.Parameters.AddWithValue("@subject", form.Subject);
    var chatToken = await cmd2.ExecuteScalarAsync();

    // 3. Spara första meddelandet
    await using var cmd3 = db.CreateCommand(@"
            INSERT INTO messages (ticket_id, sender_type, message_text)
            VALUES ((SELECT id FROM tickets WHERE chat_token = @chatToken), 'USER', @message)");
    cmd3.Parameters.AddWithValue("@chatToken", chatToken);
    cmd3.Parameters.AddWithValue("@message", form.Message);
    await cmd3.ExecuteNonQueryAsync();

    Console.WriteLine("Chat token generated: " + chatToken); // För debugging
    return Results.Ok(new { chatToken, message = "Form is posted." });
  }
  catch (Exception ex)
  {
    Console.WriteLine("Error: " + ex.Message); // För debugging
    return Results.BadRequest(new { message = ex.Message });
  }
});




// Hämta meddelanden för en specifik chat
app.MapGet("/api/messages/{chatToken}", async (string chatToken, NpgsqlDataSource db) =>
{
  await using var cmd = db.CreateCommand(@"
        SELECT m.* 
        FROM messages m
        JOIN tickets t ON t.id = m.ticket_id
        WHERE t.chat_token = @chatToken
        ORDER BY m.created_at");
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

// Skicka nytt meddelande
app.MapPost("/api/messages/{chatToken}", async (string chatToken, MessageRequest request, NpgsqlDataSource db) =>
{
  await using var cmd = db.CreateCommand(@"
        INSERT INTO messages (ticket_id, sender_type, message_text)
        VALUES (
            (SELECT id FROM tickets WHERE chat_token = @chatToken),
            'USER',
            @message
        )");
  cmd.Parameters.AddWithValue("@chatToken", chatToken);
  cmd.Parameters.AddWithValue("@message", request.Message);
  await cmd.ExecuteNonQueryAsync();
  return Results.Ok();
});


await app.RunAsync();