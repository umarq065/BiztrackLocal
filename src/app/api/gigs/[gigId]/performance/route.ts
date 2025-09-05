
import { NextResponse } from 'next/server';
import { addOrUpdateGigPerformance } from '@/lib/services/gigPerformanceService';
import { z } from 'zod';

const addGigPerformanceSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    impressions: z.coerce.number().int().min(0),
    clicks: z.coerce.number().int().min(0),
    sourceId: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: { gigId: string } }) {
  try {
    const json = await request.json();
    const parsedJson = { 
        ...json, 
        gigId: params.gigId,
        date: new Date(json.date) 
    };
    const parsedData = addGigPerformanceSchema.parse(parsedJson);

    const performanceData = await addOrUpdateGigPerformance(parsedData);

    return NextResponse.json({ message: 'Performance data added successfully', performance: performanceData }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API Error adding gig performance data:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
