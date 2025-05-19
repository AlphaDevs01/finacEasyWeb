import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Obter resumo do dashboard
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { mes, ano } = req.query;
    
    // Se mês e ano não foram informados, usar mês e ano atuais
    const dataAtual = new Date();
    const mesAtual = mes || dataAtual.getMonth() + 1;
    const anoAtual = ano || dataAtual.getFullYear();
    
    // Buscar total de receitas do mês
    const receitasResult = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM receitas 
       WHERE userId = $1 
       AND EXTRACT(MONTH FROM data) = $2 
       AND EXTRACT(YEAR FROM data) = $3`,
      [userId, mesAtual, anoAtual]
    );
    
    // Buscar total de despesas do mês
    const despesasResult = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM despesas 
       WHERE userId = $1 
       AND EXTRACT(MONTH FROM data) = $2 
       AND EXTRACT(YEAR FROM data) = $3`,
      [userId, mesAtual, anoAtual]
    );
    
    // Buscar total de faturas pendentes
    const faturasResult = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) as total
       FROM faturas 
       WHERE userId = $1 
       AND status = 'pendente' 
       AND mes_referencia = $2 
       AND ano_referencia = $3`,
      [userId, mesAtual, anoAtual]
    );
    
    // Buscar total de despesas por categoria
    const categoriasDespesasResult = await db.query(
      `SELECT categoria, COALESCE(SUM(valor), 0) as total
       FROM despesas 
       WHERE userId = $1 
       AND EXTRACT(MONTH FROM data) = $2 
       AND EXTRACT(YEAR FROM data) = $3
       GROUP BY categoria
       ORDER BY total DESC`,
      [userId, mesAtual, anoAtual]
    );
    
    // Buscar total de receitas por categoria
    const categoriasReceitasResult = await db.query(
      `SELECT categoria, COALESCE(SUM(valor), 0) as total
       FROM receitas 
       WHERE userId = $1 
       AND EXTRACT(MONTH FROM data) = $2 
       AND EXTRACT(YEAR FROM data) = $3
       GROUP BY categoria
       ORDER BY total DESC`,
      [userId, mesAtual, anoAtual]
    );
    
    // Buscar despesas diárias do mês
    const despesasDiariasResult = await db.query(
      `SELECT EXTRACT(DAY FROM data) as dia, COALESCE(SUM(valor), 0) as total
       FROM despesas 
       WHERE userId = $1 
       AND EXTRACT(MONTH FROM data) = $2 
       AND EXTRACT(YEAR FROM data) = $3
       GROUP BY dia
       ORDER BY dia`,
      [userId, mesAtual, anoAtual]
    );
    
    // Buscar receitas diárias do mês
    const receitasDiariasResult = await db.query(
      `SELECT EXTRACT(DAY FROM data) as dia, COALESCE(SUM(valor), 0) as total
       FROM receitas 
       WHERE userId = $1 
       AND EXTRACT(MONTH FROM data) = $2 
       AND EXTRACT(YEAR FROM data) = $3
       GROUP BY dia
       ORDER BY dia`,
      [userId, mesAtual, anoAtual]
    );
    
    // Calcular saldo
    const totalReceitas = parseFloat(receitasResult.rows[0].total);
    const totalDespesas = parseFloat(despesasResult.rows[0].total);
    const saldo = totalReceitas - totalDespesas;
    
    // Montar resposta
    const dashboard = {
      mes: mesAtual,
      ano: anoAtual,
      receitas: totalReceitas,
      despesas: totalDespesas,
      faturas_pendentes: parseFloat(faturasResult.rows[0].total),
      saldo,
      categorias_despesas: categoriasDespesasResult.rows,
      categorias_receitas: categoriasReceitasResult.rows,
      despesas_diarias: despesasDiariasResult.rows,
      receitas_diarias: receitasDiariasResult.rows
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// Obter histórico mensal para gráficos
router.get('/historico', async (req, res) => {
  try {
    const userId = req.user.id;
    const { ano } = req.query;
    
    // Se ano não foi informado, usar ano atual
    const dataAtual = new Date();
    const anoAtual = ano || dataAtual.getFullYear();
    
    // Buscar totais de receitas por mês
    const receitasMensaisResult = await db.query(
      `SELECT EXTRACT(MONTH FROM data) as mes, COALESCE(SUM(valor), 0) as total
       FROM receitas 
       WHERE userId = $1 
       AND EXTRACT(YEAR FROM data) = $2
       GROUP BY mes
       ORDER BY mes`,
      [userId, anoAtual]
    );
    
    // Buscar totais de despesas por mês
    const despesasMensaisResult = await db.query(
      `SELECT EXTRACT(MONTH FROM data) as mes, COALESCE(SUM(valor), 0) as total
       FROM despesas 
       WHERE userId = $1 
       AND EXTRACT(YEAR FROM data) = $2
       GROUP BY mes
       ORDER BY mes`,
      [userId, anoAtual]
    );
    
    // Montar arrays completos para todos os meses (1-12)
    const receitasMensais = Array(12).fill(0);
    const despesasMensais = Array(12).fill(0);
    
    receitasMensaisResult.rows.forEach(row => {
      receitasMensais[parseInt(row.mes) - 1] = parseFloat(row.total);
    });
    
    despesasMensaisResult.rows.forEach(row => {
      despesasMensais[parseInt(row.mes) - 1] = parseFloat(row.total);
    });
    
    // Calcular saldo mensal
    const saldoMensal = receitasMensais.map((receita, index) => receita - despesasMensais[index]);
    
    // Montar resposta
    const historico = {
      ano: anoAtual,
      receitas_mensais: receitasMensais,
      despesas_mensais: despesasMensais,
      saldo_mensal: saldoMensal
    };
    
    res.json(historico);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

export default router;