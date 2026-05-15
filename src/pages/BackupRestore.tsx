import React, { useState } from 'react';
import { Download, Upload, Database, Shield, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

const BackupRestore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<any>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const handleBackup = async () => {
    setLoading(true);
    try {
      const response = await api.get('/backup/export');
      const data = response.data;
      
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        user: user?.nome,
        data: data
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financEasy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Backup criado!',
        message: 'Seus dados foram exportados com sucesso',
        icon: <Database className="h-5 w-5 text-primary-500" />
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro no backup',
        message: error.response?.data?.error || 'Erro ao criar backup'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setBackupData(data);
        } catch (error) {
          showToast({
            type: 'error',
            title: 'Arquivo inválido',
            message: 'O arquivo selecionado não é um backup válido'
          });
          setRestoreFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestore = async () => {
    if (!backupData) {
      showToast({
        type: 'error',
        title: 'Nenhum arquivo selecionado',
        message: 'Selecione um arquivo de backup válido'
      });
      return;
    }

    const confirmRestore = window.confirm(
      'ATENÇÃO: Esta ação irá substituir todos os seus dados atuais pelos dados do backup. Esta ação não pode ser desfeita. Deseja continuar?'
    );

    if (!confirmRestore) return;

    setLoading(true);
    try {
      await api.post('/backup/import', { data: backupData.data });
      
      showToast({
        type: 'success',
        title: 'Dados restaurados!',
        message: 'Seus dados foram restaurados com sucesso. A página será recarregada.',
        duration: 3000
      });

      // Recarregar a página após 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Erro na restauração',
        message: error.response?.data?.error || 'Erro ao restaurar dados'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getDataSummary = () => {
    if (!backupData?.data) return null;

    const data = backupData.data;
    return {
      cartoes: data.cartoes?.length || 0,
      despesas: data.despesas?.length || 0,
      receitas: data.receitas?.length || 0,
      investimentos: data.investimentos?.length || 0,
      metas: data.metas?.length || 0
    };
  };

  const summary = getDataSummary();

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Backup e Restauração</h1>
        <p className="text-neutral-600 mb-8">
          Faça backup dos seus dados financeiros ou restaure de um backup anterior
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Backup */}
          <div className="bg-white p-8 rounded-2xl shadow-medium border border-neutral-200/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Fazer Backup</h2>
              <p className="text-neutral-600 mb-6">
                Exporte todos os seus dados financeiros para um arquivo seguro
              </p>
              
              <div className="bg-primary-50 p-4 rounded-xl mb-6">
                <h3 className="font-semibold text-primary-800 mb-2 flex items-center gap-2">
                  <Shield size={20} />
                  O que será incluído:
                </h3>
                <ul className="text-sm text-primary-700 space-y-1 text-left">
                  <li>• Cartões de crédito</li>
                  <li>• Despesas e receitas</li>
                  <li>• Investimentos</li>
                  <li>• Metas de gastos</li>
                  <li>• Categorias personalizadas</li>
                  <li>• Configurações</li>
                </ul>
              </div>

              <button
                onClick={handleBackup}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                    Criando backup...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Fazer Backup
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Restore */}
          <div className="bg-white p-8 rounded-2xl shadow-medium border border-neutral-200/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-secondary-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Restaurar Backup</h2>
              <p className="text-neutral-600 mb-6">
                Restaure seus dados de um arquivo de backup anterior
              </p>

              <div className="mb-6">
                <label className="block w-full">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 cursor-pointer hover:border-secondary-500 hover:bg-secondary-50 transition-all duration-200">
                    <FileText className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">
                      {restoreFile ? restoreFile.name : 'Clique para selecionar arquivo de backup'}
                    </p>
                  </div>
                </label>
              </div>

              {backupData && (
                <div className="bg-secondary-50 p-4 rounded-xl mb-6 text-left">
                  <h3 className="font-semibold text-secondary-800 mb-2">Informações do Backup:</h3>
                  <div className="text-sm text-secondary-700 space-y-1">
                    <p><strong>Data:</strong> {formatDate(backupData.timestamp)}</p>
                    <p><strong>Usuário:</strong> {backupData.user}</p>
                    <p><strong>Versão:</strong> {backupData.version}</p>
                    {summary && (
                      <div className="mt-3 pt-3 border-t border-secondary-200">
                        <p className="font-medium mb-1">Dados incluídos:</p>
                        <ul className="space-y-1">
                          <li>• {summary.cartoes} cartões</li>
                          <li>• {summary.despesas} despesas</li>
                          <li>• {summary.receitas} receitas</li>
                          <li>• {summary.investimentos} investimentos</li>
                          <li>• {summary.metas} metas</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-red-50 p-4 rounded-xl mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-semibold mb-1">Atenção!</p>
                    <p>A restauração irá substituir todos os seus dados atuais. Faça um backup antes de continuar.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRestore}
                disabled={loading || !backupData}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary-500 to-accent-500 text-white rounded-xl hover:from-secondary-600 hover:to-accent-600 transition-all duration-200 transform hover:scale-105 shadow-medium focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 ${
                  loading || !backupData ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Restaurar Dados
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Informações de Segurança */}
        <div className="mt-8 bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="text-primary-600" size={20} />
            Informações de Segurança
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-neutral-700">
            <div>
              <h4 className="font-semibold mb-2">Sobre os Backups:</h4>
              <ul className="space-y-1">
                <li>• Os dados são exportados em formato JSON</li>
                <li>• Senhas não são incluídas no backup</li>
                <li>• Recomendamos fazer backup regularmente</li>
                <li>• Mantenha seus arquivos de backup seguros</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Sobre a Restauração:</h4>
              <ul className="space-y-1">
                <li>• Todos os dados atuais serão substituídos</li>
                <li>• A operação não pode ser desfeita</li>
                <li>• Faça backup antes de restaurar</li>
                <li>• Verifique a integridade do arquivo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;