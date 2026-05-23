document.getElementById("entrar").addEventListener("click", () => {
    login();
});

document.getElementById("recuperar").addEventListener("click", () => {
    abrirModalRecuperacao();
});

document.addEventListener("DOMContentLoaded", () => {
    const fechar = document.getElementById("fecharModalRecuperacao");
    const cancelar = document.getElementById("btnCancelarRecuperacao");
    const enviar = document.getElementById("btnEnviarRecuperacao");
    const modal = document.getElementById("modalRecuperacao");

    if (fechar) fechar.addEventListener("click", fecharModalRecuperacao);
    if (cancelar) cancelar.addEventListener("click", fecharModalRecuperacao);
    if (enviar) enviar.addEventListener("click", recuperarSenha);
    if (modal) modal.addEventListener("click", function (e) {
        if (e.target === modal) fecharModalRecuperacao();
    });
});

function abrirModalRecuperacao() {
    const modal = document.getElementById("modalRecuperacao");
    if (modal) modal.style.display = "flex";
    const email = document.getElementById("emailRecuperar");
    if (email) email.value = document.getElementById("email")?.value || "";
    atualizarMensagemRecuperacao('', '');
}

function fecharModalRecuperacao() {
    const modal = document.getElementById("modalRecuperacao");
    if (modal) modal.style.display = "none";
    const email = document.getElementById("emailRecuperar");
    if (email) email.value = "";
    atualizarMensagemRecuperacao('', '');
}

function atualizarMensagemRecuperacao(texto, tipo) {
    const msg = document.getElementById("mensagemRecuperacao");
    if (!msg) return;
    msg.textContent = texto;
    msg.className = "mensagem-recuperacao" + (tipo ? " " + tipo : "");
}

async function recuperarSenha() {
    const email = document.getElementById("emailRecuperar").value.trim();
    const erro = document.getElementById("erro-email-recuperar");

    if (erro) erro.innerText = "";
    atualizarMensagemRecuperacao('', '');

    if (!email) {
        if (erro) erro.innerText = "O campo e-mail é obrigatório.";
        return;
    }

    const fd = new FormData();
    fd.append("email", email);

    try {
        const response = await fetch("../php/recuperar_senha.php", {
            method: "POST",
            body: fd
        });
        const data = await response.json();

        if (data.status === "ok") {
            atualizarMensagemRecuperacao(data.mensagem + (data.senha ? "\nSenha temporária: " + data.senha : ""), 'sucesso');
        } else {
            atualizarMensagemRecuperacao(data.mensagem || "E-mail não encontrado.", 'erro');
        }
    } catch (error) {
        atualizarMensagemRecuperacao("Erro ao recuperar senha.", 'erro');
        console.error(error);
    }
}

async function login(){
    var email = document.getElementById("email").value;
    var senha = document.getElementById("senha").value;

    limparErros();

    let valido = true;

    if(email.trim() == ""){
        document.getElementById("erro-email").innerText = "O campo email é obrigatório.";
        document.getElementById("email").classList.add("input-erro");
        valido = false;
    }

    if(senha.trim() == ""){
        document.getElementById("erro-senha").innerText = "O campo senha é obrigatório.";
        document.getElementById("senha").classList.add("input-erro");
        valido = false;
    }

    if(!valido){
        return;
    }

    const fd = new FormData();
    fd.append("email", email);
    fd.append("senha", senha);

    const retorno = await fetch("../php/cliente_login.php",{
            method: "POST",
            body: fd
        }
    );

    const resposta = await retorno.json();

    const msg = document.getElementById("mnsg");

    if(resposta.status == "ok"){

        const usuario = resposta.data;

        msg.className = "msg-success";
        msg.style.color = "green";
        msg.innerText = "Login realizado com sucesso!";

        setTimeout(() => {

            if(usuario.email == "adm@adm"){
                window.location.href = "../admin/adm-index.html";
            }else{    

                window.location.href = "../home/home.html";
            }
        }, 1200);
        
    }else{
        msg.className = "msg-error";
        msg.style.color = "red";
        msg.innerText = resposta.mensagem ||"Credenciais invalidas.";
    }
}

function limparErros() {

    const inputs = document.querySelectorAll(".form-control");
    inputs.forEach(input => {
        input.classList.remove("input-erro");
    });

    const erros = document.querySelectorAll(".erro-input");
    erros.forEach(erro => {
        erro.innerText = "";
    });
}