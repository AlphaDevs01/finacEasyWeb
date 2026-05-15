import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Download, Filter } from 'lucide-react';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [selectedYear] = useState(2025);
  const [selectedMonth] = useState(5); // Maio

  // Dados para o gráfico de evolução patrimonial
  const balanceData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Patrimônio Total',
        data: [15000, 16200, 17500, 18800, 20100, 21500, 23000, 24600, 26300, 28100, 30000, 32000],
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  // Dados para o gráfico de receitas e despesas
  const monthlyComparisonData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Receitas',
        data: [4200, 4500, 5100, 5700, 5200, 5300, 5600, 5800, 6100, 5900, 6200, 6500],
        backgroundColor: '#10B981',
      },
      {
        label: 'Despesas',
        data: [3800, 4100, 4300, 4500, 3840, 4100, 4300, 4200, 4600, 4500, 4800, 5100],
        backgroundColor: '#EF4444',
      }
    ],
  };

  // Opções comuns para os gráficos
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => {
            return `R$ ${value.toLocaleString('pt-BR')}`;
          },
        },
      },
    },
  };

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-slate-500">Análise detalhada das suas finanças</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex items-center">
            <Filter size={18} className="mr-2" />
            Filtrar
          </button>
          <button className="btn btn-primary flex items-center">
            <Download size={18} className="mr-2" />
            Exportar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Resumo do período */}
        <div className="card p-5">
          <h2 className="font-medium mb-4">Resumo do Período</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Receitas</p>
              <p className="text-xl font-semibold text-income">R$ 5.200,00</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Despesas</p>
              <p className="text-xl font-semibold text-expense">R$ 3.840,00</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Saldo</p>
              <p className="text-xl font-semibold text-blue-600">R$ 1.360,00</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Economia</p>
              <p className="text-xl font-semibold text-blue-600">26%</p>
            </div>
          </div>
        </div>

        {/* Metas e objetivos */}
        <div className="card p-5">
          <h2 className="font-medium mb-4">Metas e Objetivos</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Meta de economia</span>
                <span>R$ 1.500,00 / R$ 2.000,00</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Limite de gastos</span>
                <span>R$ 3.840,00 / R$ 4.000,00</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '96%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        {/* Evolução Patrimonial */}
        <div className="card p-5">
          <h2 className="font-medium mb-4">Evolução Patrimonial ({selectedYear})</h2>
          <div className="h-[300px]">
            <Line data={balanceData} options={chartOptions} />
          </div>
        </div>

        {/* Comparativo Mensal */}
        <div className="card p-5">
          <h2 className="font-medium mb-4">Comparativo Mensal ({selectedYear})</h2>
          <div className="h-[300px]">
            <Bar data={monthlyComparisonData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;