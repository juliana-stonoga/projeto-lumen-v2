<?php
    include_once('conexao.php');
    // Configurando o padrão de retorno em todas
    // as situações
    $retorno = [
        'status'    => '', // ok - nok
        'mensagem'  => '', // mensagem que envio para o front
        'data'      => []
    ];

    if ($_POST['email'] === 'adm@adm' && $_POST['senha'] === '123') {

        session_start();
        $_SESSION['usuario'] = [
            'email' => 'adm@adm',
            'nome' => 'Administrador'
        ];

        echo json_encode([
            'status' => 'ok',
            'mensagem' => 'Login administrador realizado.',
            'data' => $_SESSION['usuario']
        ]);
        exit;
    }


    $stmt = $conexao->prepare("SELECT * FROM cliente WHERE email = ? AND senha = ?");
    $stmt->bind_param("ss",$_POST['email'],$_POST['senha']);
    
    // Recuperando informações do banco de dados
    // Vou executar a query
    $stmt->execute();
    $resultado = $stmt->get_result();

    // Criando um array vazio para receber o resultado
    // do banco de Dados
    $tabela = [];

    if($resultado->num_rows > 0){

        $usuario = $resultado->fetch_assoc();

        session_start();
        $_SESSION['usuario'] = $usuario;

        $retorno = [
            'status'    => 'ok', // ok - nok
            'mensagem'  => 'Sucesso, consulta efetuada.', // mensagem que envio para o front
            'data'      => $usuario
        ];
    }else{
        $retorno = [
            'status'    => 'nok', // ok - nok
            'mensagem'  => 'Usuário ou senha inválidos.', // mensagem que envio para o front
            'data'      => []
        ];
    }
    // Fechamento do estado e conexão.
    $stmt->close();
    $conexao->close();

    // Estou enviando para o FRONT o array RETORNO
    // mas no formato JSON
    header("Content-type:application/json;charset:utf-8");
    echo json_encode($retorno);
?>