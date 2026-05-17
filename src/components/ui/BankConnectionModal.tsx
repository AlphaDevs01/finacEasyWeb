import React, { useEffect, useMemo, useState } from 'react';
import { X, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { PluggyConnector } from '../../services/pluggy';

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connector: PluggyConnector | null;
  onConnect: (credentials: Record<string, string>) => Promise<void>;
}

const BankConnectionModal: React.FC<BankConnectionModalProps> = ({
  isOpen,
  onClose,
  connector,
  onConnect
}) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedConsent, setAcceptedConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptedConsent) {
      setError('Para conectar um banco, é necessário aceitar o termo de autorização de uso de dados financeiros.');
      return;
    }

    setLoading(true);

    try {
      await onConnect(credentials);
      setCredentials({});
      setShowPasswords({});
      setAcceptedConsent(false);
    } catch (error: any) {
      const apiData = error?.response?.data;
      const apiError = apiData?.error;
      const apiDetails = apiData?.details;
      const requestId = apiData?.requestId;
      const detailMessage = apiDetails?.data?.message || apiDetails?.data?.error || apiDetails?.data?.detail;
      const debugMessage = [apiError || error.message || 'Erro ao conectar com o banco', detailMessage, requestId ? `RequestId: ${requestId}` : null]
        .filter(Boolean)
        .join(' | ');
      setError(debugMessage);
      console.error('Erro detalhado ao conectar Open Finance:', apiData || error);
    } finally {
      setLoading(false);
    }
  };

  const updateCredential = (name: string, value: string) => {
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleInputChange = (field: any, value: string) => {
    if (field.name.toLowerCase().includes('cpf')) {
      value = formatCPF(value);
    }
    updateCredential(field.name, value);
  };

  const credentialFields = useMemo(() => connector?.credentials || [], [connector]);
  const hasCredentialFields = Array.isArray(credentialFields) && credentialFields.length > 0;
  const allRequiredFieldsFilled = hasCredentialFields && credentialFields.every((field) => {
    const value = credentials[field.name];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });

  useEffect(() => {
    if (!isOpen) return;
    setCredentials({});
    setShowPasswords({});
    setError('');
    setAcceptedConsent(false);
  }, [isOpen, connector?.id]);

  if (!isOpen || !connector) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-strong sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <img 
              src={connector.imageUrl} 
              alt={connector.name}
              className="w-8 h-8 rounded"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/bank-fallback.svg';
              }}
            />
            <div>
              <h2 className="text-xl font-bold text-neutral-800">Conectar {connector.name}</h2>
              <p className="text-sm text-neutral-600">Digite suas credenciais bancárias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Aviso de Segurança */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Segurança Garantida</h3>
                <p className="text-sm text-blue-700">
                  Suas credenciais são enviadas ao backend seguro da aplicação e repassadas à Pluggy por conexão criptografada. 
                  Não armazenamos suas senhas nem expomos chaves Pluggy no navegador.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Erro na Conexão</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!hasCredentialFields && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                Este conector não retornou campos de credencial. Se ele usar fluxo de consentimento externo, será necessário implementar o Connect Token/Pluggy Connect para esse banco.
              </div>
            )}

            {credentialFields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showPasswords[field.name] ? 'password' : 'text'}
                    value={credentials[field.name] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.name)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPasswords[field.name] ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  )}
                </div>
                {field.validation && (
                  <p className="text-xs text-neutral-500 mt-1">{field.validation}</p>
                )}
              </div>
            ))}


            <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={acceptedConsent}
                onChange={(event) => setAcceptedConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                required
              />
              <span>
                Autorizo o uso dos meus dados financeiros para conexão, sincronização e categorização das informações deste banco, conforme Termos de Uso e Política de Privacidade da aplicação.
              </span>
            </label>

            <div className="sticky bottom-0 -mx-4 bg-white px-4 pb-2 pt-4 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0">
              <button
                type="submit"
                disabled={loading || !acceptedConsent || !hasCredentialFields || !allRequiredFieldsFilled || !allRequiredFieldsFilled}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  loading || !acceptedConsent || !hasCredentialFields || !allRequiredFieldsFilled
                    ? 'bg-primary-100 text-primary-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 transform hover:scale-105 shadow-medium'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
                    Conectando...
                  </>
                ) : (
                  'Conectar Banco'
                )}
              </button>
              {hasCredentialFields && !allRequiredFieldsFilled && (
                <p className="mt-2 text-center text-xs text-neutral-500">
                  Preencha todos os campos exigidos pelo banco para habilitar a conexão.
                </p>
              )}
            </div>
          </form>

          {/* Informações sobre o processo */}
          <div className="mt-6 bg-neutral-50 rounded-xl p-4">
            <h4 className="font-semibold text-neutral-800 mb-2">Como funciona:</h4>
            <ol className="text-sm text-neutral-600 space-y-1">
              <li>1. Suas credenciais são enviadas ao backend seguro da aplicação</li>
              <li>2. O banco valida suas informações de forma segura</li>
              <li>3. Recebemos autorização para acessar seus dados (somente leitura)</li>
              <li>4. Suas transações são importadas automaticamente</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankConnectionModal;