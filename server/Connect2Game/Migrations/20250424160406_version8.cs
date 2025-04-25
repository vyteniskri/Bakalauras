using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class version8 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InformationFields_Categories_ForeignKeyCategoryId",
                table: "InformationFields");

            migrationBuilder.DropForeignKey(
                name: "FK_Photos_ChatMessages_ForeignKeyChatMessageId",
                table: "Photos");

            migrationBuilder.DropForeignKey(
                name: "FK_Videos_PredefinedInformationFields_ForeignKeyPredefinedInfo~",
                table: "Videos");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "CategoryProfiles");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "FilterFields");

            migrationBuilder.DropTable(
                name: "PredefinedCategoryAndInfoFields");

            migrationBuilder.DropTable(
                name: "Members");

            migrationBuilder.DropTable(
                name: "PredefinedInformationFields");

            migrationBuilder.DropTable(
                name: "Subcategories");

            migrationBuilder.DropTable(
                name: "ChatGroups");

            migrationBuilder.DropTable(
                name: "PredefinedCategories");

            migrationBuilder.DropIndex(
                name: "IX_Videos_ForeignKeyPredefinedInformationFieldId",
                table: "Videos");

            migrationBuilder.DropIndex(
                name: "IX_Photos_ForeignKeyChatMessageId",
                table: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_InformationFields_ForeignKeyCategoryId",
                table: "InformationFields");

            migrationBuilder.DropColumn(
                name: "ForeignKeyPredefinedInformationFieldId",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "ForeignKeyChatMessageId",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "ForeignKeyCategoryId",
                table: "InformationFields");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ForeignKeyPredefinedInformationFieldId",
                table: "Videos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ForeignKeyChatMessageId",
                table: "Photos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ForeignKeyCategoryId",
                table: "InformationFields",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ForeignKeyCategoryId = table.Column<int>(type: "integer", nullable: true),
                    CreationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ForeignKeyCategoryId",
                        column: x => x.ForeignKeyCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FilterFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Category = table.Column<string>(type: "text", nullable: false),
                    CreationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    SubCategory = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FilterFields", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PredefinedCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredefinedCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PredefinedInformationFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredefinedInformationFields", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ForeignKeyChatGroupId = table.Column<int>(type: "integer", nullable: true),
                    CreationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsMemeber = table.Column<bool>(type: "boolean", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Members_ChatGroups_ForeignKeyChatGroupId",
                        column: x => x.ForeignKeyChatGroupId,
                        principalTable: "ChatGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Subcategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ForeignKeyPredefinedCategoryId = table.Column<int>(type: "integer", nullable: true),
                    ForeignKeySubcategoryId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subcategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subcategories_PredefinedCategories_ForeignKeyPredefinedCate~",
                        column: x => x.ForeignKeyPredefinedCategoryId,
                        principalTable: "PredefinedCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Subcategories_Subcategories_ForeignKeySubcategoryId",
                        column: x => x.ForeignKeySubcategoryId,
                        principalTable: "Subcategories",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ForeignKeyMemberId = table.Column<int>(type: "integer", nullable: true),
                    CreationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Members_ForeignKeyMemberId",
                        column: x => x.ForeignKeyMemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PredefinedCategoryAndInfoFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ForeignKeyPredefinedInformationFieldId = table.Column<int>(type: "integer", nullable: true),
                    ForeignKeySubcategoryId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredefinedCategoryAndInfoFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PredefinedCategoryAndInfoFields_PredefinedInformationFields~",
                        column: x => x.ForeignKeyPredefinedInformationFieldId,
                        principalTable: "PredefinedInformationFields",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PredefinedCategoryAndInfoFields_Subcategories_ForeignKeySub~",
                        column: x => x.ForeignKeySubcategoryId,
                        principalTable: "Subcategories",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CategoryProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ForeignKeyPredefinedCategoryAndInfoFieldId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoryProfiles_PredefinedCategoryAndInfoFields_ForeignKey~",
                        column: x => x.ForeignKeyPredefinedCategoryAndInfoFieldId,
                        principalTable: "PredefinedCategoryAndInfoFields",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ForeignKeyPredefinedInformationFieldId",
                table: "Videos",
                column: "ForeignKeyPredefinedInformationFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_Photos_ForeignKeyChatMessageId",
                table: "Photos",
                column: "ForeignKeyChatMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_InformationFields_ForeignKeyCategoryId",
                table: "InformationFields",
                column: "ForeignKeyCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ForeignKeyCategoryId",
                table: "Categories",
                column: "ForeignKeyCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryProfiles_ForeignKeyPredefinedCategoryAndInfoFieldId",
                table: "CategoryProfiles",
                column: "ForeignKeyPredefinedCategoryAndInfoFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ForeignKeyMemberId",
                table: "ChatMessages",
                column: "ForeignKeyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Members_ForeignKeyChatGroupId",
                table: "Members",
                column: "ForeignKeyChatGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedCategoryAndInfoFields_ForeignKeyPredefinedInforma~",
                table: "PredefinedCategoryAndInfoFields",
                column: "ForeignKeyPredefinedInformationFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedCategoryAndInfoFields_ForeignKeySubcategoryId",
                table: "PredefinedCategoryAndInfoFields",
                column: "ForeignKeySubcategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Subcategories_ForeignKeyPredefinedCategoryId",
                table: "Subcategories",
                column: "ForeignKeyPredefinedCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Subcategories_ForeignKeySubcategoryId",
                table: "Subcategories",
                column: "ForeignKeySubcategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_InformationFields_Categories_ForeignKeyCategoryId",
                table: "InformationFields",
                column: "ForeignKeyCategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_ChatMessages_ForeignKeyChatMessageId",
                table: "Photos",
                column: "ForeignKeyChatMessageId",
                principalTable: "ChatMessages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Videos_PredefinedInformationFields_ForeignKeyPredefinedInfo~",
                table: "Videos",
                column: "ForeignKeyPredefinedInformationFieldId",
                principalTable: "PredefinedInformationFields",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
