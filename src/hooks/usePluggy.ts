import { useState, useEffect } from 'react';
import PluggyService, { PluggyConnector } from '../services/pluggy';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

interface PluggyConnection {
  id: string;
  itemId: string;
  connectorId: number;
  bankName: string;
  status: 'CREATED' | 'LOGIN_IN_PROGRESS' | 'WAITING_USER_INPUT' | 'UPDATING' | 'UPDATED' | 'LOGIN_ERROR' | 'OUTDATED';
  lastSync: string | null;
  createdAt: string;
}

interface UsePluggyReturn {
  connectors: PluggyConnector[];
  connections: PluggyConnection[];
  isLoading: boolean;
  connectBank: (connectorId: number, credentials: Record<string, string>) => Promise<string>;
  disconnectBank: (itemId: string) => Promise<void>;
  syncData: (itemId: string) => Promise<any>;
  getItemStatus: (itemId: string) => Promise<any>;
  refreshConnections: () => Promise<void>;
}

export const usePluggy = (): UsePluggyReturn => {
  const [connectors, setConnectors] = useState<PluggyConnector[]>([]);
  const [connections, setConnections] = useState<PluggyConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const pluggyService = new PluggyService();

  useEffect(() => {
    loadConnectors();
    loadConnections();
  }, []);

  const loadConnectors = async () => {
    try {
      setIsLoading(true);
      const connectorsData = await pluggyService.getConnectors();
      setConnectors(connectorsData);
    } catch (error) {
      console.error('Erro ao carregar conectores:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar bancos',
        message: 'Não foi possível carregar a lista de bancos disponíveis'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const response = await api.get('/openfinance/connections');
      setConnections(response.data);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    }
  };

  const connectBank = async (connectorId: number, credentials: Record<string, string>): Promise<string> => {
    try {
      setIsLoading(true);
      
      // Criar item no Pluggy
      const itemId = await pluggyService.createItem(connectorId, credentials);
      
      // Salvar conexão no banco local
      await api.post('/openfinance/connections', {
        itemId,
        connectorId,
        status: 'CREATED'
      });
      
      // Aguardar alguns segundos para o banco processar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar status
      const status = await pluggyService.getItemStatus(itemId);
      
      if (status.status === 'UPDATED') {
        showToast({
          type: 'success',
          title: 'Banco conectado!',
          message: 'Conexão estabelecida com sucesso. Iniciando sincronização...'
        });
        
        // Sincronizar dados automaticamente
        setTimeout(() => syncData(itemId), 2000);
      } else if (status.status === 'LOGIN_ERROR') {
        throw new Error('Credenciais inválidas. Verifique seus dados e tente novamente.');
      }
      
      await loadConnections();
      return itemId;
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro na conexão',
        message: error.message || 'Não foi possível conectar com o banco'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectBank = async (itemId: string): Promise<void> => {
    try {
      // Deletar item no Pluggy
      await pluggyService.deleteItem(itemId);
      
      // Remover conexão do banco local
      await api.delete(`/openfinance/connections/${itemId}`);
      
      await loadConnections();
      
      showToast({
        type: 'success',
        title: 'Banco desconectado!',
        message: 'A conexão foi removida com sucesso'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao desconectar',
        message: error.message || 'Não foi possível desconectar o banco'
      });
      throw error;
    }
  };

  const syncData = async (itemId: string): Promise<any> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      setIsLoading(true);
      
      // Verificar status do item primeiro
      const itemStatus = await pluggyService.getItemStatus(itemId);
      
      if (itemStatus.status !== 'UPDATED') {
        throw new Error('Banco não está pronto para sincronização. Tente novamente em alguns minutos.');
      }
      
      // Sincronizar dados
      const results = await pluggyService.syncWithLocalSystem(itemId, user.id);
      
      // Atualizar última sincronização no banco
      await api.put(`/openfinance/connections/${itemId}`, {
        lastSync: new Date().toISOString()
      });
      
      await loadConnections();
      
      showToast({
        type: 'success',
        title: 'Sincronização concluída!',
        message: `${results.transactionsSynced} transações sincronizadas`,
        duration: 6000
      });
      
      return results;
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro na sincronização',
        message: error.message || 'Não foi possível sincronizar os dados'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getItemStatus = async (itemId: string): Promise<any> => {
    try {
      return await pluggyService.getItemStatus(itemId);
    } catch (error) {
      console.error('Erro ao obter status:', error);
      throw error;
    }
  };

  const refreshConnections = async (): Promise<void> => {
    await loadConnections();
  };

  return {
    connectors,
    connections,
    isLoading,
    connectBank,
    disconnectBank,
    syncData,
    getItemStatus,
    refreshConnections
  };
};