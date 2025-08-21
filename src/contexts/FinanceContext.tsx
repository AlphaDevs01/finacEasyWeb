import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';
import { CreditCard, DollarSign, CheckCircle } from 'lucide-react';

interface DashboardData {
  mes: number;
  ano: number;
  receitas: number;
  despesas: number;
  faturas_pendentes: number;
  saldo: number;
  categorias_despesas: { categoria: string; total: number }[];
  categorias_receitas: { categoria: string; total: number }[];
  despesas_diarias: { dia: number; total: number }[];
  receitas_diarias: { dia: number; total: number }[];
}

interface HistoricoData {
  ano: number;
  receitas_mensais: number[];
  despesas_mensais: number[];
  saldo_mensal: number[];
}

interface Cartao {
  id: number;
  nome: string;
  numero: string;
  limite: number;
  data_fechamento: number;
  data_vencimento: number;
}

interface Fatura {
  id: number;
  cartaoId: number;
  mes_referencia: number;
  ano_referencia: number;
  valor_total: number;
  status: string;
  cartao_nome?: string;
}

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
}

interface Despesa extends Transacao {
  tipo: string;
  cartaoId?: number;
  faturaId?: number;
  status: string;
  data_vencimento?: string;
  observacoes?: string;
}

interface Receita extends Transacao {
  status: string;
  data_vencimento?: string;
  observacoes?: string;
}

interface Investimento {
  id: number;
  tipo: string;
  nome: string;
  valor_aplicado: number;
  rendimento_mensal: number;
}

interface Configuracao {
  id: number;
  notificacoes_email: boolean;
  tema: string;
}

