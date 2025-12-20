import { SOWData } from '@/lib/types';
import { hasValue } from '@/lib/utils';

interface DealDetailsSectionProps {
  data: SOWData;
}

export function DealDetailsSection({ data }: DealDetailsSectionProps) {
  return (
    <div className="space-y-0">
      {hasValue(data.customer.name) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Customer Name</span>
          <span className="text-sm text-text-primary font-normal break-words">{data.customer.name}</span>
        </div>
      )}

      {hasValue(data.customer.phone) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Phone Number</span>
          <span className="text-sm text-text-primary font-normal break-words">{data.customer.phone}</span>
        </div>
      )}

      {hasValue(data.customer.email) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Email</span>
          <span className="text-sm text-text-primary font-normal break-words">{data.customer.email}</span>
        </div>
      )}

      {hasValue(data.salesRep.name) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Sales Rep Name</span>
          <span className="text-sm text-text-primary font-normal break-words">{data.salesRep.name}</span>
        </div>
      )}

      {hasValue(data.salesRep.email) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Sales Rep Email</span>
          <span className="text-sm text-text-primary font-normal break-words">{data.salesRep.email}</span>
        </div>
      )}

      {hasValue(data.setter) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Setter</span>
          <span className="text-sm text-text-primary font-normal break-words">{data.setter}</span>
        </div>
      )}

      {hasValue(data.leadSource) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-base uppercase tracking-wide text-text-muted">Lead Source</span>
          <span className="text-sm text-text-primary font-normal break-words">{data.leadSource}</span>
        </div>
      )}
    </div>
  );
}
