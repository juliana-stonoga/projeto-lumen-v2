/**
 * Modal de confirmação de exclusão — compartilhado por todas as páginas.
 *
 * Uso:
 *   confirmarExclusao({
 *     titulo:      'Excluir meta?',
 *     mensagem:    'Esta ação não pode ser desfeita.',
 *     onConfirmar: () => { ... }   // chamada ao clicar em Excluir
 *   });
 */

let _excluirCallback = null;

function confirmarExclusao({ titulo, mensagem, onConfirmar }) {
    _excluirCallback = onConfirmar || null;

    document.getElementById('modal-excluir-titulo').textContent = titulo   || 'Excluir?';
    document.getElementById('modal-excluir-msg').textContent    = mensagem || 'Esta ação é permanente e não poderá ser desfeita.';
    document.getElementById('modal-excluir-global').style.display = 'flex';
}

function _confirmarExclusaoOk() {
    document.getElementById('modal-excluir-global').style.display = 'none';
    if (typeof _excluirCallback === 'function') {
        _excluirCallback();
    }
    _excluirCallback = null;
}

function _fecharModalExcluir() {
    document.getElementById('modal-excluir-global').style.display = 'none';
    _excluirCallback = null;
}
