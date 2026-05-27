<?php

    include_once('conexao.php');

    $retorno = [
        'status'    => '',
        'mensagem'  => '',
        'data'      => []
    ];

    $nome     = $_POST['nome'];
    $email    = $_POST['email'];
    $senha    = $_POST['senha'];
    $telefone = $_POST['telefone'];

    // ★★★ NOVO CAMPO — PASSO 3A DE 4: LER DO $_POST (Cadastro) ★★★
    // Adicione aqui a leitura do novo campo enviado pelo JS.
    // Exemplo para "nome_mae":
    //   $nome_mae = trim($_POST['nome_mae'] ?? '');
    // ★★★ FIM DA INSTRUÇÃO ★★★

    // Validação de formato de e-mail no servidor
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            "status"   => "erro",
            "mensagem" => "E-mail inválido. Use o formato nome@dominio.com."
        ]);
        exit;
    }

    // Preparando para inserção no banco de dados

    // ★★★ NOVO CAMPO — PASSO 3B DE 4: INSERT (Cadastro) ★★★
    // 1. Adicione o nome da coluna na lista do INSERT:
    //    (nome, email, senha, telefone, nome_mae, criado_em)
    // 2. Adicione um "?" a mais no VALUES:
    //    VALUES (?,?,?,?,?,NOW())
    // 3. Adicione "s" no bind_param e a variável ao final:
    //    $stmt->bind_param("sssss", $nome, $email, $senha, $telefone, $nome_mae);
    // ★★★ FIM DA INSTRUÇÃO ★★★

    $stmt = $conexao->prepare("
    INSERT INTO cliente
    (nome, email, senha, telefone, criado_em)
    VALUES
    (?,?,?,?,NOW())");

    $stmt->bind_param("ssss", $nome, $email, $senha, $telefone);
    
    $retorno = [];

try {

    $stmt->execute();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Conta registrada com sucesso";

} catch(mysqli_sql_exception $erro){

    $retorno["status"] = "erro";

    if(str_contains($erro->getMessage(), 'email')){

        $retorno["mensagem"] = "E-mail já cadastrado.";

    } else {

        $retorno["mensagem"] = "Erro ao cadastrar usuário.";
    }
}

echo json_encode($retorno);