import { SOWData } from '@/lib/types';
import { hasValue } from '@/lib/utils';

interface SystemDetailsSectionProps {
  data: SOWData;
}

export function SystemDetailsSection({ data }: SystemDetailsSectionProps) {
  const { system } = data;

  return (
    <div className="space-y-0">
      {hasValue(system.size) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">System Size</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{system.size} kW</span>
        </div>
      )}

      {hasValue(system.panelType) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Panel Type</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{system.panelType}</span>
        </div>
      )}

      {hasValue(system.panelCount) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Panel Count</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{system.panelCount}</span>
        </div>
      )}

      {hasValue(system.inverterType) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Inverter Type</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{system.inverterType}</span>
        </div>
      )}

      {hasValue(system.inverterCount) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Inverter Count</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{system.inverterCount}</span>
        </div>
      )}

      {hasValue(system.batteryType) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Battery Type</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{system.batteryType}</span>
        </div>
      )}

      {hasValue(system.batteryCount) && (
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] gap-2 md:gap-8 md:items-baseline py-6 border-b border-text-muted">
          <span className="text-[19px] uppercase tracking-wide text-text-muted">Battery Count</span>
          <span className="text-[15px] text-text-primary font-normal break-words">{system.batteryCount}</span>
        </div>
      )}
    </div>
  );
}
