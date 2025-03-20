namespace server;

public record PasswordRequest(string userName, string email, string password, string newPassword);