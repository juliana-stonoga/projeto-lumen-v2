<?php
    session_start();
    include_once('conexao.php');

    header("Content-type:application/json;charset:utf-8");

    $retorno = [
        'status'   => 'nok',
        'mensagem' => '',
        'data'     => []
    ];

    if (!isset($_SESSION['usuario']['id'])) {
        $retorno['mensagem'] = 'Sessão inválida.';
        echo json_encode($retorno);
        exit;
    }

    $id       = $_SESSION['usuario']['id'];
    $nome     = trim($_POST['nome']     ?? '');
    $email    = trim($_POST['email']    ?? '');
    $telefone = trim($_POST['telefone'] ?? '');
    $senha    = trim($_POST['senha']    ?? '');   // vazio = não alterar

    // ★★★ NOVO CAMPO — PASSO 3A DE 4: LER DO $_POST (Perfil) ★★★
    // Adicione a leitura do novo campo aqui.
    // Exemplo:
    //   $nome_mae = trim($_POST['nome_mae'] ?? '');
    // ★★★ FIM DA INSTRUÇÃO ★★★

    if ($nome === '' || $email === '') {
        $retorno['mensagem'] = 'Nome e e-mail são obrigatórios.';
        echo json_encode($retorno);
        exit;
    }

    try {
        // ★★★ NOVO CAMPO — PASSO 3B DE 4: UPDATE (Perfil) ★★★
        // Adicione o novo campo nos dois UPDATEs abaixo (com e sem senha).
        // Exemplo para "nome_mae":
        //   "UPDATE cliente SET nome=?, email=?, telefone=?, senha=?, nome_mae=? WHERE id=?"
        //    bind_param: "sssssi", $nome, $email, $telefone, $senha, $nome_mae, $id
        //
        //   "UPDATE cliente SET nome=?, email=?, telefone=?, nome_mae=? WHERE id=?"
        //    bind_param: "ssssi", $nome, $email, $telefone, $nome_mae, $id
        // ★★★ FIM DA INSTRUÇÃO ★★★

        if ($senha !== '') {
            // Atualiza tudo incluindo a senha
            $stmt = $conexao->prepare(
                "UPDATE cliente SET nome = ?, email = ?, telefone = ?, senha = ? WHERE id = ?"
            );
            $stmt->bind_param("ssssi", $nome, $email, $telefone, $senha, $id);
        } else {
            // Atualiza sem mexer na senha
            $stmt = $conexao->prepare(
                "UPDATE cliente SET nome = ?, email = ?, telefone = ? WHERE id = ?"
            );
            $stmt->bind_param("sssi", $nome, $email, $telefone, $id);
        }

        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $_SESSION['usuario']['nome']     = $nome;
            $_SESSION['usuario']['email']    = $email;
            $_SESSION['usuario']['telefone'] = $telefone;
            if ($senha !== '') $_SESSION['usuario']['senha'] = $senha;

            $retorno = [
                'status'   => 'ok',
                'mensagem' => 'Dados alterados com sucesso.',
            ];
        } else {
            $retorno['mensagem'] = 'Nenhuma alteração detectada.';
        }

        $stmt->close();

    } catch (Exception $e) {
        $retorno['mensagem'] = 'Erro interno ao salvar os dados.';
        error_log('[cliente_alterar] ' . $e->getMessage());
    }

    $conexao->close();
    echo json_encode($retorno);
?>
