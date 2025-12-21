import { SOWData } from '@/lib/types';
import { hasValue, formatCurrency, formatPercent } from '@/lib/utils';

interface FinancingSectionProps {
  data: SOWData;
}

export function FinancingSection({ data }: FinancingSectionProps) {
  const { financing } = data;

  return (
    <div className="space-y-0">
      {hasValue(financing.lender) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Lender</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{financing.lender}</span>
        </div>
      )}

      {hasValue(financing.termLength) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Term Length</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{financing.termLength} years</span>
        </div>
      )}

      {hasValue(financing.financeType) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Finance Type</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{financing.financeType}</span>
        </div>
      )}

      {hasValue(financing.interestRate) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Interest Rate</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{formatPercent(financing.interestRate)}</span>
        </div>
      )}

      {hasValue(financing.totalContractAmount) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Total Contract Amount</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{formatCurrency(financing.totalContractAmount)}</span>
        </div>
      )}

      {hasValue(financing.dealerFeeAmount) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Dealer Fee Amount</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{formatCurrency(financing.dealerFeeAmount)}</span>
        </div>
      )}
    </div>
  );
}
