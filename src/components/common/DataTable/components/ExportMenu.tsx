
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { ExportOptions, Column } from '../types';

interface ExportMenuProps<T> {
  columns: Column<T>[];
  visibleColumns: string[];
  onExport: (options: ExportOptions) => void;
  totalRecords: number;
  currentPageRecords: number;
}

export function ExportMenu<T>({ 
  columns, 
  visibleColumns, 
  onExport, 
  totalRecords, 
  currentPageRecords 
}: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(visibleColumns);
  const [allPages, setAllPages] = useState(false);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    onExport({
      format,
      allPages,
      selectedColumns
    });
    setOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setOpen(false);
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Export Options</h4>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Columns to Export:</label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {columns.filter(col => visibleColumns.includes(col.key)).map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-${column.key}`}
                    checked={selectedColumns.includes(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <label htmlFor={`export-${column.key}`} className="text-sm">
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-pages"
              checked={allPages}
              onCheckedChange={(checked) => setAllPages(checked as boolean)}
            />
            <label htmlFor="all-pages" className="text-sm">
              Export all {totalRecords} records (current: {currentPageRecords})
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
