
"use client";

import * as React from "react";
import { ListFilter, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface IncomeSourceFilterProps {
  sources: string[];
  selectedSources: string[];
  onSelectionChange: (sources: string[]) => void;
  isLoading: boolean;
}

export default function IncomeSourceFilter({ sources, selectedSources, onSelectionChange, isLoading }: IncomeSourceFilterProps) {
  const [open, setOpen] = React.useState(false);
  
  const handleSelect = (source: string) => {
    const newSelection = selectedSources.includes(source)
      ? selectedSources.filter(s => s !== source)
      : [...selectedSources, source];
    onSelectionChange(newSelection);
  };
  
  const handleSelectAll = () => {
      onSelectionChange(sources.length === selectedSources.length ? [] : sources);
  }

  const title = selectedSources.length === 0
      ? "All Sources"
      : selectedSources.length === 1
      ? selectedSources[0]
      : `${selectedSources.length} sources selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
            <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                <span className="truncate">{title}</span>
            </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search sources..." />
          <CommandList>
            <CommandEmpty>No sources found.</CommandEmpty>
            <CommandGroup>
                <CommandItem onSelect={handleSelectAll} className="cursor-pointer">
                     <div
                        className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        sources.length === selectedSources.length
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                    >
                        <Check className={cn("h-4 w-4")} />
                    </div>
                    <span>All Sources</span>
                </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {sources.map((source) => (
                <CommandItem
                  key={source}
                  value={source}
                  onSelect={() => handleSelect(source)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedSources.includes(source)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <span>{source}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
