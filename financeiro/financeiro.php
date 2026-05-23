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

$result = $conexao->query("SELECT id, tipo, categoria AS titulo, descricao, valor, data_financeira, criado_em, atualizado_em FROM financeiro WHERE cliente_id=$cliente_id ORDER BY criado_em DESC");
$transacoes = [];
while ($row = $result->fetch_assoc()) {
    $transacoes[] = $row;
}

echo json_encode($transacoes);
?>