namespace server.Classes;

using System.Text.Json.Serialization;

public class User
{
  public int Id { get; set; }
  public string Username { get; set; }
  public string Email { get; set; }
  [JsonConverter(typeof(JsonStringEnumConverter))]
  public Role Role { get; set; }
  public int? CompanyId { get; set; }

  public User(int id, string username, string email, Role role)
  {
    Id = id;
    Username = username;
    Email = email;
    Role = role;
  }
}