const express = require('express');

const router = express.Router();

const autenticarToken = require('../middlewares/authMiddleware');

const {
    cadastrarMovimentacao,
    listarMovimentacoes,
    resumoFinanceiro,
    excluirMovimentacao,
    atualizarMovimentacao
} = require('../controllers/movimentacoesController');


// Resumo financeiro (rota protegida)
router.get('/resumo', autenticarToken, resumoFinanceiro);

// Cadastrar movimentação
router.post('/', autenticarToken, cadastrarMovimentacao);

// Listar movimentações
router.get('/', autenticarToken, listarMovimentacoes);

// Excluir movimentação
router.delete('/:id', autenticarToken, excluirMovimentacao);

// Atualizar movimentação
router.put('/:id', autenticarToken, atualizarMovimentacao);

module.exports = router;