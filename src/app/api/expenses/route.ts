
import { NextResponse } from 'next/server';
import { getExpenses, addExpense } from '@/lib/services/expensesService';
import { expenseFormSchema } from '@/lib/data/expenses-data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const expenses = await getExpenses();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('API GET Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedData = expenseFormSchema.parse({
      ...json,
      date: new Date(json.date),
    });
    const newExpense = await addExpense(parsedData);
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }
    console.error('API POST Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
