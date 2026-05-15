import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Target, Plus, Edit, Trash2, AlertTriangle, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

interface OrcamentoItem {
  id: number;
  categoria: string;
  valor_planejado: number;
  valor_gasto: number;
  mes: number;
  ano: number;
  tipo: 'receita' | 'despesa';
}

const Orcamento: React.FC = () => {
  const [orcamento, setOrcamento] = useState<OrcamentoItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [categoria, setCategoria] = useState('');
  const [valorPlanejado, setValorPlanejado] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const categorias = {
    despesa: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros'],
    receita: ['Salário', 'Freelance', 'Investimentos', 'Outros']
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    loadOrcamento();
  }, [mes, ano]);

  const loadOrcamento = async () => {
    try {
      const response = await api.get(`/orcamento?mes=${mes}&ano=${ano}`);
      setOrcamento(response.data);
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoria || !valorPlanejado) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      if (editId) {
        await api.put(`/orcamento/${editId}`, {
          valor_planejado: parseFloat(valorPlanejado)
        });
        showToast({
          type: 'success',
          title: 'Orçamento atualizado!',
          message: 'Item do orçamento atualizado com sucesso'
        });
      } else {
        await api.post('/orcamento', {
          categoria,
          valor_planejado: parseFloat(valorPlanejado),
          tipo,
          mes,
          ano
        });
        showToast({
          type: 'success',
          title: 'Item adicionado!',
          message: 'Item adicionado ao orçamento com sucesso'
        });
      }

      setShowForm(false);
      resetForm();
      loadOrcamento();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao salvar item do orçamento');
      showToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: OrcamentoItem) => {
    setEditId(item.id);
    setCategoria(item.categoria);
    setValorPlanejado(String(item.valor_planejado));
    setTipo(item.tipo);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este item do orçamento?')) {
      return;
    }

    try {
      await api.delete(`/orcamento/${id}`);
      loadOrcamento();
      showToast({
        type: 'success',
        title: 'Item excluído!',
        message: 'Item removido do orçamento com sucesso'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao excluir',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    }
  };

  const resetForm = () => {
    setEditId(null);
    setCategoria('');
    setValorPlanejado('');
    setTipo('despesa');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressColor = (percentual: number, tipo: 'receita' | 'despesa') => {
    if (tipo === 'receita') {
      if (percentual >= 100) return 'bg-green-500';
      if (percentual >= 80) return 'bg-yellow-500';
      return 'bg-red-500';
    } else {
      if (percentual >= 100) return 'bg-red-500';
      if (percentual >= 80) return 'bg-yellow-500';
      return 'bg-green-500';
    }
  };

  const getProgressBgColor = (percentual: number, tipo: 'receita' | 'despesa') => {
    if (tipo === 'receita') {
      if (percentual >= 100) return 'bg-green-100';
      if (percentual >= 80) return 'bg-yellow-100';
      return 'bg-red-100';
    } else {
      if (percentual >= 100) return 'bg-red-100';
      if (percentual >= 80) return 'bg-yellow-100';
      return 'bg-green-100';
    }
  };

  const despesas = orcamento.filter(item => item.tipo === 'despesa');
  const receitas = orcamento.filter(item => item.tipo === 'receita');

  const totalPlanejadoDespesas = despesas.reduce((acc, item) => acc + item.valor_planejado, 0);
  const totalGastoDespesas = despesas.reduce((acc, item) => acc + item.valor_gasto, 0);
  const totalPlanejadoReceitas = receitas.reduce((acc, item) => acc + item.valor_planejado, 0);
  const totalReceitasReais = receitas.reduce((acc, item) => acc + item.valor_gasto, 0);

  const saldoPlanejado = totalPlanejadoReceitas - totalPlanejadoDespesas;
  const saldoReal = totalReceitasReais - totalGastoDespesas;

  const chartData = [
    {
      name: 'Planejado',
      receitas: totalPlanejadoReceitas,
      despesas: totalPlanejadoDespesas,
      saldo: saldoPlanejado
    },
    {
      name: 'Real',
      receitas: totalReceitasReais,
      despesas: totalGastoDespesas,
      saldo: saldoReal
    }
  ];

  const pieData = despesas.map(item => ({
    name: item.categoria,
    value: item.valor_planejado,
    gasto: item.valor_gasto
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#CD6155'];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planejamento Financeiro</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Plus size={20} />
          Novo Item
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Mês</label>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          >
            {meses.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ano</label>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          >
            {[ano - 1, ano, ano + 1].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-green-600">
            <TrendingUp size={20} />
            Receitas Planejadas
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPlanejadoReceitas)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Real: {formatCurrency(totalReceitasReais)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-600">
            <DollarSign size={20} />
            Despesas Planejadas
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalPlanejadoDespesas)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Real: {formatCurrency(totalGastoDespesas)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
          <h3 className="text-lg font-semibold mb-2">Saldo Planejado</h3>
          <p className={`text-2xl font-bold ${saldoPlanejado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(saldoPlanejado)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Real: {formatCurrency(saldoReal)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
          <h3 className="text-lg font-semibold mb-2">Aderência</h3>
          <p className={`text-2xl font-bold ${
            totalPlanejadoDespesas > 0 && (totalGastoDespesas / totalPlanejadoDespesas) <= 1 ? 'text-green-600' : 'text-red-600'
          }`}>
            {totalPlanejadoDespesas > 0 ? ((totalGastoDespesas / totalPlanejadoDespesas) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Execução do planejado
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editId ? 'Editar Item' : 'Novo Item do Orçamento'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'receita' | 'despesa')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  required
                  disabled={editId !== null}
                >
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  required
                  disabled={editId !== null}
                >
                  <option value="">Selecione...</option>
                  {categorias[tipo].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Planejado
                </label>
                <input
                  type="number"
                  value={valorPlanejado}
                  onChange={(e) => setValorPlanejado(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
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
                className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
          <h3 className="text-xl font-bold mb-6">Planejado vs Real</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
                <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
                <Bar dataKey="saldo" fill="#3B82F6" name="Saldo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-medium border border-neutral-200/50">
          <h3 className="text-xl font-bold mb-6">Distribuição do Orçamento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-red-600">Despesas</h3>
          <div className="space-y-4">
            {despesas.map(item => {
              const percentual = item.valor_planejado > 0 ? (item.valor_gasto / item.valor_planejado) * 100 : 0;
              
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-medium border border-neutral-200/50 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{item.categoria}</h4>
                      <p className="text-sm text-neutral-500">
                        {formatCurrency(item.valor_gasto)} de {formatCurrency(item.valor_planejado)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-neutral-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-all duration-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className={`w-full rounded-full h-2 mb-2 ${getProgressBgColor(percentual, 'despesa')}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentual, 'despesa')}`}
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">
                      {percentual.toFixed(1)}% utilizado
                    </span>
                    {percentual >= 90 && (
                      <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                        <AlertTriangle size={16} />
                        {percentual >= 100 ? 'Orçamento excedido!' : 'Quase no limite!'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-green-600">Receitas</h3>
          <div className="space-y-4">
            {receitas.map(item => {
              const percentual = item.valor_planejado > 0 ? (item.valor_gasto / item.valor_planejado) * 100 : 0;
              
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-medium border border-neutral-200/50 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{item.categoria}</h4>
                      <p className="text-sm text-neutral-500">
                        {formatCurrency(item.valor_gasto)} de {formatCurrency(item.valor_planejado)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-neutral-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-all duration-200"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className={`w-full rounded-full h-2 mb-2 ${getProgressBgColor(percentual, 'receita')}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentual, 'receita')}`}
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">
                      {percentual.toFixed(1)}% alcançado
                    </span>
                    {percentual >= 100 && (
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <Target size={16} />
                        Meta alcançada!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orcamento;