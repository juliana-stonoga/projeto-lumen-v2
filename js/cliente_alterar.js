document.addEventListener("DOMContentLoaded", () => {
    valida_sessao();
    buscar();

    document.getElementById("btn-editar").addEventListener("click", () => toggleEditMode(true));
    document.getElementById("cancelar").addEventListener("click", () => toggleEditMode(false));
    document.getElementById("enviar").addEventListener("click", (e) => {
        e.preventDefault();
        alterar();
    });
    document.getElementById("delete-account").addEventListener("click", excluirConta);
});

function toggleEditMode(show) {
    document.getElementById("view-mode").style.display = show ? "none" : "block";
    document.getElementById("form-alterar").style.display = show ? "block" : "none";
    document.getElementById("alerta").style.display = "none";
}

async function buscar() {
    const retorno = await fetch("../php/cliente_get.php");
    const resposta = await retorno.json();

    if (resposta.status == "ok") {
        const registro = resposta.data[0];

        document.getElementById("id").value = registro.id;

        document.getElementById("view-nome").textContent = registro.nome;
        document.getElementById("view-email").textContent = registro.email;
        document.getElementById("view-telefone").textContent = registro.telefone;

        document.getElementById("nome").value = registro.nome;
        document.getElementById("email").value = registro.email;
        document.getElementById("telefone").value = registro.telefone;
        document.getElementById("senha").value = registro.senha;
    } else {
        alert("ERRO: " + resposta.mensagem);
        window.location.href = "../home/home.html";
    }
}

async function alterar() {
    try {
        const nome     = document.getElementById("nome").value;
        const telefone = document.getElementById("telefone").value;
        const senha    = document.getElementById("senha").value;
        const email    = document.getElementById("email").value;
        const id       = document.getElementById("id").value;

        const fd = new FormData();
        fd.append("nome", nome);
        fd.append("telefone", telefone);
        fd.append("senha", senha);
        fd.append("email", email);

        const retorno = await fetch("../php/cliente_alterar.php?id=" + id, {
            method: "POST",
            body: fd
        });

        const resposta = await retorno.json();
        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";

        if (resposta.status == "ok") {
            alerta.className = "custom-alert sucesso";
            alerta.innerText = "Dados alterados com sucesso!";

            document.getElementById("view-nome").textContent = nome;
            document.getElementById("view-email").textContent = email;
            document.getElementById("view-telefone").textContent = telefone;

            setTimeout(() => toggleEditMode(false), 1500);
        } else {
            alerta.className = "custom-alert erro";
            alerta.innerText = resposta.mensagem || "Não há dados para alterar.";
        }
    } catch (erro) {
        console.log(erro);
        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";
        alerta.className = "custom-alert erro";
        alerta.innerText = "Erro no JavaScript ou PHP.";
    }
}

async function excluirConta() {
    const confirmar = confirm("Tem certeza que deseja excluir sua conta?");
    if (!confirmar) return;

    try {
        const id = document.getElementById("id").value;

        const retorno = await fetch("../php/cliente_excluir.php?id=" + id, { method: "POST" });
        const resposta = await retorno.json();

        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";

        if (resposta.status == "ok") {
            alerta.className = "custom-alert sucesso";
            alerta.innerText = "Conta excluída com sucesso.";
            setTimeout(() => { window.location.href = "../index.html"; }, 2000);
        } else {
            alerta.className = "custom-alert erro";
            alerta.innerText = resposta.mensagem;
        }
    } catch (erro) {
        console.log(erro);
        const alerta = document.getElementById("alerta");
        alerta.style.display = "block";
        alerta.className = "custom-alert erro";
        alerta.innerText = "Erro ao excluir conta.";
    }
}
