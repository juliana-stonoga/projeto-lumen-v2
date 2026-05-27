<?php

    session_start();
    include_once('conexao.php');
    // Configurando o padrão de retorno em todas
    // as situações
    $retorno = [
        'status'    => '', // ok - nok
        'mensagem'  => '', // mensagem que envio para o front
        'data'      => []
    ];

    // ★★★ NOVO CAMPO — PASSO 3C DE 4: SELECT (Perfil / GET) ★★★
    // Este arquivo usa "SELECT *", então a nova coluna já retorna automaticamente
    // após o ALTER TABLE ser executado no banco. Nenhuma alteração necessária aqui!
    // O JS em cliente_alterar.js recebe o campo como r.nome_mae (use o nome exato da coluna).
    // ★★★ FIM DA INSTRUÇÃO ★★★

    if(isset($_SESSION['usuario']['id'])){
        // Segunda situação - RECEBENDO O ID por GET
        $stmt = $conexao->prepare("SELECT * FROM cliente WHERE id = ?");
        
        $stmt->bind_param("i",$_SESSION['usuario']['id']);
    }else{
        // Primeira situação - SEM RECEBER O ID por GET
        $stmt = $conexao->prepare("SELECT * FROM cliente");
    }
    
    // Recuperando informações do banco de dados
    // Vou executar a query
    $stmt->execute();
    $resultado = $stmt->get_result();
    // Criando um array vazio para receber o resultado
    // do banco de Dados
    $tabela = [];
    if($resultado->num_rows > 0){
        while($linha = $resultado->fetch_assoc()){
            $tabela[] = $linha;
        }

        $retorno = [
            'status'    => 'ok', // ok - nok
            'mensagem'  => 'Sucesso, consulta efetuada.', // mensagem que envio para o front
            'data'      => $tabela
        ];
    }else{
        $retorno = [
            'status'    => 'nok', // ok - nok
            'mensagem'  => 'Não há registros', // mensagem que envio para o front
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