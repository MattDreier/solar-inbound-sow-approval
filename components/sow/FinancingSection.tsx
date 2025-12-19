import { SOWData } from '@/lib/types';
import { formatValue, formatCurrency, formatPercent } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface FinancingSectionProps {
  data: SOWData;
}

export function FinancingSection({ data }: FinancingSectionProps) {
  const { financing } = data;

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Lender</span>
            <span className="text-body text-light-primary text-right">{formatValue(financing.lender)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Term Length</span>
            <span className="text-body text-light-primary text-right">{formatValue(financing.termLength)} years</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Finance Type</span>
            <span className="text-body text-light-primary text-right">{formatValue(financing.financeType)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Interest Rate</span>
            <span className="text-body text-light-primary text-right">{formatPercent(financing.interestRate)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Total Contract Amount</span>
            <span className="text-body text-light-primary text-right">{formatCurrency(financing.totalContractAmount)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Dealer Fee Amount</span>
            <span className="text-body text-light-primary text-right">{formatCurrency(financing.dealerFeeAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
