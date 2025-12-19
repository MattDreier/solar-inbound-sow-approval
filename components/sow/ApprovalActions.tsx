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
    <div className="flex flex-col gap-3 w-full">
      <Button
        variant="primary"
        onClick={onApprove}
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full text-lg"
      >
        Approve
      </Button>
      <Button
        variant="danger"
        onClick={onReject}
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        Reject
      </Button>
    </div>
  );
}
