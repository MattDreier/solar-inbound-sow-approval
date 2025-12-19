import { SOWData } from '@/lib/types';
import { formatValue } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface DealDetailsSectionProps {
  data: SOWData;
}

export function DealDetailsSection({ data }: DealDetailsSectionProps) {
  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Customer Name</span>
            <span className="text-body text-light-primary text-right">{formatValue(data.customer.name)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Phone</span>
            <span className="text-body text-light-primary text-right">{formatValue(data.customer.phone)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Email</span>
            <span className="text-body text-light-primary text-right">{formatValue(data.customer.email)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Sales Rep Name</span>
            <span className="text-body text-light-primary text-right">{formatValue(data.salesRep.name)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Sales Rep Email</span>
            <span className="text-body text-light-primary text-right">{formatValue(data.salesRep.email)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Setter</span>
            <span className="text-body text-light-primary text-right">{formatValue(data.setter)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Lead Source</span>
            <span className="text-body text-light-primary text-right">{formatValue(data.leadSource)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
