<?php
/**
 * LÚMEN — admin/adm_toggle_usuario.php
 * Ativa ou desativa a conta de um usuário (toggle).
 * Método: POST  |  Parâmetro: id (int)
 * Resposta: { status: 'ok', ativo: 1|0 }
 */

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
session_start();
include_once('../php/conexao.php');

header('Content-Type: application/json; charset=utf-8');

$role_sessao = $_SESSION['usuario']['role'] ?? '';
if ($role_sessao !== 'admin') {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Acesso negado.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID inválido.']);
    exit;
}

try {
    // Inverte o valor de ativo (1 → 0 ou 0 → 1)
    $stmt = $conexao->prepare("UPDATE cliente SET ativo = NOT ativo WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não encontrado.']);
        exit;
    }

    // Retorna o novo estado
    $stmtGet = $conexao->prepare("SELECT ativo FROM cliente WHERE id = ?");
    $stmtGet->bind_param("i", $id);
    $stmtGet->execute();
    $res      = $stmtGet->get_result()->fetch_assoc();
    $novoAtivo = (int) $res['ativo'];

    echo json_encode(['status' => 'ok', 'ativo' => $novoAtivo]);

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_toggle_usuario] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
