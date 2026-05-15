import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFinance } from "../contexts/FinanceContext";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { api } from "../services/api"; // Use o api do projeto
import dayjs from "dayjs";

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonth = () => new Date().getMonth() + 1;

const DetalhesCartao: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartoes, faturas, loadCartoes, loadFaturas, atualizarStatusFatura } =
    useFinance();

  const [cartao, setCartao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mes, setMes] = useState(getCurrentMonth());
  const [ano, setAno] = useState(getCurrentYear());
  const [expanded, setExpanded] = useState<{ [faturaId: number]: boolean }>({});
  const [despesas, setDespesas] = useState<{ [faturaId: number]: any[] }>({});
  const [loadingFatura, setLoadingFatura] = useState<number | null>(null);
  const [pagamentoModal, setPagamentoModal] = useState<{
    open: boolean;
    fatura: any | null;
  }>({ open: false, fatura: null });
  const [valorPagamento, setValorPagamento] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadCartoes();
        if (id) {
          await loadFaturas(parseInt(id));
        }
      } catch (error) {
        setError("Erro ao carregar dados do cartão");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    if (cartoes.length > 0 && id) {
      const found = cartoes.find((c) => c.id === parseInt(id));
      if (found) {
        setCartao(found);
      } else {
        setError("Cartão não encontrado");
      }
    }
  }, [cartoes, id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return months[month - 1];
  };

  const handleStatusChange = async (faturaId: number, newStatus: string) => {
    try {
      await atualizarStatusFatura(faturaId, newStatus);
      if (id) {
        await loadFaturas(parseInt(id));
      }
    } catch (error) {
      setError("Erro ao atualizar status da fatura");
    }
  };

  // Filtrar faturas por mês/ano
  const faturasFiltradas = faturas.filter(
    (f) => f.mes_referencia === mes && f.ano_referencia === ano
  );

  // Toggle despesas da fatura
  const handleToggleDespesas = async (faturaId: number) => {
    setExpanded((prev) => ({ ...prev, [faturaId]: !prev[faturaId] }));
    if (!despesas[faturaId]) {
      setLoadingFatura(faturaId);
      try {
        const res = await api.get(`/faturas/${faturaId}`);
        setDespesas((prev) => ({
          ...prev,
          [faturaId]: res.data.despesas || [],
        }));
      } catch (e: any) {
        setError(e.response?.data?.error || "Erro ao buscar despesas");
      } finally {
        setLoadingFatura(null);
      }
    }
  };

  // Abrir modal de pagamento
  const openPagamento = (fatura: any) => {
    setPagamentoModal({ open: true, fatura });
    setValorPagamento("");
    setError("");
    setSuccess("");
  };

  // Efetuar pagamento (parcial ou total)
  const handlePagamento = async () => {
    if (!pagamentoModal.fatura) return;
    const valor = parseFloat(valorPagamento.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      setError("Informe um valor válido");
      return;
    }
    setLoadingFatura(pagamentoModal.fatura.id);
    setError("");
    try {
      const novoValor = Math.max(0, pagamentoModal.fatura.valor_total - valor);
      const status = novoValor === 0 ? "paga" : "aberta";
      await api.put(`/faturas/${pagamentoModal.fatura.id}`, {
        valor_total: novoValor,
        status,
      });
      setSuccess("Pagamento realizado com sucesso!");
      if (id) await loadFaturas(parseInt(id));
      setPagamentoModal({ open: false, fatura: null });
    } catch (e: any) {
      setError(e.response?.data?.error || "Erro ao pagar fatura");
    } finally {
      setLoadingFatura(null);
    }
  };

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Calcular limite disponível corretamente:
  const limiteDisponivel = cartao
    ? (() => {
        // ATENÇÃO: o campo pode vir como cartaoid ou cartaoId dependendo do backend!
        // Vamos garantir que ambos sejam considerados.
        const faturasCartao = faturas.filter((f: any) => {
          const fCartaoId = f.cartao_id ?? f.cartaoId ?? f.cartaoid;
          return String(fCartaoId) === String(cartao.id) && f.status !== "paga";
        });
        const totalFaturasCartao = faturasCartao.reduce(
          (acc: number, f: any) => acc + (Number(f.valor_total) || 0),
          0
        );
        const limite = Number(cartao.limite) || 0;
        // Logs para debug
        console.log("Faturas do cartão (não pagas):", faturasCartao);
        console.log("totalFaturasCartao:", totalFaturasCartao);
        console.log("Limite disponível:", limite - totalFaturasCartao);
        return limite - totalFaturasCartao;
      })()
    : 0;
  console.log("Limite disponível:", limiteDisponivel);
  console.log("Faturas:", faturas);
  console.log("Cartão:", cartao);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!cartao) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          Cartão não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => navigate("/cartoes")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} />
        Voltar para Cartões
      </button>

      {/* Cartão info */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 rounded-lg text-white shadow mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{cartao.nome}</h1>
            <p className="text-lg opacity-80">**** **** **** {cartao.numero}</p>
          </div>
          <CreditCard size={32} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-sm opacity-80">Limite</p>
            <p className="text-xl font-semibold">
              {formatCurrency(cartao.limite)}
            </p>
            <p className="text-sm opacity-80 mt-2">Limite disponível</p>
            <p className="text-lg font-semibold">
              {isNaN(limiteDisponivel)
                ? "R$ 0,00"
                : formatCurrency(limiteDisponivel)}
            </p>
          </div>

          <div>
            <p className="text-sm opacity-80">Fechamento</p>
            <p className="text-xl font-semibold">
              Dia {cartao.data_fechamento}
            </p>
          </div>

          <div>
            <p className="text-sm opacity-80">Vencimento</p>
            <p className="text-xl font-semibold">
              Dia {cartao.data_vencimento}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mês</label>
          <select
            className="border rounded px-2 py-1 text-gray-800"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {meses.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ano</label>
          <select
            className="border rounded px-2 py-1 text-gray-800"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map(
              (a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden text-gray-800">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Faturas</h2>
        </div>
        <div className="divide-y">
          {faturasFiltradas.map((fatura) => (
            <div key={fatura.id} className="p-4 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleDespesas(fatura.id)}
                    className="text-gray-500 hover:text-blue-600 focus:outline-none"
                    aria-label="Expandir despesas"
                  >
                    {expanded[fatura.id] ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
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
                    <div className="font-semibold">
                      {formatCurrency(fatura.valor_total)}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        fatura.status === "paga"
                          ? "bg-green-100 text-green-700"
                          : fatura.status === "vencida"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {fatura.status === "paga"
                        ? "Paga"
                        : fatura.status === "vencida"
                        ? "Vencida"
                        : "Aberta"}
                    </span>
                  </div>
                  <button
                    onClick={() => openPagamento(fatura)}
                    disabled={fatura.status === "paga"}
                    className={`flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm ${
                      fatura.status === "paga"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
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
                            <li
                              key={d.id}
                              className="py-2 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{d.descricao}</div>
                                <div className="text-xs text-gray-500">
                                  {dayjs(d.data).format("DD/MM/YYYY")}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {d.categoria}
                                </div>
                              </div>
                              <div className="font-semibold">
                                {formatCurrency(d.valor)}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-500 text-center py-4">
                          Nenhuma despesa nesta fatura.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {faturasFiltradas.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
              <p>Nenhuma fatura encontrada para o período selecionado.</p>
            </div>
          )}
        </div>
      </div>

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
              <span className="font-medium">{cartao.nome}</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-600">Valor em aberto: </span>
              <span className="font-semibold">
                {formatCurrency(pagamentoModal.fatura.valor_total)}
              </span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePagamento();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valor do pagamento
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={pagamentoModal.fatura.valor_total}
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0,00"
                  required
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={loadingFatura === pagamentoModal.fatura.id}
                className={`w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  loadingFatura === pagamentoModal.fatura.id
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {loadingFatura === pagamentoModal.fatura.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />{" "}
                    Processando...
                  </span>
                ) : (
                  "Confirmar Pagamento"
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

export default DetalhesCartao;
