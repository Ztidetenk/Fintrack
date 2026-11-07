import { useEffect, useState } from 'react';

/** Destructive actions run on the second click; the first one arms the button for a few seconds. */
export function useTwoStepConfirm(action: () => void, ms = 3000) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), ms);
    return () => window.clearTimeout(t);
  }, [armed, ms]);

  const trigger = () => {
    if (armed) {
      setArmed(false);
      action();
    } else {
      setArmed(true);
    }
  };

  return { armed, trigger };
}
