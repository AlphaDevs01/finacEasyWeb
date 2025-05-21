import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { Sun, Moon, Bell, BellOff, Save, AlertCircle } from 'lucide-react';

const Configuracoes: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { configuracoes, salvarConfiguracoes } = useFinance();
  
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tema, setTema] = useState(configuracoes?.tema || 'claro');
  const [notificacoes, setNotificacoes] = useState(configuracoes?.notificacoes_email || false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (configuracoes) {
      setTema(configuracoes.tema);
      setNotificacoes(configuracoes.notificacoes_email);
    }
  }, [configuracoes]);
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await updateUser({ nome, email });
      setSuccess('Perfil atualizado com sucesso!');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Pegue o token do localStorage (JWT) com a chave correta usada no projeto
      let token = localStorage.getItem('@FinanceApp:token');
      if (!token) {
        token = sessionStorage.getItem('@FinanceApp:token');
      }
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      // Troca de senha deve ser feita no endpoint /api/configuracoes/senha
      // Use a URL do backend diretamente para evitar problemas de proxy
      const apiUrl =
        import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
        'http://localhost:3000';

      const response = await fetch(`${apiUrl}/api/configuracoes/senha`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar senha');
      }

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setSuccess('Senha atualizada com sucesso!');
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePreferences = async () => {
    try {
      await salvarConfiguracoes({
        notificacoes_email: notificacoes,
        tema
      });
      setSuccess('Preferências salvas com sucesso!');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao salvar preferências');
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
          <Save size={20} />
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Perfil</h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </form>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Alterar Senha</h2>
          
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Preferências</h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tema
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setTema('claro')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    tema === 'claro'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Sun size={20} />
                  Claro
                </button>
                <button
                  onClick={() => setTema('escuro')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    tema === 'escuro'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Moon size={20} />
                  Escuro
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notificações por Email
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setNotificacoes(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    notificacoes
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Bell size={20} />
                  Ativadas
                </button>
                <button
                  onClick={() => setNotificacoes(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    !notificacoes
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BellOff size={20} />
                  Desativadas
                </button>
              </div>
            </div>
            
            <button
              onClick={handleSavePreferences}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;