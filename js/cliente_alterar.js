document.addEventListener("DOMContentLoaded", () => {
    valida_sessao();
    buscar();

    // Listeners principais
    document.getElementById("btn-editar").addEventListener("click", () => toggleEditMode(true));
    document.getElementById("cancelar").addEventListener("click", () => toggleEditMode(false));
    document.getElementById("enviar").addEventListener("click", (e) => {
        e.preventDefault();
        if (validarFormulario()) alterar();
    });
    document.getElementById("delete-account").addEventListener("click", abrirModalExcluir);
    document.getElementById("modal-cancelar").addEventListener("click", fecharModalExcluir);
    document.getElementById("modal-confirmar").addEventListener("click", excluirConta);
    document.getElementById("modal-excluir").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) fecharModalExcluir();
    });

    // Máscara de telefone em tempo real
    document.getElementById("telefone").addEventListener("input", (e) => {
        const pos = e.target.selectionStart;
        e.target.value = mascaraTelefone(e.target.value);
    });

    // Toggle mostrar/ocultar senha
    document.getElementById("toggle-senha").addEventListener("click", () => {
        const input = document.getElementById("senha");
        const icon  = document.getElementById("icon-senha");
        if (input.type === "password") {
            input.type = "text";
            icon.className = "fa-solid fa-eye-slash";
        } else {
            input.type = "password";
            icon.className = "fa-solid fa-eye";
        }
    });

    // Validação ao sair de cada campo (blur)
    // + re-valida em tempo real se já tiver erro marcado
    const campos = ["nome", "email", "telefone", "senha"];
    campos.forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener("blur", () => validarCampo(id));
        el.addEventListener("input", () => {
            if (el.classList.contains("input-erro")) validarCampo(id);
        });
    });
});

// ─── Máscara de telefone ─────────────────────────────────────────────────────
// Formato: (XX) XXXX-XXXX para fixo (10 dígitos)
//          (XX) XXXXX-XXXX para celular (11 dígitos)

