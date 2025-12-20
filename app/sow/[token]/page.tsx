'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/layout/Container';
import { PinInput } from '@/components/ui/PinInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { API_ENDPOINTS } from '@/lib/constants';
import { getSOWState, saveSOWState } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import type { VerifyPinRequest, VerifyPinResponse, SOWData, SOWState } from '@/lib/types';

// Import all SOW sections
import {
  DealDetailsSection,
  SystemDetailsSection,
  FinancingSection,
  AddersSection,
  CommissionSection,
  PlanDisplay,
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

  // Sticky sidebar state
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Detect when sidebar becomes sticky using sentinel element
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is NOT intersecting (scrolled past), sidebar is sticky
        const sticky = !entry.isIntersecting;
        console.log('Sticky state:', sticky, 'Theme:', resolvedTheme);
        setIsSticky(sticky);
      },
      { threshold: [0], rootMargin: '-61.5px 0px 0px 0px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, []);

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
      <div className="min-h-screen bg-bg">
        <Header />
        <Container className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <div className="w-full max-w-md">
            <div className="bg-card/50 border border-border/40 p-12 backdrop-blur-sm">
              <div className="text-center mb-12">
                <h1 className="text-heading-1 text-text-primary mb-4 font-light tracking-tight">
                  Scope of Work
                </h1>
                <p className="text-body-lg text-text-secondary mb-2">
                  Enter your PIN to view this SOW
                </p>
                <p className="text-body-sm text-text-muted">
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
      <div className="min-h-screen bg-bg">
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
      <div className="min-h-screen bg-bg">
        <Header />
        <Container className="flex items-center justify-center min-h-[calc(100vh-88px)]">
          <div className="text-center">
            <h1 className="text-heading-2 text-text-primary mb-3">
              {dataError || 'SOW not found'}
            </h1>
            <p className="text-text-secondary">Please check the URL and try again.</p>
          </div>
        </Container>
      </div>
    );
  }

  const isPending = sowData.status === 'pending';

  // SOW Content View
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <Container className="max-w-7xl">

        {/* Hero Section - Grafit-inspired layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pb-32 pt-8">
          {/* Left: Customer Info - 5 columns */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            {/* Breadcrumb at top */}
            <p className="text-[10px] leading-[23.15px] text-text-muted uppercase tracking-normal mb-0 font-normal">
              SCOPE OF WORK &nbsp;&nbsp;›&nbsp;&nbsp; {sowData.customer.address.toUpperCase()}
            </p>

            {/* Content at bottom (using space-between) */}
            <div>
              <h1 className="text-[37.54px] leading-[45.05px] text-text-primary font-normal tracking-normal mb-0">
                {sowData.customer.name}
              </h1>

              <div className="inline-block px-2 py-1 bg-card text-text-primary text-[11.66px] leading-[16px] font-medium uppercase tracking-normal border border-border mt-[44.69px] mb-2">
                Solar Installation
              </div>

              <p className="text-[17.32px] leading-[25.99px] text-text-primary font-medium tracking-normal">
                {sowData.system.size} kW System
              </p>
            </div>
          </div>

          {/* Right: Proposal Image - 7 columns */}
          <div className="lg:col-span-7 relative w-full aspect-[16/9] bg-surface overflow-hidden">
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_233px] gap-16 pb-28">
          {/* Main Content */}
          <div className="space-y-8 lg:space-y-20">

            {/* Deal Details */}
            <section className="space-y-6">
              <h2 className="text-heading-3 text-text-primary font-normal">Deal Details</h2>
              <DealDetailsSection data={sowData} />
            </section>

            {/* System Details */}
            <section className="space-y-6">
              <h2 className="text-heading-3 text-text-primary font-normal">System Specifications</h2>
              <SystemDetailsSection data={sowData} />
            </section>

            {/* Financing */}
            <section className="space-y-6">
              <h2 className="text-heading-3 text-text-primary font-normal">Financing Details</h2>
              <FinancingSection data={sowData} />
            </section>

            {/* Adders */}
            <section className="space-y-6">
              <h2 className="text-heading-3 text-text-primary font-normal">Additional Items</h2>
              <AddersSection data={sowData} />
            </section>

            {/* Commission (highlighted) */}
            <section className="space-y-6">
              <h2 className="text-heading-3 text-text-primary font-normal">Commission Breakdown</h2>
              <CommissionSection data={sowData} />
            </section>

            {/* Plans */}
            <section className="space-y-6">
              <h2 className="text-heading-3 text-text-primary font-normal">Plans</h2>
              <PlanDisplay data={sowData} />
            </section>

            {/* Large status/action section at bottom - Desktop only */}
            <div className="hidden lg:block pt-8 lg:pt-20 pb-4 lg:pb-[calc(60vh-6rem)]">
              {isPending ? (
                // Pending: Show "Approve" text (non-clickable)
                <>
                  <h2 className="text-[37.54px] leading-[45.05px] text-text-primary font-normal tracking-normal flex justify-between items-center mt-8 lg:mt-[100px]">
                    <span>Approve</span>
                    <span>→</span>
                  </h2>
                  <div className="pt-3 border-b border-text-muted"></div>
                  <p className="text-[11px] text-status-rejected mt-3 font-bold">
                    THIS IS SUBJECT TO CHANGE AFTER PRE-PRODUCTION UPLOAD AND INSTALLATION
                  </p>
                </>
              ) : sowData.status === 'approved' ? (
                // Approved: Show approval details
                <>
                  <h2 className="text-[37.54px] leading-[45.05px] text-status-approved font-normal tracking-normal mt-8 lg:mt-[100px]">
                    APPROVED
                  </h2>
                  <div className="pt-3 border-b border-text-muted"></div>
                  <p className="text-[11px] text-gray-500 mt-3 font-normal uppercase">
                    BY {sowData.approvedBy}
                  </p>
                  <p className="text-[11px] text-gray-500 font-normal uppercase">
                    ON {formatDate(sowData.approvedAt)}
                  </p>
                </>
              ) : (
                // Rejected: Show rejection details
                <>
                  <h2 className="text-[37.54px] leading-[45.05px] text-text-primary font-normal tracking-normal mt-8 lg:mt-[100px]">
                    Rejected
                  </h2>
                  <div className="pt-3 border-b border-text-muted"></div>
                  <p className="text-[11px] text-text-primary mt-3 font-normal">
                    {formatDate(sowData.rejectedAt)}
                  </p>
                  {sowData.rejectionReason && (
                    <p className="text-[11px] text-text-secondary mt-2 font-normal">
                      Reason: {sowData.rejectionReason}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sticky Sidebar - Approval Actions */}
          {isPending && (
            <div className="lg:sticky lg:top-[61.5px] h-fit">
              {/* Sentinel element to detect sticky state */}
              <div ref={sentinelRef} className="absolute -top-[61.5px] h-0" aria-hidden="true" />
              <div className={`
                bg-dark-bg dark:bg-white p-8
                ${!isSticky ? 'border border-gray-400' : ''}
                ${isSticky && resolvedTheme === 'dark' ? 'border-x border-b border-gray-400 border-t-2 border-t-black' : ''}
                ${isSticky && resolvedTheme !== 'dark' ? 'border-x border-b border-gray-400 border-t-2 border-t-white' : ''}
              `}>
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-10">
                    <span className="flex items-center justify-center h-3 w-3 flex-shrink-0">
                      <span className="animate-glow relative inline-flex rounded-full h-1.5 w-1.5 bg-status-rejected"></span>
                    </span>
                    <span className="text-[10px] text-white dark:text-dark-bg uppercase leading-[12px] font-normal">
                      Action Required
                    </span>
                  </div>
                  <h3 className="text-[10px] text-white dark:text-dark-bg mb-3 font-semibold leading-tight">
                    Review & Approve
                  </h3>
                  <p className="text-[10px] text-text-muted leading-snug font-normal">
                    Please reach out if you have any questions
                  </p>
                </div>
                <ApprovalActions
                  token={token}
                  onApprove={handleApprove}
                  onReject={() => setShowRejectionModal(true)}
                  isLoading={actionLoading}
                />
              </div>

              {/* Disclaimer - Mobile only (below CTA) */}
              <p className="lg:hidden text-[11px] text-status-rejected mt-6 font-bold text-left">
                THIS IS SUBJECT TO CHANGE AFTER PRE-PRODUCTION UPLOAD AND INSTALLATION
              </p>
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
