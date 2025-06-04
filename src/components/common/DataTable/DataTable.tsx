
import { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react";
import { TableSearch } from './components/TableSearch';
import { ColumnToggle } from './components/ColumnToggle';
import { ExportMenu } from './components/ExportMenu';
import { TablePagination } from './components/TablePagination';
import { DataTableProps, Column } from './types';
import { cn } from '@/lib/utils';

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
  onLoadMore,
  onExport,
  enableExport = true,
  enableColumnToggle = true,
  enableInfiniteScroll = false,
  className
}: DataTableProps<T>) {
  const totalPages = Math.ceil(data.total / data.pageSize);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    onFiltersChange({
      sortBy: columnKey,
      sortOrder: columnKey === 'sortBy' ? 'desc' : 'asc'
    });
  };

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.key !== 'actions'),
    [columns]
  );

  const getSortIcon = (columnKey: string) => {
    // This would be managed by the parent component's state
    return <MoreHorizontal className="h-4 w-4" />;
  };

  return (
    <Card className={cn("w-full", className)}>
      {/* Table Header Controls */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <TableSearch
              value=""
              onChange={(value) => onFiltersChange({ search: value })}
              placeholder="Search all columns..."
            />
          </div>
          <div className="flex items-center gap-2">
            {enableColumnToggle && (
              <ColumnToggle
                columns={visibleColumns}
                visibleColumns={visibleColumns.map(col => col.key)}
                onToggle={() => {}}
              />
            )}
            {enableExport && onExport && (
              <ExportMenu
                columns={visibleColumns}
                visibleColumns={visibleColumns.map(col => col.key)}
                onExport={onExport}
                totalRecords={data.total}
                currentPageRecords={data.data.length}
              />
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:bg-gray-100",
                    column.width && `w-${column.width}`
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && data.data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.data.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load More Button for Infinite Scroll */}
      {enableInfiniteScroll && data.hasMore && (
        <div className="p-4 border-t bg-gray-50 text-center">
          <Button
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!enableInfiniteScroll && (
        <TablePagination
          currentPage={data.page}
          totalPages={totalPages}
          pageSize={data.pageSize}
          totalRecords={data.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          loading={loading}
        />
      )}
    </Card>
  );
}
