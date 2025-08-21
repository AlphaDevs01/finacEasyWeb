import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard } from 'lucide-react';

const Register: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !email || !senha || !confirmSenha) {
      setError('Preencha todos os campos');
      return;
    }
    
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(nome, email, senha);
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 p-4 shadow-medium">
            <CreditCard className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-neutral-800 tracking-tight">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Comece a controlar suas finanças agora mesmo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-medium sm:rounded-2xl sm:px-10 border border-neutral-200/50">
          {error && (
            <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded-xl mb-4 animate-slide-down">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-neutral-700">
                Nome
              </label>
              <div className="mt-1">
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-soft placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-soft placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-neutral-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-soft placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmSenha" className="block text-sm font-medium text-neutral-700">
                Confirmar Senha
              </label>
              <div className="mt-1">
                <input
                  id="confirmSenha"
                  name="confirmSenha"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-soft placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-medium text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-[1.02] ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">
                  Ou
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm text-neutral-600">
                  Já tem uma conta?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Fazer login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;