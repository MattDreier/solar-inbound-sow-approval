'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Header } from '@/components/layout/Header';
import { Container } from '@/components/layout/Container';
import { PinInput } from '@/components/ui/PinInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LazySection } from '@/components/ui/LazySection';
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
import { ApprovalModal } from '@/components/sow/ApprovalModal';

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
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Sticky sidebar state
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Refs for dynamic scroll alignment
  const approveHeadingRef = useRef<HTMLHeadingElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const [bottomSpacerHeight, setBottomSpacerHeight] = useState(0);
  const spacerHeightRef = useRef(0); // Store current spacer for calculation
  const isCalculatingRef = useRef(false);

  // Arrow bump animation state
  const [arrowBump, setArrowBump] = useState(false);
  const wasAtBottomRef = useRef(false);

  // PIN entry animation state
  const [pinEntryAnimated, setPinEntryAnimated] = useState(false);
  const [pinExiting, setPinExiting] = useState(false);

  // Status change animation state
  const [statusTransitioning, setStatusTransitioning] = useState(false);
  const previousStatusRef = useRef(sowData?.status);

  // Component entrance animation states (triggered when isVerified && sowData)
  const [phase1Animated, setPhase1Animated] = useState(false); // Name, size, sidebar (T=0ms)
  const [phase2Animated, setPhase2Animated] = useState(false); // Proposal image (T=100ms)
  const [phase3Animated, setPhase3Animated] = useState(false); // Breadcrumb (T=150ms)
  const [phase4Animated, setPhase4Animated] = useState(false); // Deal Details, Commission (T=300ms, T=350ms)
  const [phase5Animated, setPhase5Animated] = useState(false); // System Specs, Financing (T=600ms, T=650ms)

  // Trigger PIN entry animation on mount
  useEffect(() => {
    if (!isVerified && !pinExiting) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPinEntryAnimated(true);
        });
      });
    }
  }, [isVerified, pinExiting]);

  // Orchestrate component entrance animations after verification
  useEffect(() => {
    if (isVerified && sowData && !isLoadingData) {
      // Phase 1: Immediate (T=0ms) - Customer name, system size, sidebar
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase1Animated(true);
        });
      });

      // Phase 2: T=100ms - Proposal image
      const timer2 = setTimeout(() => {
        setPhase2Animated(true);
      }, 100);

      // Phase 3: T=150ms - Breadcrumb
      const timer3 = setTimeout(() => {
        setPhase3Animated(true);
      }, 150);

      // Phase 4: T=300ms - Deal Details, Commission
      const timer4 = setTimeout(() => {
        setPhase4Animated(true);
      }, 300);

      // Phase 5: T=600ms - System Specs, Financing (conditional on viewport)
      const timer5 = setTimeout(() => {
        setPhase5Animated(true);
      }, 600);

      return () => {
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [isVerified, sowData, isLoadingData]);

  // Detect status changes and trigger transition animation
  useEffect(() => {
    if (sowData && previousStatusRef.current && previousStatusRef.current !== sowData.status) {
      // Status changed - trigger transition
      setStatusTransitioning(true);
      // Reset after animation completes
      const timer = setTimeout(() => {
        setStatusTransitioning(false);
      }, 400); // 200ms exit + 200ms pause
      return () => clearTimeout(timer);
    }
    previousStatusRef.current = sowData?.status;
  }, [sowData?.status]);

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

  // Calculate dynamic spacer height for perfect alignment at max scroll
  const calculateAlignment = useCallback(() => {
    // Only run on desktop (lg breakpoint = 1024px)
    if (typeof window === 'undefined' || window.innerWidth < 1024) {
      spacerHeightRef.current = 0;
      setBottomSpacerHeight(0);
      return;
    }

    const heading = approveHeadingRef.current;
    const button = approveButtonRef.current;

    if (!heading || !button || isCalculatingRef.current) return;

    isCalculatingRef.current = true;

    // Use requestAnimationFrame to ensure DOM has settled
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const viewportHeight = window.innerHeight;
        const currentSpacer = spacerHeightRef.current;

        // Get heading's position in the document
        const headingRect = heading.getBoundingClientRect();
        const headingDocY = headingRect.top + window.scrollY;
        const headingCenterDocY = headingDocY + headingRect.height / 2;

        // Get button's position relative to its sticky container
        // When sidebar is sticky at top: 61.5px, we need to find the button's
        // offset within the sidebar to calculate its sticky viewport position
        const sidebarContainer = button.closest('[class*="lg:sticky"]') as HTMLElement;

        if (!sidebarContainer) {
          isCalculatingRef.current = false;
          return;
        }

        // Calculate button's Y position when sidebar is stuck
        // The sidebar sticks at top: 61.5px
        const HEADER_HEIGHT = 61.5;
        const sidebarRect = sidebarContainer.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();

        // Button's offset from the top of the sidebar container
        const buttonOffsetInSidebar = buttonRect.top - sidebarRect.top;

        // When sidebar is sticky, the button's viewport Y position will be:
        const buttonStickyViewportY = HEADER_HEIGHT + buttonOffsetInSidebar;
        const buttonStickyCenterY = buttonStickyViewportY + buttonRect.height / 2;

        // Calculate total document height (minus current spacer)
        const totalDocHeight = document.documentElement.scrollHeight;
        const contentHeightWithoutSpacer = totalDocHeight - currentSpacer;

        // At max scroll (without spacer):
        // maxScrollY = contentHeightWithoutSpacer - viewportHeight
        // headingViewportY = headingCenterDocY - maxScrollY
        const maxScrollYWithoutSpacer = contentHeightWithoutSpacer - viewportHeight;
        const headingViewportYAtMaxScroll = headingCenterDocY - maxScrollYWithoutSpacer;

        // We want heading to be at buttonStickyCenterY at max scroll
        // Difference tells us how much extra spacer we need
        const difference = headingViewportYAtMaxScroll - buttonStickyCenterY;

        // If heading would be below the button at max scroll, we need a spacer
        // If heading would be above (difference < 0), we need to reduce scroll range
        // We achieve this by setting spacer height
        const newSpacerHeight = Math.max(0, difference);

        if (Math.abs(newSpacerHeight - currentSpacer) > 1) {
          spacerHeightRef.current = newSpacerHeight;
          setBottomSpacerHeight(newSpacerHeight);
        }

        isCalculatingRef.current = false;
      });
    });
  }, []); // No dependencies - uses refs for current values

  // Run alignment calculation on mount, resize, and when data loads
  useEffect(() => {
    if (!sowData || sowData.status !== 'pending') return;

    // Initial calculation after a short delay to ensure layout is complete
    const initialTimeout = setTimeout(calculateAlignment, 100);

    // Recalculate on resize (handles zoom and window size changes)
    const handleResize = () => {
      calculateAlignment();
    };

    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect zoom/font size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateAlignment();
    });
    resizeObserver.observe(document.documentElement);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [sowData, calculateAlignment]);

  // Detect when user scrolls to bottom and trigger arrow bump animation
  useEffect(() => {
    if (!sowData || sowData.status !== 'pending') return;
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if at bottom (within 5px threshold)
      const isAtBottom = scrollTop + windowHeight >= documentHeight - 5;

      // Trigger bump only when first reaching the bottom
      if (isAtBottom && !wasAtBottomRef.current) {
        setArrowBump(true);
        // Reset animation after it completes
        setTimeout(() => setArrowBump(false), 300);
      }

      wasAtBottomRef.current = isAtBottom;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sowData]);

  // Load SOW data after PIN verification
  // Note: Data loading now starts immediately in handlePinComplete for faster UX
  // This useEffect serves as a fallback in case the parallel load didn't trigger
  useEffect(() => {
    if (!isVerified || sowData || isLoadingData) return;

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
  }, [isVerified, token, sowData, isLoadingData]);

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
        // PIN verified - immediately start loading SOW data in parallel with exit animation
        setIsLoadingData(true);

        // Start data fetch immediately (don't await - let it run in parallel)
        fetch(`${API_ENDPOINTS.GET_SOW}?token=${token}`)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error('Failed to fetch SOW data');
            }
            const sowDataResponse: SOWData = await response.json();

            // Merge with localStorage state (localStorage takes priority)
            const localState = getSOWState(token);
            if (localState) {
              sowDataResponse.status = localState.status;
              sowDataResponse.approvedAt = localState.approvedAt || sowDataResponse.approvedAt;
              sowDataResponse.approvedBy = localState.approvedBy || sowDataResponse.approvedBy;
              sowDataResponse.rejectedAt = localState.rejectedAt || sowDataResponse.rejectedAt;
              sowDataResponse.rejectionReason = localState.rejectionReason || sowDataResponse.rejectionReason;
            }

            setSOWData(sowDataResponse);
            setIsLoadingData(false);
          })
          .catch((err) => {
            setDataError('Failed to load SOW data. Please try again.');
            setIsLoadingData(false);
          });

        // Trigger exit animation in parallel
        setPinExiting(true);
        setTimeout(() => {
          setIsVerified(true);
        }, 350); // Wait for exit animation to complete
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

      // Close modal
      setShowApprovalModal(false);
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
          <div
            className={`w-full max-w-md transition-all ease-out ${
              pinExiting
                ? 'opacity-0 scale-95 -translate-y-6 duration-300'
                : pinEntryAnimated
                  ? 'opacity-100 translate-y-0 scale-100 duration-500'
                  : 'opacity-0 translate-y-8 scale-100 duration-500'
            }`}
          >
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
          <div className="animate-fade-in">
            <LoadingSpinner size="lg" />
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pb-16 pt-8">
          {/* Left: Customer Info - 5 columns */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            {/* Breadcrumb at top - Phase 3 (T=150ms, 250ms duration) */}
            <p className={`text-[11px] leading-[23.15px] text-text-muted uppercase tracking-normal mb-0 font-normal transition-all duration-[250ms] ease-out ${
              phase3Animated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}>
              SCOPE OF WORK &nbsp;&nbsp;›&nbsp;&nbsp; {sowData.customer.address.toUpperCase()}
            </p>

            {/* Content at bottom (using space-between) */}
            <div>
              {/* Customer Name - Phase 1 (T=0ms, 300ms duration) */}
              <h1 className={`text-[37.54px] leading-[45.05px] text-text-primary font-normal tracking-normal mb-0 transition-all duration-300 ease-out ${
                phase1Animated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              }`}>
                {sowData.customer.name}
              </h1>

              {/* Badge - Phase 1 (T=0ms, 300ms duration) */}
              <div className={`inline-block px-2 py-1 bg-card text-text-primary text-[11.66px] leading-[16px] font-medium uppercase tracking-normal border border-border mt-[44.69px] mb-2 transition-all duration-300 ease-out ${
                phase1Animated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              }`}>
                SOLAR PROJECT
              </div>

              {/* System Size - Phase 1 (T=0ms, 300ms duration) */}
              <p className={`text-[17.32px] leading-[25.99px] text-text-primary font-medium tracking-normal transition-all duration-300 ease-out ${
                phase1Animated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              }`}>
                {sowData.system.size} kW System
              </p>
            </div>
          </div>

          {/* Right: Proposal Image - Phase 2 (T=100ms, 450ms duration) */}
          <div className={`lg:col-span-7 relative w-full aspect-[16/9] bg-surface overflow-hidden transition-all duration-[450ms] ease-out ${
            phase2Animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_233px] gap-16 pb-24">
          {/* Main Content */}
          <div className="space-y-12 lg:space-y-24">

            {/* Deal Details - Phase 4 (T=300ms, 350ms duration) */}
            <div className={`transition-all duration-[350ms] ease-out ${
              phase4Animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <section className="space-y-6">
                <h2 className="text-heading-3 text-text-primary font-normal">Deal Details</h2>
                <DealDetailsSection data={sowData} />
              </section>
            </div>

            {/* System Details - Phase 5 (T=600ms, 350ms duration) OR lazy if below fold */}
            <div className={`transition-all duration-[350ms] ease-out ${
              phase5Animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <section className="space-y-6">
                <h2 className="text-heading-3 text-text-primary font-normal">System Specifications</h2>
                <SystemDetailsSection data={sowData} />
              </section>
            </div>

            {/* Financing - Phase 5 (T=650ms via CSS delay, 350ms duration) OR lazy if below fold */}
            <div className={`transition-all duration-[350ms] ease-out ${
              phase5Animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: phase5Animated ? '50ms' : '0ms' }}>
              <section className="space-y-6">
                <h2 className="text-heading-3 text-text-primary font-normal">Financing Details</h2>
                <FinancingSection data={sowData} />
              </section>
            </div>

            {/* Adders - lazy loaded only (below fold) */}
            <LazySection minHeight="300px">
              <section className="space-y-6">
                <h2 className="text-heading-3 text-text-primary font-normal">Additional Items</h2>
                <AddersSection data={sowData} />
              </section>
            </LazySection>

            {/* Commission (highlighted) - Phase 4 (T=350ms via CSS delay, 350ms duration) */}
            <div className={`transition-all duration-[350ms] ease-out ${
              phase4Animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ transitionDelay: phase4Animated ? '50ms' : '0ms' }}>
              <section className="space-y-6">
                <h2 className="text-heading-3 text-text-primary font-normal">Commission Breakdown</h2>
                <CommissionSection data={sowData} />
              </section>
            </div>

            {/* Plans - lazy loaded */}
            <LazySection minHeight="400px">
              <section className="space-y-6">
                <h2 className="text-heading-3 text-text-primary font-normal">Plans</h2>
                <PlanDisplay data={sowData} />
              </section>
            </LazySection>

            {/* Large status/action section at bottom */}
            <div className="pt-8 lg:pt-20 pb-8">
              <div className={`transition-all duration-300 ease-out ${
                statusTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
              }`}>
                {isPending ? (
                  // Pending: Show "Approve" text (non-clickable) - hidden on mobile
                  <div className="hidden lg:block">
                    <h2
                      ref={approveHeadingRef}
                      className="text-[37.54px] leading-[45.05px] text-text-primary font-normal tracking-normal flex justify-between items-center mt-8 lg:mt-[100px] mb-8"
                    >
                      <span>Approve</span>
                      <span
                        className={`inline-block ${arrowBump ? 'animate-bump-right' : ''}`}
                        style={{ fontFamily: 'var(--font-hedvig)' }}
                      >→</span>
                    </h2>
                    <div className="border-b border-text-muted"></div>
                    <p className="text-[11px] text-status-rejected mt-3 mb-0 font-bold">
                      THIS IS SUBJECT TO CHANGE AFTER PRE-PRODUCTION UPLOAD AND INSTALLATION
                    </p>
                    {/* Dynamic spacer for perfect alignment at max scroll */}
                    <div
                      style={{ height: bottomSpacerHeight }}
                      aria-hidden="true"
                    />
                  </div>
                ) : sowData.status === 'approved' ? (
                  // Approved: Show approval details
                  <>
                    <h2 className="text-[37.54px] leading-[45.05px] text-status-approved font-normal tracking-normal mt-8 lg:mt-[100px]">
                      APPROVED
                    </h2>
                    <div className="pt-6 border-b border-text-muted"></div>
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
                    <h2 className="text-[37.54px] leading-[45.05px] text-status-rejected font-normal tracking-normal mt-8 lg:mt-[100px]">
                      REJECTED
                    </h2>
                    <div className="pt-6 border-b border-text-muted"></div>
                    <p className="text-[11px] text-gray-500 mt-3 font-normal uppercase">
                      BY {sowData.salesRep.email}
                    </p>
                    <p className="text-[11px] text-gray-500 font-normal uppercase">
                      ON {formatDate(sowData.rejectedAt)}
                    </p>
                    {sowData.rejectionReason && (
                      <p className="text-[11px] text-white mt-2 font-normal">
                        Reason: {sowData.rejectionReason}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar - Approval Actions - Phase 1 (T=0ms, 300ms duration) */}
          {isPending && (
            <div className={`lg:sticky lg:top-[61.5px] h-fit transition-all duration-300 ease-out ${
              phase1Animated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}>
              {/* Sentinel element to detect sticky state */}
              <div ref={sentinelRef} className="absolute -top-[61.5px] h-0" aria-hidden="true" />
              <div className={`
                bg-dark-bg dark:bg-white p-8
                border border-gray-400
                transition-all duration-200 ease-out
                ${isSticky ? 'border-t-2 scale-[1.01] shadow-sm' : ''}
                ${isSticky && resolvedTheme === 'dark' ? 'border-t-black' : ''}
                ${isSticky && resolvedTheme !== 'dark' ? 'border-t-white' : ''}
              `}>
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-10">
                    <span className="flex items-center justify-center h-3 w-3 flex-shrink-0">
                      <span className="animate-glow relative inline-flex rounded-full h-[5px] w-[5px] bg-status-pending"></span>
                    </span>
                    <span className="text-[11px] text-white dark:text-dark-bg uppercase leading-[12px] font-normal">
                      Action Required
                    </span>
                  </div>
                  <h3 className="text-[13px] text-white dark:text-dark-bg mb-3 font-semibold leading-tight">
                    Review & Approve
                  </h3>
                  <p className="text-[11px] text-text-muted leading-snug font-normal">
                    Please reach out if you have any questions
                  </p>
                </div>
                <ApprovalActions
                  ref={approveButtonRef}
                  token={token}
                  onApprove={() => setShowApprovalModal(true)}
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

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleApprove}
        isLoading={actionLoading}
      />

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
