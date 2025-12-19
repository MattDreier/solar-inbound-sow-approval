import { NextRequest, NextResponse } from 'next/server';
import { ApproveSOWRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ApproveSOWRequest = await request.json();

    // Validate required fields
    if (!body.token || !body.approverEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: token and approverEmail' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.approverEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Validate the token exists in HubSpot
    // 2. Check that the SOW is in 'pending' status
    // 3. Update the deal's design_status to 'approved'
    // 4. Set design_approved_at and design_approved_by fields
    // 5. Trigger any necessary workflows (notifications, etc.)
    //
    // For prototype purposes, we return success and let the client
    // update localStorage with the new state

    const approvedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      approvedAt,
    });
  } catch (error) {
    console.error('Error in approve-sow API:', error);
    return NextResponse.json(
      { error: 'Failed to approve SOW' },
      { status: 500 }
    );
  }
}
