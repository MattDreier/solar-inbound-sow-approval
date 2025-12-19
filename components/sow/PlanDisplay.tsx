import { SOWData } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface PlanDisplayProps {
  data: SOWData;
}

export function PlanDisplay({ data }: PlanDisplayProps) {
  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          {/* PDF Viewer for desktop */}
          <div className="hidden md:block">
            <div className="w-full h-[600px] border border-dark-border rounded-md overflow-hidden bg-dark-surface">
              <iframe
                src={data.planFileUrl}
                className="w-full h-full"
                title="Installation Plan PDF"
              />
            </div>
          </div>

          {/* Download link for mobile and as backup */}
          <div className="md:hidden">
            <p className="text-sm text-light-tertiary mb-5">
              PDF viewer is not available on mobile devices.
            </p>
          </div>

          <a
            href={data.planFileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Plan PDF
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
