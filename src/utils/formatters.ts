export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('pt-BR');
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
};

export const formatCardNumber = (number: string): string => {
  const cleaned = number.replace(/\D/g, '');
  return `**** **** **** ${cleaned.slice(-4)}`;
};

export const getMonthName = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || '';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paga':
    case 'recebida':
      return 'bg-green-100 text-green-700';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-700';
    case 'vencida':
      return 'bg-red-100 text-red-700';
    case 'cancelada':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusLabel = (status: string, type: 'despesa' | 'receita' = 'despesa'): string => {
  switch (status) {
    case 'paga':
      return type === 'despesa' ? 'Paga' : 'Recebida';
    case 'pendente':
      return 'Pendente';
    case 'vencida':
      return 'Vencida';
    case 'cancelada':
      return 'Cancelada';
    default:
      return status;
  }
};

export const calculateDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isOverdue = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

export const getDaysUntilDue = (date: string | Date): number => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diffTime = dateObj.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};