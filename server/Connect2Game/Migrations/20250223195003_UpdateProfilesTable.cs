using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Connect2Game.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProfilesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "testas",
                table: "InformationFields",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "testas",
                table: "InformationFields");
        }
    }
}
