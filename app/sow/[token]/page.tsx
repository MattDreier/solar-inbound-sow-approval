'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
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
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <Container className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <div className="w-full max-w-md">
            <div className="bg-dark-card/50 shadow-2xl border border-dark-border/40 p-12 backdrop-blur-sm">
              <div className="text-center mb-12">
                <h1 className="text-heading-1 text-light-primary mb-4 font-light tracking-tight">
                  Scope of Work Review
                </h1>
                <p className="text-body-lg text-light-secondary mb-2">
                  Enter your PIN to view this SOW
                </p>
                <p className="text-body-sm text-light-muted">
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
      <div className="min-h-screen bg-dark-bg">
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
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <Container className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <div className="text-center">
            <h1 className="text-heading-2 text-light-primary mb-3">
              {dataError || 'SOW not found'}
            </h1>
            <p className="text-light-secondary">Please check the URL and try again.</p>
          </div>
        </Container>
      </div>
    );
  }

  const isPending = sowData.status === 'pending';

  // SOW Content View
  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <Container className="max-w-7xl">
        {/* Status Badge (shown if approved/rejected) */}
        <div className="pt-16">
          <StatusBadge data={sowData} />
        </div>

        {/* Hero Section - Grafit-inspired layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pb-32 pt-8">
          {/* Left: Customer Info - 5 columns */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            {/* Breadcrumb at top */}
            <p className="text-[15.43px] leading-[23.15px] text-light-muted uppercase tracking-normal mb-0 font-normal">
              SCOPE OF WORK &nbsp;&nbsp;›&nbsp;&nbsp; {sowData.customer.address.toUpperCase()}
            </p>

            {/* Content at bottom (using space-between) */}
            <div>
              <h1 className="text-[37.54px] leading-[45.05px] text-light-primary font-normal tracking-normal mb-0">
                {sowData.customer.name}
              </h1>

              <div className="inline-block px-2 py-1 bg-[rgb(23,23,25)] text-light-primary text-[11.66px] leading-[11.66px] font-medium uppercase tracking-normal border border-[rgb(61,62,69)] mt-[44.69px] mb-2">
                Solar Installation
              </div>

              <p className="text-[17.32px] leading-[25.99px] text-light-primary font-medium tracking-normal">
                {sowData.system.size} kW System
              </p>
            </div>
          </div>

          {/* Right: Proposal Image - 7 columns */}
          <div className="lg:col-span-7 relative w-full aspect-[16/9] bg-dark-surface overflow-hidden">
            <Image
              src={sowData.proposalImageUrl}
              alt="Solar System Proposal"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Two-column layout: Main content + Sticky sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-16 pb-16">
          {/* Main Content */}
          <div className="space-y-20">

            {/* 01 Deal Details */}
            <section className="space-y-6">
              <div className="flex items-baseline gap-5">
                <span className="text-label text-light-muted font-normal">01</span>
                <h2 className="text-heading-3 text-light-primary font-normal">Deal Details</h2>
              </div>
              <DealDetailsSection data={sowData} />
            </section>

            {/* 02 System Details */}
            <section className="space-y-6">
              <div className="flex items-baseline gap-5">
                <span className="text-label text-light-muted font-normal">02</span>
                <h2 className="text-heading-3 text-light-primary font-normal">System Specifications</h2>
              </div>
              <SystemDetailsSection data={sowData} />
            </section>

            {/* 03 Financing */}
            <section className="space-y-6">
              <div className="flex items-baseline gap-5">
                <span className="text-label text-light-muted font-normal">03</span>
                <h2 className="text-heading-3 text-light-primary font-normal">Financing Details</h2>
              </div>
              <FinancingSection data={sowData} />
            </section>

            {/* 04 Adders */}
            <section className="space-y-6">
              <div className="flex items-baseline gap-5">
                <span className="text-label text-light-muted font-normal">04</span>
                <h2 className="text-heading-3 text-light-primary font-normal">Additional Items</h2>
              </div>
              <AddersSection data={sowData} />
            </section>

            {/* 05 Commission (highlighted) */}
            <section className="space-y-6">
              <div className="flex items-baseline gap-5">
                <span className="text-label text-light-muted font-normal">05</span>
                <h2 className="text-heading-3 text-light-primary font-normal">Commission Breakdown</h2>
              </div>
              <CommissionSection data={sowData} />
            </section>

            {/* 06 Proposal & Plans */}
            <section className="space-y-6">
              <div className="flex items-baseline gap-5">
                <span className="text-label text-light-muted font-normal">06</span>
                <h2 className="text-heading-3 text-light-primary font-normal">Proposal & Plans</h2>
              </div>
              <div className="space-y-6">
                <ProposalDisplay data={sowData} />
                <PlanDisplay data={sowData} />
              </div>
            </section>

            {/* Disclaimer */}
            <DisclaimerSection />
          </div>

          {/* Sticky Sidebar - Approval Actions */}
          {isPending && (
            <div className="lg:sticky lg:top-24 h-fit">
              <div style={{ backgroundColor: '#f7f8fc' }} className="border border-gray-200 p-8 shadow-xl">
                <div className="mb-6">
                  <span className="text-label text-gray-500 uppercase">
                    Action Required
                  </span>
                  <h3 className="text-heading-3 text-gray-900 mt-3 font-normal">
                    Review & Approve
                  </h3>
                  <p className="text-body-sm text-gray-600 mt-3 leading-relaxed">
                    Please review all sections carefully before making your decision.
                  </p>
                </div>
                <ApprovalActions
                  token={token}
                  onApprove={handleApprove}
                  onReject={() => setShowRejectionModal(true)}
                  isLoading={actionLoading}
                />
              </div>
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
