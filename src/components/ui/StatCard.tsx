import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      value: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      value: 'text-green-600'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      value: 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      value: 'text-yellow-600'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      value: 'text-purple-600'
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        {trend && (
          <div className="mt-4 h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${colorClasses[color].value}`}>
            {value}
          </h3>
          {trend && (
            <div className="mt-2 flex items-center">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorClasses[color].bg}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].text}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;