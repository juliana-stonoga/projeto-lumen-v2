/**
 * Valida a sessão do usuário e preenche automaticamente
 * os elementos de perfil (#perfil-nome, #perfil-email, #perfil-iniciais)
 * se eles existirem na página.
 *
 * Retorna o objeto do usuário autenticado, ou null se não autenticado.
 */
async function valida_sessao() {
    const retorno  = await fetch("../php/valida_sessao.php");
    const resposta = await retorno.json();

    if (resposta.status === "nok") {
        window.location.href = '../login/';
        return null;
    }

    const usuario = resposta.data[0];
    _preencherPerfil(usuario);
    return usuario;
}

/**
 * Preenche os elementos de identidade do usuário na página.
 * Funciona em qualquer layout (sidebar ou navbar) que contenha
 * os IDs: perfil-nome, perfil-email, perfil-iniciais.
 */
function _preencherPerfil(usuario) {
    if (!usuario) return;

    const nome  = usuario.nome  || "";
    const email = usuario.email || "";

    // Gera iniciais: 1ª letra do primeiro nome + 1ª letra do último
    const partes   = nome.trim().split(/\s+/).filter(Boolean);
    const iniciais = partes.length >= 2
        ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
        : (partes[0] ? partes[0][0].toUpperCase() : "?");

    const el = {
        nome:     document.getElementById("perfil-nome"),
        email:    document.getElementById("perfil-email"),
        iniciais: document.getElementById("perfil-iniciais"),
    };

    if (el.nome)     el.nome.textContent     = nome;
    if (el.email)    el.email.textContent    = email;
    if (el.iniciais) el.iniciais.textContent = iniciais;
}
