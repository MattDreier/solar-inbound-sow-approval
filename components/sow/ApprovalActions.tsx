'use client';

import { Button } from '@/components/ui/Button';

interface ApprovalActionsProps {
  token: string;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function ApprovalActions({
  token,
  onApprove,
  onReject,
  isLoading = false,
}: ApprovalActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <Button
        variant="secondary"
        onClick={onReject}
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full sm:w-auto sm:flex-1"
      >
        Reject
      </Button>
      <Button
        variant="primary"
        onClick={onApprove}
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full sm:w-auto sm:flex-[2] text-lg"
      >
        Approve
      </Button>
    </div>
  );
}
