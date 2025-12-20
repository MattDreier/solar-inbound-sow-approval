import { SOWData } from '@/lib/types';
import { formatValue, formatCurrency, formatPercent } from '@/lib/utils';

interface FinancingSectionProps {
  data: SOWData;
}

export function FinancingSection({ data }: FinancingSectionProps) {
  const { financing } = data;

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Lender</span>
        <span className="text-base text-white font-normal">{formatValue(financing.lender)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Term Length</span>
        <span className="text-base text-white font-normal">{formatValue(financing.termLength)} years</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Finance Type</span>
        <span className="text-base text-white font-normal">{formatValue(financing.financeType)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Interest Rate</span>
        <span className="text-base text-white font-normal">{formatPercent(financing.interestRate)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Total Contract Amount</span>
        <span className="text-base text-white font-normal">{formatCurrency(financing.totalContractAmount)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Dealer Fee Amount</span>
        <span className="text-base text-white font-normal">{formatCurrency(financing.dealerFeeAmount)}</span>
      </div>
    </div>
  );
}
