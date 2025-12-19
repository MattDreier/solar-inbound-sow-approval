'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/layout/Container';
import { PinInput } from '@/components/ui/PinInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { API_ENDPOINTS } from '@/lib/constants';
import { getSOWState, saveSOWState } from '@/lib/storage';
import type { VerifyPinRequest, VerifyPinResponse, SOWData, SOWState } from '@/lib/types';

// Import all SOW sections
import {
  DealDetailsSection,
  SystemDetailsSection,
  FinancingSection,
  AddersSection,
  CommissionSection,
  ProposalDisplay,
  PlanDisplay,
  DisclaimerSection,
  StatusBadge,
} from '@/components/sow';

import { ApprovalActions } from '@/components/sow/ApprovalActions';
import { RejectionModal } from '@/components/sow/RejectionModal';

export default function SOWPage() {
  const params = useParams();
  const token = params.token as string;

  // PIN entry state
  const [isVerified, setIsVerified] = useState(false);
  const [pinError, setPinError] = useState<string>('');
  const [isPinLoading, setIsPinLoading] = useState(false);

  // SOW data state
  const [sowData, setSOWData] = useState<SOWData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Load SOW data after PIN verification
  useEffect(() => {
    if (!isVerified) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch SOW data from API
        const response = await fetch(`${API_ENDPOINTS.GET_SOW}?token=${token}`);

        if (!response.ok) {
          throw new Error('Failed to fetch SOW data');
        }

        const data: SOWData = await response.json();

        // Merge with localStorage state (localStorage takes priority)
        const localState = getSOWState(token);
        if (localState) {
          data.status = localState.status;
          data.approvedAt = localState.approvedAt || data.approvedAt;
          data.approvedBy = localState.approvedBy || data.approvedBy;
          data.rejectedAt = localState.rejectedAt || data.rejectedAt;
          data.rejectionReason = localState.rejectionReason || data.rejectionReason;
        }

        setSOWData(data);
        setIsLoadingData(false);
      } catch (err) {
        setDataError('Failed to load SOW data. Please try again.');
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isVerified, token]);

  const handlePinComplete = async (pin: string) => {
    setPinError('');
    setIsPinLoading(true);

    try {
      const requestBody: VerifyPinRequest = { token, pin };

      const response = await fetch(API_ENDPOINTS.VERIFY_PIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: VerifyPinResponse = await response.json();

      if (data.valid) {
        // PIN verified - show SOW content
        setIsVerified(true);
      } else {
        // Show error message
        setPinError(data.error || 'Incorrect PIN. Please try again.');
        setIsPinLoading(false);
      }
    } catch (err) {
      setPinError('An error occurred. Please try again.');
      setIsPinLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!sowData) return;

    setActionLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.APPROVE_SOW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          approverEmail: sowData.salesRep.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve SOW');
      }

      const result = await response.json();

      // Update localStorage
      const newState: SOWState = {
        status: 'approved',
        approvedAt: result.approvedAt,
        approvedBy: sowData.salesRep.email,
      };
      saveSOWState(token, newState);

      // Update UI
      setSOWData({
        ...sowData,
        status: 'approved',
        approvedAt: result.approvedAt,
        approvedBy: sowData.salesRep.email,
      });
    } catch (err) {
      alert('Failed to approve SOW. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!sowData) return;

    setActionLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.REJECT_SOW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          reason,
          rejecterEmail: sowData.salesRep.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject SOW');
      }

      const result = await response.json();

      // Update localStorage
      const newState: SOWState = {
        status: 'rejected',
        rejectedAt: result.rejectedAt,
        rejectionReason: reason,
      };
      saveSOWState(token, newState);

      // Update UI
      setSOWData({
        ...sowData,
        status: 'rejected',
        rejectedAt: result.rejectedAt,
        rejectionReason: reason,
      });

      // Close modal
      setShowRejectionModal(false);
    } catch (err) {
      alert('Failed to reject SOW. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // PIN Entry View
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Scope of Work Review
                </h1>
                <p className="text-gray-600 mb-1">
                  Enter your PIN to view this SOW
                </p>
                <p className="text-sm text-gray-500">
                  PIN was sent to your email
                </p>
              </div>

              <PinInput
                onComplete={handlePinComplete}
                error={pinError}
                isLoading={isPinLoading}
              />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Loading SOW Data
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <LoadingSpinner size="lg" />
        </Container>
      </div>
    );
  }

  // Error State
  if (dataError || !sowData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {dataError || 'SOW not found'}
            </h1>
            <p className="text-gray-600">Please check the URL and try again.</p>
          </div>
        </Container>
      </div>
    );
  }

  const isPending = sowData.status === 'pending';

  // SOW Content View
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container>
        <div className="space-y-6">
          {/* Status Badge (shown if approved/rejected) */}
          <StatusBadge data={sowData} />

          {/* Customer Name Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {sowData.customer.name}
            </h1>
            <p className="text-gray-600 mt-1">{sowData.customer.address}</p>
          </div>

          {/* Deal Details */}
          <DealDetailsSection data={sowData} />

          {/* System Details */}
          <SystemDetailsSection data={sowData} />

          {/* Financing Details */}
          <FinancingSection data={sowData} />

          {/* Adders */}
          <AddersSection data={sowData} />

          {/* Commission Breakdown (highlighted) */}
          <CommissionSection data={sowData} />

          {/* Proposal Image */}
          <ProposalDisplay data={sowData} />

          {/* Plan PDF */}
          <PlanDisplay data={sowData} />

          {/* Disclaimer */}
          <DisclaimerSection />

          {/* Approval/Rejection Actions (only shown if pending) */}
          {isPending && (
            <div className="py-6">
              <ApprovalActions
                token={token}
                onApprove={handleApprove}
                onReject={() => setShowRejectionModal(true)}
                isLoading={actionLoading}
              />
            </div>
          )}
        </div>
      </Container>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onSubmit={handleReject}
        isLoading={actionLoading}
      />
    </div>
  );
}
