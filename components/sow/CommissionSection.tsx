import { SOWData } from '@/lib/types';
import { hasValue, formatCurrency } from '@/lib/utils';

interface CommissionSectionProps {
  data: SOWData;
}

export function CommissionSection({ data }: CommissionSectionProps) {
  const { commission } = data;

  return (
    <div className="space-y-0">
      {hasValue(commission.grossPpw) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Gross PPW</span>
          <span className="text-sm text-text-primary font-normal break-words">${commission.grossPpw}</span>
        </div>
      )}

      {hasValue(commission.totalAddersPpw) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Total Adders PPW</span>
          <span className="text-sm text-text-primary font-normal break-words">${commission.totalAddersPpw}</span>
        </div>
      )}

      {hasValue(commission.netPpw) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Net PPW</span>
          <span className="text-sm text-text-primary font-normal break-words">${commission.netPpw}</span>
        </div>
      )}

      {hasValue(commission.totalCommission) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Total Commission</span>
          <span className="text-sm text-commission-text font-semibold break-words">{formatCurrency(commission.totalCommission)}</span>
        </div>
      )}
    </div>
  );
}
