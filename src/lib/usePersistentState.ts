import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const PREFIX = 'apex-horizon:';

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    // Shallow-merge objects so fields added in later versions pick up their defaults.
    if (isPlainObject(fallback) && isPlainObject(parsed)) return { ...fallback, ...parsed } as T;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** `useState` that survives reloads. Storage failures (private mode, blocked storage) fall back to memory. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => read(key, initial));

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(state));
    } catch {
      /* storage unavailable — keep working in memory */
    }
  }, [key, state]);

  return [state, setState];
}
