using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class version6 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId",
                table: "Friendships");

            migrationBuilder.RenameColumn(
                name: "ForeignKeyProfileId",
                table: "Friendships",
                newName: "ForeignKeyProfileId2");

            migrationBuilder.RenameIndex(
                name: "IX_Friendships_ForeignKeyProfileId",
                table: "Friendships",
                newName: "IX_Friendships_ForeignKeyProfileId2");

            migrationBuilder.AddColumn<string>(
                name: "ForeignKeyProfileId1",
                table: "Friendships",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_ForeignKeyProfileId1",
                table: "Friendships",
                column: "ForeignKeyProfileId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId1",
                table: "Friendships",
                column: "ForeignKeyProfileId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId2",
                table: "Friendships",
                column: "ForeignKeyProfileId2",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId1",
                table: "Friendships");

            migrationBuilder.DropForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId2",
                table: "Friendships");

            migrationBuilder.DropIndex(
                name: "IX_Friendships_ForeignKeyProfileId1",
                table: "Friendships");

            migrationBuilder.DropColumn(
                name: "ForeignKeyProfileId1",
                table: "Friendships");

            migrationBuilder.RenameColumn(
                name: "ForeignKeyProfileId2",
                table: "Friendships",
                newName: "ForeignKeyProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_Friendships_ForeignKeyProfileId2",
                table: "Friendships",
                newName: "IX_Friendships_ForeignKeyProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Friendships_AspNetUsers_ForeignKeyProfileId",
                table: "Friendships",
                column: "ForeignKeyProfileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
