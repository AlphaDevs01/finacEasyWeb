import { NavLink } from 'react-router-dom';
import { 
  CreditCard, 
  BarChart3, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Settings, 
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  closeSidebar: () => void;
}

const NavItem = ({ to, icon, label, closeSidebar }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      onClick={closeSidebar}
      className={({ isActive }) => 
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-900 text-white' 
            : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <span className="mr-3">{icon}</span>
      {label}
    </NavLink>
  );
};

const Sidebar = ({ isOpen, closeSidebar }: SidebarProps) => {
  return (
    <div 
      className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Cabeçalho do Sidebar com logo */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <CreditCard className="h-6 w-6 text-blue-900 mr-2" />
          <h1 className="text-xl font-bold text-blue-900">FinControl</h1>
        </div>
        
        {/* Botão de fechar no mobile */}
        <button 
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Links de navegação */}
      <nav className="py-4 px-3 space-y-1">
        <NavItem to="/" icon={<BarChart3 size={20} />} label="Dashboard" closeSidebar={closeSidebar} />
        <NavItem to="/cartoes" icon={<CreditCard size={20} />} label="Cartões de Crédito" closeSidebar={closeSidebar} />
        <NavItem to="/despesas" icon={<ArrowUpCircle size={20} />} label="Despesas" closeSidebar={closeSidebar} />
        <NavItem to="/receitas" icon={<ArrowDownCircle size={20} />} label="Receitas" closeSidebar={closeSidebar} />
        <NavItem to="/relatorios" icon={<Wallet size={20} />} label="Relatórios" closeSidebar={closeSidebar} />
        
        <div className="pt-4 mt-4 border-t border-slate-200">
          <NavItem to="/configuracoes" icon={<Settings size={20} />} label="Configurações" closeSidebar={closeSidebar} />
        </div>
      </nav>
      
      {/* Resumo financeiro */}
      <div className="mt-auto p-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 mb-2">Resumo do mês</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Receitas:</span>
            <span className="font-medium text-income">R$ 5.200,00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Despesas:</span>
            <span className="font-medium text-expense">R$ 3.840,00</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between font-medium">
            <span>Saldo:</span>
            <span className="text-income">R$ 1.360,00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;