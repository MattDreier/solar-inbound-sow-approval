'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function ApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ApprovalModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Scope of Work">
      <div className="space-y-6">
        <div className="bg-status-pending/15 border border-status-pending/15 p-4">
          <p className="text-sm text-status-pending font-bold mb-3">
            IMPORTANT DISCLAIMER
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            This scope of work is subject to change after pre-production upload and installation.
            By approving, you acknowledge that modifications may be required during the installation process.
          </p>
        </div>

        <div className="pt-6 w-full">
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full text-sm py-1 text-left pl-4 border-2 border-transparent dark:!bg-white dark:!text-gray-900 dark:hover:!bg-gray-100"
          >
            Submit Approval
          </Button>
        </div>
      </div>
    </Modal>
  );
}
