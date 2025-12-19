import { SOWData } from '@/lib/types';
import { formatValue, formatCurrency, formatPercent } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface FinancingSectionProps {
  data: SOWData;
}

export function FinancingSection({ data }: FinancingSectionProps) {
  const { financing } = data;

  return (
    <Card>
      <CardHeader>Financing Details</CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-600">Lender:</span>
            <span className="font-medium text-gray-900">{formatValue(financing.lender)}</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-600">Term Length:</span>
            <span className="font-medium text-gray-900">{formatValue(financing.termLength)} years</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-600">Finance Type:</span>
            <span className="font-medium text-gray-900">{formatValue(financing.financeType)}</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-600">Interest Rate:</span>
            <span className="font-medium text-gray-900">{formatPercent(financing.interestRate)}</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-600">Total Contract Amount:</span>
            <span className="font-medium text-gray-900">{formatCurrency(financing.totalContractAmount)}</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-600">Dealer Fee Amount:</span>
            <span className="font-medium text-gray-900">{formatCurrency(financing.dealerFeeAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
