"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterOptions?: {
    key: string;
    label: string;
    options: { label: string; value: string }[];
  }[];
  pageSize?: number;
  pageSizeOptions?: number[];
  initialPageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  filterOptions = [],
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  initialPageIndex = 0,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: initialPageIndex,
    pageSize: pageSize,
  });

  // Keep pagination state in sync with incoming initial value.
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: initialPageIndex }));
  }, [initialPageIndex]);

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    setPagination((prev) => {
      const nextState =
        typeof updater === "function"
          ? (updater as (old: PaginationState) => PaginationState)(prev)
          : updater;

      onPageChange?.(nextState.pageIndex);
      return nextState;
    });
  };

  const table = useReactTable({
    data,
    columns,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between w-full px-10  space-x-2 py-4">
        <div className="flex items-center justify-between w-full space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {/* Page numbers */}
              {Array.from(
                { length: Math.min(5, table.getPageCount()) },
                (_, i) => {
                  const pageIndex = table.getState().pagination.pageIndex;
                  const totalPages = table.getPageCount();
                  let pageNumber;

                  if (totalPages <= 5) {
                    pageNumber = i;
                  } else if (pageIndex < 3) {
                    pageNumber = i;
                  } else if (pageIndex > totalPages - 4) {
                    pageNumber = totalPages - 5 + i;
                  } else {
                    pageNumber = pageIndex - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => table.setPageIndex(pageNumber)}
                        isActive={pageNumber === pageIndex}
                        className="cursor-pointer"
                      >
                        {pageNumber + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
