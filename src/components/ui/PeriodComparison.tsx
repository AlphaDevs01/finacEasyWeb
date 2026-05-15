import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface ComparisonData {
  periodo1: {
    receitas: number;
    despesas: number;
    saldo: number;
    label: string;
  };
  periodo2: {
    receitas: number;
    despesas: number;
    saldo: number;
    label: string;
  };
  variacao: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
}

interface PeriodComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

const PeriodComparison: React.FC<PeriodComparisonProps> = ({ isOpen, onClose }) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [periodo1, setPeriodo1] = useState({
    mes: new Date().getMonth(),
    ano: new Date().getFullYear()
  });
  const [periodo2, setPeriodo2] = useState({
    mes: new Date().getMonth() - 1 < 0 ? 11 : new Date().getMonth() - 1,
    ano: new Date().getMonth() - 1 < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    if (isOpen) {
      loadComparison();
    }
  }, [isOpen, periodo1, periodo2]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const [response1, response2] = await Promise.all([
        api.get(`/dashboard?mes=${periodo1.mes + 1}&ano=${periodo1.ano}`),
        api.get(`/dashboard?mes=${periodo2.mes + 1}&ano=${periodo2.ano}`)
      ]);

      const data1 = response1.data;
      const data2 = response2.data;

      const comparison: ComparisonData = {
        periodo1: {
          receitas: data1.receitas,
          despesas: data1.despesas,
          saldo: data1.saldo,
          label: `${meses[periodo1.mes]} ${periodo1.ano}`
        },
        periodo2: {
          receitas: data2.receitas,
          despesas: data2.despesas,
          saldo: data2.saldo,
          label: `${meses[periodo2.mes]} ${periodo2.ano}`
        },
        variacao: {
          receitas: data2.receitas > 0 ? ((data1.receitas - data2.receitas) / data2.receitas) * 100 : 0,
          despesas: data2.despesas > 0 ? ((data1.despesas - data2.despesas) / data2.despesas) * 100 : 0,
          saldo: data2.saldo !== 0 ? ((data1.saldo - data2.saldo) / Math.abs(data2.saldo)) * 100 : 0
        }
      };

      setComparisonData(comparison);
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getVariationColor = (value: number, isPositiveGood: boolean = true) => {
    if (value === 0) return 'text-neutral-500';
    const isPositive = value > 0;
    return (isPositive === isPositiveGood) ? 'text-green-500' : 'text-red-500';
  };

  const getVariationIcon = (value: number) => {
    if (value === 0) return null;
    return value > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  const chartData = comparisonData ? [
    {
      name: comparisonData.periodo2.label,
      receitas: comparisonData.periodo2.receitas,
      despesas: comparisonData.periodo2.despesas,
      saldo: comparisonData.periodo2.saldo
    },
    {
      name: comparisonData.periodo1.label,
      receitas: comparisonData.periodo1.receitas,
      despesas: comparisonData.periodo1.despesas,
      saldo: comparisonData.periodo1.saldo
    }
  ] : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-strong max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <Calendar size={24} />
            Comparação de Períodos
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-all duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Seletores de Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-primary-50 p-4 rounded-2xl border border-primary-200">
              <h3 className="text-lg font-semibold mb-3 text-primary-800">Período 1 (Atual)</h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={periodo1.mes}
                  onChange={(e) => setPeriodo1({ ...periodo1, mes: Number(e.target.value) })}
                  className="px-3 py-2 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {meses.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={periodo1.ano}
                  onChange={(e) => setPeriodo1({ ...periodo1, ano: Number(e.target.value) })}
                  className="px-3 py-2 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="bg-secondary-50 p-4 rounded-2xl border border-secondary-200">
              <h3 className="text-lg font-semibold mb-3 text-secondary-800">Período 2 (Comparação)</h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={periodo2.mes}
                  onChange={(e) => setPeriodo2({ ...periodo2, mes: Number(e.target.value) })}
                  className="px-3 py-2 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                >
                  {meses.map((mes, index) => (
                    <option key={index} value={index}>{mes}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={periodo2.ano}
                  onChange={(e) => setPeriodo2({ ...periodo2, ano: Number(e.target.value) })}
                  className="px-3 py-2 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : comparisonData ? (
            <>
              {/* Cards de Comparação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200">
                  <h4 className="text-lg font-semibold mb-4 text-green-600">Receitas</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">{comparisonData.periodo1.label}</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(comparisonData.periodo1.receitas)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">{comparisonData.periodo2.label}</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(comparisonData.periodo2.receitas)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-neutral-200">
                      <div className={`flex items-center gap-2 ${getVariationColor(comparisonData.variacao.receitas)}`}>
                        {getVariationIcon(comparisonData.variacao.receitas)}
                        <span className="font-semibold">
                          {formatPercentage(comparisonData.variacao.receitas)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200">
                  <h4 className="text-lg font-semibold mb-4 text-red-600">Despesas</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">{comparisonData.periodo1.label}</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(comparisonData.periodo1.despesas)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">{comparisonData.periodo2.label}</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(comparisonData.periodo2.despesas)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-neutral-200">
                      <div className={`flex items-center gap-2 ${getVariationColor(comparisonData.variacao.despesas, false)}`}>
                        {getVariationIcon(comparisonData.variacao.despesas)}
                        <span className="font-semibold">
                          {formatPercentage(comparisonData.variacao.despesas)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200">
                  <h4 className="text-lg font-semibold mb-4 text-blue-600">Saldo</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">{comparisonData.periodo1.label}</span>
                      <span className={`font-semibold ${comparisonData.periodo1.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(comparisonData.periodo1.saldo)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">{comparisonData.periodo2.label}</span>
                      <span className={`font-semibold ${comparisonData.periodo2.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(comparisonData.periodo2.saldo)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-neutral-200">
                      <div className={`flex items-center gap-2 ${getVariationColor(comparisonData.variacao.saldo)}`}>
                        {getVariationIcon(comparisonData.variacao.saldo)}
                        <span className="font-semibold">
                          {formatPercentage(comparisonData.variacao.saldo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Comparação */}
              <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200">
                <h3 className="text-xl font-semibold mb-6">Comparação Visual</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
                      <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
                      <Bar dataKey="saldo" fill="#3B82F6" name="Saldo" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PeriodComparison;