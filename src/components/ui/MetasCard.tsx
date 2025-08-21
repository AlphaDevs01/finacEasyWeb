import React, { useState } from 'react';
import { Target, Plus, Edit, Trash2 } from 'lucide-react';

interface Meta {
  id: number;
  categoria: string;
  valor_limite: number;
  valor_atual: number;
  mes: number;
  ano: number;
}

const MetasCard: React.FC = () => {
  const [metas, setMetas] = useState<Meta[]>([
    {
      id: 1,
      categoria: 'Alimentação',
      valor_limite: 800,
      valor_atual: 650,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    },
    {
      id: 2,
      categoria: 'Transporte',
      valor_limite: 400,
      valor_atual: 320,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    }
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 90) return 'bg-red-500';
    if (percentual >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBgColor = (percentual: number) => {
    if (percentual >= 90) return 'bg-red-100';
    if (percentual >= 70) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Target size={20} />
          Metas de Gastos
        </h3>
        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {metas.map(meta => {
          const percentual = (meta.valor_atual / meta.valor_limite) * 100;
          
          return (
            <div key={meta.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">{meta.categoria}</h4>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(meta.valor_atual)} de {formatCurrency(meta.valor_limite)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className={`w-full rounded-full h-2 ${getProgressBgColor(percentual)}`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentual)}`}
                  style={{ width: `${Math.min(percentual, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {percentual.toFixed(1)}% utilizado
                </span>
                {percentual >= 90 && (
                  <span className="text-xs text-red-600 font-medium">
                    ⚠️ Meta quase atingida!
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {metas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target size={48} className="mx-auto mb-2 opacity-50" />
            <p>Nenhuma meta definida</p>
            <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
              Criar primeira meta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetasCard;