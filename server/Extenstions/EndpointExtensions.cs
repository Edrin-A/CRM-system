using Microsoft.AspNetCore.Authorization;
using server.Classes;

namespace server.Extensions;

public static class EndpointExtensions
{
  public static RouteHandlerBuilder RequireRole(this RouteHandlerBuilder builder, Role role)
  {
    return builder.AddEndpointFilter(async (context, next) =>
    {
      var httpContext = context.HttpContext;
      var userJson = httpContext.Session.GetString("User");

      if (string.IsNullOrEmpty(userJson))
      {
        return Results.Unauthorized();
      }

      var user = System.Text.Json.JsonSerializer.Deserialize<User>(userJson);

      if (user == null || user.Role != role)
      {
        return Results.Forbid();
      }

      return await next(context);
    });
  }
}