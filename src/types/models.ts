// Tipos para o usuário
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Tipos para cartões de crédito
export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  number: string;
  limit: number;
  availableLimit: number;
  dueDate: number;
  closingDate: number;
  color: string;
  bank: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para faturas
export interface Invoice {
  id: string;
  cardId: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para transações
export interface Transaction {
  id: string;
  userId: string;
  cardId?: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  type: 'expense' | 'income';
  isRecurring: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

// Enum para status de faturas
export enum InvoiceStatus {
  PAID = 'paid',
  PENDING = 'pending',
  DUE_SOON = 'due_soon',
  OVERDUE = 'overdue'
}

// Tipos para categorias
export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income' | 'both';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para orçamentos
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}