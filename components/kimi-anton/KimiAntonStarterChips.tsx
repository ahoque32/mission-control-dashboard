'use client';

const KIMI_ANTON_STARTER_CHIPS = [
  "Review today's open tasks",
  'Summarize agent activity for the last 24h',
  'Draft a status report for Anton',
  'Check for any blocked tasks',
  'What SOPs apply to deployment?',
];

interface KimiAntonStarterChipsProps {
  onSelect: (message: string) => void;
}

export default function KimiAntonStarterChips({ onSelect }: KimiAntonStarterChipsProps) {
  return (
    <div className="text-center py-6">
      <p className="text-foreground-secondary text-sm mb-4">
        Ask Kimi anything about operations (Anton instance)
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {KIMI_ANTON_STARTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10
                       text-foreground hover:bg-white/10 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
