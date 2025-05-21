import React, { useEffect, useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { dashboard, loadDashboard, historico, loadHistorico, cartoes, loadCartoes } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();
  
  useEffect(() => {
    loadDashboard(currentMonth, currentYear);
    loadHistorico(currentYear);
    loadCartoes();
  }, [currentMonth, currentYear]);
  
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
        <h1 className=" dark:text-white text-2xl font-bold text-gray-700">Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 md:mt-0">
          <select
            value={currentMonth}
            onChange={changeMonth}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          
          <select
            value={currentYear}
            onChange={changeYear}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Saldo */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Saldo do Mês</p>
                  <h3 className={`text-2xl font-bold ${dashboard.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(dashboard.saldo)}
                  </h3>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  dashboard.saldo >= 0 ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
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
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receitas</p>
                  <h3 className="text-2xl font-bold text-green-500">
                    {formatCurrency(dashboard.receitas)}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-100 text-green-500">
                  <DollarSign />
                </div>
              </div>
            </div>
            
            {/* Despesas */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Despesas</p>
                  <h3 className="text-2xl font-bold text-red-500">
                    {formatCurrency(dashboard.despesas)}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-red-100 text-red-500">
                  <ArrowDownRight />
                </div>
              </div>
            </div>
            
            {/* Faturas Pendentes */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Faturas Pendentes</p>
                  <h3 className="text-2xl font-bold text-yellow-500">
                    {formatCurrency(dashboard.faturas_pendentes)}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-yellow-100 text-yellow-500">
                  <CreditCard />
                </div>
              </div>
            </div>
          </div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de barras - Despesas e Receitas Diárias */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Movimento Diário</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareBarChartData()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfico de linha - Evolução Anual */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Evolução Anual</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareLineChartData()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" />
                    <Line type="monotone" dataKey="despesas" stroke="#ef4444" name="Despesas" />
                    <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Seção inferior - Categorias e Cartões */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categorias de Despesas */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Despesas por Categoria</h3>
              {dashboard.categorias_despesas.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard.categorias_despesas}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                        nameKey="categoria"
                        label={({ categoria, total }) => `${categoria}: ${formatCurrency(total)}`}
                      >
                        {dashboard.categorias_despesas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma despesa registrada neste mês
                </p>
              )}
            </div>
            
            {/* Cartões */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Seus Cartões</h3>
                <button 
                  onClick={() => navigate('/cartoes')}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
                      className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 rounded-lg text-white shadow cursor-pointer hover:shadow-lg transition-shadow"
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
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-3">Você ainda não tem cartões cadastrados</p>
                  <button
                    onClick={() => navigate('/cartoes')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;