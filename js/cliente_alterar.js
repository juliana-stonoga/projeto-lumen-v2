document.addEventListener("DOMContentLoaded", () => {
    
    valida_sessao();
    const url = new URLSearchParams(window.location.search);
    const id = url.get("id");
    buscar(id);
});

async function buscar(){
    const retorno = await fetch("../php/cliente_get.php");
    const resposta = await retorno.json();

    if(resposta.status == "ok"){
        
        var registro = resposta.data[0];

        console.log(registro);

        document.getElementById("nome").value = registro.nome;
        document.getElementById("email").value = registro.email;
        document.getElementById("telefone").value = registro.telefone;
        document.getElementById("senha").value = registro.senha;

        document.getElementById("id").value = registro.id;

    }else{
        alert("ERRO:" + resposta.mensagem);
        window.location.href = "home/cliente_alterar.html";
    }
}

// ----------------------------------------------
// Fase 2
document.getElementById("enviar").addEventListener("click", (event) => {
    event.preventDefault();
    alterar();
});

async function alterar(){

    try {

        var nome = document.getElementById("nome").value;
        var telefone = document.getElementById("telefone").value;
        var senha = document.getElementById("senha").value;
        var email = document.getElementById("email").value;
        var id = document.getElementById("id").value;

        const fd = new FormData();

        fd.append("nome", nome);
        fd.append("telefone", telefone);
        fd.append("senha", senha);
        fd.append("email", email);

        const retorno = await fetch("../php/cliente_alterar.php?id=" + id, {
            method: 'POST',
            body: fd  
        });

        const resposta = await retorno.json();

        const alerta = document.getElementById("alerta");

        alerta.style.display = "block";
        
        if(resposta.status == "ok"){

            alerta.className = "custom-alert sucesso";

            alerta.innerText =
                "Dados alterados com sucesso!";

        } else {

            alerta.className = "custom-alert erro";

            alerta.innerText =
                resposta.mensagem || "Não há dados para alterar.";
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

// ----------------- Deletar conta-----------------------------

document.getElementById("delete-account")
.addEventListener("click", async () => {

    const confirmar = confirm(
        "Tem certeza que deseja excluir sua conta?"
    );

    if(!confirmar){
        return;
    }

    try {

        const id =
            document.getElementById("id").value;

        const retorno = await fetch(
            "../php/cliente_excluir.php?id=" + id,
            {
                method: "POST"
            }
        );

        const resposta = await retorno.json();

        const alerta =
            document.getElementById("alerta");

        alerta.style.display = "block";

        if(resposta.status == "ok"){

            alerta.className =
                "custom-alert sucesso";

            alerta.innerText =
                "Conta excluída com sucesso.";

            setTimeout(() => {

                window.location.href =
                    "../index.html";

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
            "Erro ao excluir conta.";
    }
});