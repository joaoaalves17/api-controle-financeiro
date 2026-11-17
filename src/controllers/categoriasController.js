const pool = require('../config/database');

// Cadastrar categoria
async function cadastrarCategoria(req, res) {
    try {
        const { nome, tipo } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({
                mensagem: 'Nome e tipo são obrigatórios.'
            });
        }

        if (!['receita', 'despesa'].includes(tipo)) {
            return res.status(400).json({
                mensagem: 'Tipo deve ser receita ou despesa.'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO categorias (usuario_id, nome, tipo)
             VALUES ($1, $2, $3)
             RETURNING id, usuario_id, nome, tipo`,
            [req.usuario.id, nome, tipo]
        );

        return res.status(201).json({
            mensagem: 'Categoria cadastrada com sucesso!',
            categoria: resultado.rows[0]
        });

        } catch (erro) {

        if (erro.code === '23505') {
            return res.status(409).json({
                mensagem: 'Esta categoria já existe para este tipo.'
            });
        }

        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao cadastrar categoria.'
        });
    }
}

// Listar categorias do usuário
async function listarCategorias(req, res) {
    try {
        const resultado = await pool.query(
            `SELECT id, usuario_id, nome, tipo
             FROM categorias
             WHERE usuario_id = $1
             ORDER BY id ASC`,
            [req.usuario.id]
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao listar categorias.'
        });
    }
}

module.exports = {
    cadastrarCategoria,
    listarCategorias
};