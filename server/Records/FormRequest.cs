namespace server;

public record FormRequest(string Company, string Email, string Subject, string Message, int? ProductId);