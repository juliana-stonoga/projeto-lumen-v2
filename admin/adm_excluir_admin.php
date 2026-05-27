<?php
/**
 * LÚMEN — admin/adm_excluir_admin.php
 * Remove uma conta de administrador pelo ID.
 * Protege contra auto-exclusão.
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

$id     = intval($_GET['id'] ?? 0);
$meu_id = intval($_SESSION['usuario']['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID inválido.']);
    exit;
}

if ($id === $meu_id) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Você não pode excluir sua própria conta de administrador.']);
    exit;
}

try {
    // Garante que sempre haverá pelo menos 1 administrador
    $count = $conexao->query("SELECT COUNT(*) AS n FROM administrador")->fetch_assoc()['n'];
    if ((int) $count <= 1) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Não é possível excluir o único administrador do sistema.']);
        exit;
    }

    $stmt = $conexao->prepare("DELETE FROM administrador WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'ok', 'mensagem' => 'Administrador excluído com sucesso.']);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Administrador não encontrado.']);
    }

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_excluir_admin] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
