import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ResponsiveCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
  onClick,
  className = '',
  loading = false
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-500'
    },
    secondary: {
      bg: 'bg-secondary-50',
      text: 'text-secondary-600',
      icon: 'text-secondary-500'
    },
    accent: {
      bg: 'bg-accent-50',
      text: 'text-accent-600',
      icon: 'text-accent-500'
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'text-yellow-500'
    },
    error: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-500'
    }
  };

  if (loading) {
    return (
      <div className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-neutral-200/50 animate-pulse ${className}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-neutral-200 rounded w-24"></div>
            <div className="h-6 sm:h-8 bg-neutral-200 rounded w-32"></div>
            {subtitle && <div className="h-3 bg-neutral-200 rounded w-20"></div>}
          </div>
          {Icon && (
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-neutral-200 rounded-full"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border border-neutral-200/50 hover:shadow-medium transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] transform' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 mb-1 truncate">
            {title}
          </p>
          <h3 className={`text-xl sm:text-2xl font-bold ${colorClasses[color].text} break-words`}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center">
              <span className={`text-xs sm:text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="text-xs text-neutral-500 ml-1">vs anterior</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${colorClasses[color].bg} flex-shrink-0 ml-3`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colorClasses[color].icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveCard;