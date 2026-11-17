
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Cadastrar usuário
async function cadastrarUsuario(req, res) {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: 'Nome, email e senha são obrigatórios.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const resultado = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash)
             VALUES ($1, $2, $3)
             RETURNING id, nome, email, criado_em`,
            [nome, email, senhaHash]
        );

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: resultado.rows[0]
        });

       } catch (erro) {

        if (erro.code === '23505') {
            return res.status(409).json({
                mensagem: 'Este email já está cadastrado.'
            });
        }

        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao cadastrar usuário.'
        });
    }
}

// Listar usuários
async function listarUsuarios(req, res) {
    try {
        const resultado = await pool.query(
            `SELECT id, nome, email, criado_em
             FROM usuarios
             ORDER BY id ASC`
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao listar usuários.'
        });
    }
}

// Realizar login
async function loginUsuario(req, res) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: 'Email e senha são obrigatórios.'
            });
        }

        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensagem: 'Email ou senha incorretos.'
            });
        }

        const usuario = resultado.rows[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                mensagem: 'Email ou senha incorretos.'
            });
        }

        const token = jwt.sign(
    {
        id: usuario.id,
        email: usuario.email
    },
    process.env.JWT_SECRET,
    {
        expiresIn: '1h'
    }
);

return res.status(200).json({
    mensagem: 'Login realizado com sucesso!',
    usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
    },
    token
});

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            mensagem: 'Erro ao realizar login.'
        });
    }
}

module.exports = {
    cadastrarUsuario,
    listarUsuarios,
    loginUsuario
};
