import { NextResponse } from 'next/server';
import { SonioxNodeClient } from '@soniox/node';

/**
 * POST /api/token
 *
 * Server-side route that mints a short-lived temporary Soniox API key for
 * the browser. This keeps the permanent API key strictly server-side and
 * never exposed to the client.
 *
 * The temporary key:
 *  - Has a 1-hour TTL (`expires_in_seconds: 3600`)
 *  - Is scoped to WebSocket transcription only (`usage_type: "transcribe_websocket"`)
 *  - Cannot be used for billing, file management, or admin operations
 *
 * @returns JSON `{ api_key: string, expires_at: string }` on success,
 *          or `{ error: string }` with HTTP 500 on failure.
 */
export async function POST() {
  try {
    const client = new SonioxNodeClient({
      api_key: process.env.SONIOX_API_KEY || '',
    });

    const tokenData = await client.auth.createTemporaryKey({
      expires_in_seconds: 3600, // 1 hour token validity
      usage_type: "transcribe_websocket",
    });

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Error generating Soniox token:', error);
    return NextResponse.json(
      { error: 'Failed to generate temporary token' },
      { status: 500 }
    );
  }
}
