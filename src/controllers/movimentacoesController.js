const pool = require('../config/database');

// Cadastrar movimentação
async function cadastrarMovimentacao(req, res) {
    try {
        const {
            categoria_id,
            descricao,
            valor,
            tipo,
            data
        } = req.body;

        if (
            !categoria_id ||
            typeof descricao !== 'string' ||
            !descricao.trim() ||
            !valor ||
            !tipo
)       {
            return res.status(400).json({
                mensagem: 'Categoria, descrição, valor e tipo são obrigatórios.'
            });
        }

        if (!['receita', 'despesa'].includes(tipo)) {
            return res.status(400).json({
                mensagem: 'Tipo deve ser receita ou despesa.'
            });
        }

        if (Number(valor) <= 0 || !Number.isFinite(Number(valor))) {
            return res.status(400).json({
                mensagem: 'O valor deve ser maior que zero.'
            });
        }

if (data) {
    const dataConvertida = new Date(`${data}T00:00:00Z`);

    if (
        typeof data !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        Number.isNaN(dataConvertida.getTime()) ||
        dataConvertida.toISOString().slice(0, 10) !== data
    ) {
        return res.status(400).json({
            mensagem: 'Informe uma data válida no formato AAAA-MM-DD.'
        });
    }
}

// Verificar se a categoria pertence ao usuário e corresponde ao tipo
const categoria = await pool.query(
    `SELECT id
     FROM categorias
     WHERE id = $1
       AND usuario_id = $2
       AND tipo = $3`,
    [categoria_id, req.usuario.id, tipo]
);

if (categoria.rows.length === 0) {
    return res.status(400).json({
        mensagem: 'Categoria inválida ou incompatível com o tipo da movimentação.'
    });
}

        const resultado = await pool.query(
            `INSERT INTO movimentacoes
                (usuario_id, categoria_id, descricao, valor, tipo, data)
             VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
             RETURNING id, usuario_id, categoria_id, descricao, valor, tipo, data`,
            [
                req.usuario.id,
                categoria_id,
                descricao,
                valor,
                tipo,
                data || null
            ]
        );

        return res.status(201).json({
            mensagem: 'Movimentação cadastrada com sucesso!',
            movimentacao: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao cadastrar movimentação.'
        });
    }
}

// Listar movimentações do usuário
async function listarMovimentacoes(req, res) {
    try {
        const { inicio, fim, tipo } = req.query;
        // Validar formato e existência das datas
function dataValida(data) {
    if (!data) return true;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }

    const dataConvertida = new Date(`${data}T00:00:00Z`);

    if (Number.isNaN(dataConvertida.getTime())) {
        return false;
    }

    return dataConvertida.toISOString().slice(0, 10) === data;
}

if (!dataValida(inicio) || !dataValida(fim)) {
    return res.status(400).json({
        mensagem: 'Informe datas válidas no formato AAAA-MM-DD.'
    });
}

if (inicio && fim && inicio > fim) {
    return res.status(400).json({
        mensagem: 'A data inicial não pode ser posterior à data final.'
    });
}

// Validar tipo da movimentação
if (tipo && !['receita', 'despesa'].includes(tipo)) {
    return res.status(400).json({
        mensagem: 'Tipo deve ser receita ou despesa.'
    });
}
        const resultado = await pool.query(
    `SELECT
        m.id,
        m.descricao,
        m.valor,
        m.tipo,
        m.data,
        c.nome AS categoria
     FROM movimentacoes m
     INNER JOIN categorias c
        ON m.categoria_id = c.id
     WHERE m.usuario_id = $1
        AND ($2::DATE IS NULL OR m.data >= $2)
        AND ($3::DATE IS NULL OR m.data <= $3)
        AND ($4::VARCHAR IS NULL OR m.tipo = $4)
     ORDER BY m.data DESC, m.id DESC`,
        [
        req.usuario.id,
        inicio || null,
        fim || null,
        tipo || null
        ]
);

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao listar movimentações.'
        });
    }
}


// Resumo financeiro do usuário
async function resumoFinanceiro(req, res) {
    try {
        const resultado = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS total_receitas,
                COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS total_despesas,
                COALESCE(SUM(CASE
                    WHEN tipo = 'receita' THEN valor
                    WHEN tipo = 'despesa' THEN -valor
                    ELSE 0
                END), 0) AS saldo
             FROM movimentacoes
             WHERE usuario_id = $1`,
            [req.usuario.id]
        );

        return res.status(200).json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao gerar resumo financeiro.'
        });
    }
}

// Excluir movimentação do usuário
async function excluirMovimentacao(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: 'ID da movimentação inválido.'
            });
        }

        const resultado = await pool.query(
            `DELETE FROM movimentacoes
             WHERE id = $1
               AND usuario_id = $2
             RETURNING id`,
            [id, req.usuario.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: 'Movimentação não encontrada.'
            });
        }

        return res.status(200).json({
            mensagem: 'Movimentação excluída com sucesso!'
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao excluir movimentação.'
        });
    }
}

// Atualizar movimentação do usuário
async function atualizarMovimentacao(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: 'ID da movimentação inválido.'
            });
        }

        const {
            categoria_id,
            descricao,
            valor,
            tipo,
            data
        } = req.body;

        if (
            !categoria_id ||
            typeof descricao !== 'string' ||
            !descricao.trim() ||
            !valor ||
            !tipo ||
            !data
)       {
            return res.status(400).json({
                mensagem: 'Categoria, descrição, valor, tipo e data são obrigatórios.'
            });
        }

        if (!['receita', 'despesa'].includes(tipo)) {
            return res.status(400).json({
                mensagem: 'Tipo deve ser receita ou despesa.'
            });
        }

        if (Number(valor) <= 0 || !Number.isFinite(Number(valor))) {
            return res.status(400).json({
                mensagem: 'O valor deve ser maior que zero.'
            });
        }
        
        const dataConvertida = new Date(`${data}T00:00:00Z`);

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
            Number.isNaN(dataConvertida.getTime()) ||
            dataConvertida.toISOString().slice(0, 10) !== data
        ) {
            return res.status(400).json({
                mensagem: 'Informe uma data válida no formato AAAA-MM-DD.'
            });
        }
        
        const categoria = await pool.query(
            `SELECT id
             FROM categorias
             WHERE id = $1
               AND usuario_id = $2
               AND tipo = $3`,
            [categoria_id, req.usuario.id, tipo]
        );

        if (categoria.rows.length === 0) {
            return res.status(400).json({
                mensagem: 'Categoria inválida ou incompatível com o tipo da movimentação.'
            });
        }

        const resultado = await pool.query(
            `UPDATE movimentacoes
             SET categoria_id = $1,
                 descricao = $2,
                 valor = $3,
                 tipo = $4,
                 data = $5
             WHERE id = $6
               AND usuario_id = $7
             RETURNING id, categoria_id, descricao, valor, tipo, data`,
            [
                categoria_id,
                descricao,
                valor,
                tipo,
                data,
                id,
                req.usuario.id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: 'Movimentação não encontrada.'
            });
        }

        return res.status(200).json({
            mensagem: 'Movimentação atualizada com sucesso!',
            movimentacao: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao atualizar movimentação.'
        });
    }
}

module.exports = {
    cadastrarMovimentacao,
    listarMovimentacoes,
    resumoFinanceiro,
    excluirMovimentacao,
    atualizarMovimentacao
};