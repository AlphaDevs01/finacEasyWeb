import React, { useState, useEffect } from 'react';
import { FolderSync as Sync, CheckCircle, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { api } from '../../services/api';

interface SyncStatus {
  isEnabled: boolean;
  lastSync: string | null;
  nextSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  frequency: string;
}

const AutoSyncStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isEnabled: false,
    lastSync: null,
    nextSync: null,
    status: 'idle',
    frequency: 'daily'
  });

  useEffect(() => {
    loadSyncStatus();
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const response = await api.get('/openfinance/settings');
      const settings = response.data;
      
      setSyncStatus({
        isEnabled: settings.auto_sync,
        lastSync: settings.last_sync,
        nextSync: calculateNextSync(settings.last_sync, settings.sync_frequency),
        status: 'idle',
        frequency: settings.sync_frequency
      });
    } catch (error) {
      console.error('Erro ao carregar status de sincronização:', error);
    }
  };

  const calculateNextSync = (lastSync: string | null, frequency: string): string | null => {
    if (!lastSync) return null;
    
    const last = new Date(lastSync);
    const next = new Date(last);
    
    switch (frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
    }
    
    return next.toISOString();
  };

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays} dias atrás`;
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <Sync className="animate-spin text-blue-500" size={16} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return syncStatus.isEnabled ? 
          <Wifi className="text-green-500" size={16} /> : 
          <WifiOff className="text-gray-400" size={16} />;
    }
  };

  const getStatusText = () => {
    if (!syncStatus.isEnabled) return 'Sincronização desabilitada';
    
    switch (syncStatus.status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronizado';
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Aguardando';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-700 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {getStatusText()}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {syncStatus.lastSync ? (
                `Última sincronização: ${formatRelativeTime(syncStatus.lastSync)}`
              ) : (
                'Nenhuma sincronização realizada'
              )}
            </div>
          </div>
        </div>
        
        {syncStatus.isEnabled && syncStatus.nextSync && (
          <div className="text-right">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Próxima em:</div>
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 flex items-center gap-1">
              <Clock size={12} />
              {formatRelativeTime(syncStatus.nextSync)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoSyncStatus;