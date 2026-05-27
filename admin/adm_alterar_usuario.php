<?php
/**
 * LÚMEN — admin/adm_alterar_usuario.php
 * Edita qualquer usuário pelo ID.
 * Se "senha" vier em branco, mantém a atual.
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

$id       = intval($_POST['id']       ?? 0);
$nome     = trim($_POST['nome']       ?? '');
$email    = trim($_POST['email']      ?? '');
$telefone = trim($_POST['telefone']   ?? '');
$senha    = trim($_POST['senha']      ?? '');

// ★★★ NOVO CAMPO — PASSO 3A DE 4: LER DO $_POST (Admin — alterar usuário) ★★★
// Adicione a leitura do novo campo aqui.
// Exemplo:
//   $nome_mae = trim($_POST['nome_mae'] ?? '');
// ★★★ FIM DA INSTRUÇÃO ★★★

if ($id <= 0 || $nome === '' || $email === '') {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Campos obrigatórios ausentes.']);
    exit;
}

try {
    // Verifica duplicidade de e-mail
    $stmtCheck = $conexao->prepare("SELECT id FROM cliente WHERE email = ? AND id != ?");
    $stmtCheck->bind_param("si", $email, $id);
    $stmtCheck->execute();
    if ($stmtCheck->get_result()->num_rows > 0) {
        echo json_encode(['status' => 'erro', 'mensagem' => 'E-mail já em uso por outro usuário.']);
        exit;
    }

    // ★★★ NOVO CAMPO — PASSO 3B DE 4: UPDATE (Admin — alterar usuário) ★★★
    // Adicione a coluna nos dois UPDATEs (com e sem senha).
    // Exemplo para "nome_mae":
    //   "UPDATE cliente SET nome=?, email=?, telefone=?, senha=?, nome_mae=? WHERE id=?"
    //    bind_param: "sssssi", $nome, $email, $telefone, $senha, $nome_mae, $id
    //
    //   "UPDATE cliente SET nome=?, email=?, telefone=?, nome_mae=? WHERE id=?"
    //    bind_param: "ssssi", $nome, $email, $telefone, $nome_mae, $id
    // ★★★ FIM DA INSTRUÇÃO ★★★

    if ($senha !== '') {
        $stmt = $conexao->prepare("
            UPDATE cliente SET nome = ?, email = ?, telefone = ?, senha = ?
            WHERE id = ?
        ");
        $stmt->bind_param("ssssi", $nome, $email, $telefone, $senha, $id);
    } else {
        $stmt = $conexao->prepare("
            UPDATE cliente SET nome = ?, email = ?, telefone = ?
            WHERE id = ?
        ");
        $stmt->bind_param("sssi", $nome, $email, $telefone, $id);
    }

    $stmt->execute();
    echo json_encode(['status' => 'ok', 'mensagem' => 'Usuário atualizado com sucesso.']);

} catch (mysqli_sql_exception $e) {
    error_log('[Lúmen/adm_alterar_usuario] ' . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro interno no servidor.']);
}
?>
