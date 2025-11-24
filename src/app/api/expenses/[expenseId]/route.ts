export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { updateExpense, deleteExpense } from '@/lib/services/expensesService';
import { expenseFormSchema } from '@/lib/data/expenses-data';
import { z } from 'zod';

export async function PUT(request: Request, { params }: { params: { expenseId: string } }) {
  try {
    const json = await request.json();
    const parsedData = expenseFormSchema.parse({
        ...json,
        date: new Date(json.date),
    });
    const updatedExpense = await updateExpense(params.expenseId, parsedData);

    if (!updatedExpense) {
        return NextResponse.json({ error: 'Expense not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(updatedExpense, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API PUT Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { expenseId: string } }) {
  try {
    const success = await deleteExpense(params.expenseId);
    if (!success) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}

    
