"use client";

import { Search, Download } from "lucide-react";
import { Input, Select } from "./Input";
import { Button } from "./Button";
import { cn } from "@/utils/cn";

export interface FilterConfig {
  key: string;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

interface ToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onExport?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  filters = [],
  onExport,
  className,
  children,
}: ToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", className)}>
      {onSearchChange && (
        <div className="w-full lg:max-w-xs">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        {filters.map((f) => (
          <Select
            key={f.key}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            options={[{ value: "all", label: f.placeholder }, ...f.options]}
            className="min-w-36"
          />
        ))}
        {children}
        {onExport && (
          <Button variant="outline" size="md" onClick={onExport}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        )}
      </div>
    </div>
  );
}
