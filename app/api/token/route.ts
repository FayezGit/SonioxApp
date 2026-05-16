import { NextResponse } from 'next/server';
import { SonioxNodeClient } from '@soniox/node';

export async function POST() {
  try {
    const client = new SonioxNodeClient({
      api_key: process.env.SONIOX_API_KEY || '',
    });

    const tokenData = await client.auth.createTemporaryKey({
      expires_in_seconds: 3600, // 1 hour token validity
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
