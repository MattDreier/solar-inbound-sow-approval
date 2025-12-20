import { SOWData } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

interface StatusBadgeProps {
  data: SOWData;
}

export function StatusBadge({ data }: StatusBadgeProps) {
  if (data.status === 'pending') {
    return null;
  }

  const isApproved = data.status === 'approved';
  const bgColor = isApproved ? 'bg-status-approved' : 'bg-status-rejected';
  const borderColor = isApproved ? 'border-status-approved' : 'border-status-rejected';
  const statusText = isApproved ? 'APPROVED' : 'REJECTED';
  const timestamp = isApproved ? data.approvedAt : data.rejectedAt;
  const actionBy = isApproved ? data.approvedBy : null;

  return (
    <div className="space-y-6">
      <Card className={`${bgColor} ${borderColor} border-2`}>
        <div className="text-center py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {statusText}
          </h1>
          <p className="text-white text-sm md:text-base">
            {formatDate(timestamp)}
          </p>
          {actionBy && (
            <p className="text-white text-sm md:text-base mt-1">
              by {actionBy}
            </p>
          )}
        </div>
      </Card>

      {!isApproved && data.rejectionReason && (
        <Card className="border-2 border-status-rejected">
          <div className="space-y-3">
            <h3 className="font-semibold text-light-secondary">Rejection Reason:</h3>
            <p className="text-light-secondary whitespace-pre-wrap">{data.rejectionReason}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
