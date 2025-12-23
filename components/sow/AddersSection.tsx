import { SOWData } from '@/lib/types';
import { formatCurrency, formatAdderLabel } from '@/lib/utils';

interface AddersSectionProps {
  data: SOWData;
}

export function AddersSection({ data }: AddersSectionProps) {
  const { adders } = data;

  // Filter out null values and the addersTotal field
  const adderEntries = Object.entries(adders)
    .filter(([key, value]) => key !== 'addersTotal' && value !== null)
    .map(([key, value]) => ({
      label: formatAdderLabel(key),
      value: value as number,
    }));

  return (
    <div className="space-y-0">
      {adderEntries.length === 0 ? (
        <p className="text-section-value text-text-muted py-6">No adders for this project</p>
      ) : (
        <>
          {adderEntries.map(({ label, value }) => (
            <div key={label} className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
              <span className="text-section-label uppercase text-text-muted">{label}</span>
              <span className="text-section-value text-text-primary break-words">
                {formatCurrency(value)}
              </span>
            </div>
          ))}

          <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
            <span className="text-section-label uppercase text-text-muted">Total</span>
            <span className="text-section-value text-text-primary break-words">
              {formatCurrency(adders.addersTotal)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
