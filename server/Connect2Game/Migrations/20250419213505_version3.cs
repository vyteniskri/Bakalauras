using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class version3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfileId",
                table: "InformationFields",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InformationFields_ProfileId",
                table: "InformationFields",
                column: "ProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_InformationFields_AspNetUsers_ProfileId",
                table: "InformationFields",
                column: "ProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InformationFields_AspNetUsers_ProfileId",
                table: "InformationFields");

            migrationBuilder.DropIndex(
                name: "IX_InformationFields_ProfileId",
                table: "InformationFields");

            migrationBuilder.DropColumn(
                name: "ProfileId",
                table: "InformationFields");
        }
    }
}
