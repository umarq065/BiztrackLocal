
"use client";

import { memo } from "react";
import { ExpensesDashboard } from "@/components/expenses/expenses-dashboard";

const ExpensesPageComponent = () => {
  return <ExpensesDashboard />;
}

const MemoizedExpensesPage = memo(ExpensesPageComponent);

export default function ExpensesPage() {
  return <MemoizedExpensesPage />;
}
