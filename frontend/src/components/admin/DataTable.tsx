import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ 
  data, 
  columns, 
  isLoading = false,
  emptyMessage = "Nenhum registro encontrado."
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-surface/40 border border-border/40 rounded-2xl overflow-hidden">
        <div className="animate-pulse flex flex-col">
          <div className="h-12 bg-surface/60 border-b border-border/40" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-border/20 last:border-0" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-surface/40 border border-border/40 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
          <span className="text-text-muted text-2xl">?</span>
        </div>
        <p className="text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface/40 border border-border/40 rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="bg-surface/60 border-b border-border/40">
            {columns.map((col, i) => (
              <th 
                key={i} 
                className={cn("py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {data.map((item, rowIndex) => (
            <tr 
              key={rowIndex}
              className="hover:bg-surface-hover/50 transition-colors"
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={cn("py-4 px-6 text-sm text-text-main", col.className)}>
                  {col.cell 
                    ? col.cell(item) 
                    : col.accessorKey 
                      ? String(item[col.accessorKey]) 
                      : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
