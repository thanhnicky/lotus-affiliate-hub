export function LotusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="currentColor" className="text-primary" />
      <path
        d="M24 11c3.6 3.9 5.4 7.6 5.4 11.2 0 1.6-.3 3-.9 4.4 2.3-1.9 4.9-2.9 7.8-3.1-.6 5.9-4.9 10.6-10.6 11.9-.6.1-1.1.2-1.7.2s-1.1-.1-1.7-.2C16.6 34.1 12.3 29.4 11.7 23.5c2.9.2 5.5 1.2 7.8 3.1-.6-1.4-.9-2.8-.9-4.4 0-3.6 1.8-7.3 5.4-11.2Z"
        fill="oklch(0.97 0.03 20)"
      />
    </svg>
  );
}
