import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-neutral-200">404</h1>
        <h2 className="text-3xl font-bold text-neutral-800 mt-4 tracking-tight">Página não encontrada</h2>
        <p className="text-neutral-600 mt-2">
          A página que você está procurando não existe ou foi removida.
        </p>
        
        <button
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium mx-auto"
        >
          <Home size={20} />
          Voltar para o início
        </button>
      </div>
    </div>
  );
};

export default NotFound;