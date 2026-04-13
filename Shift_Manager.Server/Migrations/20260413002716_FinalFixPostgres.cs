using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Shift_Manager.Server.Migrations
{
    /// <inheritdoc />
    public partial class FinalFixPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cuadrantes",
                columns: table => new
                {
                    ID_Cuadrante = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Sector = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cuadrantes", x => x.ID_Cuadrante);
                });

            migrationBuilder.CreateTable(
                name: "HistoricoCambios",
                columns: table => new
                {
                    ID_Historico = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Tabla = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ID_Registro = table.Column<int>(type: "integer", nullable: false),
                    Accion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Usuario = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Detalle = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoricoCambios", x => x.ID_Historico);
                });

            migrationBuilder.CreateTable(
                name: "Agentes",
                columns: table => new
                {
                    ID_Agente = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Codigo_Agente = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Apellido = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Cedula = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    Rango = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Contacto = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    PuestoAsignado = table.Column<int>(type: "integer", nullable: false),
                    ID_Cuadrante = table.Column<int>(type: "integer", nullable: false),
                    Antiguedad = table.Column<int>(type: "integer", nullable: true),
                    Disponibilidad = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaModificacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agentes", x => x.ID_Agente);
                    table.ForeignKey(
                        name: "FK_Agentes_Cuadrantes_ID_Cuadrante",
                        column: x => x.ID_Cuadrante,
                        principalTable: "Cuadrantes",
                        principalColumn: "ID_Cuadrante",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Turnos",
                columns: table => new
                {
                    ID_Turno = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ID_Agente = table.Column<int>(type: "integer", nullable: false),
                    ID_Cuadrante = table.Column<int>(type: "integer", nullable: false),
                    FechaProgramadaInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaProgramadaFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaInicioReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaFinReal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Turnos", x => x.ID_Turno);
                    table.ForeignKey(
                        name: "FK_Turnos_Agentes_ID_Agente",
                        column: x => x.ID_Agente,
                        principalTable: "Agentes",
                        principalColumn: "ID_Agente",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Turnos_Cuadrantes_ID_Cuadrante",
                        column: x => x.ID_Cuadrante,
                        principalTable: "Cuadrantes",
                        principalColumn: "ID_Cuadrante",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UsuariosSistema",
                columns: table => new
                {
                    ID_Usuario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Rol = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ID_Agente = table.Column<int>(type: "integer", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosSistema", x => x.ID_Usuario);
                    table.ForeignKey(
                        name: "FK_UsuariosSistema_Agentes_ID_Agente",
                        column: x => x.ID_Agente,
                        principalTable: "Agentes",
                        principalColumn: "ID_Agente",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Horarios",
                columns: table => new
                {
                    IdHorario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdAgente = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    HoraInicio = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    HoraFin = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    TipoTurno = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IdCuadrante = table.Column<int>(type: "integer", nullable: false),
                    ID_Turno = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioCreacion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FechaModificacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsuarioModificacion = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Observaciones = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Horarios", x => x.IdHorario);
                    table.ForeignKey(
                        name: "FK_Horarios_Cuadrantes_IdCuadrante",
                        column: x => x.IdCuadrante,
                        principalTable: "Cuadrantes",
                        principalColumn: "ID_Cuadrante",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Horarios_Turnos_ID_Turno",
                        column: x => x.ID_Turno,
                        principalTable: "Turnos",
                        principalColumn: "ID_Turno",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reportes",
                columns: table => new
                {
                    ID_Reporte = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ID_Turno = table.Column<int>(type: "integer", nullable: false),
                    ID_Agente = table.Column<int>(type: "integer", nullable: false),
                    ID_Cuadrante = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Prioridad = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaCierre = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reportes", x => x.ID_Reporte);
                    table.ForeignKey(
                        name: "FK_Reportes_Agentes_ID_Agente",
                        column: x => x.ID_Agente,
                        principalTable: "Agentes",
                        principalColumn: "ID_Agente",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reportes_Cuadrantes_ID_Cuadrante",
                        column: x => x.ID_Cuadrante,
                        principalTable: "Cuadrantes",
                        principalColumn: "ID_Cuadrante",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reportes_Turnos_ID_Turno",
                        column: x => x.ID_Turno,
                        principalTable: "Turnos",
                        principalColumn: "ID_Turno",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    Token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Expiration = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    Revoked = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReplacedByToken = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_UsuariosSistema_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "UsuariosSistema",
                        principalColumn: "ID_Usuario",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agentes_Cedula",
                table: "Agentes",
                column: "Cedula",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Agentes_Codigo_Agente",
                table: "Agentes",
                column: "Codigo_Agente",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Agentes_ID_Cuadrante",
                table: "Agentes",
                column: "ID_Cuadrante");

            migrationBuilder.CreateIndex(
                name: "IX_Horarios_ID_Turno",
                table: "Horarios",
                column: "ID_Turno");

            migrationBuilder.CreateIndex(
                name: "IX_Horarios_IdCuadrante",
                table: "Horarios",
                column: "IdCuadrante");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UsuarioId",
                table: "RefreshTokens",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Reportes_ID_Agente",
                table: "Reportes",
                column: "ID_Agente");

            migrationBuilder.CreateIndex(
                name: "IX_Reportes_ID_Cuadrante",
                table: "Reportes",
                column: "ID_Cuadrante");

            migrationBuilder.CreateIndex(
                name: "IX_Reportes_ID_Turno",
                table: "Reportes",
                column: "ID_Turno");

            migrationBuilder.CreateIndex(
                name: "IX_Turnos_ID_Agente",
                table: "Turnos",
                column: "ID_Agente");

            migrationBuilder.CreateIndex(
                name: "IX_Turnos_ID_Cuadrante",
                table: "Turnos",
                column: "ID_Cuadrante");

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosSistema_ID_Agente",
                table: "UsuariosSistema",
                column: "ID_Agente");

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosSistema_Username",
                table: "UsuariosSistema",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistoricoCambios");

            migrationBuilder.DropTable(
                name: "Horarios");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Reportes");

            migrationBuilder.DropTable(
                name: "UsuariosSistema");

            migrationBuilder.DropTable(
                name: "Turnos");

            migrationBuilder.DropTable(
                name: "Agentes");

            migrationBuilder.DropTable(
                name: "Cuadrantes");
        }
    }
}
