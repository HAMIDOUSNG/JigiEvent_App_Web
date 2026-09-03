"use client";

import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { EmptyState } from "./States";
import { SkeletonTable } from "./Skeleton";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  emptyTitle = "Aucun résultat",
  emptyDescription,
  emptyAction,
}: DataTableProps<T>) {
  if (loading) return <SkeletonTable cols={columns.length} />;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const alignCls = { left: "text-left", right: "text-right", center: "text-center" };

  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-5 py-3 text-label font-semibold",
                    alignCls[col.align ?? "left"],
                    col.className
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {sortBy === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-surface-2"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-5 py-3.5 text-body-sm text-foreground", alignCls[col.align ?? "left"], col.className)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && onPageChange && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-caption">
            {from}–{to} sur {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-sand disabled:opacity-40 focus-ring"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm text-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-sand disabled:opacity-40 focus-ring"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
