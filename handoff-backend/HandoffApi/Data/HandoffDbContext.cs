using HandoffApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HandoffApi.Data;

public class HandoffDbContext : DbContext
{
    public HandoffDbContext(DbContextOptions<HandoffDbContext> options) : base(options) { }

    public DbSet<Clinician> Clinicians => Set<Clinician>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Handoff> Handoffs => Set<Handoff>();
    public DbSet<ActionItem> Actions => Set<ActionItem>();
    public DbSet<PendingStudy> PendingStudies => Set<PendingStudy>();
    public DbSet<Contingency> Contingencies => Set<Contingency>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Clinician>(entity =>
        {
            entity.HasIndex(c => c.EmployeeId).IsUnique();
        });

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasOne(p => p.Handoff)
                .WithOne(h => h.Patient)
                .HasForeignKey<Handoff>(h => h.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Handoff>(entity =>
        {
            entity.HasMany(h => h.Actions)
                .WithOne(a => a.Handoff)
                .HasForeignKey(a => a.HandoffId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(h => h.PendingStudies)
                .WithOne(s => s.Handoff)
                .HasForeignKey(s => s.HandoffId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(h => h.Contingencies)
                .WithOne(c => c.Handoff)
                .HasForeignKey(c => c.HandoffId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
