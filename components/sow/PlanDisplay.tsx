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
        <p className="text-sm text-secondary mb-5">
          PDF viewer is not available on mobile devices.
        </p>
        <a
          href={data.planFileUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center w-full px-4 py-1 min-h-[61.5px] bg-dark-bg text-white dark:bg-white dark:text-gray-900 overflow-hidden transition-all duration-300 text-sm text-left font-normal before:absolute before:inset-0 before:bg-amber-500 before:-translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 hover:text-gray-900 dark:hover:text-gray-900"
        >
          <span className="relative z-10">Download Plan PDF</span>
        </a>
      </div>
    </div>
  );
}
