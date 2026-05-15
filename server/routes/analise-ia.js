import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Gerar análise inteligente dos gastos
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { data_inicio, data_fim } = req.body;
    
    if (!data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Período de análise é obrigatório' });
    }

    // Buscar dados do período
    const [despesasResult, receitasResult, metasResult] = await Promise.all([
      db.query(
        'SELECT * FROM despesas WHERE userId = $1 AND data BETWEEN $2 AND $3 AND status != \'cancelada\'',
        [userId, data_inicio, data_fim]
      ),
      db.query(
        'SELECT * FROM receitas WHERE userId = $1 AND data BETWEEN $2 AND $3 AND status != \'cancelada\'',
        [userId, data_inicio, data_fim]
      ),
      db.query(
        'SELECT * FROM metas_gastos WHERE userId = $1 AND ativo = true',
        [userId]
      )
    ]);

    const despesas = despesasResult.rows;
    const receitas = receitasResult.rows;
    const metas = metasResult.rows;

    // Análise por categoria
    const gastosPorCategoria = despesas.reduce((acc, despesa) => {
      acc[despesa.categoria] = (acc[despesa.categoria] || 0) + parseFloat(despesa.valor);
      return acc;
    }, {});

    const totalGastos = Object.values(gastosPorCategoria).reduce((acc, valor) => acc + valor, 0);
    
    const gastos_categoria = Object.entries(gastosPorCategoria).map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: (valor / totalGastos) * 100
    })).sort((a, b) => b.valor - a.valor);

    // Análise de tendências (últimos 6 meses)
    const tendencias = [];
    const dataInicio = new Date(data_inicio);
    const dataFim = new Date(data_fim);
    
    for (let d = new Date(dataInicio); d <= dataFim; d.setMonth(d.getMonth() + 1)) {
      const mes = d.getMonth() + 1;
      const ano = d.getFullYear();
      
      const gastosMes = despesas
        .filter(d => {
          const dataDespesa = new Date(d.data);
          return dataDespesa.getMonth() + 1 === mes && dataDespesa.getFullYear() === ano;
        })
        .reduce((acc, d) => acc + parseFloat(d.valor), 0);

      const mesAnterior = tendencias[tendencias.length - 1];
      const variacao = mesAnterior ? ((gastosMes - mesAnterior.valor) / mesAnterior.valor) * 100 : 0;

      tendencias.push({
        mes: `${mes.toString().padStart(2, '0')}/${ano}`,
        valor: gastosMes,
        variacao
      });
    }

    // Gerar insights baseados nos dados
    const insights = [];
    const recomendacoes = [];
    const alertas = [];

    // Insight: Categoria com maior gasto
    if (gastos_categoria.length > 0) {
      const maiorCategoria = gastos_categoria[0];
      insights.push(`Sua maior categoria de gastos é "${maiorCategoria.categoria}" com ${maiorCategoria.percentual.toFixed(1)}% do total`);
      
      if (maiorCategoria.percentual > 40) {
        alertas.push({
          tipo: 'Concentração de Gastos',
          mensagem: `Mais de 40% dos seus gastos estão em "${maiorCategoria.categoria}". Considere diversificar.`,
          prioridade: 'media'
        });
      }
    }

    // Insight: Tendência de crescimento
    const ultimasTendencias = tendencias.slice(-3);
    const crescimentoMedio = ultimasTendencias.reduce((acc, t) => acc + t.variacao, 0) / ultimasTendencias.length;
    
    if (crescimentoMedio > 10) {
      alertas.push({
        tipo: 'Gastos Crescentes',
        mensagem: `Seus gastos aumentaram ${crescimentoMedio.toFixed(1)}% nos últimos meses.`,
        prioridade: 'alta'
      });
      recomendacoes.push('Revise seu orçamento e identifique onde é possível reduzir gastos');
    } else if (crescimentoMedio < -10) {
      insights.push(`Parabéns! Você reduziu seus gastos em ${Math.abs(crescimentoMedio).toFixed(1)}% nos últimos meses`);
    }

    // Análise de metas
    for (const meta of metas) {
      const gastoCategoria = gastosPorCategoria[meta.categoria] || 0;
      const percentualMeta = (gastoCategoria / parseFloat(meta.valor_limite)) * 100;
      
      if (percentualMeta > 100) {
        alertas.push({
          tipo: 'Meta Excedida',
          mensagem: `A categoria "${meta.categoria}" excedeu a meta em ${(percentualMeta - 100).toFixed(1)}%`,
          prioridade: 'alta'
        });
      } else if (percentualMeta > 80) {
        alertas.push({
          tipo: 'Meta Quase Atingida',
          mensagem: `A categoria "${meta.categoria}" está próxima do limite (${percentualMeta.toFixed(1)}%)`,
          prioridade: 'media'
        });
      }
    }

    // Calcular score financeiro
    let score = 100;
    
    // Penalizar por metas excedidas
    const metasExcedidas = metas.filter(meta => {
      const gasto = gastosPorCategoria[meta.categoria] || 0;
      return gasto > parseFloat(meta.valor_limite);
    }).length;
    score -= metasExcedidas * 15;

    // Penalizar por crescimento de gastos
    if (crescimentoMedio > 20) score -= 20;
    else if (crescimentoMedio > 10) score -= 10;

    // Bonificar por redução de gastos
    if (crescimentoMedio < -10) score += 10;

    // Penalizar por concentração excessiva
    if (gastos_categoria.length > 0 && gastos_categoria[0].percentual > 50) {
      score -= 15;
    }

    score = Math.max(0, Math.min(100, score));

    // Recomendações gerais
    if (score < 60) {
      recomendacoes.push('Considere criar um orçamento mensal detalhado');
      recomendacoes.push('Defina metas de gastos para cada categoria');
    }

    if (gastos_categoria.length > 0 && gastos_categoria[0].percentual > 30) {
      recomendacoes.push(`Tente reduzir os gastos em "${gastos_categoria[0].categoria}" para equilibrar seu orçamento`);
    }

    const totalReceitas = receitas.reduce((acc, r) => acc + parseFloat(r.valor), 0);
    const totalDespesas = despesas.reduce((acc, d) => acc + parseFloat(d.valor), 0);
    
    if (totalDespesas > totalReceitas * 0.9) {
      recomendacoes.push('Seus gastos estão muito próximos da sua renda. Considere aumentar sua reserva de emergência');
    }

    const analise = {
      gastos_categoria,
      tendencias,
      insights,
      recomendacoes,
      score_financeiro: Math.round(score),
      alertas,
      periodo: {
        inicio: data_inicio,
        fim: data_fim
      },
      resumo: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        numero_transacoes: despesas.length + receitas.length
      }
    };

    res.json(analise);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar análise' });
  } finally {
    client.release();
  }
});

export default router;