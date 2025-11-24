
import { NextResponse } from 'next/server';
import { getMonthlyTargets, setMonthlyTarget } from '@/lib/services/monthlyTargetsService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  target: z.number().min(0),
});

export async function GET() {
  try {
    const targets = await getMonthlyTargets();
    return NextResponse.json(targets);
  } catch (error) {
    console.error('API GET Error fetching monthly targets:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly targets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = postSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    const { year, month, target } = parsedData.data;
    await setMonthlyTarget(year, month, target);

    return NextResponse.json({ message: 'Target updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('API POST Error updating monthly target:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
