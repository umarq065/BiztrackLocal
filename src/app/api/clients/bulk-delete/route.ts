export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { deleteClientsByIds } from '@/lib/services/clientsService';
import { z } from 'zod';

const deleteSchema = z.object({
  clientIds: z.array(z.string()).min(1, 'At least one client ID is required.'),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = deleteSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Invalid input data', details: parsedData.error.errors }, { status: 400 });
    }

    const { clientIds } = parsedData.data;
    const deletedCount = await deleteClientsByIds(clientIds);

    return NextResponse.json({ message: `${deletedCount} clients deleted successfully.` }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE Error bulk deleting clients:', error);
    return NextResponse.json({ error: 'Failed to delete clients' }, { status: 500 });
  }
}

