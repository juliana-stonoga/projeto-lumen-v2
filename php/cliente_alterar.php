<?php
    session_start(); // 1. Adicionado para permitir o uso da $_SESSION
    include_once('conexao.php');

    $retorno = [
        'status'    => 'nok', // Iniciado como 'nok' por padrão
        'mensagem'  => '',
        'data'      => []
    ];

    // 2. Trocado $_GET['id'] pela verificação segura da sessão
    if(isset($_SESSION['usuario']['id'])){
        // Simulando as informações que vem do front
        $nome       = $_POST['nome']; 
        $email      = $_POST['email'];
        $telefone   = $_POST['telefone'];
        $senha      = $_POST['senha'];
    
        // 3. Preparando para inserção usando o ID da sessão no final
        $stmt = $conexao->prepare("UPDATE cliente SET nome = ?, email = ?, telefone = ?, senha = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $nome, $email, $telefone, $senha, $_SESSION['usuario']['id']);
        $stmt->execute();

        if($stmt->affected_rows > 0){
            $retorno = [
                'status'    => 'ok',
                'mensagem'  => 'Registro alterado com sucesso.',
            ];   
            
            $_SESSION['usuario']['nome'] = $nome;
            $_SESSION['usuario']['email'] = $email;
            $_SESSION['usuario']['telefone'] = $telefone;
            $_SESSION['usuario']['senha'] = $senha;

        }else{
            // 4. Corrigido o erro de sintaxe do array
            $retorno['mensagem'] = 'Nenhum dado para alterar.'; 
        }
        $stmt->close();
    }else{
        // 4. Corrigido o erro de sintaxe do array
        $retorno['mensagem'] = 'sessão invalida.'; 
    }
       
    $conexao->close();

    header("Content-type:application/json;charset:utf-8");
    echo json_encode($retorno);
?>