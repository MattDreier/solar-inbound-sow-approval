import { SOWData } from '@/lib/types';
import { formatValue } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface SystemDetailsSectionProps {
  data: SOWData;
}

export function SystemDetailsSection({ data }: SystemDetailsSectionProps) {
  const { system } = data;

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">System Size</span>
            <span className="text-body text-light-primary text-right">{formatValue(system.size)} kW</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Panel Type</span>
            <span className="text-body text-light-primary text-right">{formatValue(system.panelType)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Panel Count</span>
            <span className="text-body text-light-primary text-right">{formatValue(system.panelCount)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Inverter Type</span>
            <span className="text-body text-light-primary text-right">{formatValue(system.inverterType)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Inverter Count</span>
            <span className="text-body text-light-primary text-right">{formatValue(system.inverterCount)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Battery Type</span>
            <span className="text-body text-light-primary text-right">{formatValue(system.batteryType)}</span>
          </div>

          <div className="flex justify-between items-baseline gap-8">
            <span className="text-body-sm text-light-muted shrink-0">Battery Count</span>
            <span className="text-body text-light-primary text-right">{formatValue(system.batteryCount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
