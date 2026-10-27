import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { Sidebar } from './components/layout/Sidebar';
import { CommandCenter } from './sections/CommandCenter';
import { ExecutionTerminal } from './sections/ExecutionTerminal';
import { Journal } from './sections/Journal';
import { Roadmap } from './sections/Roadmap';
import { TreasurySimulator } from './sections/TreasurySimulator';
import { TrophyRoom } from './sections/TrophyRoom';
import { DashboardProvider, useDashboard, type TabId } from './state/DashboardContext';

const SECTIONS: Record<TabId, () => React.JSX.Element> = {
  command: CommandCenter,
  roadmap: Roadmap,
  treasury: TreasurySimulator,
  vault: TrophyRoom,
  terminal: ExecutionTerminal,
  journal: Journal,
};

function Shell() {
  const { tab } = useDashboard();
  const Section = SECTIONS[tab] ?? CommandCenter;

  // Each tab opens at the top, like a fresh page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-12 lg:px-8">
          <div key={tab} className="motion-safe:animate-[fade-in_280ms_ease-out]">
            <Section />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <Shell />
    </DashboardProvider>
  );
}
