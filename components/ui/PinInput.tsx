'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent, MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { PIN_LENGTH } from '@/lib/constants';

interface PinInputProps {
  onComplete: (pin: string) => void;
  error?: string;
  isLoading?: boolean;
}

export function PinInput({ onComplete, error, isLoading }: PinInputProps) {
  const [pins, setPins] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchDeviceRef = useRef<boolean>(false);

  // Calculate the index of the first empty input (the "active" input)
  const getActiveIndex = () => {
    const firstEmptyIndex = pins.findIndex(pin => pin === '');
    return firstEmptyIndex === -1 ? PIN_LENGTH - 1 : firstEmptyIndex;
  };

  // Detect if this is a touch device
  useEffect(() => {
    isTouchDeviceRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Auto-focus the first input on mount (only on non-touch devices)
  useEffect(() => {
    if (!isLoading && !isTouchDeviceRef.current) {
      requestAnimationFrame(() => {
        inputRefs.current[0]?.focus();
      });
    }
  }, [isLoading]);

  // Clear fields and focus first input on error (works on all devices)
  useEffect(() => {
    if (error) {
      setPins(Array(PIN_LENGTH).fill(''));
      // Focus first input on error (even on mobile - user needs to retry)
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [error]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Focus the active input when clicking anywhere in the container
  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isLoading) return;

    // Don't interfere if clicking directly on an input
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    const activeIndex = getActiveIndex();
    inputRefs.current[activeIndex]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    // Only allow input in the active field
    const activeIndex = getActiveIndex();
    if (index !== activeIndex) return;

    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPins = [...pins];
    newPins[index] = value;
    setPins(newPins);

    // Auto-advance to next input (use setTimeout to ensure it works on mobile)
    if (value && index < PIN_LENGTH - 1) {
      // Small delay ensures the next input is ready to receive focus
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }

    // Auto-submit when all digits entered
    if (newPins.every(pin => pin !== '')) {
      onComplete(newPins.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newPins = [...pins];

      if (pins[index]) {
        // Clear current digit
        newPins[index] = '';
        setPins(newPins);
      } else if (index > 0) {
        // Move to previous and clear
        newPins[index - 1] = '';
        setPins(newPins);
        inputRefs.current[index - 1]?.focus();
      }
    }

    // Handle arrow keys - only allow navigation to filled inputs or the active input
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      const activeIndex = getActiveIndex();
      // Only allow moving right to the active input
      if (index + 1 <= activeIndex) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Check if pasted data is exactly PIN_LENGTH digits
    const regex = new RegExp(`^\\d{${PIN_LENGTH}}$`);
    if (regex.test(pastedData)) {
      const newPins = pastedData.split('');
      setPins(newPins);
      // Focus last input
      inputRefs.current[PIN_LENGTH - 1]?.focus();
      // Auto-submit
      onComplete(pastedData);
    }
  };

  // Prevent focusing non-active inputs (desktop only - mobile needs smooth auto-advance)
  const handleFocus = (index: number, e: React.FocusEvent<HTMLInputElement>) => {
    // Skip focus prevention on touch devices to allow smooth auto-advance
    if (isTouchDeviceRef.current) return;

    const activeIndex = getActiveIndex();

    // If trying to focus a future input (past the active one), redirect to active
    if (index > activeIndex) {
      e.preventDefault();
      inputRefs.current[activeIndex]?.focus();
    }
  };

  // Prevent default focus behavior on mousedown for non-active inputs (desktop only)
  const handleMouseDown = (index: number, e: MouseEvent<HTMLInputElement>) => {
    // Skip on touch devices to avoid interfering with mobile keyboard
    if (isTouchDeviceRef.current) return;

    const activeIndex = getActiveIndex();

    // Clear any pending blur timeout when clicking
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    // If clicking any non-active input, prevent focus and redirect to active
    if (index !== activeIndex) {
      e.preventDefault();
      inputRefs.current[activeIndex]?.focus();
    }
  };

  // Auto-refocus when input loses focus (desktop only)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isLoading) return;

    // Skip auto-refocus on touch devices (causes keyboard issues on mobile)
    if (isTouchDeviceRef.current) return;

    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Check if focus is moving to another PIN input
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isMovingToAnotherInput = relatedTarget && inputRefs.current.includes(relatedTarget as HTMLInputElement);

    // Don't auto-refocus if moving between PIN inputs (auto-advance)
    if (isMovingToAnotherInput) {
      return;
    }

    // Set a short timeout to refocus - this allows clicks to work properly
    blurTimeoutRef.current = setTimeout(() => {
      const activeIndex = getActiveIndex();
      inputRefs.current[activeIndex]?.focus();
    }, 100);
  };

  // Click anywhere in the wrapper to focus active input
  const handleWrapperClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isLoading) return;

    // Clear blur timeout if clicking
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    const activeIndex = getActiveIndex();
    inputRefs.current[activeIndex]?.focus();
  };

  const activeIndex = getActiveIndex();

  return (
    <div
      ref={wrapperRef}
      onClick={handleWrapperClick}
      className="space-y-5 cursor-text"
    >
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="flex gap-3 justify-center"
      >
        {pins.map((pin, index) => {
          const isActive = index === activeIndex;
          const isFilled = pin !== '';

          return (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={pin}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => handleFocus(index, e)}
              onBlur={handleBlur}
              onMouseDown={(e) => handleMouseDown(index, e)}
              disabled={isLoading}
              readOnly={!isActive && isFilled}
              className={cn(
                'w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg',
                'text-text-primary bg-card',
                'transition-all duration-150',
                error
                  ? 'border-status-rejected'
                  : isActive
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border',
                isLoading && 'opacity-50 cursor-not-allowed',
                !isLoading && 'cursor-pointer',
                isActive && !isLoading && 'focus:outline-none',
                !isActive && !isFilled && 'opacity-50'
              )}
              autoFocus={index === 0}
            />
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-status-rejected text-center">{error}</p>
      )}
    </div>
  );
}
