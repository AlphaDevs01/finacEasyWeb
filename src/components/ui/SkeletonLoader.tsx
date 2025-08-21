import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  rows?: number;
  height?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '', 
  rows = 1,
  height = 'h-4'
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 rounded ${height} ${
            index > 0 ? 'mt-2' : ''
          }`}
        />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonLoader;