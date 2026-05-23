let metasCache = [];

carregarMetas();

const filtroStatus = document.getElementById('filtroStatus');
const filtroPrioridade = document.getElementById('filtroPrioridade');
const botaoLimparFiltros = document.getElementById('limparFiltrosMetas');
if (filtroStatus) filtroStatus.addEventListener('change', renderMetas);
if (filtroPrioridade) filtroPrioridade.addEventListener('change', renderMetas);
if (botaoLimparFiltros) botaoLimparFiltros.addEventListener('click', limparFiltrosMetas);

const elAccount = document.getElementById("account");
if (elAccount) {
  elAccount.addEventListener("click", function () {
    window.location.href = "../usuario/usuario.html";
  });
}

const elLogout = document.getElementById("btnLogout");
if (elLogout) {
  elLogout.addEventListener("click", function() {
    fetch("../php/cliente_logoff.php", { method: 'POST' })
      .then(() => {
        window.location.href = "../login/login.html";
      })
      .catch(() => {
        window.location.href = "../login/login.html";
      });
  });
}

function mostrarMensagem(texto, tipo) {
  const msg = document.getElementById("mensagem");
  if (!msg) {
    console.log(tipo + ': ' + texto);
    return;
  }
  msg.textContent = texto;
  msg.className = "mensagem";
  msg.classList.add(tipo);
  msg.style.display = "block";
}

function verificarVencimento(data_meta) {
  if (!data_meta) return "";
  const hoje = new Date();
  const data = new Date(data_meta);
  const diff = data - hoje;
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (dias < 0) return "meta-vencida";
  if (dias <= 2) return "meta-alerta";
  return "";
}

function normalizarStatus(status) {
  if (!status) return 'a fazer';
  status = status.toLowerCase();
  if (status.includes('concl')) return 'concluída';
  if (status.includes('fazer')) return 'a fazer';
  return 'em andamento';
}

function getStatusClass(status) {
  switch (status) {
    case 'a fazer':
      return 'status-fazer';
    case 'concluída':
      return 'status-concluido';
    default:
      return 'status-andamento';
  }
}


