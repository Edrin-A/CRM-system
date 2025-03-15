namespace server;

public record AdminRequest(string Username, string Password, string Email, string Role, int CompanyId);