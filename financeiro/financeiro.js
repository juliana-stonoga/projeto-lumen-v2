// ── Estado global ──────────────────────────────────────────────────────────
var todasTransacoes = [];

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, tipo = 'ok') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = msg;
  t.classList.add('visivel');
  if (tipo === 'erro') t.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
  else                 t.style.background = '';
  setTimeout(() => t.classList.remove('visivel'), 3000);
}

// ── Inicialização ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  carregarTransacoes();

  // Abrir modal Nova Transação
  const btnAbrir = document.getElementById("abrirModalTransacao");
  const modal    = document.getElementById("modalTransacao");
  if (btnAbrir && modal) {
    btnAbrir.addEventListener("click", function () {
      abrirModalNovo();
    });
  }

  // Fechar modal pelos botões ✖ e Cancelar
  const btnFechar   = document.getElementById("fecharModalTransacao");
  const btnCancelar = document.getElementById("cancelarModal");
  if (btnFechar)   btnFechar.addEventListener("click",   fecharModal);
  if (btnCancelar) btnCancelar.addEventListener("click", fecharModal);

  // Fechar ao clicar fora do modal-content
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharModal();
    });
  }

  // Submit do formulário
  const form = document.getElementById("formTransacao");
  if (form) form.addEventListener("submit", salvarTransacao);
});

// ── Modal ──────────────────────────────────────────────────────────────────
function abrirModalNovo() {
  const modal = document.getElementById("modalTransacao");
  const form  = document.getElementById("formTransacao");
  if (form) form.reset();
  document.getElementById("transacaoId").value = "";
  document.getElementById("modalTitulo").textContent = "Nova Transação";

  // Marcar "Entrada" por padrão
  const tipoEntrada = document.getElementById("tipoEntrada");
  if (tipoEntrada) tipoEntrada.checked = true;

  if (modal) modal.style.display = "flex";
}

function fecharModal() {
  const modal = document.getElementById("modalTransacao");
  if (modal) modal.style.display = "none";
  const form = document.getElementById("formTransacao");
  if (form) form.reset();
  document.getElementById("transacaoId").value = "";
}

// ── Salvar (criar) transação ───────────────────────────────────────────────
function salvarTransacao(e) {
  e.preventDefault();

  const id             = document.getElementById("transacaoId").value;
  const tipo           = document.querySelector('input[name="tipo"]:checked')?.value || "entrada";
  const titulo         = document.getElementById("titulo").value.trim();
  const descricao      = document.getElementById("descricao").value.trim();
  const valor          = document.getElementById("valor").value;
  const data_financeira = document.getElementById("data_financeira").value;

  if (!titulo || !valor || !data_financeira) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const params = new URLSearchParams({
    acao: id ? "editar" : "adicionar",
    tipo, titulo, descricao, valor, data_financeira
  });
  if (id) params.append("id", id);

  fetch("financeiro.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  })
    .then(r => {
      if (!r.ok) throw new Error("Erro ao enviar transação");
      return r.json();
    })
    .then(data => {
      if (!Array.isArray(data) && data.status === 'erro') {
        throw new Error(data.mensagem || 'Falha ao salvar transação');
      }
      showToast('<i class="fa-solid fa-circle-check"></i> Transação salva!');
      fecharModal();
      carregarTransacoes();
    })
    .catch(error => {
      console.error('Erro salvar transação:', error);
      showToast('<i class="fa-solid fa-circle-xmark"></i> Erro ao salvar transação.', 'erro');
      adicionarLocalmente({ tipo, titulo, descricao, valor: parseFloat(valor), data_financeira });
      fecharModal();
    });
}

// Fallback local (sem backend)
function adicionarLocalmente(t) {
  t.id = Date.now();
  todasTransacoes.push(t);
  aplicarFiltro();
  atualizarResumo(todasTransacoes);
}

// ── Carregar transações do servidor ───────────────────────────────────────
function carregarTransacoes() {
  fetch("financeiro.php", { credentials: "same-origin" })
    .then(r => {
      if (!r.ok) throw new Error('Erro ao carregar transações');
      return r.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error('Resposta inesperada do backend financeiro', data);
        todasTransacoes = [];
      } else {
        todasTransacoes = data;
      }
      popularAnosFinanceiro();
      aplicarFiltro();
      atualizarResumo(todasTransacoes);
    })
    .catch(error => {
      console.error('Erro carregar transações:', error);
      aplicarFiltro();
      atualizarResumo(todasTransacoes);
    });
}

