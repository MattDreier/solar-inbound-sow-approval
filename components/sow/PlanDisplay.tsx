import { SOWData } from '@/lib/types';

interface PlanDisplayProps {
  data: SOWData;
}

export function PlanDisplay({ data }: PlanDisplayProps) {
  return (
    <div>
      {/* PDF Viewer for desktop */}
      <div className="hidden md:block">
        <div className="w-full h-[600px] border border-dark-border overflow-hidden bg-dark-surface">
          <iframe
            src={data.planFileUrl}
            className="w-full h-full"
            title="Installation Plan PDF"
          />
        </div>
      </div>

      {/* Download link for mobile */}
      <div className="md:hidden">
        <p className="text-sm text-light-tertiary mb-5">
          PDF viewer is not available on mobile devices.
        </p>
        <a
          href={data.planFileUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-1 bg-white text-gray-900 hover:bg-gray-100 transition-all duration-300 text-sm text-left font-normal"
        >
          Download Plan PDF
        </a>
      </div>
    </div>
  );
}
