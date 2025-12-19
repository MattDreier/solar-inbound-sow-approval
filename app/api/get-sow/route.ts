import { NextRequest, NextResponse } from 'next/server';
import { getSOWByToken } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token required' },
      { status: 400 }
    );
  }

  const sowData = getSOWByToken(token);

  if (!sowData) {
    return NextResponse.json(
      { error: 'SOW not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(sowData);
}
