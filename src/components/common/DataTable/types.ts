
export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  exportRender?: (value: any, row: T) => string;
}

export interface TableData<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TableFilters {
  search?: string;
  columnFilters?: Record<string, string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  allPages?: boolean;
  selectedColumns?: string[];
}

export interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: TableData<T>;
  loading?: boolean;
  onFiltersChange: (filters: TableFilters) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onLoadMore?: () => void;
  onExport?: (options: ExportOptions) => void;
  enableExport?: boolean;
  enableColumnToggle?: boolean;
  enableInfiniteScroll?: boolean;
  className?: string;
}
