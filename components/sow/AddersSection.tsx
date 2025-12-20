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
        <p className="text-sm text-gray-400 py-6">No adders for this project</p>
      ) : (
        <>
          {adderEntries.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-baseline py-6 border-b border-gray-700">
              <span className="text-sm uppercase tracking-wide text-gray-400">{label}</span>
              <span className="text-base text-white font-normal">
                {formatCurrency(value)}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
            <span className="text-sm uppercase tracking-wide text-gray-400">Total Adders</span>
            <span className="text-base text-white font-normal">
              {formatCurrency(adders.addersTotal)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
