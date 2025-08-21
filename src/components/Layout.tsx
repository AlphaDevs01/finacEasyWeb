import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart4, 
  DollarSign, 
  TrendingUp, 
  Upload, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  Tag,
  Calendar,
  Building2
} from 'lucide-react';
import CategoryManager from './ui/CategoryManager';
import ReminderSystem from './ui/ReminderSystem';
import PeriodComparison from './ui/PeriodComparison';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { configuracoes } = useFinance();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showReminderSystem, setShowReminderSystem] = useState(false);
  const [showPeriodComparison, setShowPeriodComparison] = useState(false);
  
  useEffect(() => {
    if (configuracoes) {
      setTheme(configuracoes.tema === 'escuro' ? 'dark' : 'light');
    }
  }, [configuracoes]);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/cartoes', label: 'Cartões', icon: <CreditCard size={20} /> },
    { path: '/faturas', label: 'Faturas', icon: <CreditCard size={20} /> },
    { path: '/transacoes', label: 'Receitas/Despesas', icon: <DollarSign size={20} /> },
    { path: '/investimentos', label: 'Investimentos', icon: <TrendingUp size={20} /> },
    { path: '/metas', label: 'Metas de Gastos', icon: <TrendingUp size={20} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <BarChart4 size={20} /> },
    { path: '/importacao', label: 'Importar CSV', icon: <Upload size={20} /> },
    { path: '/openfinance', label: 'Open Finance', icon: <Building2 size={20} /> },
    { path: '/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
    { 
      path: '#categorias', 
      label: 'Categorias', 
      icon: <Tag size={20} />,
      onClick: () => setShowCategoryManager(true)
    },
    { 
      path: '#lembretes', 
      label: 'Lembretes', 
      icon: <Bell size={20} />,
      onClick: () => setShowReminderSystem(true)
    },
    { 
      path: '#comparacao', 
      label: 'Comparar Períodos', 
      icon: <Calendar size={20} />,
      onClick: () => setShowPeriodComparison(true)
    }
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      {/* Mobile header */}
      <div className="lg:hidden bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 flex justify-between items-center shadow-medium">
        <button 
          className="p-2 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h1 className="font-bold text-xl tracking-tight">FinancEasy</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      
      {/* Sidebar - Desktop */}
      <aside className="fixed top-0 left-0 z-40 h-screen transition-transform bg-gradient-to-b from-primary-500 to-secondary-500 text-white w-64 hidden lg:block shadow-strong">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-bold tracking-tight">FinancEasy</h1>
            <p className="text-sm opacity-80 mt-2">{user?.nome}</p>
            <button
              onClick={toggleTheme}
              className="mt-3 p-2 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors flex items-center gap-2 text-sm"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
          </div>
          
          <nav className="p-4 flex-grow overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white font-medium shadow-soft backdrop-blur-sm'
                        : 'hover:bg-white/10 hover:translate-x-1'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                    {isActive(item.path) && (
                      <ChevronRight className="ml-auto opacity-60" size={16} />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 text-white rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="ml-3">Sair</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Sidebar - Mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={closeSidebar}
      />
      
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-primary-500 to-secondary-500 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold tracking-tight">FinancEasy</h1>
              <p className="text-sm opacity-80 mt-2">{user?.nome}</p>
            </div>
            <button 
              className="p-2 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
              onClick={closeSidebar}
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="p-4 flex-grow overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        navigate(item.path);
                      }
                      closeSidebar();
                    }}
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white font-medium shadow-soft backdrop-blur-sm'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                    {isActive(item.path) && (
                      <ChevronRight className="ml-auto opacity-60" size={16} />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <button
              onClick={toggleTheme}
              className="flex items-center w-full p-3 text-white rounded-xl hover:bg-white/10 transition-all duration-200 mb-2"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span className="ml-3">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 text-white rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="ml-3">Sair</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        <main className="p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Modals */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoryChange={() => {
          // Recarregar dados se necessário
        }}
      />

      <ReminderSystem
        isOpen={showReminderSystem}
        onClose={() => setShowReminderSystem(false)}
      />

      <PeriodComparison
        isOpen={showPeriodComparison}
        onClose={() => setShowPeriodComparison(false)}
      />
    </div>
  );
};

export default Layout;