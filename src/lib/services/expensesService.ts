

import { z } from 'zod';
import { format } from 'date-fns';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { type Expense, expenseFormSchema, type ExpenseFormValues } from '@/lib/data/expenses-data';

interface ExpenseCategory {
    _id: ObjectId;
    name: string;
}

// --- Collections ---
async function getExpensesCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<Expense>('expenses');
}

async function getExpenseCategoriesCollection() {
  const client = await clientPromise;
  const db = client.db("biztrack-pro");
  return db.collection<ExpenseCategory>('expenseCategories');
}

// --- Expense Service Functions ---
export async function getExpenses(): Promise<Expense[]> {
  const expensesCollection = await getExpensesCollection();
  const expenses = await expensesCollection.find({}).sort({ date: -1 }).toArray();
  return expenses.map(expense => ({ ...expense, id: expense._id.toString() }));
}

export async function addExpense(expenseData: ExpenseFormValues): Promise<Expense> {
  const expensesCollection = await getExpensesCollection();
  const newExpense = {
    ...expenseData,
    _id: new ObjectId(),
    id: '', // Will be replaced by string _id
    date: format(expenseData.date, 'yyyy-MM-dd'),
  };
  newExpense.id = newExpense._id.toString();

  const result = await expensesCollection.insertOne(newExpense as any);
  if (!result.insertedId) {
    throw new Error('Failed to insert new expense.');
  }
  return newExpense;
}

export async function updateExpense(expenseId: string, expenseData: ExpenseFormValues): Promise<Expense | null> {
  const expensesCollection = await getExpensesCollection();
  const _id = new ObjectId(expenseId);
  const updateData = {
      ...expenseData,
      date: format(expenseData.date, 'yyyy-MM-dd'),
  };

  const result = await expensesCollection.findOneAndUpdate(
    { _id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) return null;
  return { ...result, id: result._id.toString() } as Expense;
}

export async function deleteExpense(expenseId: string): Promise<boolean> {
  const expensesCollection = await getExpensesCollection();
  const _id = new ObjectId(expenseId);
  const result = await expensesCollection.deleteOne({ _id });
  return result.deletedCount === 1;
}


// --- Category Service Functions ---
export async function getExpenseCategories(): Promise<string[]> {
    const categoriesCollection = await getExpenseCategoriesCollection();
    const categories = await categoriesCollection.find({}).sort({ name: 1 }).toArray();
    
    // Seed if empty
    if (categories.length === 0) {
        console.log("Seeding 'expenseCategories' collection...");
        const initialCategories = [
            "Software", "Subscription", "Office Supplies", "Hardware", "Marketing", 
            "Cloud Hosting", "Freelancer Payment", "Salary", "Travel", "Other"
        ];
        await categoriesCollection.insertMany(initialCategories.map(name => ({ _id: new ObjectId(), name })));
        return initialCategories.sort();
    }
    
    return categories.map(cat => cat.name);
}

export async function addExpenseCategory(name: string): Promise<{ name: string }> {
    const categoriesCollection = await getExpenseCategoriesCollection();
    const existing = await categoriesCollection.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
        throw new Error('Category already exists.');
    }
    const result = await categoriesCollection.insertOne({ _id: new ObjectId(), name });
    if (!result.insertedId) {
        throw new Error('Failed to add category.');
    }
    return { name };
}

export async function updateExpenseCategory(oldName: string, newName: string): Promise<void> {
    const categoriesCollection = await getExpenseCategoriesCollection();
    const expensesCollection = await getExpensesCollection();

    // Check if new name already exists (case-insensitive)
    if (oldName.toLowerCase() !== newName.toLowerCase()) {
        const existing = await categoriesCollection.findOne({ name: { $regex: new RegExp(`^${newName}$`, 'i') } });
        if (existing) {
            throw new Error(`Category "${newName}" already exists.`);
        }
    }

    // Start a transaction
    const session = (await clientPromise).startSession();
    try {
        await session.withTransaction(async () => {
            // Update the category name in the categories collection
            const categoryUpdateResult = await categoriesCollection.updateOne({ name: oldName }, { $set: { name: newName } }, { session });
            if (categoryUpdateResult.matchedCount === 0) {
                throw new Error(`Category "${oldName}" not found.`);
            }
            
            // Update all expenses that use the old category name
            await expensesCollection.updateMany({ category: oldName }, { $set: { category: newName } }, { session });
        });
    } finally {
        await session.endSession();
    }
}

export async function deleteExpenseCategory(name: string): Promise<void> {
    const categoriesCollection = await getExpenseCategoriesCollection();
    const expensesCollection = await getExpensesCollection();
    
    // Check if the category is in use
    const expenseWithCategory = await expensesCollection.findOne({ category: name });
    if (expenseWithCategory) {
        throw new Error(`Cannot delete category "${name}" because it is in use by one or more expenses.`);
    }

    const result = await categoriesCollection.deleteOne({ name });
    if (result.deletedCount === 0) {
        throw new Error(`Category "${name}" not found.`);
    }
}
