import { SOWData } from '@/lib/types';
import { formatCurrency, formatAdderLabel } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

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
    <Card>
      <CardHeader>Adders</CardHeader>
      <CardContent>
        {adderEntries.length === 0 ? (
          <p className="text-gray-500">No adders for this project</p>
        ) : (
          <div className="space-y-2">
            {adderEntries.map(({ label, value }) => (
              <div key={label} className="grid grid-cols-[1fr_auto] gap-4 py-1">
                <span className="text-gray-700">{label}:</span>
                <span className="font-medium text-gray-900 text-right">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}

            <div className="border-t border-gray-300 mt-4 pt-3">
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <span className="font-semibold text-gray-900">Total Adders:</span>
                <span className="font-bold text-gray-900 text-right">
                  {formatCurrency(adders.addersTotal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
