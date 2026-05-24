document.getElementById("enviar").addEventListener("click", () => {
    novo();
});

async function novo(){

    var nome = document.getElementById("nome").value;
    var email = document.getElementById("email").value;
    var telefone = document.getElementById("telefone").value;
    var senha = document.getElementById("senha").value;

    limparErros();

    let valido = true;

    if(nome == ""){

        document.getElementById("nome").classList.add("input-erro");

        document.getElementById("erro-nome").innerText =
            "O nome é obrigatório.";

        valido = false;        
    }

    if(email == ""){

        document.getElementById("email").classList.add("input-erro");

        document.getElementById("erro-email").innerText =
            "O e-mail é obrigatório.";

        valido = false;

    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        document.getElementById("email").classList.add("input-erro");

        document.getElementById("erro-email").innerText =
            "Digite um e-mail válido (ex: nome@dominio.com).";

        valido = false;
    }

    if(telefone == ""){

        document.getElementById("telefone").classList.add("input-erro");   

        document.getElementById("erro-telefone").innerText = "O telefone é obrigatório.";

        valido = false;
    }

    if(senha == ""){

        document.getElementById("senha").classList.add("input-erro");
        document.getElementById("erro-senha").innerText = "A senha é obrigatória.";

        valido = false;
    }

    if(!valido){
        return;
    }


    const fd = new FormData();

    fd.append("nome", nome);
    fd.append("email", email);
    fd.append("telefone", telefone);
    fd.append("senha", senha);

    try {

        const retorno = await fetch("../php/cliente_novo.php", {

            method: 'POST',
            body: fd
        });

        const resposta = await retorno.json();

        console.log(resposta);

        const alerta =
            document.getElementById("alerta");

        alerta.style.display = "block";

        if(resposta.status == "ok"){

            alerta.className =
                "custom-alert sucesso";

            alerta.innerText =
                "Conta registrada com sucesso!";

            setTimeout(() => {

                window.location.href = "../login/login.html";

            }, 2000);

        } else {

            alerta.className =
                "custom-alert erro";

            alerta.innerText =
                resposta.mensagem;
        }

    } catch(erro){

        console.log(erro);

        const alerta =
            document.getElementById("alerta");

        alerta.style.display = "block";

        alerta.className =
            "custom-alert erro";

        alerta.innerText =
            "Erro no JavaScript ou PHP.";
    }
}

function limparErros(){

    const inputs =
        document.querySelectorAll(".form-control");

    inputs.forEach(input => {

        input.classList.remove("input-erro");
    });

    const erros =
        document.querySelectorAll(".erro-input");

    erros.forEach(erro => {

        erro.innerText = "";
    });
}