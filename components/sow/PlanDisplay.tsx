import { SOWData } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface PlanDisplayProps {
  data: SOWData;
}

export function PlanDisplay({ data }: PlanDisplayProps) {
  return (
    <Card>
      <CardHeader>Plan</CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* PDF Viewer for desktop */}
          <div className="hidden md:block">
            <div className="w-full h-[600px] border border-gray-200 rounded-md overflow-hidden bg-gray-50">
              <iframe
                src={data.planFileUrl}
                className="w-full h-full"
                title="Installation Plan PDF"
              />
            </div>
          </div>

          {/* Download link for mobile and as backup */}
          <div className="md:hidden">
            <p className="text-sm text-gray-600 mb-3">
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
