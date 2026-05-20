document.addEventListener("DOMContentLoaded", () => {
    valida_sessao();
    buscar();
});

document.getElementById("novo").addEventListener("click", () => {
    window.location.href = 'cliente_novo.html';
});

document.getElementById("logoff").addEventListener("click", () => {
    logoff();
});

async function logoff(){
    const retorno = await fetch("../php/cliente_logoff.php");
    const resposta = await retorno.json();
    if(resposta.status == "ok"){
        window.location.href = '../login/';   
    }
}
async function buscar(){
    const retorno = await fetch("../php/cliente_get.php");
    const resposta = await retorno.json();
    if(resposta.status == "ok"){
        preencherTabela(resposta.data);    
    }
}

async function excluir(id){
    const retorno = await fetch("../php/cliente_excluir.php?id="+id);
    const resposta = await retorno.json();
    if(resposta.status == "ok"){
        alert(resposta.mensagem);
        window.location.reload();    
    }else{
        alert(resposta.mensagem);
    }
}

function preencherTabela(tabela){
    var html = `
        <table>
            <tr>
                <th> nome </th>
                <th> email </th>
                <th> telefone </th>
                <th> senha </th>
                <th> ações </th>
            </tr>`;
    for(var i=0;i<tabela.length;i++){
        html += `
            <tr>
                <td>${tabela[i].nome}</td>
                <td>${tabela[i].email}</td>
                <td>${tabela[i].telefone}</td>
                <td>${tabela[i].senha}</td>
                <td>
                    <button
                        class="edit-btn"
                        onclick = 'abrirEdicao(${JSON.stringify(tabela[i])})'
                    >
                        Editar
                    </button>
                    <a href='#' onclick='excluir(${tabela[i].id})'>Excluir</a>
                </td>
            </tr>
        `;
    }
    html += '</table>';
    document.getElementById("lista").innerHTML = html;
}

function abrirEdicao(cliente){
    document.getElementById("painel-edicao").style.display = "flex";

    document.getElementById("edit-id").value = usuario.id;

    document.getElementById("edit-nome").value = usuario.nome;

    document.getElementById("edit-email").value = usuario.email;

    document.getElementById("edit-telefone").value = usuario.telefone;

    document.getElementById("edit-senha").value = usuario.senha;
}

function fecharPainel(){

    document.getElementById("painel-edicao").style.display = "none";
}