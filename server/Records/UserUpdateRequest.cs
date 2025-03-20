namespace server;

public record UserUpdateRequest
{
  public string Username { get; set; } = "";
  public string Email { get; set; } = "";
  public int CompanyId { get; set; }
}