export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '1.25rem 1.5rem',
        marginTop: 'auto',
        transition: 'background-color var(--transition-theme), border-color var(--transition-theme)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>GridVision © {new Date().getFullYear()}</span>
          <span>•</span>
          <span>Capstone Research Framework</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span>Overview</span>
          <span>Household Explorer</span>
          <span>Behavioral Trajectory</span>
          <span>Copilot</span>
        </div>
      </div>
    </footer>
  );
}
