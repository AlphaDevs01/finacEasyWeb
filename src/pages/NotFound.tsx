import React from "react";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-lg text-gray-700 mb-2">Página não encontrada.</p>
      <a href="/" className="text-blue-500 underline">Voltar para o início</a>
    </div>
  );
};

export default NotFound;
