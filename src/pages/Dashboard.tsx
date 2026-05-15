import React, { useEffect, useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, DollarSign, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import OpenFinanceConnect from '../components/ui/OpenFinanceConnect';

const Dashboard: React.FC = () => {
  const { dashboard, loadDashboard, historico, loadHistorico, cartoes, loadCartoes } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [alertas, setAlertas] = useState<any[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadDashboard(currentMonth, currentYear);
    loadHistorico(currentYear);
    loadCartoes();
    loadAlertas();
  }, [currentMonth, currentYear]);
  
  const loadAlertas = async () => {
    try {
      const response = await api.get('/dashboard/alertas');
      setAlertas(response.data);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear; i++) {
      years.push(i);
    }
    return years;
  };
  
  const changeMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(parseInt(e.target.value));
  };
  
  const changeYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentYear(parseInt(e.target.value));
  };
  
  // Funções para navegar entre meses
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };
  
  // Cores para o gráfico de categorias
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#CD6155'];
  
  // Formatar valor como moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Dados para o gráfico de barras (despesas diárias)
  const prepareBarChartData = () => {
    if (!dashboard) return [];
    
    // Criar objeto para mapear dia -> { despesas, receitas }
    const diasDoMes = new Date(currentYear, currentMonth, 0).getDate();
    const chartData = Array.from({ length: diasDoMes }, (_, i) => ({
      dia: i + 1,
      despesas: 0,
      receitas: 0
    }));
    
    // Preencher com dados reais
    dashboard.despesas_diarias.forEach(item => {
      const dia = parseInt(item.dia) - 1;
      if (dia >= 0 && dia < chartData.length) {
        chartData[dia].despesas = parseFloat(item.total);
      }
    });
    
    dashboard.receitas_diarias.forEach(item => {
      const dia = parseInt(item.dia) - 1;
      if (dia >= 0 && dia < chartData.length) {
        chartData[dia].receitas = parseFloat(item.total);
      }
    });
    
    return chartData;
  };
  
  // Dados para o gráfico de linha (histórico anual)
  const prepareLineChartData = () => {
    if (!historico) return [];
    
    return months.map((month, index) => ({
      name: month.substring(0, 3),
      receitas: historico.receitas_mensais[index] || 0,
      despesas: historico.despesas_mensais[index] || 0,
      saldo: historico.saldo_mensal[index] || 0
    }));
  };
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 md:mt-0 items-center">
          {/* Botão mês anterior */}
          <button
            onClick={goToPrevMonth}
            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 shadow-soft border border-neutral-200 dark:border-neutral-600 transition-all duration-200 hover:scale-105"
            title="Mês anterior"
            type="button"
          >
            &#8592;
          </button>
          <select
            value={currentMonth}
            onChange={changeMonth}
            className="border border-neutral-300 dark:border-neutral-600 rounded-xl px-4 py-2 bg-white dark:bg-neutral-700 dark:text-neutral-100 shadow-soft focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          {/* Botão próximo mês */}
          <button
            onClick={goToNextMonth}
            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 shadow-soft border border-neutral-200 dark:border-neutral-600 transition-all duration-200 hover:scale-105"
            title="Próximo mês"
            type="button"
          >
            &#8594;
          </button>
          <select
            value={currentYear}
            onChange={changeYear}
            className="border border-neutral-300 dark:border-neutral-600 rounded-xl px-4 py-2 bg-white dark:bg-neutral-700 dark:text-neutral-100 shadow-soft focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          >
            {generateYears().map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {dashboard ? (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Saldo */}
            <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Saldo do Mês</p>
                  <h3 className={`text-2xl font-bold ${dashboard.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(dashboard.saldo)}
                  </h3>
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  dashboard.saldo >= 0 ? 'bg-green-100 text-green-500' : 'bg-accent-100 text-accent-500'
                }`}>
                  {dashboard.saldo >= 0 ? (
                    <ArrowUpRight />
                  ) : (
                    <ArrowDownRight />
                  )}
                </div>
              </div>
            </div>
            
            {/* Receitas */}
            <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Receitas</p>
                  <h3 className="text-2xl font-bold text-green-500">
                    {formatCurrency(dashboard.receitas)}
                  </h3>
                  {dashboard.receitas_pendentes > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      {formatCurrency(dashboard.receitas_pendentes)} pendentes
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-green-100 text-green-500">
                  <DollarSign />
                </div>
              </div>
            </div>
            
            {/* Despesas */}
            <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Despesas</p>
                  <h3 className="text-2xl font-bold text-accent-500">
                    {formatCurrency(dashboard.despesas)}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    {dashboard.despesas_pendentes > 0 && (
                      <p className="text-xs text-yellow-600">
                        {formatCurrency(dashboard.despesas_pendentes)} pendentes
                      </p>
                    )}
                    {dashboard.despesas_vencidas > 0 && (
                      <p className="text-xs text-accent-600">
                        {formatCurrency(dashboard.despesas_vencidas)} vencidas
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-accent-100 text-accent-500">
                  <ArrowDownRight />
                </div>
              </div>
            </div>
            
            {/* Limite dos Cartões */}
            <div className="bg-white dark:bg-neutral-700 p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50 hover:shadow-strong transition-all duration-300 hover:scale-[1.02]">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Limite Disponível</p>
                  <h3 className="text-2xl font-bold text-primary-500">
                    {formatCurrency(dashboard.limite_disponivel_cartoes || 0)}
                  </h3>
                  {dashboard.limite_total_cartoes > 0 && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {dashboard.percentual_limite_usado.toFixed(1)}% utilizado
                    </p>
                  )}
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  dashboard.percentual_limite_usado >= 80 
                    ? 'bg-accent-100 text-accent-500' 
                    : 'bg-primary-100 text-primary-500'
                }`}>
                  <CreditCard />
                </div>
              </div>
            </div>
          </div>
          
          {/* Alertas */}
          {alertas.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-100">Alertas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alertas.map((alerta, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-l-4 shadow-soft bg-white dark:bg-neutral-700 ${
                      alerta.prioridade === 'alta'
                        ? 'bg-accent-50 dark:bg-accent-900/20 border-accent-500'
                        : alerta.prioridade === 'media'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                        : 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={20}
                        className={
                          alerta.prioridade === 'alta'
                            ? 'text-accent-500'
                            : alerta.prioridade === 'media'
                            ? 'text-yellow-500'
                            : 'text-primary-500'
                        }
                      />
                      <div>
                        <h3 className="font-medium text-neutral-800 dark:text-neutral-100">{alerta.titulo}</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{alerta.mensagem}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de barras - Despesas e Receitas Diárias */}
            <div className="bg-white dark:bg-neutral-700 p-4 sm:p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50">
              <h3 className="text-xl font-bold mb-6 text-neutral-800 dark:text-neutral-100">Movimento Diário</h3>
              <div className="h-64 sm:h-80 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={prepareBarChartData()} 
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dia" 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="receitas" fill="#147361" name="Receitas" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfico de linha - Evolução Anual */}
            <div className="bg-white dark:bg-neutral-700 p-4 sm:p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50">
              <h3 className="text-xl font-bold mb-6 text-neutral-800 dark:text-neutral-100">Evolução Anual</h3>
              <div className="h-64 sm:h-80 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={prepareLineChartData()} 
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="receitas" 
                      stroke="#147361" 
                      strokeWidth={3}
                      name="Receitas"
                      dot={{ fill: '#147361', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="Despesas"
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="#285950" 
                      strokeWidth={3}
                      name="Saldo"
                      dot={{ fill: '#285950', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Seção inferior - Categorias e Cartões */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Open Finance */}
            <div className="lg:col-span-3 mb-8">
              <OpenFinanceConnect />
            </div>
            
            {/* Categorias de Despesas */}
            <div className="bg-white dark:bg-neutral-700 p-4 sm:p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50 lg:col-span-1">
              <h3 className="text-xl font-bold mb-6 text-neutral-800 dark:text-neutral-100">Despesas por Categoria</h3>
              {(dashboard.categorias_despesas && dashboard.categorias_despesas.length > 0) ? (
                <div className="h-64 sm:h-80 flex items-center justify-center w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          dashboard.categorias_despesas.map((item: any) => ({
                            categoria: item.categoria,
                            total: Number(item.total)
                          }))
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="total"
                        nameKey="categoria"
                      >
                        {dashboard.categorias_despesas.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                        formatter={(value: any, entry: any, index: number) => {
                          const categoria = dashboard.categorias_despesas[index]?.categoria || value;
                          const total = dashboard.categorias_despesas[index]?.total || 0;
                          return (
                            <span className="dark:text-neutral-100 text-neutral-800">
                              {categoria}: {formatCurrency(Number(total))}
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                  Nenhuma despesa registrada neste mês
                </p>
              )}
            </div>
            
            {/* Cartões */}
            <div className="bg-white dark:bg-neutral-700 p-4 sm:p-6 rounded-2xl shadow-medium border border-neutral-200/50 dark:border-neutral-600/50 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Seus Cartões</h3>
                <button 
                  onClick={() => navigate('/cartoes')}
                  className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Ver todos
                </button>
              </div>
              
              {cartoes && cartoes.length > 0 ? (
                <div className="space-y-4">
                  {cartoes.slice(0, 3).map(cartao => (
                    <div 
                      key={cartao.id}
                      onClick={() => navigate(`/cartoes/${cartao.id}`)}
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 p-5 rounded-2xl text-white shadow-medium cursor-pointer hover:shadow-strong transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{cartao.nome}</span>
                        <CreditCard size={20} />
                      </div>
                      <div className="text-sm opacity-80">**** **** **** {cartao.numero}</div>
                      <div className="mt-3 flex justify-between">
                        <div>
                          <p className="text-xs opacity-80">Limite</p>
                          <p className="font-semibold">{formatCurrency(cartao.limite)}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-80">Fechamento</p>
                          <p className="font-semibold">Dia {cartao.data_fechamento}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-50 dark:bg-neutral-600 rounded-2xl p-6 text-center">
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">Você ainda não tem cartões cadastrados</p>
                  <button
                    onClick={() => navigate('/cartoes')}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Adicionar Cartão
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;