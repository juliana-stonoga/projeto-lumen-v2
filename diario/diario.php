<?php
/**
 * LÚMEN — diario.php
 * Backend da seção Diário.
 *
 * Ações aceitas via POST (campo "acao"):
 *   adicionar  — cria nova entrada
 *   editar     — atualiza entrada existente (requer "id")
 *   excluir    — remove entrada (requer "id")
 *   [padrão]   — lista todas as entradas do cliente logado
 *
 * Resposta sempre em JSON:
 *   { status: "sucesso"|"erro", mensagem: "...", [entradas: [...]] }
 */

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

include('../php/conexao.php');

header('Content-Type: application/json; charset=utf-8');

/* ─── Verifica sessão ─────────────────────────────────────────── */
session_start();

if (!isset($_SESSION['usuario']['id'])) {
    echo json_encode([
        'status'   => 'erro',
        'mensagem' => 'Usuário não autenticado.'
    ]);
    exit;
}

$cliente_id = (int) $_SESSION['usuario']['id'];

/* ─── Valores aceitos para o campo humor ─────────────────────── */
const HUMORES_VALIDOS = ['muito_bem', 'bem', 'neutro', 'mal', 'muito_mal'];

/* ─── Helper: retorna string segura ou null ──────────────────── */
function campo(string $chave, bool $obrigatorio = false): ?string {
    $valor = isset($_POST[$chave]) ? trim($_POST[$chave]) : '';
    if ($obrigatorio && $valor === '') {
        throw new InvalidArgumentException("Campo obrigatório ausente: {$chave}");
    }
    return $valor === '' ? null : $valor;
}

/* ═══════════════════════════════════════════════════════════════
   ROTEAMENTO
═══════════════════════════════════════════════════════════════ */
try {
    $conexao->select_db('projeto');
    $acao = campo('acao') ?? 'listar';

    /* ── ADICIONAR ───────────────────────────────────────────── */
    if ($acao === 'adicionar') {

        $data_entrada = campo('data_entrada', true);
        $texto        = campo('texto',        true);
        $humor        = campo('humor');

        // ★★★ NOVO CAMPO — PASSO 3A DE 4: LER E INSERIR (Diário) ★★★
        // 1. Leia o campo usando o helper campo():
        //    $local = campo('local');    // null se vazio
        // 2. Adicione no INSERT:
        //    INSERT INTO diario (cliente_id, data_entrada, texto, humor, local)
        //    VALUES (?, ?, ?, ?, ?)
        // 3. Atualize o bind_param (adicione "s" e a variável):
        //    $stmt->bind_param('issss', $cliente_id, $data_entrada, $texto, $humor, $local);
        // ★★★ FIM DA INSTRUÇÃO ★★★

        // Valida formato de data
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_entrada)) {
            throw new InvalidArgumentException('Formato de data inválido. Use YYYY-MM-DD.');
        }

        // Valida humor se informado
        if ($humor !== null && !in_array($humor, HUMORES_VALIDOS, true)) {
            throw new InvalidArgumentException('Valor de humor inválido.');
        }

        $stmt = $conexao->prepare('
            INSERT INTO diario (cliente_id, data_entrada, texto, humor)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->bind_param('isss', $cliente_id, $data_entrada, $texto, $humor);
        $stmt->execute();

        $novoId = (int) $conexao->insert_id;

        echo json_encode([
            'status'   => 'sucesso',
            'mensagem' => 'Entrada adicionada com sucesso.',
            'id'       => $novoId
        ]);
        exit;
    }

    /* ── EDITAR ──────────────────────────────────────────────── */
    if ($acao === 'editar') {

        $id           = (int) ($_POST['id'] ?? 0);
        $data_entrada = campo('data_entrada', true);
        $texto        = campo('texto',        true);
        $humor        = campo('humor');

        if ($id <= 0) {
            throw new InvalidArgumentException('ID inválido para edição.');
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_entrada)) {
            throw new InvalidArgumentException('Formato de data inválido. Use YYYY-MM-DD.');
        }

        if ($humor !== null && !in_array($humor, HUMORES_VALIDOS, true)) {
            throw new InvalidArgumentException('Valor de humor inválido.');
        }

        // ★★★ NOVO CAMPO — PASSO 3B DE 4: UPDATE (Diário) ★★★
        // Adicione a coluna no SET e a variável no bind_param.
        // Exemplo: SET data_entrada=?, texto=?, humor=?, local=?
        //          bind_param: 'ssssii', ..., $humor, $local, $id, $cliente_id
        // ★★★ FIM DA INSTRUÇÃO ★★★

        $stmt = $conexao->prepare('
            UPDATE diario
            SET data_entrada = ?, texto = ?, humor = ?
            WHERE id = ? AND cliente_id = ?
        ');
        $stmt->bind_param('sssii', $data_entrada, $texto, $humor, $id, $cliente_id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            echo json_encode([
                'status'   => 'erro',
                'mensagem' => 'Entrada não encontrada ou sem permissão.'
            ]);
            exit;
        }

        echo json_encode([
            'status'   => 'sucesso',
            'mensagem' => 'Entrada atualizada com sucesso.'
        ]);
        exit;
    }

    /* ── EXCLUIR ─────────────────────────────────────────────── */
    if ($acao === 'excluir') {

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            throw new InvalidArgumentException('ID inválido para exclusão.');
        }

        $stmt = $conexao->prepare('
            DELETE FROM diario
            WHERE id = ? AND cliente_id = ?
        ');
        $stmt->bind_param('ii', $id, $cliente_id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            echo json_encode([
                'status'   => 'erro',
                'mensagem' => 'Entrada não encontrada ou sem permissão.'
            ]);
            exit;
        }

        echo json_encode([
            'status'   => 'sucesso',
            'mensagem' => 'Entrada excluída com sucesso.'
        ]);
        exit;
    }

    /* ── LISTAR (padrão) ─────────────────────────────────────── */
    // ★★★ NOVO CAMPO — PASSO 3C DE 4: SELECT / LISTAR (Diário) ★★★
    // Adicione o nome da nova coluna no SELECT para retorná-la ao JS.
    // Exemplo: SELECT id, data_entrada, texto, humor, local, criado_em, atualizado_em
    // ★★★ FIM DA INSTRUÇÃO ★★★

    $stmt = $conexao->prepare('
        SELECT
            id,
            data_entrada,
            texto,
            humor,
            criado_em,
            atualizado_em
        FROM diario
        WHERE cliente_id = ?
        ORDER BY data_entrada DESC, criado_em DESC
    ');
    $stmt->bind_param('i', $cliente_id);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $entradas  = [];

    while ($row = $resultado->fetch_assoc()) {
        $entradas[] = $row;
    }

    echo json_encode([
        'status'   => 'sucesso',
        'entradas' => $entradas
    ]);
    exit;

} catch (InvalidArgumentException $e) {
    echo json_encode([
        'status'   => 'erro',
        'mensagem' => $e->getMessage()
    ]);
    exit;

} catch (mysqli_sql_exception $e) {
    // Não expõe detalhes internos ao cliente
    error_log('[Lúmen/diario] DB error: ' . $e->getMessage());
    echo json_encode([
        'status'   => 'erro',
        'mensagem' => 'Erro interno no servidor. Tente novamente.'
    ]);
    exit;

} catch (Throwable $e) {
    error_log('[Lúmen/diario] Unexpected error: ' . $e->getMessage());
    echo json_encode([
        'status'   => 'erro',
        'mensagem' => 'Erro inesperado. Tente novamente.'
    ]);
    exit;
}
?>