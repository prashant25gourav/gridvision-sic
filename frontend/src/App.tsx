import { useState, useEffect, useCallback } from 'react';
import type { DashboardSection } from './types/dashboard';
import { WelcomeHero } from './components/welcome/WelcomeHero';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { OverviewView } from './views/OverviewView';
import { DashboardShell } from './components/dashboard/DashboardShell';

export type AppMode = 'welcome' | 'overview' | 'dashboard';

const VALID_SECTIONS: DashboardSection[] = [
  'overview',
  'demand',
  'consumers',
  'anomalies',
  'forecasting',
  'copilot',
  'findings',
  'methodology',
  'households',
  'segmentation',
];

function getInitialState(): { mode: AppMode; section: DashboardSection; theme: 'dark' | 'light' } {
  let initialTheme: 'dark' | 'light' = 'dark';
  let initialMode: AppMode = 'welcome';
  let initialSection: DashboardSection = 'overview';

  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('gridvision_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      initialTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      initialTheme = 'light';
    }

    const params = new URLSearchParams(window.location.search);
    const paramTheme = params.get('theme');
    if (paramTheme === 'light' || paramTheme === 'dark') {
      initialTheme = paramTheme;
    }

    const paramMode = params.get('mode');
    if (paramMode === 'overview' || paramMode === 'dashboard' || paramMode === 'welcome') {
      initialMode = paramMode;
    }

    const paramSection = params.get('section') as DashboardSection | null;
    if (paramSection && VALID_SECTIONS.includes(paramSection)) {
      initialSection = paramSection;
    }
  }

  return { mode: initialMode, section: initialSection, theme: initialTheme };
}

function App() {
  const [initial] = useState(getInitialState);
  const [mode, setMode] = useState<AppMode>(initial.mode);
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>(initial.section);
  const [theme, setTheme] = useState<'dark' | 'light'>(initial.theme);

  // Sync theme attribute & storage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gridvision_theme', theme);
  }, [theme]);

  // Synchronize URL parameters without reloading
  const updateUrl = useCallback((m: AppMode, s: DashboardSection, t: 'dark' | 'light') => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (m !== 'welcome') params.set('mode', m);
    if (m === 'dashboard' && s !== 'overview') params.set('section', s);
    if (t !== 'dark') params.set('theme', t);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({ mode: m, section: s, theme: t }, '', newUrl);
  }, []);

  useEffect(() => {
    updateUrl(mode, dashboardSection, theme);
  }, [mode, dashboardSection, theme, updateUrl]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
          <DashboardShell
            initialSection={dashboardSection}
            onSectionChange={(newSec) => setDashboardSection(newSec)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
