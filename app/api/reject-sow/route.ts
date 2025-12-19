import { NextRequest, NextResponse } from 'next/server';
import { RejectSOWRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: RejectSOWRequest = await request.json();

    // Validate required fields
    if (!body.token || !body.reason || !body.rejecterEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: token, reason, and rejecterEmail' },
        { status: 400 }
      );
    }

    // Validate reason is not empty
    if (body.reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason cannot be empty' },
        { status: 400 }
      );
    }

    // Validate reason length
    if (body.reason.length > 2000) {
      return NextResponse.json(
        { error: 'Rejection reason must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.rejecterEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Validate the token exists in HubSpot
    // 2. Check that the SOW is in 'pending' status
    // 3. Update the deal's design_status to 'rejected'
    // 4. Set design_rejected_at and design_rejection_reason fields
    // 5. Trigger notifications to design team with rejection reason
    // 6. Possibly create a task or ticket for design team to address
    //
    // For prototype purposes, we return success and let the client
    // update localStorage with the new state

    const rejectedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      rejectedAt,
    });
  } catch (error) {
    console.error('Error in reject-sow API:', error);
    return NextResponse.json(
      { error: 'Failed to reject SOW' },
      { status: 500 }
    );
  }
}
