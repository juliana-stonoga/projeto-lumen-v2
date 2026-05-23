<?php
include_once('conexao.php');

header('Content-Type: application/json; charset=UTF-8');

$email = trim($_POST['email'] ?? '');

if ($email === '') {
    echo json_encode([
        'status' => 'nok',
        'mensagem' => 'Informe o e-mail cadastrado.'
    ]);
    exit;
}

try {
    $stmt = $conexao->prepare("SELECT id FROM cliente WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            'status' => 'nok',
            'mensagem' => 'E-mail não encontrado em nosso cadastro.'
        ]);
        exit;
    }

    $usuario = $result->fetch_assoc();
    $novoSenha = substr(bin2hex(random_bytes(4)), 0, 8);

    $stmt = $conexao->prepare("UPDATE cliente SET senha = ? WHERE id = ?");
    $stmt->bind_param("si", $novoSenha, $usuario['id']);
    $executou = $stmt->execute();

    if ($executou) {
        echo json_encode([
            'status' => 'ok',
            'mensagem' => 'Senha redefinida com sucesso. Use a senha temporária abaixo para entrar.',
            'senha' => $novoSenha
        ]);
    } else {
        echo json_encode([
            'status' => 'nok',
            'mensagem' => 'Não foi possível redefinir a senha. Tente novamente mais tarde.'
        ]);
    }

    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        'status' => 'nok',
        'mensagem' => 'Erro no servidor: ' . $e->getMessage()
    ]);
}
