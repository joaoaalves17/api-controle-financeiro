
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { randomUUID } = require('node:crypto');
const pool = require('../src/config/database');
const app = require('../src/server');
const nomeCategoriaTeste = `Categoria-${randomUUID()}`;

const emailTeste = `teste-${randomUUID()}@email.com`;

let tokenTeste;
let categoriaTesteId;
let movimentacaoTesteId;
let movimentacaoAtualizacaoId;

const emailSegundoUsuario = `segundo-${randomUUID()}@email.com`;
let tokenSegundoUsuario;

before(async () => {
    await pool.query(
        'DELETE FROM usuarios WHERE email IN ($1, $2)',
        [emailTeste, emailSegundoUsuario]
    );
});

after(async () => {
    await pool.query(
        'DELETE FROM usuarios WHERE email IN ($1, $2)',
        [emailTeste, emailSegundoUsuario]
    );

    await pool.end();
});

test('A API deve responder à rota inicial', async () => {
    const resposta = await request(app).get('/');

    assert.strictEqual(resposta.status, 200);
    assert.strictEqual(
        resposta.body.mensagem,
        'API de Controle Financeiro funcionando!'
    );
});

test('Deve cadastrar um novo usuário', async () => {
    const resposta = await request(app)
        .post('/usuarios')
        .send({
            nome: 'Usuário de Teste',
            email: emailTeste,
            senha: '123456'
        });

    assert.strictEqual(resposta.status, 201);
    assert.strictEqual(
        resposta.body.mensagem,
        'Usuário cadastrado com sucesso!'
    );
    assert.strictEqual(resposta.body.usuario.email, emailTeste);
});

test('Não deve permitir cadastrar e-mail duplicado', async () => {
    const resposta = await request(app)
        .post('/usuarios')
        .send({
            nome: 'Outro Usuário',
            email: emailTeste,
            senha: '123456'
        });

    assert.strictEqual(resposta.status, 409);
    assert.strictEqual(
        resposta.body.mensagem,
        'Este email já está cadastrado.'
    );
});

test('Não deve cadastrar usuário sem campos obrigatórios', async () => {
    const resposta = await request(app)
        .post('/usuarios')
        .send({
            nome: 'Usuário sem email',
            senha: '123456'
        });

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'Nome, email e senha são obrigatórios.'
    );
});


test('Deve realizar login com credenciais válidas', async () => {
    const resposta = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailTeste,
            senha: '123456'
        });

    assert.strictEqual(resposta.status, 200);
    assert.strictEqual(
        resposta.body.mensagem,
        'Login realizado com sucesso!'
    );
    assert.ok(resposta.body.token);
    tokenTeste = resposta.body.token;
    assert.strictEqual(resposta.body.usuario.email, emailTeste);
});

test('Não deve realizar login com senha incorreta', async () => {
    const resposta = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailTeste,
            senha: 'senhaerrada'
        });

    assert.strictEqual(resposta.status, 401);
    assert.strictEqual(
        resposta.body.mensagem,
        'Email ou senha incorretos.'
    );
});

test('Deve cadastrar e autenticar um segundo usuário', async () => {
    const cadastro = await request(app)
        .post('/usuarios')
        .send({
            nome: 'Segundo Usuário de Teste',
            email: emailSegundoUsuario,
            senha: '123456'
        });

    assert.strictEqual(cadastro.status, 201);

    const login = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailSegundoUsuario,
            senha: '123456'
        });

    assert.strictEqual(login.status, 200);

    tokenSegundoUsuario = login.body.token;

    assert.ok(tokenSegundoUsuario);
});

test('Não deve realizar login sem campos obrigatórios', async () => {
    const resposta = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailTeste
        });

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'Email e senha são obrigatórios.'
    );
});


test('Não deve listar usuários sem token de autenticação', async () => {
    const resposta = await request(app)
        .get('/usuarios');

    assert.strictEqual(resposta.status, 401);
    assert.strictEqual(
        resposta.body.mensagem,
        'Acesso negado! Token não informado.'
    );
});


test('Deve listar usuários com token válido', async () => {
    const login = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailTeste,
            senha: '123456'
        });

    const token = login.body.token;

    const resposta = await request(app)
        .get('/usuarios')
        .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));

    assert.ok(
        resposta.body.some(usuario => usuario.email === emailTeste)
    );
});

test('Deve cadastrar uma nova categoria', async () => {
    const login = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailTeste,
            senha: '123456'
        });

    const resposta = await request(app)
        .post('/categorias')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            nome: nomeCategoriaTeste,
            tipo: 'despesa'
        });

    assert.strictEqual(resposta.status, 201);
    assert.strictEqual(
        resposta.body.mensagem,
        'Categoria cadastrada com sucesso!'
    );
    assert.strictEqual(
        resposta.body.categoria.nome,
        nomeCategoriaTeste
    );
    categoriaTesteId = resposta.body.categoria.id;
});

