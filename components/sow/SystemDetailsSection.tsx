import { SOWData } from '@/lib/types';
import { formatValue } from '@/lib/utils';

interface SystemDetailsSectionProps {
  data: SOWData;
}

export function SystemDetailsSection({ data }: SystemDetailsSectionProps) {
  const { system } = data;

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">System Size</span>
        <span className="text-base text-white font-normal">{formatValue(system.size)} kW</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Panel Type</span>
        <span className="text-base text-white font-normal">{formatValue(system.panelType)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Panel Count</span>
        <span className="text-base text-white font-normal">{formatValue(system.panelCount)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Inverter Type</span>
        <span className="text-base text-white font-normal">{formatValue(system.inverterType)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Inverter Count</span>
        <span className="text-base text-white font-normal">{formatValue(system.inverterCount)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Battery Type</span>
        <span className="text-base text-white font-normal">{formatValue(system.batteryType)}</span>
      </div>

      <div className="flex justify-between items-baseline py-6 border-b border-gray-700">
        <span className="text-sm uppercase tracking-wide text-gray-400">Battery Count</span>
        <span className="text-base text-white font-normal">{formatValue(system.batteryCount)}</span>
      </div>
    </div>
  );
}
