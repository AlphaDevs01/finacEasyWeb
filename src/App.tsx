import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cartoes from './pages/Cartoes';
import DetalhesCartao from './pages/DetalhesCartao';
import TransacoesPage from './pages/TransacoesPage';
import Investimentos from './pages/Investimentos';
import Relatorios from './pages/Relatorios';
import ImportacaoPage from './pages/ImportacaoPage';
import Configuracoes from './pages/Configuracoes';
import NotFound from './pages/NotFound';
import Faturas from './pages/Faturas';
import Metas from './pages/Metas';
import OpenFinancePage from './pages/OpenFinancePage';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <FinanceProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route 
                  path="/" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/cartoes" 
                  element={
                    <PrivateRoute>
                      <Cartoes />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/cartoes/:id" 
                  element={
                    <PrivateRoute>
                      <DetalhesCartao />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/transacoes" 
                  element={
                    <PrivateRoute>
                      <TransacoesPage />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/investimentos" 
                  element={
                    <PrivateRoute>
                      <Investimentos />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/relatorios" 
                  element={
                    <PrivateRoute>
                      <Relatorios />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/importacao" 
                  element={
                    <PrivateRoute>
                      <ImportacaoPage />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/configuracoes" 
                  element={
                    <PrivateRoute>
                      <Configuracoes />
                    </PrivateRoute>
                  } 
                />
                
                <Route 
                  path="/faturas"
                  element={
                    <PrivateRoute>
                      <Faturas />
                    </PrivateRoute>
                  }
                />
                
                <Route 
                  path="/metas"
                  element={
                    <PrivateRoute>
                      <Metas />
                    </PrivateRoute>
                  }
                />
                
                <Route 
                  path="/openfinance"
                  element={
                    <PrivateRoute>
                      <OpenFinancePage />
                    </PrivateRoute>
                  }
                />
                
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" />} />
              </Routes>
            </Router>
          </FinanceProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;