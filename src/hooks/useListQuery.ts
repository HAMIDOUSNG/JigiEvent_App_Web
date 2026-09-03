"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "./useDebounce";
import type { Paginated } from "@/types";
import type { QueryParams } from "@/services/helpers";

interface UseListQueryOptions<T> {
  key: string;
  fetcher: (params: QueryParams) => Promise<Paginated<T>>;
  pageSize?: number;
  initialFilters?: Record<string, string>;
  defaultSort?: { by: string; dir: "asc" | "desc" };
}

/** Shared list-page state: search, filters, sort, pagination + query. */
export function useListQuery<T>({
  key,
  fetcher,
  pageSize = 10,
  initialFilters = {},
  defaultSort,
}: UseListQueryOptions<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [sortBy, setSortBy] = useState<string | undefined>(defaultSort?.by);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSort?.dir ?? "asc");

  const debouncedSearch = useDebounce(search, 300);

  const query = useQuery({
    queryKey: [key, { search: debouncedSearch, page, filters, sortBy, sortDir }],
    queryFn: () =>
      fetcher({ search: debouncedSearch, page, pageSize, filters, sortBy, sortDir }),
    placeholderData: keepPreviousData,
  });

  function setFilter(k: string, v: string) {
    setFilters((prev) => ({ ...prev, [k]: v }));
    setPage(1);
  }

  function toggleSort(k: string) {
    if (sortBy === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(k);
      setSortDir("asc");
    }
    setPage(1);
  }

  function onSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }

  return {
    search,
    onSearchChange,
    page,
    setPage,
    pageSize,
    filters,
    setFilter,
    sortBy,
    sortDir,
    toggleSort,
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
