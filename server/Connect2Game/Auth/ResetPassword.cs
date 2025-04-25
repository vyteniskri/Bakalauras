using Connect2Game.Auth.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Connect2Game.Auth
{
    public static  class ResetPassword
    {
        public static void AddResetPassord(this WebApplication app)
        {
            app.MapPost("api/forgotpassword", async (UserManager<Profile> userManager, ForgotPasswordDto dto, EmailService emailService) =>
            {
                var user = await userManager.FindByEmailAsync(dto.Email);
                if (user == null)
                {
                    return Results.Ok(new { message = "If an account with this email exists, a reset link has been sent.NOT" });
                }

                var token = await userManager.GeneratePasswordResetTokenAsync(user);

                var resetUrl = $"http://localhost:3000/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

                var body = $"<p>Click here to reset your password:</p><p><a href=\"{resetUrl}\">Reset Password</a></p>";
                await emailService.SendEmailAsync(user.Email, "Password Reset", body);

                return Results.Ok(new { message = "If an account with this email exists, a reset link has been sent.YES" });
            });


            app.MapPost("api/resetpassword", async (UserManager<Profile> userManager, ResetPasswordDto dto) =>
            {
                var user = await userManager.FindByEmailAsync(dto.Email);
                if (user == null)
                {
                    return Results.NotFound();
                }

                var resetResult = await userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
                if (!resetResult.Succeeded)
                {
                    return Results.BadRequest();
                }

                return Results.Ok(new { message = "Password has been reset successfully." });
            });

        }

        public record ForgotPasswordDto(string Email);
        public record ResetPasswordDto(string Email, string Token, string NewPassword);

    }
}
