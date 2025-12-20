'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const rejectionSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(2000, 'Reason must be 2000 characters or less'),
});

type RejectionFormData = z.infer<typeof rejectionSchema>;

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function RejectionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: RejectionModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    mode: 'onChange',
  });

  const reason = watch('reason') || '';
  const characterCount = reason.length;

  const handleFormSubmit = async (data: RejectionFormData) => {
    await onSubmit(data.reason);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Scope of Work">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="rejection-reason"
            className="block text-sm font-medium text-text-secondary mb-3"
          >
            Reason for Rejection
          </label>
          <textarea
            id="rejection-reason"
            rows={6}
            className={`w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
              errors.reason ? 'border-status-rejected' : 'border-border'
            }`}
            placeholder="Please provide a detailed reason for rejecting this scope of work..."
            disabled={isLoading}
            {...register('reason')}
          />
          <div className="flex justify-between items-start mt-2">
            <p className="text-sm text-text-muted">
              This will be sent to the design team.
            </p>
            <p
              className={`text-sm ${
                characterCount > 2000 ? 'text-status-rejected' : 'text-text-muted'
              }`}
            >
              {characterCount}/2000
            </p>
          </div>
          {errors.reason && (
            <p className="text-sm text-status-rejected mt-2">{errors.reason.message}</p>
          )}
        </div>

        <div className="pt-6 w-full">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!isValid || isLoading}
            className="w-full text-sm py-1 text-left pl-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900"
          >
            Submit Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
