<?php

    include_once('conexao.php');

    $retorno = [
        'status'    => '',
        'mensagem'  => '',
        'data'      => []
    ];

    // Simulando as informações que vem do front
    $nome       = $_POST['nome']; // $_POST['nome'];
    $email      = $_POST['email'];
    $senha      = $_POST['senha'];
    $telefone   = $_POST['telefone'];

    // Preparando para inserção no banco de dados
    $stmt = $conexao->prepare("
    INSERT INTO cliente
    (nome, email, senha, telefone) 
    VALUES
    (?,?,?,?)");
    
    $stmt->bind_param("ssss",$nome, $email, $senha, $telefone);
    
    $retorno = [];

try {

    $stmt->execute();

    $retorno["status"] = "ok";
    $retorno["mensagem"] =
        "Conta registrada com sucesso";

} catch(mysqli_sql_exception $erro){

    $retorno["status"] = "erro";

    if(str_contains($erro->getMessage(), 'email')){

        $retorno["mensagem"] =
            "E-mail já cadastrado.";

    } else {

        $retorno["mensagem"] =
            "Erro ao cadastrar usuário.";
    }
}

echo json_encode($retorno);