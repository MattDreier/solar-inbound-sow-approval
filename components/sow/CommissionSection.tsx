import { SOWData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface CommissionSectionProps {
  data: SOWData;
}

export function CommissionSection({ data }: CommissionSectionProps) {
  const { commission } = data;

  return (
    <Card highlighted={true}>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-commission-text/80 shrink-0">Gross PPW</span>
            <span className="text-body text-commission-text font-medium text-right">${commission.grossPpw}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-commission-text/80 shrink-0">Total Adders PPW</span>
            <span className="text-body text-commission-text font-medium text-right">${commission.totalAddersPpw}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-commission-text/80 shrink-0">Net PPW</span>
            <span className="text-body text-commission-text font-medium text-right">${commission.netPpw}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-commission-text/80 shrink-0">Total Commission</span>
            <span className="text-body-lg text-commission-text font-semibold text-right">{formatCurrency(commission.totalCommission)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
