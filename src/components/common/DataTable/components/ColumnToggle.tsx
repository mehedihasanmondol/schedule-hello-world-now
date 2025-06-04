
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Columns } from "lucide-react";
import { Column } from '../types';

interface ColumnToggleProps<T> {
  columns: Column<T>[];
  visibleColumns: string[];
  onToggle: (columnKey: string) => void;
}

export function ColumnToggle<T>({ columns, visibleColumns, onToggle }: ColumnToggleProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns className="h-4 w-4 mr-2" />
          Columns ({visibleColumns.length}/{columns.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Toggle Columns</h4>
          {columns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={column.key}
                checked={visibleColumns.includes(column.key)}
                onCheckedChange={() => onToggle(column.key)}
              />
              <label 
                htmlFor={column.key} 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
