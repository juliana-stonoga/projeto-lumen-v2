<?php
/**
 * LÚMEN — admin/adm_novo_admin.php
 * Cria uma nova conta de administrador.
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

$email = trim($_POST['email'] ?? '');
$senha = trim($_POST['senha'] ?? '');

if ($email === '' || $senha === '') {
    echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail e senha são obrigatórios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail inválido.']);
    exit;
}

if (strlen($senha) < 4) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'A senha deve ter pelo menos 4 caracteres.']);
    exit;
}

try {
    // Verifica duplicidade
    $stmtCheck = $conexao->prepare("SELECT id FROM administrador WHERE email = ?");
    $stmtCheck->bind_param("s", $email);
    $stmtCheck->execute();
    if ($stmtCheck->get_result()->num_rows > 0) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Já existe um administrador com esse e-mail.']);
        exit;
    }

    $stmt = $conexao->prepare("INSERT INTO administrador (email, senha) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $senha);
    $stmt->execute();

    echo json_encode(['status' => 'ok', 'mensagem' => 'Administrador criado com sucesso.']);

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_novo_admin] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