function renderMetas() {
  const filtroStatusValue = document.getElementById('filtroStatus')?.value || '';
  const statusFiltro = filtroStatusValue ? normalizarStatus(filtroStatusValue) : '';
  const prioridadeFiltro = document.getElementById('filtroPrioridade')?.value || '';
  let lista = document.getElementById('listaMetas');
  lista.innerHTML = "";

  const metasFiltradas = metasCache.filter(meta => {
    const statusMeta = normalizarStatus(meta.status_meta);
    const prioridadeMeta = meta.prioridade || '';
    if (statusFiltro && statusMeta !== statusFiltro) return false;
    if (prioridadeFiltro && prioridadeMeta !== prioridadeFiltro) return false;
    return true;
  });

  if (metasFiltradas.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhuma meta encontrada.</p>';
    return;
  }

  metasFiltradas.forEach(meta => {
    const status      = normalizarStatus(meta.status_meta);
    const statusClass = getStatusClass(status);
    const prio        = (meta.prioridade || '').toLowerCase();
    const prioClass   = prio === 'alta' ? 'prioridade-alta'
                      : prio === 'média' || prio === 'media' ? 'prioridade-media'
                      : prio === 'baixa' ? 'prioridade-baixa' : '';

    const badgePrioClass = prio === 'alta' ? 'badge-alta'
                         : prio === 'média' || prio === 'media' ? 'badge-media'
                         : prio === 'baixa' ? 'badge-baixa' : 'badge-categoria';

    const progresso   = meta.progresso ?? 0;
    const vencClass   = verificarVencimento(meta.data_meta);

    const dataFormatada = meta.data_meta
      ? meta.data_meta.split('-').reverse().join('/')
      : 'Sem data';

    lista.innerHTML += `
      <div class="card-meta ${prioClass} ${vencClass}">
        <div class="card-meta-header">
          <div class="card-meta-titulo">${meta.titulo}</div>
        </div>

        ${meta.descricao ? `<div class="card-meta-descricao">${meta.descricao}</div>` : ''}

        <div class="card-meta-badges">
          ${meta.prioridade ? `<span class="badge-pill ${badgePrioClass}"><i class="fa-solid fa-flag"></i> ${meta.prioridade}</span>` : ''}
          ${meta.categoria  ? `<span class="badge-pill badge-categoria"><i class="fa-solid fa-tag"></i> ${meta.categoria}</span>` : ''}
          <span class="badge-status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>

        <div class="card-meta-data">
          <i class="fa-regular fa-calendar" style="opacity:.65"></i>
          Prazo: ${dataFormatada}
        </div>

        <div class="progresso-wrapper">
          <div class="progresso-header">
            <span>Progresso</span>
            <span id="label-prog-${meta.id}">${progresso}%</span>
          </div>
          <div class="progresso-barra-track">
            <div class="progresso-barra-fill" id="fill-${meta.id}" style="width:${progresso}%"></div>
          </div>
          <div class="progresso-range-row">
            <input
              type="range" min="0" max="100"
              value="${progresso}"
              oninput="
                document.getElementById('label-prog-${meta.id}').textContent = this.value + '%';
                document.getElementById('fill-${meta.id}').style.width = this.value + '%';
              "
              onchange="atualizarProgresso(${meta.id}, this.value, this)"
            >
          </div>
        </div>

        <div class="card-meta-acoes">
          <button class="btn-editar-meta btn-editar"
            data-id="${meta.id}"
            data-titulo="${encodeURIComponent(meta.titulo)}"
            data-descricao="${encodeURIComponent(meta.descricao)}"
            data-data="${meta.data_meta}"
            data-prioridade="${meta.prioridade ?? ''}"
            data-categoria="${meta.categoria ?? ''}"
            data-progresso="${progresso}"
          ><i class="fa-solid fa-pen"></i> Editar</button>

          <select class="status-select status-neutro" data-id="${meta.id}">
            <option value="" disabled>Status</option>
            <option value="a fazer"      ${status === 'a fazer'      ? 'selected' : ''}>A Fazer</option>
            <option value="em andamento" ${status === 'em andamento' ? 'selected' : ''}>Em Andamento</option>
            <option value="concluída"    ${status === 'concluída'    ? 'selected' : ''}>Concluída</option>
          </select>

          <button class="btn-excluir-meta" onclick="excluirMeta(${meta.id})">
            <i class="fa-solid fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
  });
}

function limparFiltrosMetas() {
  if (filtroStatus) filtroStatus.value = '';
  if (filtroPrioridade) filtroPrioridade.value = '';
  renderMetas();
}

function carregarMetas() {
  fetch("metas.php", { credentials: 'same-origin' })
    .then(response => {
      if (!response.ok) throw new Error("Erro na comunicação com o servidor.");
      return response.json();
    })
    .then(data => {
      if (data.status === 'erro' && data.mensagem === 'Usuário não logado') {
        window.location.href = "../login/login.html";
        return;
      }
      if (data.status === 'erro') {
        mostrarMensagem(data.mensagem, "erro");
        return;
      }

      if (data.nome_usuario) {
        const elUsuario = document.getElementById("usuarioLogado");
        if (elUsuario) elUsuario.textContent = data.nome_usuario;
      }

      metasCache = data.metas || [];
      renderMetas();
    })
    .catch(error => {
      console.error("Erro:", error);
      mostrarMensagem(error.message || "Erro ao carregar metas.", "erro");
    });
}

document.getElementById("formMeta").addEventListener("submit", function(e) {
  e.preventDefault();
  let formData = new FormData(this);

  if (metaAtualId) {
    formData.append("acao", "editar");
    formData.append("id", metaAtualId);
  } else {
    formData.append("acao", "adicionar");
  }

  fetch("metas.php", { method: "POST", credentials: 'same-origin', body: formData })
    .then(response => response.json())
    .then(data => {
      mostrarMensagem(data.mensagem, data.status);
      carregarMetas();
      this.reset();
      fecharModal();
    })
    .catch(error => mostrarMensagem(error.message || "Erro ao salvar meta.", "erro"));
});

function atualizarProgresso(id, valor, elemento) {
  let formData = new FormData();
  formData.append("acao", "progresso");
  formData.append("id", id);
  formData.append("progresso", valor);

  fetch("metas.php", { method: "POST", credentials: 'same-origin', body: formData })
    .then(response => response.json())
    .then(data => mostrarMensagem(data.mensagem, data.status))
    .catch(error => mostrarMensagem("Erro ao atualizar progresso.", "erro"));
}

function atualizarStatus(id, status, elemento) {
  // Atualiza o badge imediatamente (sem F5)
  function _atualizarBadge() {
    const card = elemento.closest('.card-meta');
    if (card) {
      const badge = card.querySelector('.badge-status');
      if (badge) {
        badge.classList.remove('status-fazer', 'status-andamento', 'status-concluido');
        badge.classList.add(getStatusClass(status));
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        badge.textContent = label;
      }
    }
    // Atualiza o cache local
    const meta = metasCache.find(m => String(m.id) === String(id));
    if (meta) meta.status_meta = status;
  }

  let formData = new FormData();
  formData.append("acao", "status");
  formData.append("id", id);
  formData.append("status", status);

  fetch("metas.php", { method: "POST", credentials: 'same-origin', body: formData })
    .then(response => response.json())
    .then(data => {
      mostrarMensagem(data.mensagem, data.status);
      if (data.status === 'sucesso') {
        _atualizarBadge();
      }
    })
    .catch(() => {
      // fallback: atualiza mesmo sem backend
      _atualizarBadge();
    });
}

function excluirMeta(id) {
  if (!confirm("Deseja realmente excluir esta meta?")) return;

  let formData = new FormData();
  formData.append("acao", "excluir");
  formData.append("id", id);

  fetch("metas.php", { method: "POST", credentials: 'same-origin', body: formData })
    .then(res => res.json())
    .then(data => {
      mostrarMensagem(data.mensagem, data.status);
      carregarMetas();
    })
    .catch(() => mostrarMensagem("Erro ao excluir registro.", "erro"));
}

let metaAtualId = null;

function editarMeta(id, titulo, descricao, data_meta, prioridade, categoria, progresso) {
  metaAtualId = id;
  const elTitulo = document.getElementById('titulo');
  const elDescricao = document.getElementById('descricao');
  const elData = document.getElementById('data_meta');
  const elPrioridade = document.getElementById('prioridade');
  const elCategoria = document.getElementById('categoria');
  const elProgresso = document.getElementById('progresso');

  if (elTitulo) elTitulo.value = decodeURIComponent(titulo || '');
  if (elDescricao) elDescricao.value = decodeURIComponent(descricao || '');
  if (elData) elData.value = data_meta || '';
  if (elPrioridade) elPrioridade.value = prioridade || '';
  if (elCategoria) {
    const categoriaValor = categoria || '';
    const existeOpcao = Array.from(elCategoria.options).some(option => option.value === categoriaValor);
    if (!existeOpcao && categoriaValor) {
      const option = document.createElement('option');
      option.value = categoriaValor;
      option.textContent = categoriaValor;
      elCategoria.appendChild(option);
    }
    elCategoria.value = categoriaValor;
  }
  if (elProgresso) elProgresso.value = progresso ?? 0;
  if (valorProgresso) valorProgresso.textContent = (progresso ?? elProgresso?.value ?? 0) + '%';

  if (modalMeta) modalMeta.style.display = 'flex';
}

function fecharModal() {
  if (modalMeta) modalMeta.style.display = 'none';
  metaAtualId = null;
  const form = document.getElementById('formMeta');
  if (form) form.reset();
  if (valorProgresso && progressoInput) valorProgresso.textContent = (progressoInput.value || 0) + '%';
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-editar")) {
    editarMeta(
      e.target.dataset.id,
      e.target.dataset.titulo,
      e.target.dataset.descricao,
      e.target.dataset.data,
      e.target.dataset.prioridade,
      e.target.dataset.categoria,
      e.target.dataset.progresso
    );
  }
});

document.addEventListener('change', function(e) {
  if (e.target.classList.contains('status-select')) {
    atualizarStatus(e.target.dataset.id, e.target.value, e.target);
  }
});

// Modal: abrir / fechar para Nova Meta
const modalMeta = document.getElementById('modalMeta');
const btnAbrirMeta = document.getElementById('abrirModal');
const btnFecharMeta = document.getElementById('fecharModal');
if (btnAbrirMeta && modalMeta) {
  btnAbrirMeta.addEventListener('click', () => {
    modalMeta.style.display = 'flex';
  });
}
if (btnFecharMeta && modalMeta) {
  btnFecharMeta.addEventListener('click', () => {
    modalMeta.style.display = 'none';
  });
}

const btnCancelarMeta = document.getElementById('cancelarModal');
if (btnCancelarMeta && modalMeta) {
  btnCancelarMeta.addEventListener('click', fecharModal);
}

// fechar modal ao clicar fora do conteúdo
window.addEventListener('click', function(e) {
  if (e.target === modalMeta) {
    modalMeta.style.display = 'none';
  }
});

// atualizar label do progresso ao mover o range
const progressoInput = document.getElementById('progresso');
const valorProgresso = document.getElementById('valorProgresso');
if (progressoInput && valorProgresso) {
  valorProgresso.textContent = progressoInput.value + '%';
  progressoInput.addEventListener('input', function() {
    valorProgresso.textContent = this.value + '%';
  });
}