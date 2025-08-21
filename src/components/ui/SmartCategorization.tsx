import React, { useState, useEffect } from 'react';
import { Brain, Tag, TrendingUp, Settings, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from './Toast';

interface CategoryRule {
  id: number;
  pattern: string;
  categoria: string;
  confidence: number;
  active: boolean;
}

interface SmartCategorizationProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartCategorization: React.FC<SmartCategorizationProps> = ({
  isOpen,
  onClose
}) => {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [newRule, setNewRule] = useState({
    pattern: '',
    categoria: '',
    confidence: 0.8
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadRules();
      loadCategories();
    }
  }, [isOpen]);

  const loadRules = async () => {
    try {
      // Simular regras de categorização
      const mockRules: CategoryRule[] = [
        {
          id: 1,
          pattern: 'SUPERMERCADO|MERCADO|EXTRA|CARREFOUR',
          categoria: 'Alimentação',
          confidence: 0.95,
          active: true
        },
        {
          id: 2,
          pattern: 'POSTO|SHELL|PETROBRAS|IPIRANGA',
          categoria: 'Transporte',
          confidence: 0.90,
          active: true
        },
        {
          id: 3,
          pattern: 'FARMACIA|DROGARIA|DROGA',
          categoria: 'Saúde',
          confidence: 0.85,
          active: true
        }
      ];
      
      setRules(mockRules);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categorias');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newRuleData = {
        id: Date.now(),
        pattern: newRule.pattern.toUpperCase(),
        categoria: newRule.categoria,
        confidence: newRule.confidence,
        active: true
      };

      setRules(prev => [...prev, newRuleData]);
      setNewRule({ pattern: '', categoria: '', confidence: 0.8 });
      
      showToast({
        type: 'success',
        title: 'Regra adicionada!',
        message: 'Nova regra de categorização criada com sucesso'
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro ao adicionar regra',
        message: 'Não foi possível criar a regra'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, active: !rule.active }
          : rule
      )
    );
  };

  const handleDeleteRule = async (ruleId: number) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    
    showToast({
      type: 'success',
      title: 'Regra removida!',
      message: 'A regra foi removida com sucesso'
    });
  };

  const testRule = (pattern: string, testText: string): boolean => {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(testText);
    } catch {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <Brain size={24} />
            Categorização Inteligente
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-all duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Configurações de IA */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800">Categorização por IA</h3>
                <p className="text-sm text-blue-600">
                  Use inteligência artificial para categorizar transações automaticamente
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Adicionar Nova Regra */}
          <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 mb-6">
            <h3 className="text-lg font-semibold mb-4">Adicionar Nova Regra</h3>
            
            <form onSubmit={handleAddRule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Padrão (Regex)
                  </label>
                  <input
                    type="text"
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    placeholder="Ex: SUPERMERCADO|MERCADO"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newRule.categoria}
                    onChange={(e) => setNewRule({ ...newRule, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.nome}>
                        {cat.icone} {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Confiança
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={newRule.confidence}
                    onChange={(e) => setNewRule({ ...newRule, confidence: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-neutral-500 text-center">
                    {Math.round(newRule.confidence * 100)}%
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-medium disabled:opacity-70"
              >
                <Save size={20} />
                {loading ? 'Salvando...' : 'Adicionar Regra'}
              </button>
            </form>
          </div>

          {/* Lista de Regras */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Regras Ativas</h3>
            
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  rule.active 
                    ? 'bg-white border-neutral-200 hover:shadow-medium'
                    : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="bg-neutral-100 px-2 py-1 rounded text-sm font-mono">
                        {rule.pattern}
                      </code>
                      <span className="text-sm text-neutral-600">→</span>
                      <span className="font-medium text-neutral-800">{rule.categoria}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {Math.round(rule.confidence * 100)}%
                      </span>
                    </div>
                    
                    <div className="text-sm text-neutral-500">
                      Exemplos que correspondem: 
                      <span className="ml-1 font-mono">
                        {rule.pattern.split('|').slice(0, 2).join(', ')}
                        {rule.pattern.split('|').length > 2 && '...'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => handleToggleRule(rule.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                    
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-neutral-400 hover:text-accent-500 rounded-full hover:bg-accent-50 transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <Tag size={48} className="mx-auto mb-2 opacity-50" />
                <p>Nenhuma regra de categorização criada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCategorization;