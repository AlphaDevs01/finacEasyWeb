import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Dados inválidos',
      issues: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }
  req.body = result.data;
  next();
};

export const authSchemas = {
  register: z.object({
    nome: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(100).transform((v) => v.toLowerCase()),
    senha: z.string().min(8).max(128)
  }),
  login: z.object({
    email: z.string().trim().email().max(100).transform((v) => v.toLowerCase()),
    senha: z.string().min(8).max(128)
  })
};
