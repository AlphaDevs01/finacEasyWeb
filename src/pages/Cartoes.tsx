import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { Plus, CreditCard, Trash2, Edit, AlertCircle } from 'lucide-react';

const Cartoes: React.FC = () => {
  const { cartoes, loadCartoes, salvarCartao, excluirCartao } = useFinance();
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [limite, setLimite] = useState('');
  const [dataFechamento, setDataFechamento] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadCartoes();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nome || !numero || !limite || !dataFechamento || !dataVencimento) {
      setError('Preencha todos os campos');
      return;
    }
    
    try {
      setLoading(true);
      await salvarCartao({
        nome,
        numero,
        limite: parseFloat(limite),
        data_fechamento: parseInt(dataFechamento),
        data_vencimento: parseInt(dataVencimento)
      });
      
      setShowForm(false);
      resetForm();
      loadCartoes();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao salvar cartão');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este cartão?')) {
      return;
    }
    
    try {
      await excluirCartao(id);
      loadCartoes();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao excluir cartão');
    }
  };
  
  const resetForm = () => {
    setNome('');
    setNumero('');
    setLimite('');
    setDataFechamento('');
    setDataVencimento('');
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cartões</h1>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Novo Cartão
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {nome ? 'Editar Cartão' : 'Novo Cartão'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cartão
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Nubank"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Últimos 4 dígitos
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0000"
                  maxLength={4}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite
                </label>
                <input
                  type="number"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia do Fechamento
                </label>
                <input
                  type="number"
                  value={dataFechamento}
                  onChange={(e) => setDataFechamento(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1-31"
                  min="1"
                  max="31"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia do Vencimento
                </label>
                <input
                  type="number"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1-31"
                  min="1"
                  max="31"
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cartoes.map(cartao => (
          <div
            key={cartao.id}
            className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50"
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDelete(cartao.id)}
                className="p-1 hover:bg-red-500 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div 
              className="cursor-pointer"
              onClick={() => navigate(`/cartoes/${cartao.id}`)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{cartao.nome}</span>
                <CreditCard size={20} />
              </div>
              
              <div className="text-sm opacity-80">
                **** **** **** {cartao.numero}
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs opacity-80">Limite</p>
                  <p className="font-semibold">{formatCurrency(cartao.limite)}</p>
                </div>
                
                <div>
                  <p className="text-xs opacity-80">Fechamento</p>
                  <p className="font-semibold">Dia {cartao.data_fechamento}</p>
                </div>
                
                <div>
                  <p className="text-xs opacity-80">Vencimento</p>
                  <p className="font-semibold">Dia {cartao.data_vencimento}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {cartoes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CreditCard size={48} className="mx-auto mb-2 opacity-50" />
          <p>Você ainda não tem cartões cadastrados</p>
        </div>
      )}
    </div>
  );
};

export default Cartoes;
