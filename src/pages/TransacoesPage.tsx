import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import {
  Plus,
  Filter,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/api";

const TransacoesPage: React.FC = () => {
  const {
    despesas,
    receitas,
    loadDespesas,
    loadReceitas,
    salvarDespesa,
    salvarReceita,
    excluirDespesa,
    excluirReceita,
    cartoes,
    loadCartoes,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<"despesas" | "receitas">(
    "despesas"
  );
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("conta");
  const [cartaoId, setCartaoId] = useState("");
  const [parcelas, setParcelas] = useState(1); // Novo campo para parcelas

  // Filter states
  const [mesFilter, setMesFilter] = useState(new Date().getMonth() + 1);
  const [anoFilter, setAnoFilter] = useState(new Date().getFullYear());
  const [categoriaFilter, setCategoriaFilter] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadCartoes();
  }, [mesFilter, anoFilter, categoriaFilter]);

  const loadData = () => {
    const filters = {
      mes: mesFilter,
      ano: anoFilter,
      categoria: categoriaFilter || undefined,
    };

    loadDespesas(filters);
    loadReceitas(filters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!descricao || !valor || !data || !categoria) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    if (
      activeTab === "despesas" &&
      tipo === "cartao" &&
      (!cartaoId || parcelas < 1)
    ) {
      setError("Selecione o cartão e o número de parcelas");
      return;
    }
    try {
      setLoading(true);

      if (activeTab === "despesas" && tipo === "cartao") {
        // Lógica para despesas no cartão (parceladas ou não)
        const valorParcela = parseFloat(valor) / parcelas;
        const dataObj = new Date(data);

        for (let i = 0; i < parcelas; i++) {
          // Calcula mês/ano da parcela
          const parcelaDate = new Date(dataObj);
          parcelaDate.setMonth(parcelaDate.getMonth() + i);
          const mes_referencia = parcelaDate.getMonth() + 1;
          const ano_referencia = parcelaDate.getFullYear();

          // Busca ou cria fatura do cartão para o mês/ano
          let faturaId: number | null = null;
          let fatura = null;
          try {
            // Use a chave correta do token
            let token = localStorage.getItem("@FinanceApp:token");
            if (token && token.startsWith('"') && token.endsWith('"')) {
              token = token.slice(1, -1);
            }
            const res = await api.get(`faturas/cartao/${cartaoId}`, {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            });
            if (res.status === 401) {
              setError("Sessão expirada. Faça login novamente.");
              setLoading(false);
              return;
            }
            const faturas = res.data;
            fatura = faturas.find(
              (f: any) =>
                f.mes_referencia === mes_referencia &&
                f.ano_referencia === ano_referencia
            );
          } catch (err: any) {
            setError(err.message || "Erro ao buscar fatura");
            setLoading(false);
            return;
          }

          if (!fatura) {
            let token = localStorage.getItem("@FinanceApp:token");
            if (token && token.startsWith('"') && token.endsWith('"')) {
              token = token.slice(1, -1);
            }
            // Corrija: valor_total deve ser um número (0), não string ou undefined
            try {
              const faturaRes = await api.post(
                "/faturas",
                {
                  cartaoId: parseInt(cartaoId),
                  mes_referencia,
                  ano_referencia,
                  valor_total: 0, // Garante que é número
                  status: "aberta",
                },
                {
                  headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                  },
                }
              );
              fatura = faturaRes.data;
            } catch (err: any) {
              if (err.response && err.response.status === 401) {
                setError("Sessão expirada. Faça login novamente.");
              } else {
                setError(err.response?.data?.error || "Erro ao criar fatura");
              }
              setLoading(false);
              return;
            }
          }
          faturaId = fatura.id;

          // Cria despesa vinculada à fatura
          await salvarDespesa({
            descricao:
              parcelas > 1 ? `${descricao} (${i + 1}/${parcelas})` : descricao,
            valor: valorParcela,
            data: parcelaDate.toISOString().slice(0, 10),
            categoria,
            tipo: "cartao",
            cartaoId: parseInt(cartaoId),
            faturaId,
          });

          // Atualiza valor_total da fatura
          let token = localStorage.getItem("@FinanceApp:token");
          if (token && token.startsWith('"') && token.endsWith('"')) {
            token = token.slice(1, -1);
          }
          await api.put(
            `/faturas/${faturaId}`,
            {
              valor_total: parseFloat(fatura.valor_total) + valorParcela,
              status: fatura.status,
            },
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );
        }
      } else if (activeTab === "despesas") {
        // Despesa comum (conta)
        await salvarDespesa({
          descricao,
          valor: parseFloat(valor),
          data,
          categoria,
          tipo,
          cartaoId: tipo === "cartao" ? parseInt(cartaoId) : undefined,
        });
      } else {
        // Receita
        await salvarReceita({
          descricao,
          valor: parseFloat(valor),
          data,
          categoria,
        });
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          `Erro ao salvar ${activeTab === "despesas" ? "despesa" : "receita"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, type: "despesa" | "receita") => {
    if (!window.confirm(`Tem certeza que deseja excluir esta ${type}?`)) {
      return;
    }

    try {
      if (type === "despesa") {
        await excluirDespesa(id);
      } else {
        await excluirReceita(id);
      }
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.error || `Erro ao excluir ${type}`);
    }
  };

  const resetForm = () => {
    setDescricao("");
    setValor("");
    setData("");
    setCategoria("");
    setTipo("conta");
    setCartaoId("");
    setParcelas(1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const categoriasDespesas = [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Saúde",
    "Educação",
    "Lazer",
    "Outros",
  ];

  const categoriasReceitas = [
    "Salário",
    "Freelance",
    "Investimentos",
    "Outros",
  ];

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

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receitas e Despesas</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Filter size={20} />
            Filtros
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nova {activeTab === "despesas" ? "Despesa" : "Receita"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mês
              </label>
              <select
                value={mesFilter}
                onChange={(e) => setMesFilter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano
              </label>
              <select
                value={anoFilter}
                onChange={(e) => setAnoFilter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {generateYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {(activeTab === "despesas"
                  ? categoriasDespesas
                  : categoriasReceitas
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Nova {activeTab === "despesas" ? "Despesa" : "Receita"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {(activeTab === "despesas"
                    ? categoriasDespesas
                    : categoriasReceitas
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === "despesas" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="conta">Conta</option>
                      <option value="cartao">Cartão de Crédito</option>
                    </select>
                  </div>

                  {tipo === "cartao" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cartão
                        </label>
                        <select
                          value={cartaoId}
                          onChange={(e) => setCartaoId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Selecione...</option>
                          {cartoes.map((cartao) => (
                            <option key={cartao.id} value={cartao.id}>
                              {cartao.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parcelas
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={36}
                          value={parcelas}
                          onChange={(e) => setParcelas(Number(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("despesas")}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === "despesas"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Despesas
          </button>

          <button
            onClick={() => setActiveTab("receitas")}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === "receitas"
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Receitas
          </button>
        </div>

        <div className="divide-y">
          {(activeTab === "despesas" ? despesas : receitas).map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {activeTab === "despesas" ? (
                    <ArrowDownCircle size={20} className="text-red-500" />
                  ) : (
                    <ArrowUpCircle size={20} className="text-green-500" />
                  )}

                  <div>
                    <p className="font-medium">{item.descricao}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(item.data)} • {item.categoria}
                      {activeTab === "despesas" && item.tipo === "cartao" && (
                        <span className="ml-2 text-blue-500">
                          {cartoes.find((c) => c.id === item.cartaoId)?.nome}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p
                    className={`font-medium ${
                      activeTab === "despesas"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {activeTab === "despesas" ? "-" : "+"}
                    {formatCurrency(item.valor)}
                  </p>

                  <button
                    onClick={() =>
                      handleDelete(
                        item.id,
                        activeTab === "despesas" ? "despesa" : "receita"
                      )
                    }
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(activeTab === "despesas" ? despesas : receitas).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransacoesPage;
