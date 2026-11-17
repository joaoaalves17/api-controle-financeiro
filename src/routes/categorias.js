const express = require('express');

const router = express.Router();

const autenticarToken = require('../middlewares/authMiddleware');

const {
    cadastrarCategoria,
    listarCategorias
} = require('../controllers/categoriasController');

// Cadastrar categoria
router.post('/', autenticarToken, cadastrarCategoria);

// Listar categorias
router.get('/', autenticarToken, listarCategorias);

module.exports = router;