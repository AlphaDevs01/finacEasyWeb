import React, { useEffect, useState } from 'react';
import { CreditCard, ChevronDown, ChevronUp, Calendar, DollarSign, XCircle, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '../services/api';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonth = () => new Date().getMonth() + 1;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Faturas: React.FC = () => {
  const [faturas, setFaturas] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<{ [faturaId: number]: any[] }>({});
  const [expanded, setExpanded] = useState<{ [faturaId: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [loadingFatura, setLoadingFatura] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mes, setMes] = useState(getCurrentMonth());
  const [ano, setAno] = useState(getCurrentYear());
  const [pagamentoModal, setPagamentoModal] = useState<{ open: boolean, fatura: any | null }>({ open: false, fatura: null });
  const [valorPagamento, setValorPagamento] = useState('');

  // Carregar cartões e faturas
  useEffect(() => {
    const fetchCartoesEFaturas = async () => {
      setLoading(true);
      setError('');
      try {
        const [cartoesRes, faturasRes] = await Promise.all([
          api.get('/cartoes'),
          api.get('/faturas')
        ]);
        setCartoes(cartoesRes.data);
        setFaturas(faturasRes.data);
      } catch (e: any) {
        setError(e.response?.data?.error || 'Erro ao carregar cartões/faturas');
      } finally {
        setLoading(false);
      }
    };
    fetchCartoesEFaturas();
  }, []);

  // Filtrar faturas por mês/ano
  const faturasFiltradas = faturas.filter(f =>
    f.mes_referencia === mes && f.ano_referencia === ano
  );

  // Agrupar por cartão
  const faturasPorCartao = cartoes.map(cartao => ({
    ...cartao,
    faturas: faturasFiltradas.filter(f => f.cartaoId === cartao.id)
  })).filter(c => c.faturas.length > 0);

  // Toggle despesas da fatura
  const handleToggleDespesas = async (faturaId: number) => {
    setExpanded(prev => ({ ...prev, [faturaId]: !prev[faturaId] }));
    if (!despesas[faturaId]) {
      setLoadingFatura(faturaId);
      try {
        const res = await api.get(`/faturas/${faturaId}`);
        setDespesas(prev => ({ ...prev, [faturaId]: res.data.despesas || [] }));
      } catch (e: any) {
        setError(e.response?.data?.error || 'Erro ao buscar despesas');
      } finally {
        setLoadingFatura(null);
      }
    }
  };

  // Abrir modal de pagamento
  const openPagamento = (fatura: any) => {
    setPagamentoModal({ open: true, fatura });
    setValorPagamento('');
    setError('');
    setSuccess('');
  };

  // Efetuar pagamento (parcial ou total)
  const handlePagamento = async () => {
    if (!pagamentoModal.fatura) return;
    const valor = parseFloat(valorPagamento.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setError('Informe um valor válido');
      return;
    }
    setLoadingFatura(pagamentoModal.fatura.id);
    setError('');
    try {
      // Atualiza valor_total e status se pago total
      const novoValor = Math.max(0, pagamentoModal.fatura.valor_total - valor);
      const status = novoValor === 0 ? 'paga' : 'aberta';
      await api.put(`/faturas/${pagamentoModal.fatura.id}`, {
        valor_total: novoValor,
        status
      });
      setSuccess('Pagamento realizado com sucesso!');
      // Atualiza localmente
      setFaturas(faturas =>
        faturas.map(f =>
          f.id === pagamentoModal.fatura.id
            ? { ...f, valor_total: novoValor, status }
            : f
        )
      );
      setPagamentoModal({ open: false, fatura: null });
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erro ao pagar fatura');
    } finally {
      setLoadingFatura(null);
    }
  };

  // Feedback timeout
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CreditCard size={24} /> Faturas dos Cartões
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Mês</label>
          <select
            className="border rounded px-2 py-1"
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
          >
            {meses.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ano</label>
          <select
            className="border rounded px-2 py-1"
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
          >
            {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">{success}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <>
          {faturasPorCartao.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard size={48} className="mx-auto mb-2 opacity-50" />
              <p>Nenhuma fatura encontrada para o período selecionado.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {faturasPorCartao.map(cartao => (
                <div key={cartao.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard size={20} className="text-blue-600" />
                    <span className="font-semibold">{cartao.nome}</span>
                  </div>
                  <div className="divide-y">
                    {cartao.faturas.map((fatura: any) => (
                      <div key={fatura.id} className="py-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleDespesas(fatura.id)}
                              className="text-gray-500 hover:text-blue-600 focus:outline-none"
                              aria-label="Expandir despesas"
                            >
                              {expanded[fatura.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            <span className="font-medium">
                              {meses[fatura.mes_referencia - 1]} {fatura.ano_referencia}
                            </span>
                            <span className="ml-2 text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={16} /> Venc: Dia {cartao.data_vencimento}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 items-center">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Valor total</div>
                              <div className="font-semibold">{formatCurrency(fatura.valor_total)}</div>
                            </div>
                            <div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                fatura.status === 'paga'
                                  ? 'bg-green-100 text-green-700'
                                  : fatura.status === 'vencida'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {fatura.status === 'paga'
                                  ? 'Paga'
                                  : fatura.status === 'vencida'
                                    ? 'Vencida'
                                    : 'Aberta'}
                              </span>
                            </div>
                            <button
                              onClick={() => openPagamento(fatura)}
                              disabled={fatura.status === 'paga'}
                              className={`flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm ${
                                fatura.status === 'paga' ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <DollarSign size={16} /> Pagar
                            </button>
                          </div>
                        </div>
                        {/* Despesas */}
                        {expanded[fatura.id] && (
                          <div className="mt-3 bg-gray-50 rounded p-3">
                            {loadingFatura === fatura.id ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="animate-spin" size={24} />
                              </div>
                            ) : (
                              <>
                                {despesas[fatura.id]?.length > 0 ? (
                                  <ul className="divide-y">
                                    {despesas[fatura.id].map((d: any) => (
                                      <li key={d.id} className="py-2 flex justify-between items-center">
                                        <div>
                                          <div className="font-medium">{d.descricao}</div>
                                          <div className="text-xs text-gray-500">{dayjs(d.data).format('DD/MM/YYYY')}</div>
                                          <div className="text-xs text-gray-400">{d.categoria}</div>
                                        </div>
                                        <div className="font-semibold">{formatCurrency(d.valor)}</div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="text-gray-500 text-center py-4">Nenhuma despesa nesta fatura.</div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Pagamento */}
      {pagamentoModal.open && pagamentoModal.fatura && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setPagamentoModal({ open: false, fatura: null })}
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-xl font-semibold mb-2">Pagamento da Fatura</h2>
            <div className="mb-2">
              <span className="text-gray-600">Cartão: </span>
              <span className="font-medium">{cartoes.find(c => c.id === pagamentoModal.fatura.cartaoId)?.nome}</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-600">Valor em aberto: </span>
              <span className="font-semibold">{formatCurrency(pagamentoModal.fatura.valor_total)}</span>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                handlePagamento();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Valor do pagamento</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={pagamentoModal.fatura.valor_total}
                  value={valorPagamento}
                  onChange={e => setValorPagamento(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0,00"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loadingFatura === pagamentoModal.fatura.id}
                className={`w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors ${
                  loadingFatura === pagamentoModal.fatura.id ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {loadingFatura === pagamentoModal.fatura.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Processando...
                  </span>
                ) : (
                  'Confirmar Pagamento'
                )}
              </button>
            </form>
            {error && <div className="mt-3 text-red-600">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Faturas;