import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Clock } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface QuickStatsProps {
  data: {
    totalReceitas: number;
    totalDespesas: number;
    saldoAtual: number;
    metasAtingidas: number;
    metasTotal: number;
    despesasVencidas: number;
    proximosVencimentos: number;
  };
}

const QuickStats: React.FC<QuickStatsProps> = ({ data }) => {
  const {
    totalReceitas,
    totalDespesas,
    saldoAtual,
    metasAtingidas,
    metasTotal,
    despesasVencidas,
    proximosVencimentos
  } = data;

  const percentualMetas = metasTotal > 0 ? (metasAtingidas / metasTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 font-medium">Receitas</p>
            <p className="text-lg font-bold text-green-500">{formatCurrency(totalReceitas)}</p>
          </div>
          <TrendingUp className="text-green-500" size={20} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 font-medium">Despesas</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalDespesas)}</p>
          </div>
          <TrendingDown className="text-red-500" size={20} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 font-medium">Saldo</p>
            <p className={`text-lg font-bold ${saldoAtual >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(saldoAtual)}
            </p>
          </div>
          {saldoAtual >= 0 ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <AlertTriangle className="text-red-500" size={20} />
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500 font-medium">Metas</p>
            <p className="text-lg font-bold text-blue-500">{formatPercentage(percentualMetas, 0)}</p>
            <p className="text-xs text-neutral-400">{metasAtingidas}/{metasTotal}</p>
          </div>
          <Target className="text-blue-500" size={20} />
        </div>
      </div>

      {(despesasVencidas > 0 || proximosVencimentos > 0) && (
        <div className="md:col-span-2 bg-gradient-to-r from-red-50 to-yellow-50 p-4 rounded-xl border border-red-200 hover:shadow-medium transition-all duration-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="font-medium text-red-700">Atenção necessária</p>
              <div className="text-sm text-red-600 space-y-1">
                {despesasVencidas > 0 && (
                  <p>{despesasVencidas} despesa(s) vencida(s)</p>
                )}
                {proximosVencimentos > 0 && (
                  <p>{proximosVencimentos} vencimento(s) próximo(s)</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickStats;