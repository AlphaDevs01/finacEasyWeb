import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mt-4">Página não encontrada</h2>
        <p className="text-gray-600 mt-2">
          A página que você está procurando não existe ou foi removida.
        </p>
        
        <button
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Home size={20} />
          Voltar para o início
        </button>
      </div>
    </div>
  );
};

export default NotFound;