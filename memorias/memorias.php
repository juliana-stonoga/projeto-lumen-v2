<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

include("../php/conexao.php");

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['usuario']) || !isset($_SESSION['usuario']['id'])) {
    echo json_encode([
        'status'   => 'erro',
        'mensagem' => 'Usuário não logado'
    ]);
    exit;
}

$cliente_id = $_SESSION['usuario']['id'];

try {
    $conexao->select_db("projeto");

    /* =========================================
       ADICIONAR MEMÓRIA
    ========================================= */
    if (isset($_POST['acao']) && $_POST['acao'] === 'adicionar') {

        $titulo       = trim($_POST['titulo']       ?? '');
        $descricao    = trim($_POST['descricao']    ?? '');
        $data_memoria = !empty($_POST['data_memoria']) ? $_POST['data_memoria'] : null;
        $categoria    = trim($_POST['categoria']    ?? '');
        $humor        = trim($_POST['humor']        ?? '');
        $imagem_url   = trim($_POST['imagem_url']   ?? '');

        $stmt = $conexao->prepare("
            INSERT INTO memorias
                (cliente_id, titulo, descricao, data_memoria, categoria, humor, imagem_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("issssss",
            $cliente_id, $titulo, $descricao,
            $data_memoria, $categoria, $humor, $imagem_url
        );

        if ($stmt->execute()) {
            echo json_encode(['status' => 'sucesso', 'mensagem' => 'Memória adicionada com sucesso']);
        } else {
            echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao adicionar memória']);
        }
        exit;
    }

    /* =========================================
       EDITAR MEMÓRIA
    ========================================= */
    if (isset($_POST['acao']) && $_POST['acao'] === 'editar') {

        $id           = intval($_POST['id'] ?? 0);
        $titulo       = trim($_POST['titulo']       ?? '');
        $descricao    = trim($_POST['descricao']    ?? '');
        $data_memoria = !empty($_POST['data_memoria']) ? $_POST['data_memoria'] : null;
        $categoria    = trim($_POST['categoria']    ?? '');
        $humor        = trim($_POST['humor']        ?? '');
        $imagem_url   = trim($_POST['imagem_url']   ?? '');

        $stmt = $conexao->prepare("
            UPDATE memorias
            SET titulo = ?, descricao = ?, data_memoria = ?,
                categoria = ?, humor = ?, imagem_url = ?
            WHERE id = ? AND cliente_id = ?
        ");
        $stmt->bind_param("ssssssis",
            $titulo, $descricao, $data_memoria,
            $categoria, $humor, $imagem_url,
            $id, $cliente_id
        );

        if ($stmt->execute()) {
            echo json_encode(['status' => 'sucesso', 'mensagem' => 'Memória editada com sucesso']);
        } else {
            echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao editar memória']);
        }
        exit;
    }

    /* =========================================
       EXCLUIR MEMÓRIA
    ========================================= */
    if (isset($_POST['acao']) && $_POST['acao'] === 'excluir') {

        $id = intval($_POST['id'] ?? 0);

        $stmt = $conexao->prepare("
            DELETE FROM memorias WHERE id = ? AND cliente_id = ?
        ");
        $stmt->bind_param("ii", $id, $cliente_id);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'sucesso', 'mensagem' => 'Memória excluída com sucesso']);
        } else {
            echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao excluir memória']);
        }
        exit;
    }

    /* =========================================
       LISTAR MEMÓRIAS
    ========================================= */
    $stmt = $conexao->prepare("
        SELECT id, titulo, descricao, data_memoria,
               categoria, humor, imagem_url, criado_em
        FROM memorias
        WHERE cliente_id = ?
        ORDER BY data_memoria DESC, criado_em DESC
    ");
    $stmt->bind_param("i", $cliente_id);
    $stmt->execute();

    $result = $stmt->get_result();
    $memorias = [];
    while ($row = $result->fetch_assoc()) {
        $memorias[] = $row;
    }

    echo json_encode([
        'status'   => 'sucesso',
        'memorias' => $memorias
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'status'   => 'erro',
        'mensagem' => 'Erro no servidor: ' . $e->getMessage()
    ]);
    exit;
}
?>