'use client';

import { forwardRef } from 'react';
import { Button } from '@/components/ui/Button';

interface ApprovalActionsProps {
  token: string;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const ApprovalActions = forwardRef<HTMLButtonElement, ApprovalActionsProps>(
  function ApprovalActions({ token, onApprove, onReject, isLoading = false }, ref) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Button
          ref={ref}
          variant="primary"
          onClick={onApprove}
          isLoading={isLoading}
          disabled={isLoading}
          className="w-full text-sm py-1 text-left pl-4 border-2 border-transparent"
        >
          Approve
        </Button>
        <Button
          variant="secondary"
          onClick={onReject}
          isLoading={isLoading}
          disabled={isLoading}
          className="w-full text-sm py-1 text-left pl-4"
        >
          Reject
        </Button>
      </div>
    );
  }
);
