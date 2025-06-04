
import { useState, useCallback, useMemo } from 'react';
import { TableFilters, Column } from '../types';

export const useDataTable = <T>(initialColumns: Column<T>[]) => {
  const [filters, setFilters] = useState<TableFilters>({
    search: '',
    columnFilters: {},
    sortBy: '',
    sortOrder: 'asc'
  });
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    initialColumns.map(col => col.key)
  );
  
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFiltersChange = useCallback((newFilters: TableFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleColumnToggle = useCallback((columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  }, []);

  const filteredColumns = useMemo(() => 
    initialColumns.filter(col => visibleColumns.includes(col.key)),
    [initialColumns, visibleColumns]
  );

  return {
    filters,
    visibleColumns,
    pageSize,
    currentPage,
    filteredColumns,
    handleFiltersChange,
    handleColumnToggle,
    setPageSize,
    setCurrentPage
  };
};
