import { useState, useEffect } from 'react';
import { api } from '../services/api';
import OpenFinanceService from '../services/openFinance';
import { useToast } from '../components/ui/Toast';

interface OpenFinanceHook {
  isConnected: boolean;
  connectedBanks: string[];
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: Date | null;
  connectBank: (bankId: string) => Promise<void>;
  disconnectBank: (bankId: string) => Promise<void>;
  syncData: () => Promise<void>;
  autoSyncEnabled: boolean;
  toggleAutoSync: (enabled: boolean) => Promise<void>;
}

export const useOpenFinance = (): OpenFinanceHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedBanks, setConnectedBanks] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadConnectionStatus();
    loadSyncSettings();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const response = await api.get('/openfinance/connections');
      const connections = response.data;
      
      setConnectedBanks(connections.map((c: any) => c.bank_id));
      setIsConnected(connections.length > 0);
    } catch (error) {
      console.error('Erro ao carregar status de conexão:', error);
    }
  };

  const loadSyncSettings = async () => {
    try {
      const response = await api.get('/openfinance/settings');
      const settings = response.data;
      
      setAutoSyncEnabled(settings.auto_sync);
      if (settings.last_sync) {
        setLastSync(new Date(settings.last_sync));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const connectBank = async (bankId: string): Promise<void> => {
    try {
      const response = await api.post(`/openfinance/connect/${bankId}`);
      
      // Em produção, redirecionaria para OAuth do banco
      // Por enquanto, simular conexão bem-sucedida
      setConnectedBanks(prev => [...prev, bankId]);
      setIsConnected(true);
      
      showToast({
        type: 'success',
        title: 'Banco conectado!',
        message: 'Conexão estabelecida com sucesso'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro na conexão',
        message: error.response?.data?.error || 'Não foi possível conectar com o banco'
      });
      throw error;
    }
  };

  const disconnectBank = async (bankId: string): Promise<void> => {
    try {
      await api.delete(`/openfinance/disconnect/${bankId}`);
      
      setConnectedBanks(prev => prev.filter(id => id !== bankId));
      if (connectedBanks.length === 1) {
        setIsConnected(false);
      }
      
      showToast({
        type: 'success',
        title: 'Banco desconectado!',
        message: 'A conexão foi removida com sucesso'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao desconectar',
        message: error.response?.data?.error || 'Não foi possível desconectar o banco'
      });
      throw error;
    }
  };

  const syncData = async (): Promise<void> => {
    if (!isConnected) {
      throw new Error('Nenhum banco conectado');
    }

    try {
      setSyncStatus('syncing');
      
      const response = await api.post('/openfinance/sync');
      const results = response.data;
      
      setSyncStatus('success');
      setLastSync(new Date());
      
      showToast({
        type: 'success',
        title: 'Sincronização concluída!',
        message: `${results.transactionsSynced} transações sincronizadas`,
        duration: 6000
      });
    } catch (error: any) {
      setSyncStatus('error');
      showToast({
        type: 'error',
        title: 'Erro na sincronização',
        message: error.response?.data?.error || 'Não foi possível sincronizar os dados'
      });
      throw error;
    }
  };

  const toggleAutoSync = async (enabled: boolean): Promise<void> => {
    try {
      await api.put('/openfinance/settings', {
        auto_sync: enabled,
        sync_frequency: 'daily'
      });
      
      setAutoSyncEnabled(enabled);
      
      showToast({
        type: 'success',
        title: enabled ? 'Sincronização automática ativada!' : 'Sincronização automática desativada!',
        message: enabled ? 'Seus dados serão sincronizados automaticamente' : 'A sincronização automática foi desabilitada'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar configuração',
        message: error.response?.data?.error || 'Não foi possível atualizar a configuração'
      });
      throw error;
    }
  };

  return {
    isConnected,
    connectedBanks,
    syncStatus,
    lastSync,
    connectBank,
    disconnectBank,
    syncData,
    autoSyncEnabled,
    toggleAutoSync
  };
};