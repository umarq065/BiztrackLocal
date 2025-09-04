
import { NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    // We still parse to ensure the request is valid, but we won't use the values.
    querySchema.parse(query);

    // Return an empty success response as the component now uses dummy data.
    return NextResponse.json({ message: "Financial metrics are now handled on the client." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    console.error('API GET Error for financial metrics route:', error);
    return NextResponse.json({ error: 'An error occurred on the financial metrics route' }, { status: 500 });
  }
}