interface FinanceContextData {
  dashboard: DashboardData | null;
  historico: HistoricoData | null;
  cartoes: Cartao[];
  faturas: Fatura[];
  despesas: Despesa[];
  receitas: Receita[];
  investimentos: Investimento[];
  configuracoes: Configuracao | null;
  loadDashboard: (mes?: number, ano?: number) => Promise<void>;
  loadHistorico: (ano?: number) => Promise<void>;
  loadCartoes: () => Promise<void>;
  loadFaturas: (cartaoId?: number) => Promise<void>;
  loadDespesas: (filters?: { mes?: number; ano?: number; categoria?: string }) => Promise<void>;
  loadReceitas: (filters?: { mes?: number; ano?: number; categoria?: string }) => Promise<void>;
  loadInvestimentos: (tipo?: string) => Promise<void>;
  loadConfiguracoes: () => Promise<void>;
  salvarCartao: (cartao: Partial<Cartao>) => Promise<void>;
  excluirCartao: (id: number) => Promise<void>;
  salvarFatura: (fatura: Partial<Fatura>) => Promise<void>;
  atualizarStatusFatura: (id: number, status: string) => Promise<void>;
  salvarDespesa: (despesa: Partial<Despesa>) => Promise<void>;
  excluirDespesa: (id: number) => Promise<void>;
  salvarReceita: (receita: Partial<Receita>) => Promise<void>;
  excluirReceita: (id: number) => Promise<void>;
  salvarInvestimento: (investimento: Partial<Investimento>) => Promise<void>;
  excluirInvestimento: (id: number) => Promise<void>;
  salvarConfiguracoes: (configuracoes: Partial<Configuracao>) => Promise<void>;
  importarCSV: (tipo: 'despesas' | 'receitas', data: any[]) => Promise<any>;
  atualizarStatusTransacao: (tipo: 'despesa' | 'receita', id: number, status: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [historico, setHistorico] = useState<HistoricoData | null>(null);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracao | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
      loadCartoes();
      loadConfiguracoes();
    }
  }, [isAuthenticated]);

  const loadDashboard = async (mes?: number, ano?: number): Promise<void> => {
    try {
      let url = '/dashboard';
      const params = [];
      
      if (mes) params.push(`mes=${mes}`);
      if (ano) params.push(`ano=${ano}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const loadHistorico = async (ano?: number): Promise<void> => {
    try {
      let url = '/dashboard/historico';
      
      if (ano) {
        url += `?ano=${ano}`;
      }
      
      const response = await api.get(url);
      setHistorico(response.data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadCartoes = async (): Promise<void> => {
    try {
      const response = await api.get('/cartoes');
      setCartoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    }
  };

  const loadFaturas = async (cartaoId?: number): Promise<void> => {
    try {
      let url = '/faturas';
      
      if (cartaoId) {
        url = `faturas/cartao/${cartaoId}`;
      }
      
      const response = await api.get(url);
      setFaturas(response.data);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
    }
  };

  const loadDespesas = async (filters?: { mes?: number; ano?: number; categoria?: string }): Promise<void> => {
    try {
      let url = '/despesas';
      const params = [];
      
      if (filters?.mes) params.push(`mes=${filters.mes}`);
      if (filters?.ano) params.push(`ano=${filters.ano}`);
      if (filters?.categoria) params.push(`categoria=${filters.categoria}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      setDespesas(response.data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    }
  };

  const loadReceitas = async (filters?: { mes?: number; ano?: number; categoria?: string }): Promise<void> => {
    try {
      let url = '/receitas';
      const params = [];
      
      if (filters?.mes) params.push(`mes=${filters.mes}`);
      if (filters?.ano) params.push(`ano=${filters.ano}`);
      if (filters?.categoria) params.push(`categoria=${filters.categoria}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      setReceitas(response.data);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    }
  };

  const loadInvestimentos = async (tipo?: string): Promise<void> => {
    try {
      let url = '/investimentos';
      
      if (tipo) {
        url += `?tipo=${tipo}`;
      }
      
      const response = await api.get(url);
      setInvestimentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error);
    }
  };

  const loadConfiguracoes = async (): Promise<void> => {
    try {
      const response = await api.get('/configuracoes');
      setConfiguracoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const salvarCartao = async (cartao: Partial<Cartao>): Promise<void> => {
    try {
      if (cartao.id) {
        await api.put(`/cartoes/${cartao.id}`, cartao);
        showToast({
          type: 'success',
          title: 'Cartão atualizado!',
          message: 'As informações do cartão foram atualizadas com sucesso',
          icon: <CreditCard className="h-5 w-5 text-primary-500" />
        });
      } else {
        await api.post('/cartoes', cartao);
        showToast({
          type: 'success',
          title: 'Cartão adicionado!',
          message: `Cartão ${cartao.nome} foi adicionado com sucesso`,
          icon: <CreditCard className="h-5 w-5 text-primary-500" />
        });
      }
      
      loadCartoes();
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      throw error;
    }
  };

  const excluirCartao = async (id: number): Promise<void> => {
    try {
      await api.delete(`/cartoes/${id}`);
      showToast({
        type: 'success',
        title: 'Cartão removido!',
        message: 'O cartão foi removido com sucesso',
        icon: <CreditCard className="h-5 w-5 text-primary-500" />
      });
      loadCartoes();
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      throw error;
    }
  };

  const salvarFatura = async (fatura: Partial<Fatura>): Promise<void> => {
    try {
      if (fatura.id) {
        await api.put(`/faturas/${fatura.id}`, fatura);
      } else {
        await api.post('/faturas', fatura);
      }
      
      loadFaturas();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      throw error;
    }
  };

  const atualizarStatusFatura = async (id: number, status: string): Promise<void> => {
    try {
      await api.put(`/faturas/${id}`, { status });
      if (status === 'paga') {
        showToast({
          type: 'success',
          title: 'Fatura paga!',
          message: 'A fatura foi marcada como paga com sucesso',
          icon: <CheckCircle className="h-5 w-5 text-primary-500" />,
          duration: 4000
        });
      }
      loadFaturas();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao atualizar status da fatura:', error);
      throw error;
    }
  };

  const salvarDespesa = async (despesa: Partial<Despesa>): Promise<void> => {
    try {
      if (despesa.id) {
        await api.put(`/despesas/${despesa.id}`, despesa);
        showToast({
          type: 'success',
          title: 'Despesa atualizada!',
          message: 'A despesa foi atualizada com sucesso',
          icon: <DollarSign className="h-5 w-5 text-accent-500" />
        });
      } else {
        await api.post('/despesas', despesa);
        showToast({
          type: 'success',
          title: 'Despesa adicionada!',
          message: `Despesa de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor || 0)} foi registrada`,
          icon: <DollarSign className="h-5 w-5 text-accent-500" />
        });
      }
      
      loadDespesas();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      throw error;
    }
  };

  const excluirDespesa = async (id: number): Promise<void> => {
    try {
      await api.delete(`/despesas/${id}`);
      loadDespesas();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      throw error;
    }
  };

  const salvarReceita = async (receita: Partial<Receita>): Promise<void> => {
    try {
      if (receita.id) {
        await api.put(`/receitas/${receita.id}`, receita);
        showToast({
          type: 'success',
          title: 'Receita atualizada!',
          message: 'A receita foi atualizada com sucesso',
          icon: <DollarSign className="h-5 w-5 text-primary-500" />
        });
      } else {
        await api.post('/receitas', receita);
        showToast({
          type: 'success',
          title: 'Receita adicionada!',
          message: `Receita de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receita.valor || 0)} foi registrada`,
          icon: <DollarSign className="h-5 w-5 text-primary-500" />
        });
      }
      
      loadReceitas();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      throw error;
    }
  };

  const excluirReceita = async (id: number): Promise<void> => {
    try {
      await api.delete(`/receitas/${id}`);
      loadReceitas();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      throw error;
    }
  };

  const salvarInvestimento = async (investimento: Partial<Investimento>): Promise<void> => {
    try {
      if (investimento.id) {
        await api.put(`/investimentos/${investimento.id}`, investimento);
      } else {
        await api.post('/investimentos', investimento);
      }
      
      loadInvestimentos();
    } catch (error) {
      console.error('Erro ao salvar investimento:', error);
      throw error;
    }
  };

  const excluirInvestimento = async (id: number): Promise<void> => {
    try {
      await api.delete(`/investimentos/${id}`);
      loadInvestimentos();
    } catch (error) {
      console.error('Erro ao excluir investimento:', error);
      throw error;
    }
  };

  const salvarConfiguracoes = async (config: Partial<Configuracao>): Promise<void> => {
    try {
      await api.put('/configuracoes', config);
      loadConfiguracoes();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  };

  const importarCSV = async (tipo: 'despesas' | 'receitas', data: any[]): Promise<any> => {
    try {
      const response = await api.post(`/import/${tipo}`, { data });
      
      if (tipo === 'despesas') {
        loadDespesas();
      } else {
        loadReceitas();
      }
      
      loadDashboard();
      return response.data;
    } catch (error) {
      console.error(`Erro ao importar ${tipo}:`, error);
      throw error;
    }
  };

  const atualizarStatusTransacao = async (tipo: 'despesa' | 'receita', id: number, status: string): Promise<void> => {
    try {
      const endpoint = tipo === 'despesa' ? 'despesas' : 'receitas';
      await api.patch(`/${endpoint}/${id}/status`, { status });
      
      if (tipo === 'despesa') {
        loadDespesas();
      } else {
        loadReceitas();
      }
      
      loadDashboard();
    } catch (error) {
      console.error(`Erro ao atualizar status da ${tipo}:`, error);
      throw error;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        dashboard,
        historico,
        cartoes,
        faturas,
        despesas,
        receitas,
        investimentos,
        configuracoes,
        loadDashboard,
        loadHistorico,
        loadCartoes,
        loadFaturas,
        loadDespesas,
        loadReceitas,
        loadInvestimentos,
        loadConfiguracoes,
        salvarCartao,
        excluirCartao,
        salvarFatura,
        atualizarStatusFatura,
        salvarDespesa,
        excluirDespesa,
        salvarReceita,
        excluirReceita,
        salvarInvestimento,
        excluirInvestimento,
        salvarConfiguracoes,
        importarCSV,
        atualizarStatusTransacao
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance(): FinanceContextData {
  const context = useContext(FinanceContext);
  
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  
  return context;
}