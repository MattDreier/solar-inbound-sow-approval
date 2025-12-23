'use client';

import { Button } from '@/components/ui/Button';
import { GlowDot } from '@/components/sow/GlowDot';

interface MobileStickyBottomCTAProps {
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
  isAnimated?: boolean;
}

/**
 * Mobile-only sticky bottom CTA for SOW approval.
 * Shows "Action Required" indicator above full-width Approve/Reject buttons.
 * Fixed to viewport bottom with safe area inset support for notched devices.
 * Uses transparent background like header, matching header padding/width.
 *
 * Animation behavior:
 * - Entry: Matches PIN entry animation (translate-y-8 → 0, ease-out, 500ms)
 */
export function MobileStickyBottomCTA({
  onApprove,
  onReject,
  isLoading,
  isAnimated = true,
}: MobileStickyBottomCTAProps) {
  return (
    <div
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-30
        transition-all duration-500 ease-out
        ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      `}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      role="region"
      aria-label="Approval actions"
    >
      {/* Wrapper with header-matching width and padding - transparent background */}
      <div className="max-w-container mx-auto px-[21px] pb-3">
        {/* Main CTA box - black box with white border (light mode), white box with black border (dark mode) */}
        <div className="bg-dark-bg dark:bg-white border border-white dark:border-dark-bg p-4">
          {/* Action Required indicator - on top (mb-5 matches PlanDisplay text→button spacing) */}
          <div className="flex items-center gap-1.5 mb-5">
            <GlowDot interactive />
            <span className="text-meta-label text-white dark:text-dark-bg uppercase">
              Action Required
            </span>
          </div>

          {/* Buttons - side by side, full width, text left-aligned (Approve left, Reject right) */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 min-h-[48px] px-4 py-2 text-button-compact justify-start text-left"
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              onClick={onReject}
              disabled={isLoading}
              className="flex-1 min-h-[48px] px-4 py-2 text-button-compact justify-start text-left"
            >
              Request Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
