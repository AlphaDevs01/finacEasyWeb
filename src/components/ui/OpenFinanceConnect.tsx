import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  FolderSync as Sync,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import { usePluggy } from '../../hooks/usePluggy';
import { useToast } from './Toast';
import BankConnectionModal from './BankConnectionModal';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const isConnectorOffline = (connector: any) => {
  const status = String(connector?.status || connector?.health?.status || '').toUpperCase();
  return status === 'OFFLINE' || status === 'UNAVAILABLE' || connector?.isOffline === true;
};

const connectorMatchesPopularBank = (connectorName: string) => {
  const name = normalizeText(connectorName);
  return ['nubank', 'itau', 'itaú', 'bradesco', 'santander', 'banco do brasil', 'bb', 'caixa', 'inter', 'c6'].some((bank) =>
    name.includes(normalizeText(bank))
  );
};

const OpenFinanceConnect: React.FC = () => {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [bankSearch, setBankSearch] = useState('');
  const { showToast } = useToast();

  const {
    connectors,
    connections,
    isLoading,
    connectBank,
    disconnectBank,
    syncData,
  } = usePluggy();

  const connectedConnectorIds = useMemo(
    () =>
      new Set(
        connections
          .filter((conn) => ['UPDATED', 'UPDATING'].includes(conn.status))
          .map((conn) => Number(conn.connectorId))
      ),
    [connections]
  );

  const filteredConnectors = useMemo(() => {
    const query = normalizeText(bankSearch);

    return connectors
      .filter((connector) => {
        if (!query) return true;

        const searchable = [
          connector.name,
          connector.type,
          connector.country,
          ...(connector.products || []),
        ]
          .filter(Boolean)
          .join(' ');

        return normalizeText(searchable).includes(query);
      })
      .sort((a, b) => {
        const aOffline = isConnectorOffline(a) ? 1 : 0;
        const bOffline = isConnectorOffline(b) ? 1 : 0;
        if (aOffline !== bOffline) return aOffline - bOffline;
        return String(a.name).localeCompare(String(b.name), 'pt-BR');
      });
  }, [connectors, bankSearch]);

  const popularConnectors = useMemo(
    () => filteredConnectors.filter((connector) => connectorMatchesPopularBank(connector.name)).slice(0, 8),
    [filteredConnectors]
  );

  const handleBankSelect = (connector: any) => {
    if (isConnectorOffline(connector)) {
      showToast({
        type: 'warning',
        title: 'Banco indisponível',
        message: 'Este conector está temporariamente offline na Pluggy. Tente outro banco ou tente novamente mais tarde.',
        duration: 7000,
      });
      return;
    }

    setSelectedConnector(connector);
    setShowConnectionModal(true);
  };

  const handleConnection = async (credentials: Record<string, string>) => {
    if (!selectedConnector) return;

    try {
      await connectBank(selectedConnector.id, credentials);
      setShowConnectionModal(false);
      setSelectedConnector(null);
    } catch (error) {
      // O hook/modal exibem o erro detalhado.
    }
  };

  const handleSync = async (itemId: string) => {
    try {
      const results = await syncData(itemId);
      setSyncResults(results);
    } catch (error) {
      // O hook exibe o erro.
    }
  };

  const handleDisconnect = async (itemId: string) => {
    if (!window.confirm('Tem certeza que deseja desconectar este banco?')) return;

    try {
      await disconnectBank(itemId);
    } catch (error) {
      // O hook exibe o erro.
    }
  };

  const renderConnectorButton = (connector: any) => {
    const isConnected = connectedConnectorIds.has(Number(connector.id));
    const offline = isConnectorOffline(connector);
    const disabled = isConnected || offline;

    return (
      <button
        key={connector.id}
        type="button"
        onClick={() => handleBankSelect(connector)}
        disabled={disabled}
        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
          isConnected
            ? 'border-green-300 bg-green-50 text-green-700 cursor-not-allowed'
            : offline
              ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-75'
              : 'border-neutral-300 hover:border-primary-300 hover:bg-primary-50 text-neutral-700'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <img
            src={connector.imageUrl || '/bank-fallback.svg'}
            alt={connector.name}
            className="w-7 h-7 rounded object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/bank-fallback.svg';
            }}
          />
          {offline && <XCircle className="h-4 w-4 text-neutral-400" />}
        </div>

        <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{connector.name}</div>

        <div className="mt-2 flex flex-wrap gap-1">
          {isConnected && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Conectado
            </span>
          )}
          {offline && <span className="text-xs text-neutral-500">Indisponível</span>}
        </div>
      </button>
    );
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

      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Bancos Disponíveis</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Pesquise pelo nome do banco e selecione o conector correto.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={bankSearch}
              onChange={(event) => setBankSearch(event.target.value)}
              placeholder="Pesquisar banco..."
              className="w-full rounded-xl border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-neutral-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="p-4 rounded-xl border-2 border-neutral-200 animate-pulse">
                <div className="w-8 h-8 bg-neutral-200 rounded-full mb-2 mx-auto" />
                <div className="h-4 bg-neutral-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredConnectors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-600 dark:text-neutral-400">
            Nenhum banco encontrado para “{bankSearch}”.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredConnectors.map(renderConnectorButton)}
          </div>
        )}
      </div>

      {connections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">Conexões Ativas</h3>
          <div className="space-y-3">
            {connections.map((connection) => {
              const connector = connectors.find((c) => c.id === connection.connectorId);
              const statusColor = connection.status === 'UPDATED' ? 'green' : connection.status === 'LOGIN_ERROR' ? 'red' : 'yellow';

              return (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-neutral-600 rounded-xl border border-neutral-200 dark:border-neutral-500"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={connector?.imageUrl || '/bank-fallback.svg'}
                      alt={connector?.name || 'Banco'}
                      className="w-8 h-8 rounded object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/bank-fallback.svg';
                      }}
                    />
                    <div>
                      <div className="font-medium text-neutral-800 dark:text-neutral-100">{connector?.name || 'Banco'}</div>
                      <div
                        className={`text-sm flex items-center gap-1 ${
                          statusColor === 'green' ? 'text-green-600' : statusColor === 'red' ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      >
                        {connection.status === 'UPDATED' && <CheckCircle size={16} />}
                        {connection.status === 'LOGIN_ERROR' && <AlertCircle size={16} />}
                        {connection.status === 'UPDATING' && <Loader2 size={16} className="animate-spin" />}
                        {connection.status === 'UPDATED'
                          ? 'Conectado'
                          : connection.status === 'LOGIN_ERROR'
                            ? 'Erro de login'
                            : connection.status === 'UPDATING'
                              ? 'Atualizando...'
                              : connection.status}
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

      {popularConnectors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">Bancos Populares</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{popularConnectors.map(renderConnectorButton)}</div>
        </div>
      )}

      {syncResults && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-semibold text-green-800 mb-2">Última Sincronização</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600 font-medium">Contas:</span>
              <div className="text-green-800">{syncResults.accountsSynced}</div>
            </div>
            <div>
              <span className="text-green-600 font-medium">Transações:</span>
              <div className="text-green-800">{syncResults.transactionsSynced}</div>
            </div>
            <div>
              <span className="text-green-600 font-medium">Cartões:</span>
              <div className="text-green-800">{syncResults.cardsSynced}</div>
            </div>
            <div>
              <span className="text-green-600 font-medium">Investimentos:</span>
              <div className="text-green-800">{syncResults.investmentsSynced}</div>
            </div>
          </div>
        </div>
      )}

      <BankConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        connector={selectedConnector}
        onConnect={handleConnection}
      />
    </div>
  );
};

export default OpenFinanceConnect;
