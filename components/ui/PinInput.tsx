'use client';

import { useState, useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
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

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPins = [...pins];
    newPins[index] = value;
    setPins(newPins);

    // Auto-advance to next input
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
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

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        {pins.map((pin, index) => (
          <input
            key={index}
            ref={el => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={pin}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={cn(
              'w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg',
              'text-gray-900 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all',
              error
                ? 'border-status-rejected'
                : 'border-gray-300',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            autoFocus={index === 0}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-status-rejected text-center">{error}</p>
      )}
    </div>
  );
}
