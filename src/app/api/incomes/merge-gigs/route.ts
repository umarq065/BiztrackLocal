
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mergeGigs } from '@/lib/services/incomesService';

const mergeGigsSchema = z.object({
    sourceId: z.string(),
    mainGigId: z.string(),
    gigsToMergeIds: z.array(z.string()),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = mergeGigsSchema.parse(body);

        await mergeGigs(validatedData.sourceId, validatedData.mainGigId, validatedData.gigsToMergeIds);

        return NextResponse.json({ success: true, message: 'Gigs merged successfully' });
    } catch (error) {
        console.error('Error merging gigs:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to merge gigs' }, { status: 500 });
    }
}
