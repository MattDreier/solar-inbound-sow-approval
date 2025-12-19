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
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="rejection-reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reason for Rejection
          </label>
          <textarea
            id="rejection-reason"
            rows={6}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
              errors.reason ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Please provide a detailed reason for rejecting this scope of work..."
            disabled={isLoading}
            {...register('reason')}
          />
          <div className="flex justify-between items-start mt-1">
            <p className="text-sm text-gray-500">
              This will be sent to the design team.
            </p>
            <p
              className={`text-sm ${
                characterCount > 2000 ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {characterCount}/2000
            </p>
          </div>
          {errors.reason && (
            <p className="text-sm text-red-500 mt-1">{errors.reason.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isLoading}
            disabled={!isValid || isLoading}
            className="flex-1"
          >
            Submit Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
