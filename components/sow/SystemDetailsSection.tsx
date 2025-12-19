import { SOWData } from '@/lib/types';
import { formatValue } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface SystemDetailsSectionProps {
  data: SOWData;
}

export function SystemDetailsSection({ data }: SystemDetailsSectionProps) {
  const { system } = data;

  return (
    <Card>
      <CardHeader>System Details</CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">System Size:</span>
            <span className="font-medium text-gray-900">{formatValue(system.size)} kW</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Panel Type:</span>
            <span className="font-medium text-gray-900">{formatValue(system.panelType)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Panel Count:</span>
            <span className="font-medium text-gray-900">{formatValue(system.panelCount)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Inverter Type:</span>
            <span className="font-medium text-gray-900">{formatValue(system.inverterType)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Inverter Count:</span>
            <span className="font-medium text-gray-900">{formatValue(system.inverterCount)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Battery Type:</span>
            <span className="font-medium text-gray-900">{formatValue(system.batteryType)}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-4">
            <span className="text-gray-600">Battery Count:</span>
            <span className="font-medium text-gray-900">{formatValue(system.batteryCount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
