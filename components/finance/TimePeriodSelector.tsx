'use client';

// ============================================================================
// TimePeriodSelector — Button group for 7d / 30d / 90d time ranges
// ============================================================================

interface TimePeriodSelectorProps {
  selected: number;
  onChange: (days: number) => void;
}

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

export default function TimePeriodSelector({
  selected,
  onChange,
}: TimePeriodSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
      {PERIODS.map(({ label, days }) => {
        const isActive = selected === days;

        return (
          <button
            key={days}
            type="button"
            onClick={() => onChange(days)}
            className={`
              px-4 py-1.5 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-white/15 text-[#ededed]'
                  : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-[#ededed]'
              }
              ${days !== PERIODS[0].days ? 'border-l border-white/10' : ''}
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
