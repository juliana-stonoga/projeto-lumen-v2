<?php
/**
 * LÚMEN — admin/adm_excluir_usuario.php
 * Remove um usuário pelo ID.
 * ON DELETE CASCADE remove todos os dados relacionados automaticamente.
 */

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
session_start();
include_once('../php/conexao.php');

header('Content-Type: application/json; charset=utf-8');

$email_sessao = $_SESSION['usuario']['email'] ?? '';
if ($email_sessao !== 'adm@adm') {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Acesso negado.']);
    exit;
}

$id = intval($_GET['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID inválido.']);
    exit;
}

try {
    $stmt = $conexao->prepare("DELETE FROM cliente WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'ok', 'mensagem' => 'Usuário excluído com sucesso.']);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não encontrado.']);
    }

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_excluir_usuario] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
