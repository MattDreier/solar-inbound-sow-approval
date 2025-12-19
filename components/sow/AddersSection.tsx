import { SOWData } from '@/lib/types';
import { formatCurrency, formatAdderLabel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

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
      <CardContent>
        {adderEntries.length === 0 ? (
          <p className="text-body-sm text-light-muted">No adders for this project</p>
        ) : (
          <div className="space-y-4">
            {adderEntries.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-baseline gap-8">
                <span className="text-body-sm text-light-muted">{label}</span>
                <span className="text-body text-light-primary text-right">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}

            <div className="border-t border-dark-border/40 mt-6 pt-6">
              <div className="flex justify-between items-baseline gap-8">
                <span className="text-body text-light-secondary">Total Adders</span>
                <span className="text-body-lg text-light-primary font-medium text-right">
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
