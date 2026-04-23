using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Infrastructure.Context
{
    public class ShiftManagerDbContext : DbContext
    {
        public ShiftManagerDbContext(DbContextOptions<ShiftManagerDbContext> options)
            : base(options) { }

        public DbSet<Agente> Agentes { get; set; }
        public DbSet<Cuadrante> Cuadrantes { get; set; }
        public DbSet<Turno> Turnos { get; set; }
        public DbSet<Horario> Horarios { get; set; }
        public DbSet<Reporte> Reportes { get; set; }
        public DbSet<UsuarioSistema> UsuariosSistema { get; set; }
        public DbSet<HistoricoCambio> HistoricoCambios { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Notificacion> Notificaciones { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── AGENTES ──────────────────────────────────────────────────────
            modelBuilder.Entity<Agente>(e =>
            {
                e.HasKey(x => x.ID_Agente);
                e.HasIndex(x => x.Codigo_Agente).IsUnique();
                e.HasIndex(x => x.Cedula).IsUnique();
                e.Property(x => x.Codigo_Agente).HasMaxLength(15).IsRequired();
                e.Property(x => x.Nombre).HasMaxLength(50).IsRequired();
                e.Property(x => x.Apellido).HasMaxLength(50).IsRequired();
                e.Property(x => x.Cedula).HasMaxLength(13).IsRequired();
                e.Property(x => x.Rango).HasMaxLength(20).IsRequired();
                e.Property(x => x.Contacto).HasMaxLength(15);
                e.UseXminAsConcurrencyToken();
                e.Ignore(x => x.RowVersion);
                e.HasOne(x => x.Cuadrante)
                    .WithMany(c => c.Agentes)
                    .HasForeignKey(x => x.ID_Cuadrante);
                // Tabla tiene triggers de auditoría → usar UPDATE sin OUTPUT
                e.Ignore(x => x.Horarios);
                e.ToTable(tb => tb.HasTrigger("trg_Agentes_Auditoria"));
            });

            // ── CUADRANTES ───────────────────────────────────────────────────
            modelBuilder.Entity<Cuadrante>(e =>
            {
                e.HasKey(x => x.ID_Cuadrante);
                e.Property(x => x.Nombre).HasMaxLength(50).IsRequired();
                e.Property(x => x.Sector).HasMaxLength(100);
            });

            // ── TURNOS ───────────────────────────────────────────────────────
            modelBuilder.Entity<Turno>(e =>
            {
                e.HasKey(x => x.ID_Turno);
                e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
                e.Property(x => x.Observaciones).HasMaxLength(300);
                e.UseXminAsConcurrencyToken();
                e.Ignore(x => x.RowVersion);
                e.HasOne(x => x.Agente)
                    .WithMany(a => a.Turnos)
                    .HasForeignKey(x => x.ID_Agente)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Cuadrante)
                    .WithMany(c => c.Turnos)
                    .HasForeignKey(x => x.ID_Cuadrante)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.ID_Agente);
                e.HasIndex(x => x.ID_Cuadrante);
                
                // Tabla tiene triggers de auditoría → usar UPDATE sin OUTPUT
                e.ToTable(tb => tb.HasTrigger("trg_Turnos_Auditoria"));
 
            });

            // ── HORARIOS ─────────────────────────────────────────────────────
            modelBuilder.Entity<Horario>(e =>
            {
                e.HasKey(x => x.IdHorario);
                e.Property(x => x.IdAgente)
                    .HasColumnName("IdAgente")
                    .HasMaxLength(50)
                    .IsRequired();
                e.Property(x => x.HoraInicio).IsRequired();
                e.Property(x => x.HoraFin).IsRequired();
                e.Property(x => x.TipoTurno).HasMaxLength(20).IsRequired();
                e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
                e.Property(x => x.UsuarioCreacion).HasMaxLength(30).IsRequired();
                e.Property(x => x.UsuarioModificacion).HasMaxLength(30);
                e.Property(x => x.Observaciones).HasMaxLength(300);
                e.HasOne(x => x.Turno)
                    .WithMany(t => t.Horarios)
                    .HasForeignKey(x => x.ID_Turno)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Cuadrante)
                    .WithMany(c => c.Horarios)
                    .HasForeignKey(x => x.IdCuadrante)
                    .OnDelete(DeleteBehavior.Restrict);
                e.ToTable(tb => tb.HasTrigger("trg_Horarios_Auditoria"));
            });

            // ── REPORTES ─────────────────────────────────────────────────────
            modelBuilder.Entity<Reporte>(e =>
            {
                e.HasKey(x => x.ID_Reporte);
                e.Property(x => x.Tipo).HasMaxLength(50).IsRequired();
                e.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
                e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
                e.Property(x => x.Prioridad).HasMaxLength(20).IsRequired();
                e.UseXminAsConcurrencyToken();
                e.Ignore(x => x.RowVersion);
                e.HasOne(x => x.Agente)
                    .WithMany(a => a.Reportes)
                    .HasForeignKey(x => x.ID_Agente)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Cuadrante)
                    .WithMany(c => c.Reportes)
                    .HasForeignKey(x => x.ID_Cuadrante)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Turno)
                    .WithMany(t => t.Reportes)
                    .HasForeignKey(x => x.ID_Turno)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasIndex(x => x.ID_Agente);
                e.HasIndex(x => x.ID_Turno);
                e.HasIndex(x => x.ID_Cuadrante);
                e.ToTable(tb => tb.HasTrigger("trg_Reportes_Auditoria"));
            });

            // ── USUARIOS ─────────────────────────────────────────────────────
            modelBuilder.Entity<UsuarioSistema>(e =>
            {
                e.HasKey(x => x.ID_Usuario);
                e.HasIndex(x => x.Username).IsUnique();
                e.Property(x => x.Username).HasMaxLength(30).IsRequired();
                e.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
                e.Property(x => x.Rol).HasMaxLength(20).IsRequired();
                e.UseXminAsConcurrencyToken();
                e.Ignore(x => x.RowVersion);
                e.HasOne(x => x.Agente)
                    .WithMany(a => a.UsuariosSistema)
                    .HasForeignKey(x => x.ID_Agente)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── HISTORICO ────────────────────────────────────────────────────
            modelBuilder.Entity<HistoricoCambio>(e =>
            {
                e.HasKey(x => x.ID_Historico);
                e.Property(x => x.Tabla).HasMaxLength(50).IsRequired();
                e.Property(x => x.Accion).HasMaxLength(20).IsRequired();
                e.Property(x => x.Usuario).HasMaxLength(30).IsRequired();
            });

            // ── REFRESH TOKENS ───────────────────────────────────────────────
            modelBuilder.Entity<RefreshToken>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Token).HasMaxLength(500).IsRequired();
                e.Property(x => x.Expiration).IsRequired();
                e.Property(x => x.Created).IsRequired().HasDefaultValueSql("now()");
                
                // Foreign key a Usuario
                e.HasOne(x => x.Usuario)
                    .WithMany(u => u.RefreshTokens)
                    .HasForeignKey(x => x.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
            });

            // ── NOTIFICACIONES ──────────────────────────────────────────────
            modelBuilder.Entity<Notificacion>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Titulo).HasMaxLength(100).IsRequired();
                e.Property(x => x.Mensaje).HasMaxLength(500).IsRequired();
                e.Property(x => x.TipoReferencia).HasMaxLength(50).IsRequired();
                e.Property(x => x.FechaCreacion).IsRequired().HasDefaultValueSql("now()");
                
                e.HasOne(x => x.Agente)
                    .WithMany() // Ajustado para no requerir colección bidireccional inmediata
                    .HasForeignKey(x => x.IdAgente)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
