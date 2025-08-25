import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface DashboardStatsProps {
  dashboard: any;
  onNavigate: (path: string) => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ dashboard, onNavigate }) => {
  if (!dashboard) return null;

  const stats = [
    {
      title: 'Saldo do Mês',
      value: formatCurrency(dashboard.saldo),
      icon: dashboard.saldo >= 0 ? TrendingUp : TrendingDown,
      color: dashboard.saldo >= 0 ? 'green' : 'red',
      bgColor: dashboard.saldo >= 0 ? 'bg-green-100' : 'bg-red-100',
      textColor: dashboard.saldo >= 0 ? 'text-green-500' : 'text-red-500',
      onClick: () => onNavigate('/transacoes')
    },
    {
      title: 'Receitas',
      value: formatCurrency(dashboard.receitas),
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-500',
      subtitle: dashboard.receitas_pendentes > 0 ? `${formatCurrency(dashboard.receitas_pendentes)} pendentes` : null,
      onClick: () => onNavigate('/transacoes')
    },
    {
      title: 'Despesas',
      value: formatCurrency(dashboard.despesas),
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-500',
      subtitle: dashboard.despesas_pendentes > 0 ? `${formatCurrency(dashboard.despesas_pendentes)} pendentes` : null,
      onClick: () => onNavigate('/transacoes')
    },
    {
      title: 'Limite Disponível',
      value: formatCurrency(dashboard.limite_disponivel_cartoes || 0),
      icon: CreditCard,
      color: (dashboard.percentual_limite_usado || 0) >= 80 ? 'red' : 'blue',
      bgColor: (dashboard.percentual_limite_usado || 0) >= 80 ? 'bg-red-100' : 'bg-blue-100',
      textColor: (dashboard.percentual_limite_usado || 0) >= 80 ? 'text-red-500' : 'text-blue-500',
      subtitle: (dashboard.limite_total_cartoes || 0) > 0 ? `${formatPercentage(dashboard.percentual_limite_usado || 0)} utilizado` : null,
      onClick: () => onNavigate('/cartoes')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          onClick={stat.onClick}
          className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50 hover:shadow-strong transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{stat.title}</p>
              <h3 className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </h3>
              {stat.subtitle && (
                <p className="text-xs text-neutral-500 mt-1">
                  {stat.subtitle}
                </p>
              )}
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
              <stat.icon className={stat.textColor} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;