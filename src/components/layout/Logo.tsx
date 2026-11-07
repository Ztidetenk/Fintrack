import { useId } from 'react';

export function Logo({ className = 'size-8' }: { className?: string }) {
  const gradient = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={gradient} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#09090b" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#27272a" />
      <path
        d="M6 23 13.5 9l4.5 8 2.5-4L26 23Z"
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="23.5" cy="8.5" r="2" fill="#f59e0b" />
    </svg>
  );
}
