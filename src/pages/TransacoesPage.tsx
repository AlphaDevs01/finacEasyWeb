import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { useToast } from "../components/ui/Toast";
import SearchInput from "../components/ui/SearchInput";
import AdvancedFilters from "../components/ui/AdvancedFilters";
import ExportButton from "../components/ui/ExportButton";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { TableSkeleton } from "../components/ui/SkeletonLoader";
import { ErrorHandler, withRetry } from "../utils/errorHandler";
import { Validator, commonSchemas } from "../utils/validation";
import {
  Plus,
  Filter,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  AlertCircle,
  Edit,
  Settings
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
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"despesas" | "receitas">(
    "despesas"
  );
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    item: any;
    type: 'despesa' | 'receita';
  }>({ isOpen: false, item: null, type: 'despesa' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  // Form states
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("conta");
  const [cartaoId, setCartaoId] = useState("");
  const [parcelas, setParcelas] = useState(1); // Novo campo para parcelas
  const [status, setStatus] = useState("pendente");
  const [dataVencimento, setDataVencimento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Filter states
  const [mesFilter, setMesFilter] = useState(new Date().getMonth() + 1);
  const [anoFilter, setAnoFilter] = useState(new Date().getFullYear());

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  // Novo estado para edição
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setDataLoading(true);
        await loadCartoes();
        await loadCategorias();
        await loadData();
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Erro ao carregar dados',
          message: 'Não foi possível carregar as transações'
        });
      } finally {
        setDataLoading(false);
      }
    };
    
    initData();
  }, [mesFilter, anoFilter, advancedFilters]);

  const loadCategorias = async () => {
    try {
      const response = await withRetry(() => api.get('/categorias'));
      setCategorias(response.data);
    } catch (error) {
      const appError = ErrorHandler.handle(error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar categorias',
        message: appError.message
      });
    }
  };

  const loadData = () => {
    const filters = Object.assign({
      mes: mesFilter,
      ano: anoFilter,
    }, advancedFilters);

    loadDespesas(filters);
    loadReceitas(filters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validação usando o sistema de validação
    const validationSchema = {
      descricao: { required: true, minLength: 2, maxLength: 255 },
      valor: { required: true, ...commonSchemas.currency },
      data: { required: true, ...commonSchemas.date },
      categoria: { required: true }
    };

    const formData = { descricao, valor: parseFloat(valor), data, categoria };
    const validation = Validator.validate(formData, validationSchema);

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return;
    }

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
          status,
          data_vencimento: dataVencimento || undefined,
          observacoes
        });
      } else {
        // Receita
        await salvarReceita({
          descricao,
          valor: parseFloat(valor),
          data,
          categoria,
          status,
          data_vencimento: dataVencimento || undefined,
          observacoes
        });
      }

      setShowForm(false);
      resetForm();
      loadData();
      showToast({
        type: 'success',
        title: 'Sucesso!',
        message: `${activeTab === 'despesas' ? 'Despesa' : 'Receita'} salva com sucesso`
      });
    } catch (error) {
      const appError = ErrorHandler.handle(error);
      setError(appError.message);
      showToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: appError.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para iniciar edição
  const handleEdit = (item: any) => {
    setEditId(item.id);
    setDescricao(item.descricao);
    setValor(String(item.valor));
    setData(item.data.slice(0, 10));
    setCategoria(item.categoria);
    setStatus(item.status || 'pendente');
    setDataVencimento(item.data_vencimento ? item.data_vencimento.slice(0, 10) : '');
    setObservacoes(item.observacoes || '');
    if (activeTab === "despesas") {
      setTipo(item.tipo || "conta");
      setCartaoId(item.cartaoId ? String(item.cartaoId) : "");
      setParcelas(1);
    }
    setShowForm(true);
  };

  // Função para salvar edição
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!descricao || !valor || !data || !categoria) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      setLoading(true);
      if (activeTab === "despesas") {
        await salvarDespesa({
          id: editId,
          descricao,
          valor: parseFloat(valor),
          data,
          categoria,
          tipo,
          cartaoId: tipo === "cartao" ? parseInt(cartaoId) : undefined,
          status,
          data_vencimento: dataVencimento || undefined,
          observacoes
        });
      } else {
        await salvarReceita({
          id: editId,
          descricao,
          valor: parseFloat(valor),
          data,
          categoria,
          status,
          data_vencimento: dataVencimento || undefined,
          observacoes
        });
      }
      setShowForm(false);
      setEditId(null);
      resetForm();
      loadData();
      showToast({
        type: 'success',
        title: 'Sucesso!',
        message: `${activeTab === 'despesas' ? 'Despesa' : 'Receita'} editada com sucesso`
      });
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          `Erro ao editar ${activeTab === "despesas" ? "despesa" : "receita"}`
      );
      showToast({
        type: 'error',
        title: 'Erro ao editar',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (item: any, newStatus: string) => {
    try {
      if (activeTab === "despesas") {
        await salvarDespesa({
          id: item.id,
          descricao: item.descricao,
          valor: item.valor,
          data: item.data,
          categoria: item.categoria,
          tipo: item.tipo,
          cartaoId: item.cartaoId,
          status: newStatus,
          data_vencimento: item.data_vencimento,
          observacoes: item.observacoes
        });
      } else {
        await salvarReceita({
          id: item.id,
          descricao: item.descricao,
          valor: item.valor,
          data: item.data,
          categoria: item.categoria,
          status: newStatus,
          data_vencimento: item.data_vencimento,
          observacoes: item.observacoes
        });
      }
      loadData();
      showToast({
        type: 'success',
        title: 'Status atualizado!',
        message: `${activeTab === 'despesas' ? 'Despesa' : 'Receita'} marcada como ${newStatus}`
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar status',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    const { item, type } = confirmDialog;
    
    try {
      if (type === "despesa") {
        await excluirDespesa(item.id);
      } else {
        await excluirReceita(item.id);
      }
      loadData();
      showToast({
        type: 'success',
        title: 'Sucesso!',
        message: `${type === 'despesa' ? 'Despesa' : 'Receita'} excluída com sucesso`
      });
    } catch (error: any) {
      setError(error.response?.data?.error || `Erro ao excluir ${type}`);
      showToast({
        type: 'error',
        title: 'Erro ao excluir',
        message: error.response?.data?.error || 'Ocorreu um erro inesperado'
      });
    } finally {
      setConfirmDialog({ isOpen: false, item: null, type: 'despesa' });
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
    setStatus("pendente");
    setDataVencimento("");
    setObservacoes("");
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

  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'yellow' },
    { value: 'paga', label: activeTab === 'despesas' ? 'Paga' : 'Recebida', color: 'green' },
    { value: 'vencida', label: 'Vencida', color: 'red' },
    { value: 'cancelada', label: 'Cancelada', color: 'gray' }
  ];

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.label || status;
  };

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

  // Navegação entre meses
  const goToPrevMonth = () => {
    setMesFilter((prev) => {
      if (prev === 1) {
        setAnoFilter((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setMesFilter((prev) => {
      if (prev === 12) {
        setAnoFilter((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  // Filtrar dados baseado na busca
  const filteredData = (activeTab === "despesas" ? despesas : receitas).filter(item => {
    const matchesSearch = item.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Aplicar filtros avançados
    if (advancedFilters.valorMin && item.valor < parseFloat(advancedFilters.valorMin)) return false;
    if (advancedFilters.valorMax && item.valor > parseFloat(advancedFilters.valorMax)) return false;
    if (advancedFilters.dataInicio && item.data < advancedFilters.dataInicio) return false;
    if (advancedFilters.dataFim && item.data > advancedFilters.dataFim) return false;
    if (advancedFilters.categoria && item.categoria !== advancedFilters.categoria) return false;
    if (advancedFilters.status && item.status !== advancedFilters.status) return false;
    if (advancedFilters.tipo && item.tipo !== advancedFilters.tipo) return false;
    if (advancedFilters.cartaoId && item.cartaoId !== parseInt(advancedFilters.cartaoId)) return false;
    if (advancedFilters.descricao && !item.descricao.toLowerCase().includes(advancedFilters.descricao.toLowerCase())) return false;

    return matchesSearch;
  });

  const handleAdvancedFiltersApply = (filters: any) => {
    setAdvancedFilters(filters);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receitas e Despesas</h1>

        <div className="flex gap-2">
          <ExportButton
            data={filteredData}
            filename={`${activeTab}-${mesFilter}-${anoFilter}`}
          />

          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              Object.keys(advancedFilters).length > 0
                ? 'bg-primary-50 border border-primary-200 text-primary-700 shadow-medium'
                : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-soft'
            }`}
          >
            <Settings size={20} />
            Filtros Avançados
            {Object.keys(advancedFilters).length > 0 && (
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {Object.keys(advancedFilters).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Plus size={20} />
            Nova {activeTab === "despesas" ? "Despesa" : "Receita"}
          </button>
        </div>
      </div>

      {/* Navegação de mês/ano */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goToPrevMonth}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          title="Mês anterior"
          type="button"
        >
          &#8592;
        </button>
        <select
          value={mesFilter}
          onChange={(e) => setMesFilter(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
        >
          {months.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
        <button
          onClick={goToNextMonth}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          title="Próximo mês"
          type="button"
        >
          &#8594;
        </button>
        <select
          value={anoFilter}
          onChange={(e) => setAnoFilter(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
        >
          {generateYears().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Barra de busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          placeholder={`Buscar ${activeTab}...`}
          onSearch={setSearchQuery}
          className="flex-1"
        />
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 text-gray-800">
          <h2 className="text-lg font-semibold mb-4">
            {editId
              ? `Editar ${activeTab === "despesas" ? "Despesa" : "Receita"}`
              : `Nova ${activeTab === "despesas" ? "Despesa" : "Receita"}`}
          </h2>
          <form onSubmit={editId ? handleSaveEdit : handleSubmit} className="space-y-4">
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
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  required
                >
                  <option value="">Selecione...</option>
                  {categorias
                    .filter(cat => cat.tipo === (activeTab === 'despesas' ? 'despesa' : 'receita'))
                    .map((cat) => (
                    <option key={cat.id} value={cat.nome}>
                      {cat.icone} {cat.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento (opcional)
                </label>
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
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
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
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
                          className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
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
                          className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  rows={3}
                  placeholder="Adicione observações sobre esta transação..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  resetForm();
                }}
                className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading
                  ? "Salvando..."
                  : editId
                  ? "Salvar Alterações"
                  : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {dataLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden text-gray-800">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("despesas")}
              className={`flex-1 px-4 py-3 text-center font-medium ${
                activeTab === "despesas"
                  ? "bg-primary-50 text-primary-600 border-b-2 border-primary-600"
                  : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Despesas ({despesas.length})
            </button>

            <button
              onClick={() => setActiveTab("receitas")}
              className={`flex-1 px-4 py-3 text-center font-medium ${
                activeTab === "receitas"
                  ? "bg-primary-50 text-primary-600 border-b-2 border-primary-600"
                  : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Receitas ({receitas.length})
            </button>
          </div>

          <div className="divide-y">
            {filteredData.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
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
                        {item.data_vencimento && (
                          <span className="ml-2">
                            • Venc: {formatDate(item.data_vencimento)}
                          </span>
                        )}
                        {activeTab === "despesas" && item.tipo === "cartao" && (
                          <span className="ml-2 text-blue-500">
                            {cartoes.find((c) => c.id === item.cartaoId)?.nome}
                          </span>
                        )}
                      </p>
                      {item.observacoes && (
                        <p className="text-xs text-gray-400 mt-1">
                          {item.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
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
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            getStatusColor(item.status) === 'green'
                              ? 'bg-green-100 text-green-700'
                              : getStatusColor(item.status) === 'yellow'
                              ? 'bg-yellow-100 text-yellow-700'
                              : getStatusColor(item.status) === 'red'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                        
                        {item.status === 'pendente' && (
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            className="text-xs border border-neutral-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="paga">
                              {activeTab === 'despesas' ? 'Pagar' : 'Receber'}
                            </option>
                            <option value="cancelada">Cancelar</option>
                          </select>
                        )}
                      </div>
                    </div>
                    
                    {/* Botão Editar */}
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-neutral-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-all duration-200 transform hover:scale-110"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDialog({
                        isOpen: true,
                        item,
                        type: activeTab === "despesas" ? "despesa" : "receita"
                      })}
                      className="p-2 text-neutral-400 hover:text-accent-500 rounded-full hover:bg-accent-50 transition-all duration-200 transform hover:scale-110"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && !dataLoading && (
              <div className="p-8 text-center text-neutral-500">
                <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
                <p>
                  {searchQuery 
                    ? 'Nenhum registro encontrado para sua busca' 
                    : 'Nenhum registro encontrado'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog de confirmação */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, item: null, type: 'despesa' })}
        onConfirm={handleDeleteConfirm}
        title={`Excluir ${confirmDialog.type}`}
        message={`Tem certeza que deseja excluir esta ${confirmDialog.type}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
      />

      {/* Filtros Avançados */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={handleAdvancedFiltersApply}
        cartoes={cartoes}
        categorias={categorias}
      />
    </div>
  );
};

export default TransacoesPage;