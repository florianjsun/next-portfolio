"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectInterface } from "@/config/projects";
import { cn } from "@/lib/utils";

const filterOptions = [
  { value: "all", label: "All", type: null },
  { value: "personal", label: "Personal", type: "Personal" },
  { value: "professional", label: "Professional", type: "Professional" },
] as const;

type FilterValue = (typeof filterOptions)[number]["value"];

interface ProjectFilterItem {
  id: string;
  type: ProjectInterface["type"];
  content: ReactNode;
}

interface ProjectFilterProps {
  items: readonly ProjectFilterItem[];
}

function isFilterValue(value: string): value is FilterValue {
  return filterOptions.some((option) => option.value === value);
}

export function ProjectFilter({ items }: ProjectFilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const activeOption = filterOptions.find(
    (option) => option.value === activeFilter
  );
  const visibleItems = activeOption?.type
    ? items.filter((item) => item.type === activeOption.type)
    : items;

  const handleFilterChange = (value: string) => {
    if (isFilterValue(value)) {
      setActiveFilter(value);
    }
  };

  return (
    <div className="w-full">
      <div className="md:hidden mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {activeOption?.label ?? "Select option"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full min-w-[200px]">
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={cn(
                  "cursor-pointer",
                  activeFilter === option.value && "bg-accent"
                )}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden md:block">
        <Tabs
          value={activeFilter}
          onValueChange={handleFilterChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            {filterOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="mx-auto my-4 grid justify-center gap-4 sm:grid-cols-2 xl:grid-cols-4 static items-stretch">
        {visibleItems.map((item) => (
          <Fragment key={item.id}>{item.content}</Fragment>
        ))}
      </div>
    </div>
  );
}
