<?php
/**
 * LÚMEN — admin/adm_get_usuarios.php
 * Retorna todos os usuários cadastrados.
 * Acesso restrito ao administrador.
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

try {
    // ★★★ NOVO CAMPO — PASSO 3C DE 4: SELECT (Admin — listar usuários) ★★★
    // Adicione o nome da nova coluna no SELECT para que o JS receba o valor.
    // Exemplo: SELECT id, nome, email, telefone, nome_mae, criado_em
    // ★★★ FIM DA INSTRUÇÃO ★★★

    $stmt = $conexao->prepare("
        SELECT id, nome, email, telefone, criado_em
        FROM cliente
        ORDER BY criado_em DESC
    ");
    $stmt->execute();
    $resultado = $stmt->get_result();

    $tabela = [];
    while ($linha = $resultado->fetch_assoc()) {
        $tabela[] = $linha;
    }

    echo json_encode(['status' => 'ok', 'data' => $tabela]);

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_get_usuarios] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
