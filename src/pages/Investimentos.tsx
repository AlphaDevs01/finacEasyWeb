import React, { useState, useEffect } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Plus, TrendingUp, Trash2, AlertCircle } from 'lucide-react';

const Investimentos: React.FC = () => {
  const { investimentos, loadInvestimentos, salvarInvestimento, excluirInvestimento } = useFinance();
  
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState('');
  const [nome, setNome] = useState('');
  const [valorAplicado, setValorAplicado] = useState('');
  const [rendimentoMensal, setRendimentoMensal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadInvestimentos();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!tipo || !nome || !valorAplicado || rendimentoMensal === '') {
      setError('Preencha todos os campos');
      return;
    }
    
    try {
      setLoading(true);
      await salvarInvestimento({
        tipo,
        nome,
        valor_aplicado: parseFloat(valorAplicado),
        rendimento_mensal: parseFloat(rendimentoMensal)
      });
      
      setShowForm(false);
      resetForm();
      loadInvestimentos();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao salvar investimento');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este investimento?')) {
      return;
    }
    
    try {
      await excluirInvestimento(id);
      loadInvestimentos();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao excluir investimento');
    }
  };
  
  const resetForm = () => {
    setTipo('');
    setNome('');
    setValorAplicado('');
    setRendimentoMensal('');
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };
  
  const tiposInvestimento = [
    'Poupança',
    'CDB',
    'Tesouro Direto',
    'Ações',
    'FIIs',
    'Criptomoedas',
    'Outros'
  ];
  
  const calcularTotalInvestido = () => {
    return investimentos.reduce((total, inv) => total + inv.valor_aplicado, 0);
  };
  
  const calcularRendimentoTotal = () => {
    return investimentos.reduce((total, inv) => {
      const rendimento = (inv.valor_aplicado * inv.rendimento_mensal) / 100;
      return total + rendimento;
    }, 0);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Investimentos</h1>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Investimento
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow text-gray-800">
          <h3 className="text-lg font-semibold mb-2">Total Investido</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(calcularTotalInvestido())}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow text-gray-800">
          <h3 className="text-lg font-semibold mb-2">Rendimento Mensal</h3>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(calcularRendimentoTotal())}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow text-gray-800">
          <h3 className="text-lg font-semibold mb-2">Rentabilidade Média</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatPercentage(
              investimentos.length > 0
                ? investimentos.reduce((total, inv) => total + inv.rendimento_mensal, 0) / investimentos.length
                : 0
            )}
          </p>
        </div>
      </div>
      
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 text-gray-800">
          <h2 className="text-xl font-semibold mb-4">Novo Investimento</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {tiposInvestimento.map(tipo => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Tesouro IPCA+ 2026"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Aplicado
                </label>
                <input
                  type="number"
                  value={valorAplicado}
                  onChange={(e) => setValorAplicado(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rendimento Mensal (%)
                </label>
                <input
                  type="number"
                  value={rendimentoMensal}
                  onChange={(e) => setRendimentoMensal(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-800">
        {investimentos.map(investimento => (
          <div key={investimento.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{investimento.nome}</h3>
                <p className="text-sm text-gray-500">{investimento.tipo}</p>
              </div>
              
              <button
                onClick={() => handleDelete(investimento.id)}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Valor Aplicado</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(investimento.valor_aplicado)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Rendimento Mensal</p>
                <p className="text-lg font-semibold text-green-500">
                  {formatPercentage(investimento.rendimento_mensal)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Retorno Mensal</p>
                <p className="text-lg font-semibold text-blue-500">
                  {formatCurrency((investimento.valor_aplicado * investimento.rendimento_mensal) / 100)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {investimentos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
          <p>Você ainda não tem investimentos cadastrados</p>
        </div>
      )}
    </div>
  );
};

export default Investimentos;