export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { addOrUpdateGigPerformance } from '@/lib/services/gigPerformanceService';
import { z } from 'zod';

// Note: This schema does not include gigId as it comes from the URL params.
const addGigPerformanceSchema = z.object({
    date: z.date({ required_error: "A date is required." }),
    impressions: z.coerce.number().int().min(0),
    clicks: z.coerce.number().int().min(0),
    sourceId: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: { gigId: string } }) {
  try {
    const json = await request.json();
    // Combine json body with the gigId from the URL parameter before parsing.
    const parsedJson = { 
        ...json, 
        gigId: params.gigId,
        date: new Date(json.date) 
    };
    
    // The service now expects gigId, so we need a slightly different schema for the service layer
    const serviceSchema = addGigPerformanceSchema.extend({
        gigId: z.string().min(1),
    });

    const parsedData = serviceSchema.parse(parsedJson);

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
