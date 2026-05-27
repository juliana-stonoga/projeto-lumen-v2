document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("enviar").addEventListener("click", (e) => {
        e.preventDefault();
        if (validarFormulario()) novo();
    });

    // Máscara de telefone em tempo real
    document.getElementById("telefone").addEventListener("input", (e) => {
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
    ["nome", "email", "telefone", "senha"].forEach(id => {
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
        obrigatorio: true,
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

    if (regra.obrigatorio && valor.trim() === "") {
        marcarErro(el, erro, "Este campo é obrigatório.");
        return false;
    }

    if (valor.trim() !== "" && !regra.validar(valor)) {
        marcarErro(el, erro, regra.mensagem);
        return false;
    }

    marcarValido(el, erro);
    return true;
}

// Valida todos os campos e retorna true somente se todos passarem

function validarFormulario() {
    const ids  = ["nome", "email", "telefone", "senha"];
    let valido = true;
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

// ─── Enviar cadastro ──────────────────────────────────────────────────────────

async function novo() {
    const nome     = document.getElementById("nome").value.trim();
    const email    = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value;
    const senha    = document.getElementById("senha").value;

    const fd = new FormData();
    fd.append("nome",     nome);
    fd.append("email",    email);
    fd.append("telefone", telefone);
    fd.append("senha",    senha);

    try {
        const retorno  = await fetch("../php/cliente_novo.php", { method: "POST", body: fd });
        const resposta = await retorno.json();

        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";

        if (resposta.status === "ok") {
            alerta.className = "custom-alert sucesso";
            alerta.innerText = "Conta registrada com sucesso!";
            setTimeout(() => { window.location.href = "../login/login.html"; }, 2000);
        } else {
            alerta.className = "custom-alert erro";
            alerta.innerText = resposta.mensagem;
        }
    } catch (erro) {
        console.error(erro);
        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";
        alerta.className = "custom-alert erro";
        alerta.innerText = "Erro ao cadastrar. Tente novamente.";
    }
}
