import { api } from './api';

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
  // Este service NÃO chama https://api.pluggy.ai diretamente.
  // Toda autenticação sensível fica no backend em server/services/pluggyService.js.

  async getConnectors(): Promise<PluggyConnector[]> {
    const response = await api.get('/openfinance/connectors');
    return response.data;
  }

  async createConnectToken(itemId?: string): Promise<any> {
    const response = await api.post('/openfinance/connect-token', itemId ? { itemId } : {});
    return response.data;
  }

  async createItem(connectorId: number, credentials: Record<string, string>, bankName?: string): Promise<string> {
    const response = await api.post('/openfinance/items', {
      connectorId,
      credentials,
      bankName
    });
    return response.data.id;
  }

  async getItemStatus(itemId: string): Promise<any> {
    const response = await api.get(`/openfinance/items/${encodeURIComponent(itemId)}`);
    return response.data;
  }

  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    const response = await api.get('/openfinance/accounts', { params: { itemId } });
    return response.data;
  }

  async getTransactions(itemId: string, accountId: string, from?: string, to?: string): Promise<PluggyTransaction[]> {
    const response = await api.get('/openfinance/transactions', {
      params: { itemId, accountId, from, to }
    });
    return response.data;
  }

  async getCreditCards(itemId: string): Promise<PluggyCreditCard[]> {
    const response = await api.get('/openfinance/cards', { params: { itemId } });
    return response.data;
  }

  async getInvestments(itemId: string): Promise<PluggyInvestment[]> {
    const response = await api.get('/openfinance/investments', { params: { itemId } });
    return response.data;
  }

  async deleteItem(itemId: string): Promise<void> {
    await api.delete(`/openfinance/items/${encodeURIComponent(itemId)}`);
  }

  categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    const categories = [
      { keywords: ['supermercado', 'mercado', 'extra', 'carrefour', 'pao', 'acucar'], category: 'Alimentação' },
      { keywords: ['posto', 'shell', 'petrobras', 'ipiranga', 'combustivel', 'gasolina'], category: 'Transporte' },
      { keywords: ['uber', 'taxi', '99', 'metro', 'onibus'], category: 'Transporte' },
      { keywords: ['farmacia', 'drogaria', 'hospital', 'medico', 'clinica'], category: 'Saúde' },
      { keywords: ['cinema', 'restaurante', 'bar', 'lanchonete', 'pizza'], category: 'Lazer' },
      { keywords: ['escola', 'faculdade', 'curso', 'livro', 'educacao'], category: 'Educação' },
      { keywords: ['aluguel', 'condominio', 'energia', 'agua', 'gas', 'internet'], category: 'Moradia' },
      { keywords: ['salario', 'pagamento', 'pix recebido', 'transferencia recebida'], category: 'Salário' },
      { keywords: ['freelance', 'consultoria', 'servico'], category: 'Freelance' },
      { keywords: ['dividendo', 'rendimento', 'juros'], category: 'Investimentos' }
    ];

    for (const cat of categories) {
      if (cat.keywords.some(keyword => desc.includes(keyword))) return cat.category;
    }
    return 'Outros';
  }

  async syncWithLocalSystem(itemId: string, _userId: number): Promise<{
    accountsSynced: number;
    transactionsSynced: number;
    cardsSynced: number;
    investmentsSynced: number;
  }> {
    const [accounts, creditCards, investments] = await Promise.all([
      this.getAccounts(itemId),
      this.getCreditCards(itemId).catch(() => []),
      this.getInvestments(itemId).catch(() => [])
    ]);

    let transactionsSynced = 0;
    let accountsSynced = 0;
    let cardsSynced = 0;
    let investmentsSynced = 0;

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);
    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    for (const account of accounts) {
      const transactions = await this.getTransactions(itemId, account.id, from, to).catch(() => []);
      for (const transaction of transactions) {
        await this.saveTransactionToLocal(transaction);
        transactionsSynced++;
      }
      accountsSynced++;
    }

    for (const card of creditCards) {
      await this.saveCreditCardToLocal(card);
      cardsSynced++;
    }

    for (const investment of investments) {
      await this.saveInvestmentToLocal(investment);
      investmentsSynced++;
    }

    return { accountsSynced, transactionsSynced, cardsSynced, investmentsSynced };
  }

  private async saveTransactionToLocal(transaction: PluggyTransaction): Promise<void> {
    const endpoint = transaction.type === 'CREDIT' ? '/receitas' : '/despesas';
    const existingCheck = await api.get(endpoint, {
      params: {
        descricao: transaction.description,
        valor: Math.abs(transaction.amount),
        data: transaction.date
      }
    });

    const exists = existingCheck.data.some((t: any) =>
      String(t.descricao || '').toLowerCase().includes(transaction.description.toLowerCase()) &&
      Math.abs(Number(t.valor) - Math.abs(transaction.amount)) < 0.01 &&
      String(t.data).slice(0, 10) === transaction.date
    );

    if (exists) return;

    await api.post(endpoint, {
      descricao: transaction.description,
      valor: Math.abs(transaction.amount),
      data: transaction.date,
      categoria: this.categorizeTransaction(transaction.description),
      tipo: 'conta',
      status: 'paga',
      observacoes: `Sincronizado via Pluggy - ID: ${transaction.id}`
    });
  }

  private async saveCreditCardToLocal(card: PluggyCreditCard): Promise<void> {
    const existingCards = await api.get('/cartoes');
    const last4 = card.number ? card.number.slice(-4) : '';
    const cardExists = existingCards.data.some((c: any) =>
      c.numero === last4 || String(c.nome || '').toLowerCase().includes(card.name.toLowerCase())
    );

    if (!cardExists) {
      await api.post('/cartoes', {
        nome: card.name,
        numero: last4 || '0000',
        limite: card.creditLimit || 0,
        data_fechamento: card.closeDay || 1,
        data_vencimento: card.dueDay || 1
      });
    }
  }

  private async saveInvestmentToLocal(investment: PluggyInvestment): Promise<void> {
    const existingInvestments = await api.get('/investimentos');
    const investmentExists = existingInvestments.data.some((i: any) =>
      String(i.nome || '').toLowerCase().includes(investment.name.toLowerCase())
    );

    if (!investmentExists) {
      await api.post('/investimentos', {
        tipo: investment.type,
        nome: investment.name,
        valor_aplicado: investment.balance || 0,
        rendimento_mensal: investment.rate || 0
      });
    }
  }
}

export default PluggyService;
