import axios from 'axios';

export interface PluggyAccount {
  id: string;
  name: string;
  number: string;
  balance: number;
  type: string;
  subtype: string;
  currencyCode: string;
}

export interface PluggyTransaction {
  id: string;
  accountId: string;
  description: string;
  descriptionRaw: string;
  amount: number;
  date: string;
  category: string;
  categoryId: string;
  type: 'DEBIT' | 'CREDIT';
}

export interface PluggyCreditCard {
  id: string;
  name: string;
  number: string;
  brand: string;
  type: string;
  closeDay: number;
  dueDay: number;
  creditLimit: number;
  availableCreditLimit: number;
  currencyCode: string;
}

export interface PluggyInvestment {
  id: string;
  name: string;
  number: string;
  balance: number;
  type: string;
  currencyCode: string;
  rate?: number;
  taxes?: number;
}

export interface PluggyConnector {
  id: number;
  name: string;
  institutionUrl: string;
  imageUrl: string;
  primaryColor: string;
  type: string;
  country: string;
  credentials: Array<{
    label: string;
    name: string;
    type: string;
    placeholder?: string;
    validation?: string;
  }>;
  products: string[];
}

class PluggyService {
  private baseURL = 'https://api.pluggy.ai';
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_PLUGGY_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_PLUGGY_CLIENT_SECRET || '';
  }

  // Autenticação
  async authenticate(): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/auth`, {
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });

      this.accessToken = response.data.apiKey;
      return this.accessToken;
    } catch (error) {
      console.error('Erro na autenticação Pluggy:', error);
      throw new Error('Falha na autenticação com Pluggy');
    }
  }

  // Headers para requisições autenticadas
  private async getHeaders() {
    if (!this.accessToken) {
      await this.authenticate();
    }

    return {
      'X-API-KEY': this.accessToken,
      'Content-Type': 'application/json'
    };
  }

  // Obter conectores disponíveis (bancos)
  async getConnectors(): Promise<PluggyConnector[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseURL}/connectors`, { headers });
      
      // Filtrar apenas bancos brasileiros
      return response.data.results.filter((connector: PluggyConnector) => 
        connector.country === 'BR' && 
        (connector.products.includes('ACCOUNTS') || connector.products.includes('CREDIT_CARDS'))
      );
    } catch (error) {
      console.error('Erro ao buscar conectores:', error);
      throw new Error('Erro ao buscar bancos disponíveis');
    }
  }

  // Criar item de conexão (conectar com banco)
  async createItem(connectorId: number, credentials: Record<string, string>): Promise<string> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(`${this.baseURL}/items`, {
        connectorId,
        parameters: credentials
      }, { headers });

      return response.data.id;
    } catch (error) {
      console.error('Erro ao criar item:', error);
      throw new Error('Erro ao conectar com o banco');
    }
  }

  // Obter status do item
  async getItemStatus(itemId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseURL}/items/${itemId}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter status do item:', error);
      throw error;
    }
  }

  // Obter contas de um item
  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseURL}/accounts`, {
        headers,
        params: { itemId }
      });

      return response.data.results;
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      throw new Error('Erro ao buscar contas bancárias');
    }
  }

  // Obter transações de uma conta
  async getTransactions(accountId: string, from?: string, to?: string): Promise<PluggyTransaction[]> {
    try {
      const headers = await this.getHeaders();
      const params: any = { accountId };
      
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await axios.get(`${this.baseURL}/transactions`, {
        headers,
        params
      });

      return response.data.results;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw new Error('Erro ao buscar transações');
    }
  }

  // Obter cartões de crédito
  async getCreditCards(itemId: string): Promise<PluggyCreditCard[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseURL}/accounts`, {
        headers,
        params: { 
          itemId,
          type: 'CREDIT'
        }
      });

      return response.data.results;
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      throw new Error('Erro ao buscar cartões de crédito');
    }
  }

  // Obter investimentos
  async getInvestments(itemId: string): Promise<PluggyInvestment[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseURL}/investments`, {
        headers,
        params: { itemId }
      });

      return response.data.results;
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
      throw new Error('Erro ao buscar investimentos');
    }
  }

  // Deletar item (desconectar banco)
  async deleteItem(itemId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.delete(`${this.baseURL}/items/${itemId}`, { headers });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      throw new Error('Erro ao desconectar banco');
    }
  }

  // Categorizar transação automaticamente
  categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    const categories = [
      { keywords: ['supermercado', 'mercado', 'extra', 'carrefour', 'pao', 'acucar'], category: 'Alimentação' },
      { keywords: ['posto', 'shell', 'petrobras', 'ipiranga', 'combustivel', 'gasolina'], category: 'Transporte' },
      { keywords: ['uber', 'taxi', '99', 'metro', 'onibus'], category: 'Transporte' },
      { keywords: ['farmacia', 'drogaria', 'droga', 'hospital', 'medico', 'clinica'], category: 'Saúde' },
      { keywords: ['cinema', 'restaurante', 'bar', 'lanchonete', 'pizza'], category: 'Lazer' },
      { keywords: ['escola', 'faculdade', 'curso', 'livro', 'educacao'], category: 'Educação' },
      { keywords: ['aluguel', 'condominio', 'energia', 'agua', 'gas', 'internet'], category: 'Moradia' },
      { keywords: ['salario', 'pagamento', 'pix recebido', 'transferencia recebida'], category: 'Salário' },
      { keywords: ['freelance', 'consultoria', 'servico'], category: 'Freelance' },
      { keywords: ['dividendo', 'rendimento', 'juros'], category: 'Investimentos' }
    ];

    for (const cat of categories) {
      if (cat.keywords.some(keyword => desc.includes(keyword))) {
        return cat.category;
      }
    }

    return 'Outros';
  }

  // Sincronizar dados com sistema local
  async syncWithLocalSystem(itemId: string, userId: number): Promise<{
    accountsSynced: number;
    transactionsSynced: number;
    cardsSynced: number;
    investmentsSynced: number;
  }> {
    try {
      const [accounts, creditCards, investments] = await Promise.all([
        this.getAccounts(itemId),
        this.getCreditCards(itemId).catch(() => []),
        this.getInvestments(itemId).catch(() => [])
      ]);

      let transactionsSynced = 0;
      let accountsSynced = 0;
      let cardsSynced = 0;
      let investmentsSynced = 0;

      // Data range - últimos 90 dias
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);

      // Sincronizar contas bancárias e transações
      for (const account of accounts) {
        try {
          const transactions = await this.getTransactions(
            account.id,
            fromDate.toISOString().split('T')[0],
            toDate.toISOString().split('T')[0]
          );

          // Salvar transações como receitas/despesas
          for (const transaction of transactions) {
            await this.saveTransactionToLocal(transaction, userId);
            transactionsSynced++;
          }

          accountsSynced++;
        } catch (error) {
          console.error(`Erro ao sincronizar conta ${account.id}:`, error);
        }
      }

      // Sincronizar cartões de crédito
      for (const card of creditCards) {
        try {
          await this.saveCreditCardToLocal(card, userId);
          cardsSynced++;
        } catch (error) {
          console.error(`Erro ao sincronizar cartão ${card.id}:`, error);
        }
      }

      // Sincronizar investimentos
      for (const investment of investments) {
        try {
          await this.saveInvestmentToLocal(investment, userId);
          investmentsSynced++;
        } catch (error) {
          console.error(`Erro ao sincronizar investimento ${investment.id}:`, error);
        }
      }

      return {
        accountsSynced,
        transactionsSynced,
        cardsSynced,
        investmentsSynced
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }

  private async saveTransactionToLocal(transaction: PluggyTransaction, userId: number): Promise<void> {
    try {
      const token = localStorage.getItem('@FinanceApp:token');
      const endpoint = transaction.type === 'CREDIT' ? '/receitas' : '/despesas';
      
      // Verificar se a transação já existe
      const existingCheck = await axios.get(`/api${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          descricao: transaction.description,
          valor: Math.abs(transaction.amount),
          data: transaction.date
        }
      });

      // Se já existe uma transação similar, pular
      const exists = existingCheck.data.some((t: any) => 
        t.descricao.toLowerCase().includes(transaction.description.toLowerCase()) &&
        Math.abs(t.valor - Math.abs(transaction.amount)) < 0.01 &&
        t.data === transaction.date
      );

      if (exists) {
        console.log('Transação já existe, pulando:', transaction.description);
        return;
      }

      await axios.post(`/api${endpoint}`, {
        descricao: transaction.description,
        valor: Math.abs(transaction.amount),
        data: transaction.date,
        categoria: this.categorizeTransaction(transaction.description),
        tipo: 'conta',
        status: 'paga',
        observacoes: `Sincronizado via Pluggy - ID: ${transaction.id}`
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Erro ao salvar transação local:', error);
    }
  }

  private async saveCreditCardToLocal(card: PluggyCreditCard, userId: number): Promise<void> {
    try {
      const token = localStorage.getItem('@FinanceApp:token');
      
      // Verificar se o cartão já existe
      const existingCards = await axios.get('/api/cartoes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const cardExists = existingCards.data.some((c: any) => 
        c.numero === card.number.slice(-4) || c.nome.toLowerCase().includes(card.name.toLowerCase())
      );
      
      if (!cardExists) {
        await axios.post('/api/cartoes', {
          nome: card.name,
          numero: card.number.slice(-4),
          limite: card.creditLimit,
          data_fechamento: card.closeDay,
          data_vencimento: card.dueDay
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Erro ao salvar cartão local:', error);
    }
  }

  private async saveInvestmentToLocal(investment: PluggyInvestment, userId: number): Promise<void> {
    try {
      const token = localStorage.getItem('@FinanceApp:token');
      
      // Verificar se o investimento já existe
      const existingInvestments = await axios.get('/api/investimentos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const investmentExists = existingInvestments.data.some((i: any) => 
        i.nome.toLowerCase().includes(investment.name.toLowerCase())
      );
      
      if (!investmentExists) {
        await axios.post('/api/investimentos', {
          tipo: investment.type,
          nome: investment.name,
          valor_aplicado: investment.balance,
          rendimento_mensal: investment.rate || 0
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Erro ao salvar investimento local:', error);
    }
  }
}

export default PluggyService;