import React, { useState, useEffect } from 'react';
import { GitMerge, Check, X, AlertTriangle, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from './Toast';

interface PendingTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  source: 'bank' | 'card';
  confidence: number;
  suggestedMatch?: {
    id: number;
    description: string;
    amount: number;
    date: string;
  };
}

interface TransactionMatcherProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionsMatched: () => void;
}

const TransactionMatcher: React.FC<TransactionMatcherProps> = ({
  isOpen,
  onClose,
  onTransactionsMatched
}) => {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPendingTransactions();
    }
  }, [isOpen]);

  const loadPendingTransactions = async () => {
    setLoading(true);
    try {
      // Simular transações pendentes de matching
      const mockTransactions: PendingTransaction[] = [
        {
          id: '1',
          description: 'SUPERMERCADO EXTRA',
          amount: 89.50,
          date: '2024-01-15',
          category: 'Alimentação',
          source: 'bank',
          confidence: 0.95,
          suggestedMatch: {
            id: 123,
            description: 'Compras supermercado',
            amount: 89.50,
            date: '2024-01-15'
          }
        },
        {
          id: '2',
          description: 'POSTO SHELL',
          amount: 120.00,
          date: '2024-01-14',
          category: 'Transporte',
          source: 'card',
          confidence: 0.87
        }
      ];
      
      setPendingTransactions(mockTransactions);
    } catch (error) {
      console.error('Erro ao carregar transações pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (transactionId: string) => {
    try {
      // Aceitar correspondência sugerida
      await api.post(`/openfinance/match/${transactionId}/accept`);
      
      setPendingTransactions(prev => 
        prev.filter(t => t.id !== transactionId)
      );
      
      showToast({
        type: 'success',
        title: 'Transação vinculada!',
        message: 'A transação foi vinculada com sucesso'
      });
      
      onTransactionsMatched();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao vincular',
        message: 'Não foi possível vincular a transação'
      });
    }
  };

  const handleRejectMatch = async (transactionId: string) => {
    try {
      // Rejeitar correspondência e criar nova transação
      await api.post(`/openfinance/match/${transactionId}/reject`);
      
      setPendingTransactions(prev => 
        prev.filter(t => t.id !== transactionId)
      );
      
      showToast({
        type: 'success',
        title: 'Nova transação criada!',
        message: 'Uma nova transação foi criada no sistema'
      });
      
      onTransactionsMatched();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao processar',
        message: 'Não foi possível processar a transação'
      });
    }
  };

  const handleIgnore = async (transactionId: string) => {
    setPendingTransactions(prev => 
      prev.filter(t => t.id !== transactionId)
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <GitMerge size={24} />
            Correspondência de Transações
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-all duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : pendingTransactions.length > 0 ? (
            <div className="space-y-4">
              {pendingTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-neutral-800">
                          {transaction.description}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(transaction.confidence)}`}>
                          {Math.round(transaction.confidence * 100)}% confiança
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Valor:</span> {formatCurrency(transaction.amount)}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {formatDate(transaction.date)}
                        </div>
                        <div>
                          <span className="font-medium">Categoria:</span> {transaction.category}
                        </div>
                      </div>
                    </div>
                  </div>

                  {transaction.suggestedMatch && (
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 mb-4">
                      <h4 className="font-medium text-neutral-800 mb-2 flex items-center gap-2">
                        <GitMerge size={16} />
                        Correspondência Sugerida
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Descrição:</span> {transaction.suggestedMatch.description}
                        </div>
                        <div>
                          <span className="font-medium">Valor:</span> {formatCurrency(transaction.suggestedMatch.amount)}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {formatDate(transaction.suggestedMatch.date)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {transaction.suggestedMatch && (
                      <button
                        onClick={() => handleAcceptMatch(transaction.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <Check size={16} />
                        Vincular
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRejectMatch(transaction.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Eye size={16} />
                      Criar Nova
                    </button>
                    
                    <button
                      onClick={() => handleIgnore(transaction.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-xl hover:bg-neutral-700 transition-colors"
                    >
                      <X size={16} />
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <GitMerge size={48} className="mx-auto mb-2 opacity-50" />
              <p>Nenhuma transação pendente de correspondência</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionMatcher;