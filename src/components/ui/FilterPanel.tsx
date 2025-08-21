import React, { useState } from 'react';
import { Filter, X, Calendar, Tag, DollarSign } from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'date' | 'number' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterPanelProps {
  filters: FilterOption[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onClear,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.values(values).filter(value => 
    value !== '' && value !== null && value !== undefined
  ).length;

  const renderFilterInput = (filter: FilterOption) => {
    const value = values[filter.key] || '';

    switch (filter.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
          activeFiltersCount > 0
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter size={20} />
        Filtros
        {activeFiltersCount > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {filters.map(filter => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={onClear}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterPanel;