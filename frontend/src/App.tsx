import { useState, useEffect } from 'react';
import type { DashboardSection } from './types/dashboard';
import { WelcomeHero } from './components/welcome/WelcomeHero';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { OverviewView } from './views/OverviewView';
import { DashboardShell } from './components/dashboard/DashboardShell';

export type AppMode = 'welcome' | 'overview' | 'dashboard';

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gridvision_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  }
  return 'dark';
}

function App() {
  const [mode, setMode] = useState<AppMode>('welcome');
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gridvision_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (mode === 'welcome') {
    return (
      <WelcomeHero
        onNavigateOverview={() => setMode('overview')}
        onNavigateDashboard={() => {
          setDashboardSection('overview');
          setMode('dashboard');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div
      className="app-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        transition: 'background-color var(--transition-theme), color var(--transition-theme)',
      }}
    >
      {/* Persistent Application Header with Brand, Nav & Top-Right Theme Toggle */}
      <Header
        currentMode={mode === 'dashboard' ? 'dashboard' : 'overview'}
        onNavigateWelcome={() => setMode('welcome')}
        onNavigateOverview={() => setMode('overview')}
        onNavigateDashboard={() => {
          setMode('dashboard');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        {mode === 'overview' ? (
          <>
            <OverviewView
              onExploreCapstone={() => {
                setDashboardSection('overview');
                setMode('dashboard');
              }}
              onExploreResearch={() => {
                setDashboardSection('findings');
                setMode('dashboard');
              }}
            />
            <Footer />
          </>
        ) : (
          <DashboardShell initialSection={dashboardSection} />
        )}
      </main>
    </div>
  );
}

export default App;
