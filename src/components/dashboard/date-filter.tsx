"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";

export function DateFilter() {
  const years = Array.from({ length: 10 }, (_, i) => 2021 + i);
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={currentMonth}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="January">January</SelectItem>
          <SelectItem value="February">February</SelectItem>
          <SelectItem value="March">March</SelectItem>
          <SelectItem value="April">April</SelectItem>
          <SelectItem value="May">May</SelectItem>
          <SelectItem value="June">June</SelectItem>
          <SelectItem value="July">July</SelectItem>
          <SelectItem value="August">August</SelectItem>
          <SelectItem value="September">September</SelectItem>
          <SelectItem value="October">October</SelectItem>
          <SelectItem value="November">November</SelectItem>
          <SelectItem value="December">December</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue={currentYear}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
       <Button>Filter</Button>
    </div>
  );
}
