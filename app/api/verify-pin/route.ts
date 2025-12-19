import { NextRequest, NextResponse } from 'next/server';
import { verifyPIN } from '@/lib/mockData';
import type { VerifyPinRequest, VerifyPinResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: VerifyPinRequest = await request.json();
    const { token, pin } = body;

    // Validate request
    if (!token || !pin) {
      const response: VerifyPinResponse = {
        valid: false,
        error: 'Token and PIN are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verify PIN against mock data
    const isValid = verifyPIN(token, pin);

    if (isValid) {
      const response: VerifyPinResponse = {
        valid: true,
      };
      return NextResponse.json(response);
    } else {
      const response: VerifyPinResponse = {
        valid: false,
        error: 'Invalid PIN',
      };
      return NextResponse.json(response, { status: 401 });
    }
  } catch (error) {
    const response: VerifyPinResponse = {
      valid: false,
      error: 'Internal server error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
