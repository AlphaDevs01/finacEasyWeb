import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDAÇÃO - ZOD
// ============================================

// Auth Schemas
export const authSchemas = {
  register: z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    email: z.string().email('Email inválido'),
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(128)
  }).strict(),

  login: z.object({
    email: z.string().email('Email inválido'),
    senha: z.string().min(1, 'Senha é obrigatória')
  }).strict(),

  forgotPassword: z.object({
    email: z.string().email('Email inválido')
  }).strict(),

  resetPassword: z.object({
    token: z.string().min(1, 'Token obrigatório'),
    novaSenha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(128)
  }).strict(),

  changePassword: z.object({
    senhaAtual: z.string().min(1, 'Senha atual obrigatória'),
    novaSenha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(128)
  }).strict()
};

// Despesas Schema
export const despesaSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória').max(255),
  valor: z.number().positive('Valor deve ser positivo').max(999999.99),
  data: z.string().datetime('Data inválida'),
  categoria: z.string().min(1).max(50),
  tipo: z.enum(['conta', 'cartao']).default('conta'),
  cartaoId: z.number().int().positive().optional().nullable(),
  faturaId: z.number().int().positive().optional().nullable(),
  status: z.enum(['pendente', 'paga', 'atrasada']).default('pendente'),
  dataVencimento: z.string().datetime().optional().nullable(),
  observacoes: z.string().max(1000).optional()
}).strict();

export const despesasImportSchema = z.object({
  data: z.array(despesaSchema).max(5000, 'Máximo 5000 registros por importação')
}).strict();

// Receitas Schema
export const receitaSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória').max(255),
  valor: z.number().positive('Valor deve ser positivo').max(999999.99),
  data: z.string().datetime('Data inválida'),
  categoria: z.string().min(1).max(50),
  status: z.enum(['pendente', 'recebida']).default('pendente'),
  dataVencimento: z.string().datetime().optional().nullable(),
  observacoes: z.string().max(1000).optional()
}).strict();

export const receitasImportSchema = z.object({
  data: z.array(receitaSchema).max(5000, 'Máximo 5000 registros por importação')
}).strict();

// Cartões Schema
export const cartaoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100),
  numero: z.string().length(4, 'Número deve ter 4 dígitos'),
  limite: z.number().positive('Limite deve ser positivo').max(999999.99),
  dataFechamento: z.number().int().min(1).max(31, 'Dia inválido'),
  dataVencimento: z.number().int().min(1).max(31, 'Dia inválido')
}).strict();

// Faturas Schema
export const faturaSchema = z.object({
  cartaoId: z.number().int().positive(),
  mesReferencia: z.number().int().min(1).max(12),
  anoReferencia: z.number().int().min(2000).max(2100),
  valorTotal: z.number().positive().max(999999.99),
  status: z.enum(['aberta', 'fechada', 'paga']).default('aberta')
}).strict();

// Investimentos Schema
export const investimentoSchema = z.object({
  tipo: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  valorAplicado: z.number().positive().max(999999.99),
  rendimentoMensal: z.number().min(0).max(999999.99),
  dataInvestimento: z.string().datetime().optional()
}).strict();

// Metas Schema
export const metaSchema = z.object({
  categoria: z.string().min(1).max(50),
  valorLimite: z.number().positive().max(999999.99),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000).max(2100),
  ativo: z.boolean().default(true)
}).strict();

// Orçamento Schema
export const orcamentoSchema = z.object({
  categoria: z.string().min(1).max(50),
  valorLimite: z.number().positive().max(999999.99),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000).max(2100)
}).strict();

// Categorias Schema
export const categoriaSchema = z.object({
  nome: z.string().min(1).max(100),
  tipo: z.enum(['receita', 'despesa']),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hexadecimal válido'),
  icone: z.string().max(10).optional()
}).strict();

// Notificações Schema
export const notificacaoSchema = z.object({
  tipo: z.string().min(1).max(50),
  titulo: z.string().min(1).max(255),
  mensagem: z.string().min(1).max(5000),
  lida: z.boolean().default(false)
}).strict();

// Lembretes Schema
export const lemoneteSchema = z.object({
  titulo: z.string().min(1).max(255),
  descricao: z.string().max(5000).optional(),
  dataVencimento: z.string().datetime(),
  ativo: z.boolean().default(true)
}).strict();


// Backup/Restore Schema
export const backupSchema = z.object({
  data: z.object({}).passthrough().optional(),
  timestamp: z.string().datetime().optional()
}).strict().refine(
  (obj) => {
    // Validar que não está vazio
    return obj.data !== undefined || obj.timestamp !== undefined;
  },
  { message: 'Backup deve conter dados válidos' }
);

export const restoreSchema = z.object({
  backup: backupSchema,
  confirmDelete: z.boolean().refine(
    (val) => val === true,
    { message: 'Confirmação de exclusão é obrigatória' }
  )
}).strict();

// Configurações Schema
export const configuracaoSchema = z.object({
  notificacoesEmail: z.boolean().optional(),
  tema: z.enum(['claro', 'escuro']).optional(),
  alertaLimiteCartao: z.number().int().min(0).max(100).optional(),
  alertaVencimentoDias: z.number().int().min(1).max(365).optional()
}).strict();

// Middleware para validação
export const validateSchema = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validação falhou',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    return res.status(400).json({ error: 'Erro ao validar dados' });
  }
};
