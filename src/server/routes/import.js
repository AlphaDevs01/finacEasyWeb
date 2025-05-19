import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Processar importação de CSV para despesas
router.post('/despesas', async (req, res) => {
  try {
    const userId = req.user.id;
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos para importação' });
    }
    
    const registrosImportados = [];
    const erros = [];
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Validar campos obrigatórios
      if (!item.descricao || !item.valor || !item.data || !item.categoria) {
        erros.push({ linha: i + 1, erro: 'Campos obrigatórios não preenchidos' });
        continue;
      }
      
      // Validar valor positivo
      if (parseFloat(item.valor) <= 0) {
        erros.push({ linha: i + 1, erro: 'Valor deve ser maior que zero' });
        continue;
      }
      
      try {
        // Inserir despesa
        const result = await db.query(
          'INSERT INTO despesas (userId, descricao, valor, data, tipo, categoria) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [userId, item.descricao, item.valor, item.data, item.tipo || 'conta', item.categoria]
        );
        
        registrosImportados.push(result.rows[0]);
      } catch (error) {
        erros.push({ linha: i + 1, erro: 'Erro ao inserir: ' + error.message });
      }
    }
    
    res.json({
      message: `Importação concluída: ${registrosImportados.length} registros importados, ${erros.length} erros.`,
      registros_importados: registrosImportados,
      erros
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar importação' });
  }
});

// Processar importação de CSV para receitas
router.post('/receitas', async (req, res) => {
  try {
    const userId = req.user.id;
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos para importação' });
    }
    
    const registrosImportados = [];
    const erros = [];
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Validar campos obrigatórios
      if (!item.descricao || !item.valor || !item.data || !item.categoria) {
        erros.push({ linha: i + 1, erro: 'Campos obrigatórios não preenchidos' });
        continue;
      }
      
      // Validar valor positivo
      if (parseFloat(item.valor) <= 0) {
        erros.push({ linha: i + 1, erro: 'Valor deve ser maior que zero' });
        continue;
      }
      
      try {
        // Inserir receita
        const result = await db.query(
          'INSERT INTO receitas (userId, descricao, valor, data, categoria) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [userId, item.descricao, item.valor, item.data, item.categoria]
        );
        
        registrosImportados.push(result.rows[0]);
      } catch (error) {
        erros.push({ linha: i + 1, erro: 'Erro ao inserir: ' + error.message });
      }
    }
    
    res.json({
      message: `Importação concluída: ${registrosImportados.length} registros importados, ${erros.length} erros.`,
      registros_importados: registrosImportados,
      erros
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar importação' });
  }
});

export default router;