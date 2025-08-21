import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 via-white to-neutral-100">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mb-6"></div>
      <h2 className="text-2xl font-bold text-neutral-800 tracking-tight">Carregando...</h2>
      <p className="text-neutral-600 mt-2">Preparando sua experiência financeira</p>
    </div>
  );
};

export default LoadingScreen;