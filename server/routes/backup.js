import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Exportar todos os dados do usuário
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar todos os dados do usuário
    const [
      cartoes,
      faturas,
      despesas,
      receitas,
      investimentos,
      metas,
      categorias,
      lembretes,
      configuracoes,
      orcamento
    ] = await Promise.all([
      db.query('SELECT * FROM cartoes WHERE userId = $1', [userId]),
      db.query('SELECT * FROM faturas WHERE userId = $1', [userId]),
      db.query('SELECT * FROM despesas WHERE userId = $1', [userId]),
      db.query('SELECT * FROM receitas WHERE userId = $1', [userId]),
      db.query('SELECT * FROM investimentos WHERE userId = $1', [userId]),
      db.query('SELECT * FROM metas_gastos WHERE userId = $1', [userId]),
      db.query('SELECT * FROM categorias WHERE userId = $1', [userId]),
      db.query('SELECT * FROM lembretes WHERE userId = $1', [userId]),
      db.query('SELECT * FROM configuracoes WHERE userId = $1', [userId]),
      db.query('SELECT * FROM orcamento WHERE userId = $1', [userId])
    ]);

    const backupData = {
      cartoes: cartoes.rows,
      faturas: faturas.rows,
      despesas: despesas.rows,
      receitas: receitas.rows,
      investimentos: investimentos.rows,
      metas: metas.rows,
      categorias: categorias.rows,
      lembretes: lembretes.rows,
      configuracoes: configuracoes.rows[0] || null,
      orcamento: orcamento.rows
    };

    res.json(backupData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// Importar dados do backup
router.post('/import', async (req, res) => {
  const { data } = req.body;
  const userId = req.user.id;
  
  if (!data) {
    return res.status(400).json({ error: 'Dados de backup não fornecidos' });
  }

  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Limpar dados existentes do usuário
    await client.query('DELETE FROM lembretes WHERE userId = $1', [userId]);
    await client.query('DELETE FROM categorias WHERE userId = $1', [userId]);
    await client.query('DELETE FROM metas_gastos WHERE userId = $1', [userId]);
    await client.query('DELETE FROM orcamento WHERE userId = $1', [userId]);
    await client.query('DELETE FROM investimentos WHERE userId = $1', [userId]);
    await client.query('DELETE FROM despesas WHERE userId = $1', [userId]);
    await client.query('DELETE FROM receitas WHERE userId = $1', [userId]);
    await client.query('DELETE FROM faturas WHERE userId = $1', [userId]);
    await client.query('DELETE FROM cartoes WHERE userId = $1', [userId]);

    // Restaurar cartões
    if (data.cartoes) {
      for (const cartao of data.cartoes) {
        await client.query(
          'INSERT INTO cartoes (userId, nome, numero, limite, data_fechamento, data_vencimento) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, cartao.nome, cartao.numero, cartao.limite, cartao.data_fechamento, cartao.data_vencimento]
        );
      }
    }

    // Restaurar faturas
    if (data.faturas) {
      for (const fatura of data.faturas) {
        await client.query(
          'INSERT INTO faturas (userId, cartaoId, mes_referencia, ano_referencia, valor_total, status) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, fatura.cartaoId, fatura.mes_referencia, fatura.ano_referencia, fatura.valor_total, fatura.status]
        );
      }
    }

    // Restaurar despesas
    if (data.despesas) {
      for (const despesa of data.despesas) {
        await client.query(
          'INSERT INTO despesas (userId, descricao, valor, data, tipo, cartaoId, faturaId, categoria, status, data_vencimento, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [userId, despesa.descricao, despesa.valor, despesa.data, despesa.tipo, despesa.cartaoId, despesa.faturaId, despesa.categoria, despesa.status, despesa.data_vencimento, despesa.observacoes]
        );
      }
    }

    // Restaurar receitas
    if (data.receitas) {
      for (const receita of data.receitas) {
        await client.query(
          'INSERT INTO receitas (userId, descricao, valor, data, categoria, status, data_vencimento, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [userId, receita.descricao, receita.valor, receita.data, receita.categoria, receita.status, receita.data_vencimento, receita.observacoes]
        );
      }
    }

    // Restaurar investimentos
    if (data.investimentos) {
      for (const investimento of data.investimentos) {
        await client.query(
          'INSERT INTO investimentos (userId, tipo, nome, valor_aplicado, rendimento_mensal) VALUES ($1, $2, $3, $4, $5)',
          [userId, investimento.tipo, investimento.nome, investimento.valor_aplicado, investimento.rendimento_mensal]
        );
      }
    }

    // Restaurar metas
    if (data.metas) {
      for (const meta of data.metas) {
        await client.query(
          'INSERT INTO metas_gastos (userId, categoria, valor_limite, mes, ano, ativo) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, meta.categoria, meta.valor_limite, meta.mes, meta.ano, meta.ativo]
        );
      }
    }

    // Restaurar categorias
    if (data.categorias) {
      for (const categoria of data.categorias) {
        await client.query(
          'INSERT INTO categorias (userId, nome, tipo, cor, icone, ativo) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, categoria.nome, categoria.tipo, categoria.cor, categoria.icone, categoria.ativo]
        );
      }
    }

    // Restaurar lembretes
    if (data.lembretes) {
      for (const lembrete of data.lembretes) {
        await client.query(
          'INSERT INTO lembretes (userId, titulo, descricao, data_vencimento, tipo, ativo, notificado) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [userId, lembrete.titulo, lembrete.descricao, lembrete.data_vencimento, lembrete.tipo, lembrete.ativo, lembrete.notificado]
        );
      }
    }

    // Restaurar orçamento
    if (data.orcamento) {
      for (const item of data.orcamento) {
        await client.query(
          'INSERT INTO orcamento (userId, categoria, valor_planejado, tipo, mes, ano, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [userId, item.categoria, item.valor_planejado, item.tipo, item.mes, item.ano, item.ativo]
        );
      }
    }

    // Restaurar configurações
    if (data.configuracoes) {
      await client.query(
        'UPDATE configuracoes SET notificacoes_email = $1, tema = $2 WHERE userId = $3',
        [data.configuracoes.notificacoes_email, data.configuracoes.tema, userId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Dados restaurados com sucesso' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erro ao importar dados' });
  } finally {
    client.release();
  }
});

export default router;