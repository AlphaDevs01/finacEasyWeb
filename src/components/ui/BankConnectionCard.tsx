import React, { useState } from 'react';
import { Building2, Unlink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface BankConnection {
  id: string;
  bankName: string;
  bankLogo: string;
  status: 'connected' | 'error' | 'pending';
  lastSync: string | null;
  accountsCount: number;
  cardsCount: number;
}

interface BankConnectionCardProps {
  connection: BankConnection;
  onDisconnect: (bankId: string) => void;
  onReconnect: (bankId: string) => void;
  onSync: (bankId: string) => void;
}

const BankConnectionCard: React.FC<BankConnectionCardProps> = ({
  connection,
  onDisconnect,
  onReconnect,
  onSync
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (connection.status) {
      case 'connected': return 'border-green-300 bg-green-50';
      case 'error': return 'border-red-300 bg-red-50';
      case 'pending': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'connected': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      case 'pending': return <RefreshCw className="text-yellow-500 animate-spin" size={20} />;
      default: return <Building2 className="text-gray-500" size={20} />;
    }
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Nunca sincronizado';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className={`p-6 rounded-2xl border-2 transition-all duration-200 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{connection.bankLogo}</div>
          <div>
            <h3 className="font-semibold text-neutral-800">{connection.bankName}</h3>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              {getStatusIcon()}
              <span>
                {connection.status === 'connected' ? 'Conectado' : 
                 connection.status === 'error' ? 'Erro de conexão' : 'Conectando...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-neutral-500">Contas</div>
          <div className="font-semibold text-neutral-800">{connection.accountsCount}</div>
        </div>
        <div>
          <div className="text-neutral-500">Cartões</div>
          <div className="font-semibold text-neutral-800">{connection.cardsCount}</div>
        </div>
      </div>

      <div className="text-xs text-neutral-500 mb-4">
        Última sincronização: {formatLastSync(connection.lastSync)}
      </div>

      <div className="flex gap-2">
        {connection.status === 'connected' && (
          <button
            onClick={() => handleAction(() => onSync(connection.id))}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-70"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        )}
        
        {connection.status === 'error' && (
          <button
            onClick={() => handleAction(() => onReconnect(connection.id))}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors text-sm disabled:opacity-70"
          >
            <RefreshCw size={16} />
            Reconectar
          </button>
        )}
        
        <button
          onClick={() => handleAction(() => onDisconnect(connection.id))}
          disabled={isLoading}
          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm disabled:opacity-70"
        >
          <Unlink size={16} />
        </button>
      </div>
    </div>
  );
};

export default BankConnectionCard;