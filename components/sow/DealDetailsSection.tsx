import { SOWData } from '@/lib/types';
import { formatValue } from '@/lib/utils';

interface DealDetailsSectionProps {
  data: SOWData;
}

export function DealDetailsSection({ data }: DealDetailsSectionProps) {
  return (
    <div className="space-y-0">
      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Customer Name</span>
        <span className="text-base text-white font-normal">{formatValue(data.customer.name)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Phone Number</span>
        <span className="text-base text-white font-normal">{formatValue(data.customer.phone)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Email</span>
        <span className="text-base text-white font-normal">{formatValue(data.customer.email)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Sales Rep Name</span>
        <span className="text-base text-white font-normal">{formatValue(data.salesRep.name)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Sales Rep Email</span>
        <span className="text-base text-white font-normal">{formatValue(data.salesRep.email)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Setter</span>
        <span className="text-base text-white font-normal">{formatValue(data.setter)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Lead Source</span>
        <span className="text-base text-white font-normal">{formatValue(data.leadSource)}</span>
      </div>
    </div>
  );
}
