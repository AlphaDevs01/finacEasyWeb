import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, BarChart3, PieChart } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface AnaliseData {
  gastos_categoria: { categoria: string; valor: number; percentual: number }[];
  tendencias: { mes: string; valor: number; variacao: number }[];
  insights: string[];
  recomendacoes: string[];
  score_financeiro: number;
  alertas: { tipo: string; mensagem: string; prioridade: 'alta' | 'media' | 'baixa' }[];
}

const AnaliseIA: React.FC = () => {
  const [analise, setAnalise] = useState<AnaliseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadAnalise();
  }, [periodo]);

  const loadAnalise = async () => {
    setLoading(true);
    try {
      const response = await api.post('/analise-ia', {
        data_inicio: periodo.inicio,
        data_fim: periodo.fim
      });
      setAnalise(response.data);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro na análise',
        message: error.response?.data?.error || 'Erro ao gerar análise'
      });
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baixa': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="text-primary-600" size={32} />
            Análise Inteligente
          </h1>
          <p className="text-neutral-600 mt-2">
            Insights e recomendações baseadas em IA para suas finanças
          </p>
        </div>
        
        <button
          onClick={loadAnalise}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
              Analisando...
            </>
          ) : (
            <>
              <Brain size={20} />
              Gerar Análise
            </>
          )}
        </button>
      </div>

      {/* Filtros de Período */}
      <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50 mb-8">
        <h3 className="text-lg font-semibold mb-4">Período de Análise</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={periodo.inicio}
              onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={periodo.fim}
              onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-neutral-700">Analisando seus dados...</p>
            <p className="text-sm text-neutral-500">Isso pode levar alguns segundos</p>
          </div>
        </div>
      ) : analise ? (
        <div className="space-y-8">
          {/* Score Financeiro */}
          <div className="bg-white p-8 rounded-2xl shadow-medium border border-neutral-200/50">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Score Financeiro</h2>
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(analise.score_financeiro)} mb-4`}>
                <span className={`text-4xl font-bold ${getScoreColor(analise.score_financeiro)}`}>
                  {analise.score_financeiro}
                </span>
              </div>
              <p className="text-neutral-600">
                {analise.score_financeiro >= 80 ? 'Excelente! Suas finanças estão muito bem organizadas.' :
                 analise.score_financeiro >= 60 ? 'Bom! Há algumas áreas para melhorar.' :
                 'Atenção! Suas finanças precisam de mais cuidado.'}
              </p>
            </div>
          </div>

          {/* Alertas */}
          {analise.alertas.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={24} />
                Alertas Importantes
              </h2>
              <div className="space-y-3">
                {analise.alertas.map((alerta, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${getPrioridadeColor(alerta.prioridade)}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={20} className="mt-0.5" />
                      <div>
                        <p className="font-medium">{alerta.tipo}</p>
                        <p className="text-sm mt-1">{alerta.mensagem}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="text-yellow-600" size={24} />
                Insights
              </h2>
              <div className="space-y-3">
                {analise.insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm text-yellow-800">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="text-green-600" size={24} />
                Recomendações
              </h2>
              <div className="space-y-3">
                {analise.recomendacoes.map((recomendacao, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-800">{recomendacao}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Análise por Categoria */}
          <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="text-primary-600" size={24} />
              Análise por Categoria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analise.gastos_categoria.map((categoria, index) => (
                <div key={index} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <h4 className="font-semibold text-neutral-800">{categoria.categoria}</h4>
                  <p className="text-2xl font-bold text-primary-600 mt-2">
                    {formatCurrency(categoria.valor)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {categoria.percentual.toFixed(1)}% do total
                  </p>
                  <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${categoria.percentual}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tendências */}
          <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="text-secondary-600" size={24} />
              Tendências de Gastos
            </h2>
            <div className="space-y-4">
              {analise.tendencias.map((tendencia, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-neutral-50 rounded-xl">
                  <div>
                    <h4 className="font-semibold">{tendencia.mes}</h4>
                    <p className="text-sm text-neutral-500">
                      {formatCurrency(tendencia.valor)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    tendencia.variacao > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <TrendingUp 
                      size={20} 
                      className={tendencia.variacao > 0 ? 'rotate-0' : 'rotate-180'} 
                    />
                    <span className="font-semibold">
                      {Math.abs(tendencia.variacao).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain size={64} className="mx-auto mb-4 text-neutral-400" />
          <h2 className="text-2xl font-bold text-neutral-700 mb-2">
            Análise Inteligente
          </h2>
          <p className="text-neutral-500 mb-6">
            Clique em "Gerar Análise" para obter insights sobre suas finanças
          </p>
        </div>
      )}
    </div>
  );
};

export default AnaliseIA;