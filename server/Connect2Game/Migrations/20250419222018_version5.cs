using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class version5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "Videos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "subCategoriesProfile",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "registrationSteps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "profileFilters",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "Photos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "Friendships",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ForeignKeyProfileId",
                table: "Videos",
                column: "ForeignKeyProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_subCategoriesProfile_ForeignKeyProfileId",
                table: "subCategoriesProfile",
                column: "ForeignKeyProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_registrationSteps_ForeignKeyProfileId",
                table: "registrationSteps",
                column: "ForeignKeyProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_profileFilters_ForeignKeyProfileId",
                table: "profileFilters",
                column: "ForeignKeyProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Photos_ForeignKeyProfileId",
                table: "Photos",
                column: "ForeignKeyProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ForeignKeyProfileId",
                table: "Messages",
                column: "ForeignKeyProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_ForeignKeyProfileId",
                table: "Friendships",
                column: "ForeignKeyProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId",
                table: "Friendships",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_AspNetUsers_ForeignKeyProfileId",
                table: "Messages",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_AspNetUsers_ForeignKeyProfileId",
                table: "Photos",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_profileFilters_AspNetUsers_ForeignKeyProfileId",
                table: "profileFilters",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_registrationSteps_AspNetUsers_ForeignKeyProfileId",
                table: "registrationSteps",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_subCategoriesProfile_AspNetUsers_ForeignKeyProfileId",
                table: "subCategoriesProfile",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Videos_AspNetUsers_ForeignKeyProfileId",
                table: "Videos",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId",
                table: "Friendships");

            migrationBuilder.DropForeignKey(
                name: "FK_Messages_AspNetUsers_ForeignKeyProfileId",
                table: "Messages");

            migrationBuilder.DropForeignKey(
                name: "FK_Photos_AspNetUsers_ForeignKeyProfileId",
                table: "Photos");

            migrationBuilder.DropForeignKey(
                name: "FK_profileFilters_AspNetUsers_ForeignKeyProfileId",
                table: "profileFilters");

            migrationBuilder.DropForeignKey(
                name: "FK_registrationSteps_AspNetUsers_ForeignKeyProfileId",
                table: "registrationSteps");

            migrationBuilder.DropForeignKey(
                name: "FK_subCategoriesProfile_AspNetUsers_ForeignKeyProfileId",
                table: "subCategoriesProfile");

            migrationBuilder.DropForeignKey(
                name: "FK_Videos_AspNetUsers_ForeignKeyProfileId",
                table: "Videos");

            migrationBuilder.DropIndex(
                name: "IX_Videos_ForeignKeyProfileId",
                table: "Videos");

            migrationBuilder.DropIndex(
                name: "IX_subCategoriesProfile_ForeignKeyProfileId",
                table: "subCategoriesProfile");

            migrationBuilder.DropIndex(
                name: "IX_registrationSteps_ForeignKeyProfileId",
                table: "registrationSteps");

            migrationBuilder.DropIndex(
                name: "IX_profileFilters_ForeignKeyProfileId",
                table: "profileFilters");

            migrationBuilder.DropIndex(
                name: "IX_Photos_ForeignKeyProfileId",
                table: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ForeignKeyProfileId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Friendships_ForeignKeyProfileId",
                table: "Friendships");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "subCategoriesProfile");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "registrationSteps");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "profileFilters");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "Friendships");
        }
    }
}
