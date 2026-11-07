import { Lock, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../state/DashboardContext';
import { StatusPill } from './ui/StatusPill';

export function SessionPill() {
  const { terminalStatus } = useDashboard();
  if (terminalStatus.status === 'locked')
    return (
      <StatusPill tone="rose" icon={Lock}>
        Locked out
      </StatusPill>
    );
  if (terminalStatus.status === 'active')
    return (
      <StatusPill tone="emerald" pulse>
        Session active
      </StatusPill>
    );
  return (
    <StatusPill tone="zinc" icon={ShieldCheck}>
      Standby · {terminalStatus.gatePassed}/5 gate
    </StatusPill>
  );
}
