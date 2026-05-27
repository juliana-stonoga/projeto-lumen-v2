<?php
/**
 * LÚMEN — admin/adm_metricas.php
 * Contagens agregadas de todos os módulos da plataforma.
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
    $totalUsuarios     = $conexao->query("SELECT COUNT(*) AS n FROM cliente")->fetch_assoc()['n'];
    $totalMetas        = $conexao->query("SELECT COUNT(*) AS n FROM metas")->fetch_assoc()['n'];
    $metasConcluidas   = $conexao->query("SELECT COUNT(*) AS n FROM metas WHERE status_meta = 'concluída'")->fetch_assoc()['n'];
    $metasAndamento    = $conexao->query("SELECT COUNT(*) AS n FROM metas WHERE status_meta = 'em andamento'")->fetch_assoc()['n'];
    $totalTransacoes   = $conexao->query("SELECT COUNT(*) AS n FROM financeiro")->fetch_assoc()['n'];
    $transacoesEntrada = $conexao->query("SELECT COUNT(*) AS n FROM financeiro WHERE tipo = 'entrada'")->fetch_assoc()['n'];
    $transacoesSaida   = $conexao->query("SELECT COUNT(*) AS n FROM financeiro WHERE tipo = 'saida'")->fetch_assoc()['n'];
    $totalMemorias     = $conexao->query("SELECT COUNT(*) AS n FROM memorias")->fetch_assoc()['n'];
    $totalDiario       = $conexao->query("SELECT COUNT(*) AS n FROM diario")->fetch_assoc()['n'];

    echo json_encode([
        'status' => 'ok',
        'data'   => [
            'total_usuarios'      => (int) $totalUsuarios,
            'total_metas'         => (int) $totalMetas,
            'metas_concluidas'    => (int) $metasConcluidas,
            'metas_andamento'     => (int) $metasAndamento,
            'total_transacoes'    => (int) $totalTransacoes,
            'transacoes_entrada'  => (int) $transacoesEntrada,
            'transacoes_saida'    => (int) $transacoesSaida,
            'total_memorias'      => (int) $totalMemorias,
            'total_diario'        => (int) $totalDiario,
        ]
    ]);

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_metricas] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