// ── Filtros ────────────────────────────────────────────────────────────────
function aplicarFiltro() {
  const mes  = document.getElementById("filtroMes")?.value  || "";
  const ano  = document.getElementById("filtroAno")?.value  || "";
  const tipo = document.getElementById("filtroTipo")?.value || "";

  const filtradas = todasTransacoes.filter(t => {
    const partes = (t.data_financeira || "").split("-");
    const mesT = partes[1];
    const anoT = partes[0];
    const passaMes  = !mes  || mesT === mes;
    const passaAno  = !ano  || anoT === ano;
    const passaTipo = !tipo || t.tipo === tipo;
    return passaMes && passaAno && passaTipo;
  });

  renderizarTransacoes(filtradas);
  // o resumo permanece estático com base no total geral,
  // apenas as transações exibidas mudam conforme filtro.
}

function limparFiltros() {
  const campos = ["filtroMes", "filtroAno", "filtroTipo"];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  aplicarFiltro();
}

function popularAnosFinanceiro() {
  const anos = [...new Set(
    todasTransacoes.map(t => (t.data_financeira || '').split('-')[0]).filter(Boolean)
  )].sort((a, b) => b - a);

  const sel = document.getElementById('filtroAno');
  if (!sel) return;
  const valorAtual = sel.value;
  sel.innerHTML = '<option value="">Todos os anos</option>';
  anos.forEach(a => {
    const option = document.createElement('option');
    option.value = a;
    option.textContent = a;
    sel.appendChild(option);
  });
  if (valorAtual) sel.value = valorAtual;
}

