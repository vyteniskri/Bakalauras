using Connect2Game.Model;
using FluentValidation;
using FluentValidation.AspNetCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Results;
using System.ComponentModel.DataAnnotations;
using SharpGrip.FluentValidation.AutoValidation.Shared.Extensions;
using Microsoft.EntityFrameworkCore;
using Connect2Game.Endpoints;
using Connect2Game.Azure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Connect2Game.Auth.Model;
using Connect2Game.Auth;
using Connect2Game.SeedWithData;
using Connect2Game.MessagingSignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://10.0.2.2:8081", "http://10.0.2.2:8082", "https://matchtogamecontrol.netlify.app", "http://localhost:3000", "http://localhost:8081").AllowCredentials().AllowAnyHeader().AllowAnyMethod(); ///AllowCredentials() added ///ANDROID: http://10.0.2.2:8081


    });
});

builder.Services.AddDbContext<ApiDbContext>();
builder.Services.AddSingleton<AzureBlobServicePhotos>();
builder.Services.AddSingleton<AzureBlobServiceVideos>();

builder.Services.Configure<AzureStorageSettings>(options =>
{
    options.ConnectionString = builder.Configuration.GetValue<string>("AzureStorage:ConnectionString");
});


builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddHttpClient();

builder.Services.AddFluentValidationAutoValidation(configuration =>
{
    configuration.OverrideDefaultResultFactoryWith<ProblemDetailsResultFactory>();
});
builder.Services.AddTransient<JwtTokenService>();
builder.Services.AddTransient<SessionService>();
builder.Services.AddScoped<AuthSeeder>();
builder.Services.AddScoped<Seeder>();


builder.Services.AddIdentity<Profile, IdentityRole>()
    .AddEntityFrameworkStores<ApiDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters.ValidAudience = builder.Configuration["Jwt:ValidAudience"];
    options.TokenValidationParameters.ValidIssuer = builder.Configuration["Jwt:ValidIssuer"];
    options.TokenValidationParameters.IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]));

});

builder.Services.AddAuthorization();

builder.Services.AddSingleton<EmailService>();

builder.Services.AddSignalR();
var app = builder.Build();

app.UseRouting();
app.UseCors();
app.MapHub<ChatHub>("/api/chatHub");

using var scope = app.Services.CreateScope();

var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
//Pakeiciau
if (dbContext.Database.IsRelational())
{
    dbContext.Database.Migrate();
}
//Pakeiciau
if (dbContext.Database.IsRelational())
{
    var dbSeeder = scope.ServiceProvider.GetRequiredService<AuthSeeder>();
    await dbSeeder.SeedAsync();

    var dbSeeder2 = scope.ServiceProvider.GetRequiredService<Seeder>();
    await dbSeeder2.SeedAsync();
}



app.AddAuthApi();
app.AddResetPassord();

app.AddProfileApi();
app.AddInformationFieldAPI();
app.AddPhotoAPI();
app.AddVideoAPI();
app.AddFriendshipAPI();
app.AddMessageAPI();

app.AddCategory2API();
app.AddSubCategory2API();
app.AddFilterAPI();
app.AddSubCategoryFilterAPI();
app.AddProfileFilterAPI();
app.AddRegistrationStepAPI();
app.AddSubCategoryProfileAPI();
app.AddReportsAPI();
app.AddWarningAPI();

app.UseAuthentication();
app.UseAuthorization();
app.Run();



public class ProblemDetailsResultFactory : IFluentValidationAutoValidationResultFactory
{

    public IResult CreateResult(EndpointFilterInvocationContext context, FluentValidation.Results.ValidationResult validationResult)
    {
        var problemDetails = new HttpValidationProblemDetails(validationResult.ToValidationProblemErrors())
        {
            Type = "https://tools.ietf.org/html/rfc4918#section-11.2",
            Title = "Unprocessable Entity",
            Status = 422
        };

        return Results.Problem(problemDetails);
    }
}


//Profile
public record ProfileDto(String Id, String Username);
public record UpdateProfileDto(String Username)
{
    public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
    {
        public UpdateProfileDtoValidator()
        {
            RuleFor(x => x.Username).NotEmpty();
        }
    }
};


//InformationField
public record InformationFieldDto(int Id, String Text);
public record UpdateInformationFieldDto(String Text)
{
    public class UpdateInformationFieldDtoValidator : AbstractValidator<UpdateInformationFieldDto>
    {
        public UpdateInformationFieldDtoValidator()
        {
            RuleFor(x => x.Text).NotEmpty().Length(min: 2, max: 500);
        }
    }
};
public record CreateInformationFieldDto(String Text)
{
    public class CreateInformationFieldDtoValidator : AbstractValidator<CreateInformationFieldDto>
    {
        public CreateInformationFieldDtoValidator()
        {
            RuleFor(x => x.Text).NotEmpty().Length(min: 2, max: 500);
        }
    }
};

//Photo
public record PhotoDto(int Id, String FilePath, bool MainOrNot, int Number, string UserId);
public record CreatePhotoDto(bool MainOrNot, int Number);
//Video
public record VideoDto(int Id, String FilePath, int Number);


//Friendship
public record FriendshipDto(int Id, String ForeignKeyProfile1, String ForeignKeyProfile2, bool IsFriendship);

//Message
public record MessageDto(int Id, String UserId, int ForeignKeyFriendshipId, String Text, DateTimeOffset CreationDate);
public record CreateMessageDto(String Text);
public record UpdateMessageDto(String Text);



//Category2
public record Category2Dto(int Id, String Title, int Priority);
public record CreateCategory2Dto(String Title, int Priority);

//SubCategory2
public record SubCategory2Dto(int Id, String Title, int Priority, int MaxNumberOfFilters, bool CanChangeVisibility, int ForeignKeyCategory2);
public record SubCreateCategory2Dto(String Title, int Priority);

//Filter
public record FilterDto(int Id, String Text);
public record CreateFilterDto(String Text);

//SubCategoryFilter
public record SubCategoryFilterDto(int Id, int ForeignKeySubcategory2Id, int ForeignKeyFilterId);

//ProfileFilter
public record ProfileFilterDto(int Id, String UserId, int ForeignKeySubCategoryFilterId);

//RegistrationStepDto
public record RegistrationStepDto(int Id, int CurrentStep);
public record CreatedRegistrationStepDto(int CurrentStep);
public record UpdatedRegistrationStepDto(int CurrentStep);

//SubCategoryProfile
public record SubCategoryProfileDto(int Id, int ForeignKeySubcategory2, String UserId);


//Report
public record ReportDto(int Id, DateTimeOffset BanTime, int FlaggedCount, String UserId, DateTimeOffset CreationDate);
public record UpdateReportDto(DateTimeOffset BanTime);
public record CreateReportDto(DateTimeOffset BanTime, int FlaggedCount);

//Warning
public record WarningDto(int Id, int ForeignKeyReportId, String Text, DateTimeOffset CreationDate);
public record CreateWarningDto(String Text);


public partial class Program { }
