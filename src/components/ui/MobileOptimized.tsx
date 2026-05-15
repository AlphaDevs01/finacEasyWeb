import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';

interface MobileOptimizedTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
  }[];
  onRowClick?: (item: any) => void;
  searchable?: boolean;
  filterable?: boolean;
  className?: string;
}

const MobileOptimizedTable: React.FC<MobileOptimizedTableProps> = ({
  data,
  columns,
  onRowClick,
  searchable = false,
  filterable = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  if (isMobile) {
    return (
      <div className={`bg-white rounded-2xl shadow-medium border border-neutral-200/50 overflow-hidden ${className}`}>
        {searchable && (
          <div className="p-4 border-b border-neutral-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
            </div>
          </div>
        )}

        <div className="divide-y divide-neutral-200">
          {sortedData.map((item, index) => {
            const isExpanded = expandedRows.has(index);
            const primaryColumn = columns[0];
            const secondaryColumns = columns.slice(1);

            return (
              <div key={index} className="p-4">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => {
                    if (onRowClick) {
                      onRowClick(item);
                    } else {
                      toggleRowExpansion(index);
                    }
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium text-neutral-800">
                      {primaryColumn.render 
                        ? primaryColumn.render(item[primaryColumn.key], item)
                        : item[primaryColumn.key]
                      }
                    </div>
                    {secondaryColumns.length > 0 && (
                      <div className="text-sm text-neutral-500 mt-1">
                        {secondaryColumns[0].render 
                          ? secondaryColumns[0].render(item[secondaryColumns[0].key], item)
                          : item[secondaryColumns[0].key]
                        }
                      </div>
                    )}
                  </div>
                  
                  {!onRowClick && (
                    <button className="p-2 text-neutral-400 hover:text-neutral-600">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  )}
                </div>

                {isExpanded && !onRowClick && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                    {secondaryColumns.slice(1).map(column => (
                      <div key={column.key} className="flex justify-between">
                        <span className="text-sm text-neutral-500">{column.label}:</span>
                        <span className="text-sm font-medium">
                          {column.render 
                            ? column.render(item[column.key], item)
                            : item[column.key]
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedData.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            <p>Nenhum item encontrado</p>
          </div>
        )}
      </div>
    );
  }

  // Desktop view (existing table)
  return (
    <div className={`bg-white rounded-2xl shadow-medium border border-neutral-200/50 overflow-hidden ${className}`}>
      {searchable && (
        <div className="p-4 border-b border-neutral-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortConfig?.key === column.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {sortedData.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-neutral-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map(column => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {column.render 
                      ? column.render(item[column.key], item)
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="p-8 text-center text-neutral-500">
          <p>Nenhum item encontrado</p>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedTable;