namespace server;

public record ProductRequest
{
  public string Name { get; set; } = "";
  public string Description { get; set; } = "";
}