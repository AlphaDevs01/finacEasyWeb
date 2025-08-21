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
    
    // Buscar despesas pendentes
    const despesasPendentesResult = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM despesas 
       WHERE userId = $1 
       AND status = 'pendente'
       AND (data_vencimento IS NULL OR data_vencimento >= CURRENT_DATE)`,
      [userId]
    );
    
    // Buscar despesas vencidas
    const despesasVencidasResult = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM despesas 
       WHERE userId = $1 
       AND status = 'pendente'
       AND data_vencimento < CURRENT_DATE`,
      [userId]
    );
    
    // Buscar receitas pendentes
    const receitasPendentesResult = await db.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM receitas 
       WHERE userId = $1 
       AND status = 'pendente'
       AND (data_vencimento IS NULL OR data_vencimento >= CURRENT_DATE)`,
      [userId]
    );
    
    // Buscar limite disponível dos cartões
    const limitesCartoesResult = await db.query(
      `SELECT 
         SUM(c.limite) as limite_total,
         COALESCE(SUM(f.valor_total), 0) as valor_usado
       FROM cartoes c
       LEFT JOIN faturas f ON f.cartaoId = c.id AND f.status != 'paga'
       WHERE c.userId = $1`,
      [userId]
    );
    
    // Buscar total de faturas pendentes
    const faturasResult = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) as total
       FROM faturas 
       WHERE userId = $1 
       AND status != 'paga' 
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
    
    // Dados dos cartões
    const limitesCartoes = limitesCartoesResult.rows[0];
    const limiteTotal = parseFloat(limitesCartoes.limite_total) || 0;
    const valorUsado = parseFloat(limitesCartoes.valor_usado) || 0;
    const limiteDisponivel = limiteTotal - valorUsado;
    
    // Montar resposta
    const dashboard = {
      mes: mesAtual,
      ano: anoAtual,
      receitas: totalReceitas,
      despesas: totalDespesas,
      faturas_pendentes: parseFloat(faturasResult.rows[0].total),
      saldo,
      despesas_pendentes: parseFloat(despesasPendentesResult.rows[0].total),
      despesas_vencidas: parseFloat(despesasVencidasResult.rows[0].total),
      receitas_pendentes: parseFloat(receitasPendentesResult.rows[0].total),
      limite_total_cartoes: limiteTotal,
      limite_disponivel_cartoes: limiteDisponivel,
      percentual_limite_usado: limiteTotal > 0 ? (valorUsado / limiteTotal) * 100 : 0,
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

// Obter alertas e notificações
router.get('/alertas', async (req, res) => {
  try {
    const userId = req.user.id;
    const alertas = [];
    
    // Verificar despesas vencidas
    const despesasVencidas = await db.query(
      `SELECT COUNT(*) as count, SUM(valor) as total
       FROM despesas 
       WHERE userId = $1 
       AND status = 'pendente'
       AND data_vencimento < CURRENT_DATE`,
      [userId]
    );
    
    if (parseInt(despesasVencidas.rows[0].count) > 0) {
      alertas.push({
        tipo: 'despesas_vencidas',
        titulo: 'Despesas Vencidas',
        mensagem: `Você tem ${despesasVencidas.rows[0].count} despesas vencidas totalizando R$ ${parseFloat(despesasVencidas.rows[0].total).toFixed(2)}`,
        prioridade: 'alta'
      });
    }
    
    // Verificar limite dos cartões
    const limitesCartoes = await db.query(
      `SELECT c.nome, c.limite, COALESCE(SUM(f.valor_total), 0) as usado
       FROM cartoes c
       LEFT JOIN faturas f ON f.cartaoId = c.id AND f.status != 'paga'
       WHERE c.userId = $1
       GROUP BY c.id, c.nome, c.limite`,
      [userId]
    );
    
    limitesCartoes.rows.forEach(cartao => {
      const percentualUsado = (parseFloat(cartao.usado) / parseFloat(cartao.limite)) * 100;
      if (percentualUsado >= 80) {
        alertas.push({
          tipo: 'limite_cartao',
          titulo: 'Limite do Cartão',
          mensagem: `O cartão ${cartao.nome} está com ${percentualUsado.toFixed(1)}% do limite utilizado`,
          prioridade: percentualUsado >= 90 ? 'alta' : 'media'
        });
      }
    });
    
    // Verificar metas de gastos
    const metasExcedidas = await db.query(
      `SELECT m.categoria, m.valor_limite, SUM(d.valor) as valor_gasto
       FROM metas_gastos m
       LEFT JOIN despesas d ON d.categoria = m.categoria 
                            AND d.userId = m.userId 
                            AND EXTRACT(MONTH FROM d.data) = m.mes 
                            AND EXTRACT(YEAR FROM d.data) = m.ano
                            AND d.status != 'cancelada'
       WHERE m.userId = $1 
       AND m.ativo = true
       AND m.mes = EXTRACT(MONTH FROM CURRENT_DATE)
       AND m.ano = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY m.id, m.categoria, m.valor_limite
       HAVING SUM(d.valor) > m.valor_limite * 0.8`,
      [userId]
    );
    
    metasExcedidas.rows.forEach(meta => {
      const percentual = (parseFloat(meta.valor_gasto) / parseFloat(meta.valor_limite)) * 100;
      alertas.push({
        tipo: 'meta_excedida',
        titulo: 'Meta de Gastos',
        mensagem: `A categoria ${meta.categoria} está com ${percentual.toFixed(1)}% da meta utilizada`,
        prioridade: percentual >= 100 ? 'alta' : 'media'
      });
    });
    
    res.json(alertas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
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