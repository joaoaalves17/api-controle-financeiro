require('dotenv').config();

const express = require('express');
const pool = require('./config/database');
const usuariosRoutes = require('./routes/usuarios');
const categoriasRoutes = require('./routes/categorias');
const movimentacoesRoutes = require('./routes/movimentacoes');

const app = express();

app.use(express.json());
app.use('/usuarios', usuariosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/movimentacoes', movimentacoesRoutes);



const PORT = process.env.PORT || 3002;

// Rota inicial
app.get('/', (req, res) => {
    res.json({
        mensagem: 'API de Controle Financeiro funcionando!'
    });
});

// Iniciar servidor e testar banco
async function iniciarServidor() {
    try {
        await pool.query('SELECT NOW()');

        console.log('Conexão com PostgreSQL estabelecida!');

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });

    } catch (erro) {
        console.error('Erro ao conectar com PostgreSQL:', erro.message);
    }
}

if (require.main === module) {
    iniciarServidor();
}

module.exports = app;