import { useState } from 'react';
import { Plus, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: string;
}

const Expenses = () => {
  const [expenses] = useState<Expense[]>([
    {
      id: '1',
      description: 'Aluguel',
      amount: 2000,
      date: '2025-05-01',
      category: 'Moradia',
      paymentMethod: 'Transferência',
    },
    {
      id: '2',
      description: 'Supermercado',
      amount: 850.45,
      date: '2025-05-05',
      category: 'Alimentação',
      paymentMethod: 'Cartão de Crédito',
    },
    {
      id: '3',
      description: 'Energia Elétrica',
      amount: 245.78,
      date: '2025-05-10',
      category: 'Utilidades',
      paymentMethod: 'Débito Automático',
    },
  ]);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Despesas</h1>
          <p className="text-slate-500">Gerencie suas despesas mensais</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex items-center">
            <Filter size={18} className="mr-2" />
            Filtrar
          </button>
          <button className="btn btn-primary flex items-center">
            <Plus size={18} className="mr-2" />
            Nova Despesa
          </button>
        </div>
      </header>

      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-medium">Despesas Recentes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Descrição</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Categoria</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Data</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Forma de Pagamento</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Valor</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-medium">{expense.description}</span>
                  </td>
                  <td className="py-3 px-4">{expense.category}</td>
                  <td className="py-3 px-4">{formatDate(expense.date)}</td>
                  <td className="py-3 px-4">{expense.paymentMethod}</td>
                  <td className="py-3 px-4 text-right font-medium text-expense">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === expense.id ? null : expense.id)}
                        className="p-1 rounded-full hover:bg-slate-100"
                      >
                        <MoreVertical size={18} className="text-slate-500" />
                      </button>

                      {openMenu === expense.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10 animate-fade-in">
                          <div className="py-1">
                            <button className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                              <Edit size={16} className="mr-2 text-slate-500" />
                              Editar
                            </button>
                            <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-slate-100">
                              <Trash2 size={16} className="mr-2" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;