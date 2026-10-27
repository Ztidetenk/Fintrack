import { Calculator, LayoutDashboard, NotebookPen, Route, SquareTerminal, Trophy, type LucideIcon } from 'lucide-react';
import type { TabId } from '../../state/DashboardContext';

export const NAV: { id: TabId; label: string; short: string; icon: LucideIcon; blurb: string }[] = [
  {
    id: 'command',
    label: 'Command Center',
    short: 'Command',
    icon: LayoutDashboard,
    blurb: 'Live horizon stats across the whole plan.',
  },
  {
    id: 'roadmap',
    label: '15-Year Roadmap',
    short: 'Roadmap',
    icon: Route,
    blurb: 'Five phases from one 25k eval to a private fund.',
  },
  {
    id: 'treasury',
    label: 'Treasury Split',
    short: 'Treasury',
    icon: Calculator,
    blurb: 'Slide a payout, watch the split compound for 15 years.',
  },
  {
    id: 'vault',
    label: 'Trophy Room',
    short: 'Trophies',
    icon: Trophy,
    blurb: 'Every hard asset the vault is funding, in order.',
  },
  {
    id: 'terminal',
    label: 'Execution Terminal',
    short: 'Terminal',
    icon: SquareTerminal,
    blurb: "Today only. Gatekeeper, circuit breaker, and the reason you're here.",
  },
  {
    id: 'journal',
    label: 'Trade Journal',
    short: 'Journal',
    icon: NotebookPen,
    blurb: 'Every day you traded, what you made or lost, and why.',
  },
];
