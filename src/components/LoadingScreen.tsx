import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
    </div>
  );
};

export default LoadingScreen;