/**
 * Health Check API Endpoint
 * =========================
 *
 * Provides system status and HubSpot integration health information.
 * Useful for deployment verification and debugging.
 *
 * SECURITY: Two-level response system to prevent information disclosure
 *
 * GET /api/health (unauthenticated)
 * Response:
 * {
 *   "status": "healthy" | "degraded",
 *   "timestamp": "2024-12-22T10:00:00.000Z"
 * }
 *
 * GET /api/health
 * Header: X-Health-Check-Key: <HEALTH_CHECK_API_KEY>
 * Response:
 * {
 *   "status": "healthy",
 *   "timestamp": "2024-12-22T10:00:00.000Z",
 *   "hubspot": {
 *     "connected": true,
 *     "setupComplete": true,
 *     "propertiesCreated": ["sow_token", ...],
 *     "propertiesExisted": [...],
 *     "errors": []
 *   },
 *   "environment": {
 *     "hasAccessToken": true,
 *     "baseUrl": "https://sow.sunvena.com",
 *     "nodeEnv": "production"
 *   }
 * }
 *
 * Environment Variables:
 * - HEALTH_CHECK_API_KEY: Required for detailed diagnostics (generate with: openssl rand -hex 32)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureHubSpotSetup, getSetupResult, isSetupComplete } from '@/lib/hubspot-setup';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();

  // Check for admin API key for detailed health info
  const apiKey = request.headers.get('X-Health-Check-Key');
  const isAuthorized = apiKey === process.env.HEALTH_CHECK_API_KEY;

  // Check environment configuration
  const hasAccessToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'not configured';

  // Run HubSpot setup if not already done
  let hubspotConnected = false;
  let setupError: string | null = null;

  if (hasAccessToken) {
    try {
      await ensureHubSpotSetup();
      hubspotConnected = true;
    } catch (error) {
      setupError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  const setupResult = getSetupResult();

  // Determine overall health status
  const isHealthy = hasAccessToken && hubspotConnected && (setupResult?.success ?? false);

  // Public response: minimal information
  if (!isAuthorized) {
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp,
    });
  }

  // Authorized response: full diagnostics
  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp,
    hubspot: {
      connected: hubspotConnected,
      setupComplete: isSetupComplete(),
      ...(setupResult && {
        groupCreated: setupResult.groupCreated,
        propertiesCreated: setupResult.propertiesCreated,
        propertiesExisted: setupResult.propertiesExisted,
        errors: setupResult.errors,
        lastSetup: setupResult.timestamp,
      }),
      ...(setupError && { error: setupError }),
    },
    environment: {
      hasAccessToken,
      baseUrl,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  });
}
