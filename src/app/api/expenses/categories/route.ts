
import { NextResponse } from 'next/server';
import {
    getExpenseCategories,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory
} from '@/lib/services/expensesService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const categories = await getExpenseCategories();
        return NextResponse.json(categories);
    } catch (error) {
        console.error('API GET Error fetching expense categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

const categorySchema = z.object({
    name: z.string().min(1, 'Category name cannot be empty'),
});

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const parsedData = categorySchema.parse(json);
        const newCategory = await addExpenseCategory(parsedData.name);
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        // Handle custom error from service for duplicates
        if (error instanceof Error && error.message.includes('already exists')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('API POST Error creating category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

const updateCategorySchema = z.object({
    oldName: z.string().min(1),
    newName: z.string().min(1, 'New category name cannot be empty'),
});

export async function PUT(request: Request) {
    try {
        const json = await request.json();
        const { oldName, newName } = updateCategorySchema.parse(json);
        await updateExpenseCategory(oldName, newName);
        return NextResponse.json({ message: 'Category updated successfully' }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes('already exists')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('API PUT Error updating category:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const json = await request.json();
        const { name } = categorySchema.parse(json);
        await deleteExpenseCategory(name);
        return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        if (error instanceof Error && error.message.includes('is in use')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('API DELETE Error deleting category:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}