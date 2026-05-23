<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

include("../php/conexao.php");


header('Content-Type: application/json');

/* =========================================
   VERIFICA LOGIN
========================================= */

session_start();

// compatibilidade com o padrão de sessão usado no projeto
if (!isset($_SESSION['usuario']) || !isset($_SESSION['usuario']['id'])) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Usuário não logado'
    ]);
    exit;
}

$cliente_id = $_SESSION['usuario']['id'];

try {

    // garante que está usando o banco correto do projeto
    $conexao->select_db("projeto");

    /* =========================================
       ADICIONAR META
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'adicionar') {

        $titulo = trim($_POST['titulo']);
        $descricao = trim($_POST['descricao']);
        $data_meta = !empty($_POST['data_meta'])
            ? $_POST['data_meta']
            : null;

        $prioridade = $_POST['prioridade'] ?? null;
        $categoria = $_POST['categoria'] ?? null;
        $progresso = $_POST['progresso'] ?? 0;
        $status_meta = 'a fazer';

        $stmt = $conexao->prepare("
            INSERT INTO metas
            (
                cliente_id,
                titulo,
                descricao,
                data_meta,
                prioridade,
                categoria,
                progresso,
                status_meta
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param(
            "isssssis",
            $cliente_id,
            $titulo,
            $descricao,
            $data_meta,
            $prioridade,
            $categoria,
            $progresso,
            $status_meta
        );

        if ($stmt->execute()) {

            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Meta adicionada com sucesso'
            ]);

        } else {

            echo json_encode([
                'status' => 'erro',
                'mensagem' => 'Erro ao adicionar meta'
            ]);
        }

        exit;
    }

    /* =========================================
       EDITAR META
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'editar') {

        $id = intval($_POST['id']);

        $titulo = trim($_POST['titulo']);
        $descricao = trim($_POST['descricao']);

        $data_meta = !empty($_POST['data_meta'])
            ? $_POST['data_meta']
            : null;

        $prioridade = $_POST['prioridade'] ?? null;
        $categoria = $_POST['categoria'] ?? null;

        $stmt = $conexao->prepare("
            UPDATE metas
            SET
                titulo = ?,
                descricao = ?,
                data_meta = ?,
                prioridade = ?,
                categoria = ?
            WHERE id = ? AND cliente_id = ?
        ");

        $stmt->bind_param(
            "sssssii",
            $titulo,
            $descricao,
            $data_meta,
            $prioridade,
            $categoria,
            $id,
            $cliente_id
        );

        if ($stmt->execute()) {

            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Meta editada com sucesso'
            ]);

        } else {

            echo json_encode([
                'status' => 'erro',
                'mensagem' => 'Erro ao editar meta'
            ]);
        }

        exit;
    }

    /* =========================================
       CONCLUIR META
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'status') {

        $id = intval($_POST['id']);
        $status = trim($_POST['status']);

        if ($status === 'concluido' || $status === 'concluído') {
            $status = 'concluída';
        }

        $validStatuses = ['a fazer', 'em andamento', 'concluída'];

        if (!in_array($status, $validStatuses, true)) {
            echo json_encode([
                'status' => 'erro',
                'mensagem' => 'Status inválido'
            ]);
            exit;
        }

        if ($status === 'concluída') {
            $stmt = $conexao->prepare("
                UPDATE metas
                SET status_meta = ?, progresso = 100
                WHERE id = ? AND cliente_id = ?
            ");
            $stmt->bind_param("sii", $status, $id, $cliente_id);
        } elseif ($status === 'a fazer') {
            $stmt = $conexao->prepare("
                UPDATE metas
                SET status_meta = ?, progresso = 0
                WHERE id = ? AND cliente_id = ?
            ");
            $stmt->bind_param("sii", $status, $id, $cliente_id);
        } else {
            $stmt = $conexao->prepare("
                UPDATE metas
                SET status_meta = ?
                WHERE id = ? AND cliente_id = ?
            ");
            $stmt->bind_param("sii", $status, $id, $cliente_id);
        }

        if ($stmt->execute()) {

            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Status atualizado'
            ]);

        } else {

            echo json_encode([
                'status' => 'erro',
                'mensagem' => 'Erro ao atualizar status'
            ]);
        }

        exit;
    }

    /* =========================================
       ATUALIZAR PROGRESSO
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'progresso') {

        $id = intval($_POST['id']);
        $progresso = intval($_POST['progresso']);

        $status = ($progresso >= 100)
            ? 'concluída'
            : 'em andamento';

        $stmt = $conexao->prepare("
            UPDATE metas
            SET
                progresso = ?,
                status_meta = ?
            WHERE id = ? AND cliente_id = ?
        ");

        $stmt->bind_param(
            "isii",
            $progresso,
            $status,
            $id,
            $cliente_id
        );

        if ($stmt->execute()) {

            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Progresso atualizado'
            ]);

        } else {

            echo json_encode([
                'status' => 'erro',
                'mensagem' => 'Erro ao atualizar progresso'
            ]);
        }

        exit;
    }

    /* =========================================
       EXCLUIR META
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'excluir') {

        $id = intval($_POST['id']);

        $stmt = $conexao->prepare("
            DELETE FROM metas
            WHERE id = ? AND cliente_id = ?
        ");

        $stmt->bind_param("ii", $id, $cliente_id);

        if ($stmt->execute()) {

            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Meta excluída com sucesso'
            ]);

        } else {

            echo json_encode([
                'status' => 'erro',
                'mensagem' => 'Erro ao excluir meta'
            ]);
        }

        exit;
    }

    /* =========================================
       LISTAR METAS
    ========================================= */

    $stmt = $conexao->prepare("
        SELECT
            id,
            titulo,
            descricao,
            data_meta,
            prioridade,
            categoria,
            progresso,
            status_meta,
            criado_em
        FROM metas
        WHERE cliente_id = ?
        ORDER BY criado_em DESC
    ");

    $stmt->bind_param("i", $cliente_id);

    $stmt->execute();

    $result = $stmt->get_result();

    $metas = [];

    while ($row = $result->fetch_assoc()) {

        // STATUS ATRASADA AUTOMÁTICO
        if (
            $row['status_meta'] == 'em andamento' &&
            !empty($row['data_meta']) &&
            strtotime($row['data_meta']) < strtotime(date('Y-m-d'))
        ) {
            $row['status_meta'] = 'atrasada';
        }

        $metas[] = $row;
    }

    /* =========================================
       BUSCAR NOME DO CLIENTE
    ========================================= */

    $nome_usuario = "Usuário";

    $stmtUsuario = $conexao->prepare("
        SELECT nome
        FROM cliente
        WHERE id = ?
    ");

    $stmtUsuario->bind_param("i", $cliente_id);

    $stmtUsuario->execute();

    $resultadoUsuario = $stmtUsuario->get_result();

    if ($resultadoUsuario->num_rows > 0) {

        $usuario = $resultadoUsuario->fetch_assoc();

        $nome_usuario = $usuario['nome'];
    }

    echo json_encode([
        'status' => 'sucesso',
        'nome_usuario' => $nome_usuario,
        'metas' => $metas
    ]);

    exit;

} catch (Exception $e) {

    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro no servidor: ' . $e->getMessage()
    ]);

    exit;
}
?>