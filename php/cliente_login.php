<?php
    session_start();
    include_once('conexao.php');

    $retorno = [
        'status'   => '',
        'mensagem' => '',
        'data'     => []
    ];

    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';

    // 1. Verificar tabela de administradores
    $stmt_adm = $conexao->prepare("SELECT id, email FROM administrador WHERE email = ? AND senha = ?");
    $stmt_adm->bind_param("ss", $email, $senha);
    $stmt_adm->execute();
    $res_adm = $stmt_adm->get_result();

    if ($res_adm->num_rows > 0) {
        $adm = $res_adm->fetch_assoc();

        $_SESSION['usuario'] = [
            'id'    => $adm['id'],
            'email' => $adm['email'],
            'nome'  => 'Administrador',
            'role'  => 'admin'
        ];

        echo json_encode([
            'status'   => 'ok',
            'mensagem' => 'Login administrador realizado.',
            'data'     => $_SESSION['usuario']
        ]);
        exit;
    }
    $stmt_adm->close();

    // 2. Verificar tabela de clientes
    $stmt = $conexao->prepare("SELECT * FROM cliente WHERE email = ? AND senha = ?");
    $stmt->bind_param("ss", $email, $senha);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows > 0) {
        $usuario = $resultado->fetch_assoc();
        $_SESSION['usuario'] = $usuario;

        $retorno = [
            'status'   => 'ok',
            'mensagem' => 'Sucesso, consulta efetuada.',
            'data'     => $usuario
        ];
    } else {
        $retorno = [
            'status'   => 'nok',
            'mensagem' => 'Usuário ou senha inválidos.',
            'data'     => []
        ];
    }

    $stmt->close();
    $conexao->close();

    header("Content-type:application/json;charset:utf-8");
    echo json_encode($retorno);
?>
