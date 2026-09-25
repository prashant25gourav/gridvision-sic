import { useState } from 'react';
import type { NavTab } from './types/energy';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { OverviewView } from './views/OverviewView';
import { HouseholdView } from './views/HouseholdView';
import { TrajectoryView } from './views/TrajectoryView';
import { CopilotView } from './views/CopilotView';

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  const renderView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'households':
        return <HouseholdView />;
      case 'trajectories':
        return <TrajectoryView />;
      case 'copilot':
        return <CopilotView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} onTabChange={setActiveTab} apiConnected={true} />
      <main className="main-content">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