// ── Renderizar cards ───────────────────────────────────────────────────────
function renderizarTransacoes(lista) {
  const container = document.getElementById("financeiroContent");
  if (!container) return;

  if (!lista || lista.length === 0) {
    container.innerHTML = '<p class="vazio">Nenhuma transação encontrada.</p>';
    return;
  }

  container.innerHTML = lista.map(t => {
    const icone = t.tipo === "entrada"
      ? '<i class="fa-solid fa-arrow-trend-up"></i>'
      : '<i class="fa-solid fa-arrow-trend-down"></i>';

    const sinal  = t.tipo === "entrada" ? "+" : "−";
    const valor  = parseFloat(t.valor || 0).toFixed(2).replace(".", ",");
    const data   = formatarData(t.data_financeira);
    const titulo = escHtml(t.titulo || t.tipo);
    const desc   = escHtml(t.descricao || "");

    const tituloEsc   = encodeURIComponent(t.titulo   || "");
    const descEsc     = encodeURIComponent(t.descricao || "");

    return `
      <div class="card-transacao ${t.tipo}">
        <div class="card-icone">${icone}</div>
        <div class="card-info">
          <div class="card-titulo">${titulo}</div>
          ${desc ? `<div class="card-desc">${desc}</div>` : ""}
          <div class="card-data"><i class="fa-regular fa-calendar" style="margin-right:5px;opacity:.6"></i>${data}</div>
        </div>
        <div class="card-valor">${sinal} R$ ${valor}</div>
        <div class="card-acoes">
          <button class="btn-editar-card" onclick="abrirModalEditar(
            ${t.id},
            '${t.tipo}',
            '${tituloEsc}',
            '${descEsc}',
            '${t.valor}',
            '${t.data_financeira}'
          )"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="btn-excluir-card" onclick="excluirTransacao(${t.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
  }).join("");
}

// ── Resumo ─────────────────────────────────────────────────────────────────
function atualizarResumo(lista) {
  let entradas = 0, saidas = 0;
  lista.forEach(t => {
    if (t.tipo === "entrada") entradas += parseFloat(t.valor) || 0;
    else                      saidas   += parseFloat(t.valor) || 0;
  });
  const saldo = entradas - saidas;

  document.getElementById("resumoEntradas").textContent =
    "R$ " + entradas.toFixed(2).replace(".", ",");
  document.getElementById("resumoSaidas").textContent =
    "R$ " + saidas.toFixed(2).replace(".", ",");

  const elSaldo = document.getElementById("resumoSaldo");
  elSaldo.textContent = "R$ " + Math.abs(saldo).toFixed(2).replace(".", ",");
  if (saldo < 0) {
    elSaldo.textContent = "− R$ " + Math.abs(saldo).toFixed(2).replace(".", ",");
    elSaldo.className = "negativo";
  } else {
    elSaldo.className = "positivo";
  }
}

// ── Editar ─────────────────────────────────────────────────────────────────
function abrirModalEditar(id, tipo, titulo, descricao, valor, data) {
  document.getElementById("editId").value       = id;
  document.getElementById("editTipo").value     = tipo;
  document.getElementById("editTitulo").value   = decodeURIComponent(titulo   || "");
  document.getElementById("editDescricao").value = decodeURIComponent(descricao || "");
  document.getElementById("editValor").value    = valor;
  document.getElementById("editData").value     = data;
  document.getElementById("modalEditar").style.display = "flex";
}

function fecharModalEditar() {
  document.getElementById("modalEditar").style.display = "none";
}

function salvarEdicao() {
  const id        = document.getElementById("editId").value;
  const tipo      = document.getElementById("editTipo").value;
  const titulo    = document.getElementById("editTitulo").value;
  const descricao = document.getElementById("editDescricao").value;
  const valor     = document.getElementById("editValor").value;
  const data      = document.getElementById("editData").value;

  fetch("financeiro.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `acao=editar&id=${id}&tipo=${tipo}&titulo=${encodeURIComponent(titulo)}&descricao=${encodeURIComponent(descricao)}&valor=${valor}&data_financeira=${data}`
  })
    .then(r => {
      if (!r.ok) throw new Error('Erro ao editar transação');
      return r.json();
    })
    .then(data => {
      if (!Array.isArray(data) && data.status === 'erro') {
        throw new Error(data.mensagem || 'Falha ao editar transação');
      }
      showToast('<i class="fa-solid fa-pen-to-square"></i> Transação atualizada!');
      fecharModalEditar();
      carregarTransacoes();
    })
    .catch(() => {
      // fallback local
      const t = todasTransacoes.find(x => x.id == id);
      if (t) {
        t.tipo = tipo;
        t.titulo = titulo;
        t.descricao = descricao;
        t.valor = valor;
        t.data_financeira = data;
      }
      showToast('<i class="fa-solid fa-pen-to-square"></i> Transação atualizada!');
      fecharModalEditar();
      aplicarFiltro();
      atualizarResumo(todasTransacoes);
    });
}

// ── Excluir ────────────────────────────────────────────────────────────────
function excluirTransacao(id) {
  if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

  fetch("financeiro.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "acao=excluir&id=" + id
  })
    .then(r => {
      if (!r.ok) throw new Error('Erro ao excluir transação');
      return r.json();
    })
    .then(data => {
      if (!Array.isArray(data) && data.status === 'erro') {
        throw new Error(data.mensagem || 'Falha ao excluir transação');
      }
      showToast('<i class="fa-solid fa-trash"></i> Transação removida.');
      carregarTransacoes();
    })
    .catch(() => {
      // fallback local
      todasTransacoes = todasTransacoes.filter(t => t.id != id);
      showToast('<i class="fa-solid fa-trash"></i> Transação removida.');
      aplicarFiltro();
      atualizarResumo(todasTransacoes);
    });
}

// ── Utilitários ────────────────────────────────────────────────────────────
function formatarData(str) {
  if (!str) return "—";
  const [a, m, d] = str.split("-");
  return d && m && a ? `${d}/${m}/${a}` : str;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}