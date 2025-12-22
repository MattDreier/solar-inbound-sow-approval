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
          className="group relative flex items-center justify-start w-full px-4 py-3 min-h-[61.5px] mb-5 border-2 border-dark-bg text-dark-bg dark:border-light-primary dark:text-light-primary bg-transparent overflow-visible before:absolute before:inset-[-2px] before:border-2 before:border-amber-500 before:[clip-path:inset(0_100%_0_0)] before:transition-[clip-path] before:duration-300 before:ease-out hover:before:[clip-path:inset(0)]"
        >
          <span className="relative z-10 inline-block">
            <span className="relative">Download Plan PDF</span>
            <span
              className="absolute inset-0 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-hidden="true"
            >
              Download Plan PDF
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}
