import { NextRequest, NextResponse } from 'next/server';
import { addCSRFToken } from '@/lib/security/csrf-protection';
import { createSecureResponse } from '@/lib/security/security-middleware';

export async function GET(request: NextRequest) {
  try {
    // Create a simple response
    const response = NextResponse.json({
      success: true,
      message: 'CSRF token generated successfully',
      timestamp: new Date().toISOString()
    });

    // Add CSRF token to the response
    const securedResponse = addCSRFToken(response);

    return createSecureResponse(securedResponse, request);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token'
      },
      { status: 500 }
    );
  }
} 