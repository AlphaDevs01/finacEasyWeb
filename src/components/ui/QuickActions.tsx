import React from 'react';
import { Plus, Upload, Download, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'Nova Despesa',
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => navigate('/transacoes')
    },
    {
      icon: Plus,
      label: 'Nova Receita',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => navigate('/transacoes')
    },
    {
      icon: Upload,
      label: 'Importar CSV',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/importacao')
    },
    {
      icon: Calculator,
      label: 'Relatórios',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/relatorios')
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        Ações Rápidas
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center gap-2 p-3 rounded-lg text-white transition-colors ${action.color}`}
          >
            <action.icon size={20} />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;