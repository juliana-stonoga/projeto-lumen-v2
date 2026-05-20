async function valida_sessao(){
    const retorno = await fetch("../php/valida_sessao.php");
    const resposta = await retorno.json();
    if(resposta.status == "nok"){
        window.location.href = '../login/';
    }
}