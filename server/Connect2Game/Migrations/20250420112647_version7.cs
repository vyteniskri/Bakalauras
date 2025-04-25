using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class version7 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId",
                table: "reports",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_reports_ForeignKeyProfileId",
                table: "reports",
                column: "ForeignKeyProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_reports_AspNetUsers_ForeignKeyProfileId",
                table: "reports",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_reports_AspNetUsers_ForeignKeyProfileId",
                table: "reports");

            migrationBuilder.DropIndex(
                name: "IX_reports_ForeignKeyProfileId",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId",
                table: "reports");
        }
    }
}
