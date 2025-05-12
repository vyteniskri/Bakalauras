using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class version11 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Clicked",
                table: "warnings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Clicked",
                table: "warnings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