function mascaraTelefone(valor) {
    const d = valor.replace(/\D/g, "").slice(0, 11);
    const n = d.length;
    if (n === 0) return "";
    if (n <= 2)  return `(${d}`;
    if (n <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (n <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return     `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ─── Regras de validação com RegEx ───────────────────────────────────────────

const regras = {
    nome: {
        obrigatorio: true,
        validar: v => /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{3,80}$/.test(v.trim()),
        mensagem: "Nome deve ter entre 3 e 80 caracteres (somente letras e espaços)."
    },
    email: {
        obrigatorio: true,
        validar: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
        mensagem: "Informe um e-mail válido (ex: nome@dominio.com)."
    },
    telefone: {
        obrigatorio: true,
        validar: v => {
            const nums = v.replace(/\D/g, "");
            return nums.length === 10 || nums.length === 11;
        },
        mensagem: "Telefone inválido. Use o formato (XX) XXXXX-XXXX."
    },
    senha: {
        obrigatorio: false,          // opcional — deixe em branco para manter a atual
        validar: v => v.length >= 6,
        mensagem: "A senha deve ter no mínimo 6 caracteres."
    }
};

// ─── Validação de campo individual ───────────────────────────────────────────

function validarCampo(id) {
    const el    = document.getElementById(id);
    const erro  = document.getElementById("erro-" + id);
    const regra = regras[id];
    if (!el || !erro || !regra) return true;

    const valor = el.value;

    // Campo obrigatório e vazio
    if (regra.obrigatorio && valor.trim() === "") {
        marcarErro(el, erro, "Este campo é obrigatório.");
        return false;
    }

    // Campo opcional e vazio → neutro (não marca verde nem vermelho)
    if (!regra.obrigatorio && valor.trim() === "") {
        el.classList.remove("input-erro", "input-valido");
        erro.textContent = "";
        return true;
    }

    // Conteúdo preenchido mas inválido
    if (!regra.validar(valor)) {
        marcarErro(el, erro, regra.mensagem);
        return false;
    }

    marcarValido(el, erro);
    return true;
}

// Valida todos os campos e retorna true somente se todos passarem

function validarFormulario() {
    const ids   = ["nome", "email", "telefone", "senha"];
    let valido  = true;
    ids.forEach(id => { if (!validarCampo(id)) valido = false; });
    return valido;
}

// ─── Helpers de estado visual ─────────────────────────────────────────────────

function marcarErro(input, span, msg) {
    input.classList.add("input-erro");
    input.classList.remove("input-valido");
    span.textContent = msg;
}

function marcarValido(input, span) {
    input.classList.remove("input-erro");
    input.classList.add("input-valido");
    span.textContent = "";
}

function limparEstados() {
    ["nome", "email", "telefone", "senha"].forEach(id => {
        const el   = document.getElementById(id);
        const erro = document.getElementById("erro-" + id);
        if (el)   el.classList.remove("input-erro", "input-valido");
        if (erro) erro.textContent = "";
    });
    // Limpar e restaurar campo de senha
    const senha = document.getElementById("senha");
    const icon  = document.getElementById("icon-senha");
    if (senha) { senha.value = ""; senha.type = "password"; }
    if (icon)  icon.className = "fa-solid fa-eye";
}

// ─── Toggle modo edição / visualização ───────────────────────────────────────

function toggleEditMode(show) {
    document.getElementById("view-mode").style.display   = show ? "none"  : "block";
    document.getElementById("form-alterar").style.display = show ? "block" : "none";
    document.getElementById("alerta").style.display      = "none";
    if (!show) limparEstados();
}

// ─── Buscar dados do usuário ──────────────────────────────────────────────────

async function buscar() {
    try {
        const retorno  = await fetch("../php/cliente_get.php");
        const resposta = await retorno.json();

        if (resposta.status === "ok") {
            const r = resposta.data[0];

            document.getElementById("id").value = r.id;

            // Preencher modo visualização
            document.getElementById("view-nome").textContent     = r.nome     || "—";
            document.getElementById("view-email").textContent    = r.email    || "—";
            document.getElementById("view-telefone").textContent = r.telefone ? mascaraTelefone(r.telefone) : "—";

            // ★★★ NOVO CAMPO — PASSO 2A DE 4: EXIBIR NO MODO LEITURA (Perfil) ★★★
            // Preencha o elemento de visualização e o input do formulário com o valor do banco.
            // Exemplo para "nome_mae":
            //   document.getElementById("view-nome_mae").textContent = r.nome_mae || "—";
            //   document.getElementById("nome_mae").value = r.nome_mae || "";
            // ★★★ FIM DA INSTRUÇÃO ★★★

            // Preencher campos do formulário (senha não é pré-preenchida)
            document.getElementById("nome").value     = r.nome     || "";
            document.getElementById("email").value    = r.email    || "";
            document.getElementById("telefone").value = r.telefone ? mascaraTelefone(r.telefone) : "";
            document.getElementById("senha").value    = ""; // deixar vazio; preencher só para alterar
        } else {
            alert("ERRO: " + resposta.mensagem);
            window.location.href = "../home/home.html";
        }
    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar dados. Tente novamente.");
    }
}

// ─── Salvar alterações ────────────────────────────────────────────────────────

async function alterar() {
    try {
        const nome     = document.getElementById("nome").value.trim();
        const email    = document.getElementById("email").value.trim();
        const telefone = document.getElementById("telefone").value;
        const senha    = document.getElementById("senha").value;
        const id       = document.getElementById("id").value;

        // ★★★ NOVO CAMPO — PASSO 2B DE 4: ENVIAR NO FORMDATA (Perfil) ★★★
        // Leia o valor do campo e adicione ao FormData antes do fetch.
        // Exemplo para "nome_mae":
        //   const nome_mae = document.getElementById("nome_mae").value.trim();
        //   fd.append("nome_mae", nome_mae);
        // Lembre também de atualizar o modo visualização após salvar:
        //   document.getElementById("view-nome_mae").textContent = nome_mae;
        // ★★★ FIM DA INSTRUÇÃO ★★★

        const fd = new FormData();
        fd.append("nome",     nome);
        fd.append("email",    email);
        fd.append("telefone", telefone);
        if (senha) fd.append("senha", senha); // só envia se o usuário preencheu

        const retorno  = await fetch("../php/cliente_alterar.php?id=" + id, { method: "POST", body: fd });
        const resposta = await retorno.json();

        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";

        if (resposta.status === "ok") {
            alerta.className = "custom-alert sucesso";
            alerta.innerText = "Dados alterados com sucesso!";

            // Atualizar modo visualização
            document.getElementById("view-nome").textContent     = nome;
            document.getElementById("view-email").textContent    = email;
            document.getElementById("view-telefone").textContent = telefone;

            setTimeout(() => toggleEditMode(false), 1500);
        } else {
            alerta.className = "custom-alert erro";
            alerta.innerText = resposta.mensagem || "Não há dados para alterar.";
        }
    } catch (erro) {
        console.error(erro);
        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";
        alerta.className = "custom-alert erro";
        alerta.innerText = "Erro ao salvar. Tente novamente.";
    }
}

// ─── Modal de exclusão de conta ───────────────────────────────────────────────

function abrirModalExcluir() {
    document.getElementById("modal-excluir").style.display = "flex";
}

function fecharModalExcluir() {
    document.getElementById("modal-excluir").style.display = "none";
}

async function excluirConta() {
    fecharModalExcluir();
    try {
        const id       = document.getElementById("id").value;
        const retorno  = await fetch("../php/cliente_excluir.php?id=" + id, { method: "POST" });
        const resposta = await retorno.json();

        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";

        if (resposta.status === "ok") {
            alerta.className = "custom-alert sucesso";
            alerta.innerText = "Conta excluída com sucesso.";
            setTimeout(() => { window.location.href = "../index.html"; }, 2000);
        } else {
            alerta.className = "custom-alert erro";
            alerta.innerText = resposta.mensagem;
        }
    } catch (erro) {
        console.error(erro);
        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";
        alerta.className = "custom-alert erro";
        alerta.innerText = "Erro ao excluir conta.";
    }
}
