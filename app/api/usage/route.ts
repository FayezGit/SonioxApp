import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Note: The @soniox/node SDK does not currently expose a usage API method.
    // In a production environment, you would either call the undocumented REST endpoint 
    // or calculate usage by tracking tokens locally.
    // For this prototype, we return a mock usage structure for the Cost Dashboard.
    
    const mockUsage = {
      month_to_date_seconds: 7200,
      estimated_cost_usd: 3.00, // example: $0.000416 per second
      currency: "USD",
      sessions_count: 5
    };

    return NextResponse.json(mockUsage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
