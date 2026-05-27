<?php
session_start();
include("../php/conexao.php");

header('Content-Type: application/json');

if (!isset($_SESSION['usuario']) || !isset($_SESSION['usuario']['id'])) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Usuário não logado'
    ]);
    exit;
}

$cliente_id = $_SESSION['usuario']['id'];

// ★★★ NOVO CAMPO — PASSO 3A DE 4: INSERT (Financeiro) ★★★
// 1. Leia o campo: $banco = trim($_POST['banco'] ?? '');
// 2. Adicione na lista do INSERT: (..., data_financeira, banco)
//    e mais um "?" no VALUES.
// 3. Atualize o bind_param (adicione "s" e $banco ao final, antes de $data_financeira):
//    "isssds s" ... $data_financeira, $banco
// ★★★ FIM DA INSTRUÇÃO ★★★

// salva nova transacao
if (isset($_POST['acao']) && $_POST['acao'] == 'adicionar') {
    $titulo = trim($_POST['titulo'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '');
    $stmt = $conexao->prepare(
        "INSERT INTO financeiro (cliente_id, tipo, categoria, descricao, valor, data_financeira) VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("isssds", $cliente_id, $_POST['tipo'], $titulo, $descricao, $_POST['valor'], $_POST['data_financeira']);
    $stmt->execute();
}

// ★★★ NOVO CAMPO — PASSO 3B DE 4: UPDATE (Financeiro) ★★★
// Adicione a coluna no SET e a variável no bind_param (antes de $id e $cliente_id).
// Exemplo: SET tipo=?, ..., data_financeira=?, banco=?
//          bind_param: "sssds s ii", ..., $data_financeira, $banco, $id, $cliente_id
// ★★★ FIM DA INSTRUÇÃO ★★★

// editar transacao
if (isset($_POST['acao']) && $_POST['acao'] == 'editar') {
    $titulo = trim($_POST['titulo'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '');
    $stmt = $conexao->prepare(
        "UPDATE financeiro
         SET tipo=?, categoria=?, descricao=?, valor=?, data_financeira=?
         WHERE id=? AND cliente_id=?"
    );
    $stmt->bind_param(
        "sssdsii",
        $_POST['tipo'],
        $titulo,
        $descricao,
        $_POST['valor'],
        $_POST['data_financeira'],
        $_POST['id'],
        $cliente_id
    );
    $stmt->execute();
}

if (isset($_POST['acao']) && $_POST['acao'] == 'excluir') {
    $stmt = $conexao->prepare(
        "DELETE FROM financeiro WHERE id=? AND cliente_id=?"
    );
    $stmt->bind_param("ii", $_POST['id'], $cliente_id);
    $stmt->execute();
}

// ★★★ NOVO CAMPO — PASSO 3C DE 4: SELECT / LISTAR (Financeiro) ★★★
// Adicione o nome da nova coluna no SELECT para retorná-la ao JS.
// Exemplo: SELECT id, tipo, categoria AS titulo, descricao, valor, data_financeira, banco, criado_em, ...
// ★★★ FIM DA INSTRUÇÃO ★★★

$result = $conexao->query("SELECT id, tipo, categoria AS titulo, descricao, valor, data_financeira, criado_em, atualizado_em FROM financeiro WHERE cliente_id=$cliente_id ORDER BY criado_em DESC");
$transacoes = [];
while ($row = $result->fetch_assoc()) {
    $transacoes[] = $row;
}

echo json_encode($transacoes);
?>