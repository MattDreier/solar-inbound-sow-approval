import { SOWData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface CommissionSectionProps {
  data: SOWData;
}

export function CommissionSection({ data }: CommissionSectionProps) {
  const { commission } = data;

  return (
    <Card highlighted={true}>
      <CardHeader>Commission Breakdown</CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-700">Gross PPW:</span>
            <span className="font-bold text-gray-900">${commission.grossPpw}</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-700">Total Adders PPW:</span>
            <span className="font-bold text-gray-900">${commission.totalAddersPpw}</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-700">Net PPW:</span>
            <span className="font-bold text-gray-900">${commission.netPpw}</span>
          </div>

          <div className="grid grid-cols-[180px_1fr] gap-4">
            <span className="text-gray-700">Total Commission:</span>
            <span className="font-bold text-gray-900">{formatCurrency(commission.totalCommission)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
