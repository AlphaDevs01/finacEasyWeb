// Serviço legado mantido por compatibilidade. Usa a API central com cookie HttpOnly.
import { api } from './api';

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, senha: password });
  return res.data;
}

export async function register(email: string, password: string, nome = email.split('@')[0]) {
  const res = await api.post('/auth/register', { nome, email, senha: password });
  return res.data;
}

export async function getCreditCards() {
  const res = await api.get('/cartoes');
  return res.data;
}

export async function createCreditCard(data: any) {
  const res = await api.post('/cartoes', data);
  return res.data;
}

export async function getIncomes() {
  const res = await api.get('/receitas');
  return res.data;
}

export async function createIncome(data: any) {
  const res = await api.post('/receitas', data);
  return res.data;
}

export async function getExpenses() {
  const res = await api.get('/despesas');
  return res.data;
}

export async function createExpense(data: any) {
  const res = await api.post('/despesas', data);
  return res.data;
}
