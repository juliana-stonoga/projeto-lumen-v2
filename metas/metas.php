<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

include("../php/conexao.php");

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['usuario']) || !isset($_SESSION['usuario']['id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Usuário não logado']);
    exit;
}

$cliente_id = $_SESSION['usuario']['id'];

try {

    $conexao->select_db("projeto");

    /* =========================================
       ADICIONAR META
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'adicionar') {

        $titulo      = trim($_POST['titulo']);
        $descricao   = trim($_POST['descricao']);
        $data_meta   = !empty($_POST['data_meta']) ? $_POST['data_meta'] : null;
        $prioridade  = isset($_POST['prioridade']) ? trim($_POST['prioridade']) : null;
        $categoria   = isset($_POST['categoria'])  ? trim($_POST['categoria'])  : null;
        if ($categoria === '') $categoria = null;

        $tasks_json  = isset($_POST['tasks_json']) ? trim($_POST['tasks_json']) : '[]';
        // valida JSON
        if (!json_decode($tasks_json)) $tasks_json = '[]';

        $progresso   = intval($_POST['progresso'] ?? 0);
        $status_meta = $progresso >= 100 ? 'concluída' : ($progresso > 0 ? 'em andamento' : 'a fazer');

        // ★★★ NOVO CAMPO — PASSO 3A DE 4: LER E INSERIR (Metas) ★★★
        // 1. Leia o campo do $_POST:
        //    $observacao = trim($_POST['observacao'] ?? '');
        //
        // 2. Adicione na lista do INSERT:
        //    (cliente_id, titulo, ..., tasks_json, observacao)
        //    VALUES (?, ?, ..., ?, ?)
        //
        // 3. Atualize o bind_param (adicione "s" e a variável ao final):
        //    $stmt->bind_param("isssssiss s", ..., $tasks_json, $observacao);
        // ★★★ FIM DA INSTRUÇÃO ★★★

        $stmt = $conexao->prepare("
            INSERT INTO metas
                (cliente_id, titulo, descricao, data_meta, prioridade, categoria, progresso, status_meta, tasks_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("isssssiss", $cliente_id, $titulo, $descricao, $data_meta, $prioridade, $categoria, $progresso, $status_meta, $tasks_json);

        $stmt->execute();
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Meta adicionada com sucesso']);
        exit;
    }

    /* =========================================
       EDITAR META
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'editar') {

        $id         = intval($_POST['id']);
        $titulo     = trim($_POST['titulo']);
        $descricao  = trim($_POST['descricao']);
        $data_meta  = !empty($_POST['data_meta']) ? $_POST['data_meta'] : null;
        $prioridade = isset($_POST['prioridade']) ? trim($_POST['prioridade']) : null;
        $categoria  = isset($_POST['categoria'])  ? trim($_POST['categoria'])  : null;
        if ($categoria === '') $categoria = null;

        $tasks_json = isset($_POST['tasks_json']) ? trim($_POST['tasks_json']) : '[]';
        if (!json_decode($tasks_json)) $tasks_json = '[]';

        $progresso   = intval($_POST['progresso'] ?? 0);
        $status_meta = $progresso >= 100 ? 'concluída' : ($progresso > 0 ? 'em andamento' : 'a fazer');

        // ★★★ NOVO CAMPO — PASSO 3B DE 4: UPDATE (Metas) ★★★
        // Adicione a coluna no SET e a variável no bind_param (antes de $id e $cliente_id).
        // Exemplo:
        //   SET titulo=?, ..., tasks_json=?, observacao=?
        //   bind_param: "sssssisssii", ..., $tasks_json, $observacao, $id, $cliente_id
        // ★★★ FIM DA INSTRUÇÃO ★★★

        $stmt = $conexao->prepare("
            UPDATE metas
            SET titulo = ?, descricao = ?, data_meta = ?, prioridade = ?, categoria = ?,
                progresso = ?, status_meta = ?, tasks_json = ?
            WHERE id = ? AND cliente_id = ?
        ");
        $stmt->bind_param("sssssissii", $titulo, $descricao, $data_meta, $prioridade, $categoria, $progresso, $status_meta, $tasks_json, $id, $cliente_id);

        $stmt->execute();
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Meta editada com sucesso']);
        exit;
    }

    /* =========================================
       ATUALIZAR TASKS (check/uncheck no card)
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'tasks') {

        $id         = intval($_POST['id']);
        $tasks_json = isset($_POST['tasks_json']) ? trim($_POST['tasks_json']) : '[]';
        if (!json_decode($tasks_json)) $tasks_json = '[]';

        $progresso   = intval($_POST['progresso'] ?? 0);
        $status_meta = $progresso >= 100 ? 'concluída' : ($progresso > 0 ? 'em andamento' : 'a fazer');

        $stmt = $conexao->prepare("
            UPDATE metas
            SET tasks_json = ?, progresso = ?, status_meta = ?
            WHERE id = ? AND cliente_id = ?
        ");
        $stmt->bind_param("sisii", $tasks_json, $progresso, $status_meta, $id, $cliente_id);

        $stmt->execute();
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Tasks atualizadas']);
        exit;
    }

    /* =========================================
       ATUALIZAR STATUS
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'status') {

        $id     = intval($_POST['id']);
        $status = trim($_POST['status']);
        if ($status === 'concluido' || $status === 'concluído') $status = 'concluída';

        $validStatuses = ['a fazer', 'em andamento', 'concluída'];
        if (!in_array($status, $validStatuses, true)) {
            echo json_encode(['status' => 'erro', 'mensagem' => 'Status inválido']);
            exit;
        }

        if ($status === 'concluída') {
            // marca todas as tasks como concluídas ao concluir a meta
            $stmtGet = $conexao->prepare("SELECT tasks_json FROM metas WHERE id = ? AND cliente_id = ?");
            $stmtGet->bind_param("ii", $id, $cliente_id);
            $stmtGet->execute();
            $row = $stmtGet->get_result()->fetch_assoc();
            $tasks = json_decode($row['tasks_json'] ?? '[]', true) ?: [];
            foreach ($tasks as &$t) $t['concluida'] = true;
            unset($t);
            $tasks_json = json_encode($tasks);

            $stmt = $conexao->prepare("UPDATE metas SET status_meta = ?, progresso = 100, tasks_json = ? WHERE id = ? AND cliente_id = ?");
            $stmt->bind_param("ssii", $status, $tasks_json, $id, $cliente_id);
        } elseif ($status === 'a fazer') {
            $stmt = $conexao->prepare("UPDATE metas SET status_meta = ?, progresso = 0 WHERE id = ? AND cliente_id = ?");
            $stmt->bind_param("sii", $status, $id, $cliente_id);
        } else {
            $stmt = $conexao->prepare("UPDATE metas SET status_meta = ? WHERE id = ? AND cliente_id = ?");
            $stmt->bind_param("sii", $status, $id, $cliente_id);
        }

        $stmt->execute();
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Status atualizado']);
        exit;
    }

    /* =========================================
       EXCLUIR META
    ========================================= */

    if (isset($_POST['acao']) && $_POST['acao'] == 'excluir') {

        $id   = intval($_POST['id']);
        $stmt = $conexao->prepare("DELETE FROM metas WHERE id = ? AND cliente_id = ?");
        $stmt->bind_param("ii", $id, $cliente_id);
        $stmt->execute();
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Meta excluída com sucesso']);
        exit;
    }

    /* =========================================
       LISTAR METAS
    ========================================= */

    // ★★★ NOVO CAMPO — PASSO 3C DE 4: SELECT / LISTAR (Metas) ★★★
    // Adicione o nome da nova coluna na lista do SELECT para retorná-la ao JS.
    // Exemplo:
    //   SELECT id, titulo, ..., tasks_json, observacao, criado_em
    // ★★★ FIM DA INSTRUÇÃO ★★★

    $stmt = $conexao->prepare("
        SELECT id, titulo, descricao, data_meta, prioridade, categoria,
               progresso, status_meta, tasks_json, criado_em
        FROM metas
        WHERE cliente_id = ?
        ORDER BY criado_em DESC
    ");
    $stmt->bind_param("i", $cliente_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $metas = [];
    while ($row = $result->fetch_assoc()) {
        // status atrasada automático
        if (
            $row['status_meta'] == 'em andamento' &&
            !empty($row['data_meta']) &&
            strtotime($row['data_meta']) < strtotime(date('Y-m-d'))
        ) {
            $row['status_meta'] = 'atrasada';
        }
        $metas[] = $row;
    }

    /* Buscar nome do cliente */
    $nome_usuario = 'Usuário';
    $stmtU = $conexao->prepare("SELECT nome FROM cliente WHERE id = ?");
    $stmtU->bind_param("i", $cliente_id);
    $stmtU->execute();
    $resU = $stmtU->get_result();
    if ($resU->num_rows > 0) $nome_usuario = $resU->fetch_assoc()['nome'];

    echo json_encode(['status' => 'sucesso', 'nome_usuario' => $nome_usuario, 'metas' => $metas]);
    exit;

} catch (Exception $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro no servidor: ' . $e->getMessage()]);
    exit;
}
?>
