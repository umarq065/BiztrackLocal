

"use client";

import { memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import type { Expense } from "@/lib/data/expenses-data";

interface ExpensesTableProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
}

const ExpensesTableComponent = ({ expenses, onEdit, onDelete }: ExpensesTableProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Transactions</CardTitle>
                <CardDescription>
                    A list of your expenses for the selected period.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Recurring</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.length > 0 ? (
                            expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{format(new Date(expense.date.replace(/-/g, '/')), "PPP")}</TableCell>
                                    <TableCell className="font-medium">{expense.type}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell>{expense.recurring ? 'Yes' : 'No'}</TableCell>
                                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(expense)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">No expenses found for the selected period.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export const ExpensesTable = memo(ExpensesTableComponent);
