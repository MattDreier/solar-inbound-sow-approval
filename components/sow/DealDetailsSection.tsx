import { SOWData } from '@/lib/types';
import { formatValue } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface DealDetailsSectionProps {
  data: SOWData;
}

export function DealDetailsSection({ data }: DealDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>Deal Details</CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Customer Name:</span>
            <span className="font-medium text-gray-900">{formatValue(data.customer.name)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium text-gray-900">{formatValue(data.customer.phone)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">{formatValue(data.customer.email)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Sales Rep Name:</span>
            <span className="font-medium text-gray-900">{formatValue(data.salesRep.name)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Sales Rep Email:</span>
            <span className="font-medium text-gray-900">{formatValue(data.salesRep.email)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Setter:</span>
            <span className="font-medium text-gray-900">{formatValue(data.setter)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Lead Source:</span>
            <span className="font-medium text-gray-900">{formatValue(data.leadSource)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
