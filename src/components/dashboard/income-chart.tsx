import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { type IncomeBySource } from "@/lib/placeholder-data";

interface IncomeChartProps {
  data: IncomeBySource[];
}

export default function IncomeChart({ data }: IncomeChartProps) {
  return (
    <ChartContainer
      config={{}}
      className="mx-auto aspect-square h-[250px]"
    >
      <PieChart>
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="amount"
          nameKey="source"
          innerRadius={60}
          strokeWidth={5}
        >
          {data.map((entry) => (
             <Cell key={`cell-${entry.source}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
            content={<ChartLegendContent nameKey="source" />}
            className="-translate-y-[2px] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
      </PieChart>
    </ChartContainer>
  );
}
