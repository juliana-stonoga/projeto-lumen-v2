<?php
    session_start();
    session_unset();
    session_destroy();
    $retorno = [
        'status'    => 'ok', // ok - nok
        'mensagem'  => '', // mensagem que envio para o front
        'data'      => []
    ];
    header("Content-type:application/json;charset:utf-8");
    echo json_encode($retorno);
?>