test('Não deve permitir usar categoria de outro usuário', async () => {
    const resposta = await request(app)
        .post('/movimentacoes')
        .set('Authorization', `Bearer ${tokenSegundoUsuario}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Tentativa de usar categoria alheia',
            valor: 100,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 400);
});

test('Não deve permitir cadastrar categoria duplicada', async () => {
    const login = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailTeste,
            senha: '123456'
        });

    const resposta = await request(app)
        .post('/categorias')
        .set('Authorization', `Bearer ${login.body.token}`)
        .send({
            nome: nomeCategoriaTeste,
            tipo: 'despesa'
        });

    assert.strictEqual(resposta.status, 409);
    assert.strictEqual(
        resposta.body.mensagem,
        'Esta categoria já existe para este tipo.'
    );
});


test('Deve listar categorias do usuário autenticado', async () => {
    const login = await request(app)
        .post('/usuarios/login')
        .send({
            email: emailTeste,
            senha: '123456'
        });

    const resposta = await request(app)
        .get('/categorias')
        .set('Authorization', `Bearer ${login.body.token}`);

    assert.strictEqual(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));

    assert.ok(
        resposta.body.some(
            categoria => categoria.nome === nomeCategoriaTeste
        )
    );
});


test('Não deve listar categorias sem token', async () => {
    const resposta = await request(app)
        .get('/categorias');

    assert.strictEqual(resposta.status, 401);
    assert.strictEqual(
        resposta.body.mensagem,
        'Acesso negado! Token não informado.'
    );
});

test('Não deve cadastrar categoria sem token', async () => {
    const resposta = await request(app)
        .post('/categorias')
        .send({
            nome: 'Categoria sem autenticação',
            tipo: 'despesa'
        });

    assert.strictEqual(resposta.status, 401);
    assert.strictEqual(
        resposta.body.mensagem,
        'Acesso negado! Token não informado.'
    );
});

test('Deve cadastrar uma nova movimentação', async () => {
    const resposta = await request(app)
        .post('/movimentacoes')
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Compra de teste',
            valor: 150,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 201);
    assert.strictEqual(
        resposta.body.mensagem,
        'Movimentação cadastrada com sucesso!'
    );
    assert.strictEqual(
        resposta.body.movimentacao.descricao,
        'Compra de teste'
    );
    movimentacaoTesteId = resposta.body.movimentacao.id;
});

test('Não deve cadastrar movimentação com data inválida', async () => {
    const resposta = await request(app)
        .post('/movimentacoes')
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Movimentação com data inválida',
            valor: 100,
            tipo: 'despesa',
            data: '2026-13-40'
        });

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'Informe uma data válida no formato AAAA-MM-DD.'
    );
});

test('Não deve cadastrar movimentação com descrição vazia', async () => {
    const resposta = await request(app)
        .post('/movimentacoes')
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: '     ',
            valor: 100,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 400);
});

test('Não deve cadastrar movimentação sem token', async () => {
    const resposta = await request(app)
        .post('/movimentacoes')
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Despesa sem autenticação',
            valor: 100,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 401);
    assert.strictEqual(
        resposta.body.mensagem,
        'Acesso negado! Token não informado.'
    );
});

test('Deve listar movimentações do usuário autenticado', async () => {
    const resposta = await request(app)
        .get('/movimentacoes')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));

    assert.ok(
        resposta.body.some(
            movimentacao => movimentacao.descricao === 'Compra de teste'
        )
    );
});

test('Deve retornar o resumo financeiro do usuário', async () => {
    const resposta = await request(app)
        .get('/movimentacoes/resumo')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 200);

    assert.strictEqual(Number(resposta.body.total_receitas), 0);
    assert.strictEqual(Number(resposta.body.total_despesas), 150);
    assert.strictEqual(Number(resposta.body.saldo), -150);
});

test('Deve filtrar movimentações por tipo de despesa', async () => {
    const resposta = await request(app)
        .get('/movimentacoes?tipo=despesa')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));

    assert.ok(
        resposta.body.length > 0
    );

    assert.ok(
        resposta.body.every(
            movimentacao => movimentacao.tipo === 'despesa'
        )
    );
});

test('Deve filtrar movimentações por período', async () => {
    const resposta = await request(app)
        .get('/movimentacoes?inicio=2026-11-01&fim=2026-11-30')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 200);
    assert.ok(Array.isArray(resposta.body));

    assert.ok(
        resposta.body.every(movimentacao => {
            const data = new Date(movimentacao.data)
                .toISOString()
                .slice(0, 10);

            return data >= '2026-11-01' && data <= '2026-11-30';
        })
    );
});

test('Não deve aceitar data inválida no filtro', async () => {
    const resposta = await request(app)
        .get('/movimentacoes?inicio=2026-13-40')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'Informe datas válidas no formato AAAA-MM-DD.'
    );
});

test('Não deve aceitar período com data inicial posterior à final', async () => {
    const resposta = await request(app)
        .get('/movimentacoes?inicio=2026-11-30&fim=2026-11-01')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'A data inicial não pode ser posterior à data final.'
    );
});

test('Não deve aceitar tipo inválido no filtro', async () => {
    const resposta = await request(app)
        .get('/movimentacoes?tipo=transferencia')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'Tipo deve ser receita ou despesa.'
    );
});

test('Deve excluir uma movimentação existente', async () => {
    const resposta = await request(app)
        .delete(`/movimentacoes/${movimentacaoTesteId}`)
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 200);
    assert.strictEqual(
        resposta.body.mensagem,
        'Movimentação excluída com sucesso!'
    );
});

test('Não deve excluir uma movimentação inexistente', async () => {
    const resposta = await request(app)
        .delete('/movimentacoes/999999')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 404);
    assert.strictEqual(
        resposta.body.mensagem,
        'Movimentação não encontrada.'
    );
});

test('Não deve permitir excluir movimentação de outro usuário', async () => {
    const resposta = await request(app)
        .delete(`/movimentacoes/${movimentacaoTesteId}`)
        .set('Authorization', `Bearer ${tokenSegundoUsuario}`);

    assert.strictEqual(resposta.status, 404);
    assert.strictEqual(
        resposta.body.mensagem,
        'Movimentação não encontrada.'
    );
});

test('Não deve excluir movimentação com ID inválido', async () => {
    const resposta = await request(app)
        .delete('/movimentacoes/abc')
        .set('Authorization', `Bearer ${tokenTeste}`);

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'ID da movimentação inválido.'
    );
});

test('Deve cadastrar movimentação para teste de atualização', async () => {
    const resposta = await request(app)
        .post('/movimentacoes')
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Movimentação para atualizar',
            valor: 200,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 201);

    movimentacaoAtualizacaoId = resposta.body.movimentacao.id;
});

test('Deve atualizar uma movimentação existente', async () => {
    const resposta = await request(app)
        .put(`/movimentacoes/${movimentacaoAtualizacaoId}`)
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Despesa atualizada',
            valor: 250,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 200);
    assert.strictEqual(
        resposta.body.mensagem,
        'Movimentação atualizada com sucesso!'
    );
    assert.strictEqual(
        resposta.body.movimentacao.descricao,
        'Despesa atualizada'
    );
    assert.strictEqual(
        Number(resposta.body.movimentacao.valor),
        250
    );
});

test('Não deve atualizar movimentação com descrição vazia', async () => {
    const resposta = await request(app)
        .put(`/movimentacoes/${movimentacaoAtualizacaoId}`)
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: '     ',
            valor: 250,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 400);
});

test('Não deve atualizar uma movimentação inexistente', async () => {
    const resposta = await request(app)
        .put('/movimentacoes/999999')
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Movimentação inexistente',
            valor: 100,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 404);
    assert.strictEqual(
        resposta.body.mensagem,
        'Movimentação não encontrada.'
    );
});

test('Não deve permitir atualizar movimentação de outro usuário', async () => {
    const categoriaSegundoUsuario = await request(app)
        .post('/categorias')
        .set('Authorization', `Bearer ${tokenSegundoUsuario}`)
        .send({
            nome: `Categoria-seguranca-${randomUUID()}`,
            tipo: 'despesa'
        });

    assert.strictEqual(categoriaSegundoUsuario.status, 201);

    const resposta = await request(app)
        .put(`/movimentacoes/${movimentacaoTesteId}`)
        .set('Authorization', `Bearer ${tokenSegundoUsuario}`)
        .send({
            categoria_id: categoriaSegundoUsuario.body.categoria.id,
            descricao: 'Tentativa de alteração indevida',
            valor: 999,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 404);
    assert.strictEqual(
        resposta.body.mensagem,
        'Movimentação não encontrada.'
    );
});

test('Não deve atualizar movimentação com ID inválido', async () => {
    const resposta = await request(app)
        .put('/movimentacoes/abc')
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Movimentação inválida',
            valor: 100,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'ID da movimentação inválido.'
    );
});

test('Não deve atualizar movimentação com valor negativo', async () => {
    const resposta = await request(app)
        .put(`/movimentacoes/${movimentacaoAtualizacaoId}`)
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Valor negativo',
            valor: -100,
            tipo: 'despesa',
            data: '2026-11-17'
        });

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'O valor deve ser maior que zero.'
    );
});

test('Não deve atualizar movimentação com data inválida', async () => {
    const resposta = await request(app)
        .put(`/movimentacoes/${movimentacaoAtualizacaoId}`)
        .set('Authorization', `Bearer ${tokenTeste}`)
        .send({
            categoria_id: categoriaTesteId,
            descricao: 'Data inválida',
            valor: 100,
            tipo: 'despesa',
            data: '2026-13-40'
        });

    assert.strictEqual(resposta.status, 400);
    assert.strictEqual(
        resposta.body.mensagem,
        'Informe uma data válida no formato AAAA-MM-DD.'
    );
});