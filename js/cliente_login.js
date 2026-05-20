document.getElementById("entrar").addEventListener("click", () => {
    login();
});

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