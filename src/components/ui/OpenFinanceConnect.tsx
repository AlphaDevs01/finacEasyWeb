import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, FolderSync as Sync, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePluggy } from '../../hooks/usePluggy';
import { useToast } from './Toast';
import BankConnectionModal from './BankConnectionModal';

const OpenFinanceConnect: React.FC = () => {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [syncResults, setSyncResults] = useState<any>(null);
  const { showToast } = useToast();
  
  const {
    connectors,
    connections,
    isLoading,
    connectBank,
    disconnectBank,
    syncData
  } = usePluggy();

  const handleBankSelect = (connector: any) => {
    setSelectedConnector(connector);
    setShowConnectionModal(true);
  };

  const handleConnection = async (credentials: Record<string, string>) => {
    if (!selectedConnector) return;

    try {
      const itemId = await connectBank(selectedConnector.id, credentials);
      setShowConnectionModal(false);
      setSelectedConnector(null);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleSync = async (itemId: string) => {
    try {
      const results = await syncData(itemId);
      setSyncResults(results);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleDisconnect = async (itemId: string) => {
    if (!window.confirm('Tem certeza que deseja desconectar este banco?')) {
      return;
    }

    try {
      await disconnectBank(itemId);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Open Finance</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Conecte suas contas bancárias e cartões para sincronização automática
          </p>
        </div>
      </div>

      {/* Conectores Disponíveis */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">
          Bancos Disponíveis
        </h3>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="p-4 rounded-xl border-2 border-neutral-200 animate-pulse">
                <div className="w-8 h-8 bg-neutral-200 rounded-full mb-2 mx-auto"></div>
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
            {connectors.map(connector => {
              const isConnected = connections.some(conn => 
                conn.connectorId === connector.id && 
                ['UPDATED', 'UPDATING'].includes(conn.status)
              );
              
              return (
                <button
                  key={connector.id}
                  onClick={() => handleBankSelect(connector)}
                  disabled={isConnected}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isConnected
                      ? 'border-green-300 bg-green-50 text-green-700 cursor-not-allowed'
                      : 'border-neutral-300 hover:border-primary-300 hover:bg-primary-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src={connector.imageUrl} 
                      alt={connector.name}
                      className="w-6 h-6 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-2xl">🏦</div>
                  </div>
                  <div className="text-sm font-medium truncate">{connector.name}</div>
                  {isConnected && (
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs">Conectado</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conexões Ativas */}
      {connections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">
            Conexões Ativas
          </h3>
          <div className="space-y-3">
            {connections.map(connection => {
              const connector = connectors.find(c => c.id === connection.connectorId);
              const statusColor = connection.status === 'UPDATED' ? 'green' : 
                                connection.status === 'LOGIN_ERROR' ? 'red' : 'yellow';
              
              return (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-neutral-600 rounded-xl border border-neutral-200 dark:border-neutral-500"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={connector?.imageUrl} 
                      alt={connector?.name}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="font-medium text-neutral-800 dark:text-neutral-100">
                        {connector?.name || 'Banco'}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${
                        statusColor === 'green' ? 'text-green-600' :
                        statusColor === 'red' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {connection.status === 'UPDATED' && <CheckCircle size={16} />}
                        {connection.status === 'LOGIN_ERROR' && <AlertCircle size={16} />}
                        {connection.status === 'UPDATING' && <Loader2 size={16} className="animate-spin" />}
                        {connection.status === 'UPDATED' ? 'Conectado' :
                         connection.status === 'LOGIN_ERROR' ? 'Erro de login' :
                         connection.status === 'UPDATING' ? 'Atualizando...' : connection.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {connection.status === 'UPDATED' && (
                      <button
                        onClick={() => handleSync(connection.itemId)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-70"
                      >
                        <Sync size={16} className={isLoading ? 'animate-spin' : ''} />
                        Sincronizar
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDisconnect(connection.itemId)}
                      disabled={isLoading}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm disabled:opacity-70"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bancos Populares (para facilitar acesso) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">
          Bancos Populares
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {connectors.filter(c => 
            ['nubank', 'itau', 'bradesco', 'santander', 'bb', 'caixa', 'inter', 'c6'].some(bank => 
              c.name.toLowerCase().includes(bank)
            )
          ).slice(0, 8).map(connector => {
            const isConnected = connections.some(conn => 
              conn.connectorId === connector.id && 
              ['UPDATED', 'UPDATING'].includes(conn.status)
            );
            
            return (
            <button
              key={connector.id}
              onClick={() => handleBankSelect(connector)}
              disabled={isConnected}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isConnected
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-neutral-300 hover:border-primary-300 hover:bg-primary-50 text-neutral-700'
              }`}
            >
              <img 
                src={connector.imageUrl} 
                alt={connector.name}
                className="w-8 h-8 rounded mx-auto mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="text-sm font-medium truncate">{connector.name}</div>
              {isConnected && (
                <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-2" />
              )}
            </button>
          )})}
        </div>
      </div>

      {/* Resultados da Sincronização */}
      {syncResults && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-down mb-6">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle size={20} />
            Sincronização Concluída
          </h4>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncResults.accountsSynced}</div>
              <div className="text-green-700">Contas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncResults.transactionsSynced}</div>
              <div className="text-green-700">Transações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncResults.cardsSynced}</div>
              <div className="text-green-700">Cartões</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncResults.investmentsSynced}</div>
              <div className="text-green-700">Investimentos</div>
            </div>
          </div>
        </div>
      )}

      {/* Informações de Segurança */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle size={20} />
          Segurança e Privacidade
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Conexão criptografada via Pluggy (certificado pelo Banco Central)</li>
          <li>• Dados processados conforme LGPD</li>
          <li>• Acesso somente leitura às suas informações bancárias</li>
          <li>• Credenciais não são armazenadas em nossos servidores</li>
          <li>• Você pode revogar o acesso a qualquer momento</li>
        </ul>
      </div>

      {/* Modal de Conexão */}
      <BankConnectionModal
        isOpen={showConnectionModal}
        onClose={() => {
          setShowConnectionModal(false);
          setSelectedConnector(null);
        }}
        connector={selectedConnector}
        onConnect={handleConnection}
      />
    </div>
  );
};

export default OpenFinanceConnect;