import { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  PlusCircle,
  X
} from 'lucide-react';

// Tipos de dados
interface CreditCard {
  id: string;
  name: string;
  number: string;
  limit: number;
  availableLimit: number;
  dueDate: number;
  closingDate: number;
  color: string;
  bank: string;
}

const CreditCards = () => {
  // Estado para os cartões
  const [cards, setCards] = useState<CreditCard[]>([
    {
      id: '1',
      name: 'Nubank',
      number: '**** **** **** 4587',
      limit: 8000,
      availableLimit: 1200,
      dueDate: 15,
      closingDate: 8,
      color: 'bg-purple-600',
      bank: 'Nubank'
    },
    {
      id: '2',
      name: 'Itaú Platinum',
      number: '**** **** **** 6721',
      limit: 12000,
      availableLimit: 4500,
      dueDate: 10,
      closingDate: 3,
      color: 'bg-orange-600',
      bank: 'Itaú'
    },
    {
      id: '3',
      name: 'Santander Free',
      number: '**** **** **** 2198',
      limit: 4500,
      availableLimit: 1250,
      dueDate: 5,
      closingDate: 27,
      color: 'bg-red-600',
      bank: 'Santander'
    }
  ]);

  // Estado para controlar qual menu dropdown está aberto
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Função para calcular a porcentagem do limite usado
  const calculateUsedPercentage = (limit: number, available: number) => {
    const used = limit - available;
    return (used / limit) * 100;
  };

  // Função para determinar a cor da barra de progresso com base na porcentagem usada
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Estado para modal de novo cartão
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  
  // Estado para modal de nova fatura
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Faturas para demonstração
  const invoices = [
    { 
      id: '1', 
      cardId: '1', 
      month: 'Maio', 
      year: 2025, 
      amount: 5680.45, 
      status: 'paid',
      dueDate: '15/05/2025'
    },
    { 
      id: '2', 
      cardId: '1', 
      month: 'Junho', 
      year: 2025, 
      amount: 6780.45, 
      status: 'pending',
      dueDate: '15/06/2025'
    },
    { 
      id: '3', 
      cardId: '2', 
      month: 'Maio', 
      year: 2025, 
      amount: 7500.12, 
      status: 'paid',
      dueDate: '10/05/2025'
    },
    { 
      id: '4', 
      cardId: '2', 
      month: 'Junho', 
      year: 2025, 
      amount: 7520.35, 
      status: 'pending',
      dueDate: '10/06/2025'
    },
    { 
      id: '5', 
      cardId: '3', 
      month: 'Maio', 
      year: 2025, 
      amount: 3249.87, 
      status: 'paid',
      dueDate: '05/05/2025'
    },
    { 
      id: '6', 
      cardId: '3', 
      month: 'Junho', 
      year: 2025, 
      amount: 3249.87, 
      status: 'due_soon',
      dueDate: '05/06/2025'
    }
  ];

  // Função para abrir modal de fatura para um cartão específico
  const openAddInvoiceModal = (cardId: string) => {
    setSelectedCardId(cardId);
    setIsAddInvoiceModalOpen(true);
    setOpenMenu(null);
  };

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Cartões de Crédito</h1>
          <p className="text-slate-500">Gerencie seus cartões e faturas</p>
        </div>
        <button 
          onClick={() => setIsAddCardModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Novo Cartão
        </button>
      </header>

      {/* Lista de cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => {
          const usedPercentage = calculateUsedPercentage(card.limit, card.availableLimit);
          const progressColor = getProgressColor(usedPercentage);
          
          return (
            <div key={card.id} className="card">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-6 rounded flex items-center justify-center mr-3 ${card.color}`}>
                      <CreditCard size={16} className="text-white" />
                    </div>
                    <h3 className="font-medium">{card.name}</h3>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenu(openMenu === card.id ? null : card.id)}
                      className="p-1 rounded-full hover:bg-slate-100"
                    >
                      <MoreVertical size={18} className="text-slate-500" />
                    </button>
                    
                    {openMenu === card.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10 animate-fade-in">
                        <div className="py-1">
                          <button 
                            className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <Edit size={16} className="mr-2 text-slate-500" />
                            Editar cartão
                          </button>
                          <button 
                            onClick={() => openAddInvoiceModal(card.id)}
                            className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <PlusCircle size={16} className="mr-2 text-slate-500" />
                            Nova fatura
                          </button>
                          <button 
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-1">{card.number}</p>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Limite usado</span>
                    <span>{formatCurrency(card.limit - card.availableLimit)} / {formatCurrency(card.limit)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor}`} 
                      style={{ width: `${usedPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-500">Disponível</span>
                    <span className="font-medium text-green-600">{formatCurrency(card.availableLimit)}</span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-500 block">Vencimento</span>
                    <span className="font-medium">Dia {card.dueDate}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-500 block">Fechamento</span>
                    <span className="font-medium">Dia {card.closingDate}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Faturas recentes */}
      <div className="card mb-6">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-medium">Faturas recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="py-3 px-4 text-sm font-medium text-slate-500">Cartão</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500">Mês/Ano</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500">Valor</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500">Vencimento</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => {
                const card = cards.find(c => c.id === invoice.cardId);
                
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-5 rounded flex items-center justify-center mr-2 ${card?.color}`}>
                          <CreditCard size={14} className="text-white" />
                        </div>
                        <span className="font-medium">{card?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {invoice.month}/{invoice.year}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="py-3 px-4">
                      {invoice.dueDate}
                    </td>
                    <td className="py-3 px-4">
                      {invoice.status === 'paid' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={14} className="mr-1" /> Paga
                        </span>
                      )}
                      {invoice.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          Pendente
                        </span>
                      )}
                      {invoice.status === 'due_soon' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertCircle size={14} className="mr-1" /> A vencer
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para adicionar cartão - Para ser implementado com funcionalidades reais */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-slide-up">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Adicionar novo cartão</h3>
              <button onClick={() => setIsAddCardModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-center text-slate-500 mb-4">
                Formulário para adicionar novo cartão (Demo)
              </p>
              <button 
                onClick={() => setIsAddCardModalOpen(false)}
                className="btn btn-primary w-full"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar fatura - Para ser implementado com funcionalidades reais */}
      {isAddInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-slide-up">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Adicionar nova fatura</h3>
              <button onClick={() => setIsAddInvoiceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-center text-slate-500 mb-4">
                Formulário para adicionar nova fatura para o cartão selecionado (Demo)
              </p>
              <button 
                onClick={() => setIsAddInvoiceModalOpen(false)}
                className="btn btn-primary w-full"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCards;