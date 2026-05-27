<?php
/**
 * LÚMEN — admin/adm_get_admins.php
 * Retorna todos os administradores cadastrados.
 * Marca qual deles é o usuário da sessão atual (eh_atual).
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

$meu_id = intval($_SESSION['usuario']['id'] ?? 0);

try {
    $stmt = $conexao->prepare("SELECT id, email FROM administrador ORDER BY id ASC");
    $stmt->execute();
    $resultado = $stmt->get_result();

    $lista = [];
    while ($linha = $resultado->fetch_assoc()) {
        $lista[] = [
            'id'       => (int) $linha['id'],
            'email'    => $linha['email'],
            'eh_atual' => ((int) $linha['id'] === $meu_id)
        ];
    }

    echo json_encode(['status' => 'ok', 'data' => $lista]);

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_get_admins] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
