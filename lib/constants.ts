// LocalStorage keys
export const STORAGE_KEY_PREFIX = 'sow_state_';

// API endpoints (for future reference)
export const API_ENDPOINTS = {
  VERIFY_PIN: '/api/verify-pin',
  GET_SOW: '/api/get-sow',
  APPROVE_SOW: '/api/approve-sow',
  REJECT_SOW: '/api/reject-sow',
} as const;

// Validation constants
export const PIN_LENGTH = 4;
export const MAX_REJECTION_REASON_LENGTH = 2000;
