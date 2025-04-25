using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class version4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InformationFields_AspNetUsers_ProfileId",
                table: "InformationFields");

            migrationBuilder.RenameColumn(
                name: "ProfileId",
                table: "InformationFields",
                newName: "ForeignKeyProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_InformationFields_ProfileId",
                table: "InformationFields",
                newName: "IX_InformationFields_ForeignKeyProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_InformationFields_AspNetUsers_ForeignKeyProfileId",
                table: "InformationFields",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InformationFields_AspNetUsers_ForeignKeyProfileId",
                table: "InformationFields");

            migrationBuilder.RenameColumn(
                name: "ForeignKeyProfileId",
                table: "InformationFields",
                newName: "ProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_InformationFields_ForeignKeyProfileId",
                table: "InformationFields",
                newName: "IX_InformationFields_ProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_InformationFields_AspNetUsers_ProfileId",
                table: "InformationFields",
                column: "ProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
