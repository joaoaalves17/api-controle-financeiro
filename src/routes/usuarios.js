const express = require('express');
const autenticarToken = require('../middlewares/authMiddleware');
const router = express.Router();

const {
    cadastrarUsuario,
    listarUsuarios,
    loginUsuario
} = require('../controllers/usuariosController');

// Rota para cadastrar usuário
router.post('/', cadastrarUsuario);

// Rota para listar usuários
router.get('/', autenticarToken, listarUsuarios);

// Rota para realizar login
router.post('/login', loginUsuario);

module.exports = router;