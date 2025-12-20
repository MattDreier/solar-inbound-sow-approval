import { SOWData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface CommissionSectionProps {
  data: SOWData;
}

export function CommissionSection({ data }: CommissionSectionProps) {
  const { commission } = data;

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Gross PPW</span>
        <span className="text-base text-white font-normal">${commission.grossPpw}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Total Adders PPW</span>
        <span className="text-base text-white font-normal">${commission.totalAddersPpw}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Net PPW</span>
        <span className="text-base text-white font-normal">${commission.netPpw}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Total Commission</span>
        <span className="text-base text-green-400 font-semibold">{formatCurrency(commission.totalCommission)}</span>
      </div>
    </div>
  );
}
