import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  FolderSync as Sync, 
  Settings, 
  AlertCircle, 
  GitMerge, 
  CheckCircle,
  ExternalLink,
  Shield
} from 'lucide-react';

import OpenFinanceConnect from '../components/ui/OpenFinanceConnect';
import AutoSyncStatus from '../components/ui/AutoSyncStatus';
import TransactionMatcher from '../components/ui/TransactionMatcher';
import { usePluggy } from '../hooks/usePluggy';
import { useToast } from '../components/ui/Toast';

const OpenFinancePage: React.FC = () => {
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [autoSync, setAutoSync] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [showMatcher, setShowMatcher] = useState(false);
  const { showToast } = useToast();
  const { connections, isLoading } = usePluggy();

  useEffect(() => {
    loadSyncHistory();
    loadSyncSettings();
  }, []);

  const loadSyncHistory = async () => {
    try {
      const response = await api.get('/openfinance/sync-history');
      setSyncHistory(response.data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadSyncSettings = async () => {
    try {
      // Carregar configurações de sincronização
      setAutoSync(true);
      setSyncFrequency('daily');
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSyncSettingsUpdate = async () => {
    setLoading(true);
    try {
      // Salvar configurações de sincronização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast({
        type: 'success',
        title: 'Configurações salvas!',
        message: 'As configurações de sincronização foram atualizadas'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Não foi possível salvar as configurações'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sucesso': return 'bg-green-100 text-green-700';
      case 'erro': return 'bg-red-100 text-red-700';
      case 'parcial': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso': return <CheckCircle size={16} />;
      case 'erro': return <AlertCircle size={16} />;
      case 'parcial': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">
            Open Finance com Pluggy
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Conecte suas contas bancárias reais via Pluggy para sincronização automática
          </p>
        </div>
        <a
          href="https://pluggy.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all duration-200 text-sm"
        >
          <ExternalLink size={16} />
          Sobre o Pluggy
        </a>
      </div>

      {/* Status das Conexões */}
      {connections.length > 0 && (
        <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50">
          <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Shield size={24} />
            Status das Conexões
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map(connection => (
              <div
                key={connection.id}
                className={`p-4 rounded-xl border-2 ${
                  connection.status === 'UPDATED' ? 'border-green-300 bg-green-50' :
                  connection.status === 'LOGIN_ERROR' ? 'border-red-300 bg-red-50' :
                  'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">🏦</div>
                  <div className="font-medium text-neutral-800">
                    {connection.bankName || `Banco ${connection.connectorId}`}
                  </div>
                </div>
                <div className={`text-sm ${
                  connection.status === 'UPDATED' ? 'text-green-700' :
                  connection.status === 'LOGIN_ERROR' ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                  {connection.status === 'UPDATED' ? '✅ Conectado e atualizado' :
                   connection.status === 'LOGIN_ERROR' ? '❌ Erro de login' :
                   connection.status === 'UPDATING' ? '🔄 Atualizando...' :
                   connection.status}
                </div>
                {connection.lastSync && (
                  <div className="text-xs text-neutral-500 mt-1">
                    Última sync: {new Date(connection.lastSync).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Componente de Conexão */}
      <OpenFinanceConnect />

      {/* Status de Sincronização Automática */}
      <AutoSyncStatus />

      {/* Correspondência de Transações */}
      <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
              Correspondência de Transações
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Vincule transações importadas com registros existentes
            </p>
          </div>
          <button
            onClick={() => setShowMatcher(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium"
          >
            <GitMerge size={20} />
            Verificar Correspondências
          </button>
        </div>
      </div>

      {/* Configurações de Sincronização */}
      <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50">
        <h2 className="text-xl font-bold mb-6 text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Settings size={24} />
          Configurações de Sincronização
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                Sincronização Automática
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Sincronizar dados automaticamente em intervalos regulares
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {autoSync && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Frequência de Sincronização
              </label>
              <select
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              >
                <option value="hourly">A cada hora</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
              </select>
            </div>
          )}

          <button
            onClick={handleSyncSettingsUpdate}
            disabled={loading}
            className={`px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      {/* Histórico de Sincronização */}
      <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50">
        <h2 className="text-xl font-bold mb-6 text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <TrendingUp size={24} />
          Histórico de Sincronização
        </h2>

        {syncHistory.length > 0 ? (
          <div className="space-y-4">
            {syncHistory.map(sync => (
              <div
                key={sync.id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-600 rounded-xl border border-neutral-200 dark:border-neutral-500"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sync.status)}`}>
                    {getStatusIcon(sync.status)}
                    {sync.status === 'sucesso' ? 'Sucesso' : sync.status === 'erro' ? 'Erro' : 'Parcial'}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-100">
                      {formatDateTime(sync.data_sync)}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {sync.contas_sincronizadas} contas • {sync.transacoes_sincronizadas} transações • {sync.cartoes_sincronizados} cartões
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            <Sync size={48} className="mx-auto mb-2 opacity-50" />
            <p>Nenhuma sincronização realizada ainda</p>
          </div>
        )}
      </div>

      {/* Modal de Correspondência */}
      <TransactionMatcher
        isOpen={showMatcher}
        onClose={() => setShowMatcher(false)}
        onTransactionsMatched={() => {
          setShowMatcher(false);
          // Recarregar dados se necessário
        }}
      />

      {/* Informações sobre Open Finance */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700">
        <h2 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-200">
          Open Finance com Pluggy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-700 dark:text-blue-300">
          <div>
            <h3 className="font-semibold mb-2">Benefícios</h3>
            <ul className="space-y-1">
              <li>• Sincronização automática de transações</li>
              <li>• Dados reais dos bancos</li>
              <li>• Categorização inteligente</li>
              <li>• Suporte a +300 instituições</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Segurança</h3>
            <ul className="space-y-1">
              <li>• Pluggy certificado pelo Banco Central</li>
              <li>• Criptografia de ponta a ponta</li>
              <li>• Acesso somente leitura</li>
              <li>• Conformidade com LGPD</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Dados Sincronizados</h3>
            <ul className="space-y-1">
              <li>• Contas correntes e poupança</li>
              <li>• Cartões de crédito</li>
              <li>• Investimentos</li>
              <li>• Histórico de transações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenFinancePage;