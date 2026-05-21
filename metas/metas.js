let metasCache = [];

carregarMetas();

const filtroStatus = document.getElementById('filtroStatus');
const filtroPrioridade = document.getElementById('filtroPrioridade');
if (filtroStatus) filtroStatus.addEventListener('change', renderMetas);
if (filtroPrioridade) filtroPrioridade.addEventListener('change', renderMetas);

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

    if (statusFiltro && statusMeta !== statusFiltro) {
      return false;
    }

    if (prioridadeFiltro && prioridadeMeta !== prioridadeFiltro) {
      return false;
    }

    return true;
  });

  if (metasFiltradas.length === 0) {
    lista.innerHTML = "<p>Nenhuma meta encontrada.</p>";
    return;
  }

  metasFiltradas.forEach(meta => {
    const status = normalizarStatus(meta.status_meta);
    const statusClass = getStatusClass(status);
    lista.innerHTML += `
      <div class="meta ${verificarVencimento(meta.data_meta)}">
        <div class="meta-content">
          <div class="meta-titulo">${meta.titulo}</div>
          <div class="meta-descricao">${meta.descricao}</div>
              <div class="meta-data">
                  Prazo: ${meta.data_meta ?? "Sem data"}
              </div>

              <div class="meta-info">
                  <span class="prioridade">
                      Prioridade: ${meta.prioridade ?? "Não definida"}
                  </span>

                  <span class="categoria">
                      Categoria: ${meta.categoria ?? "Sem categoria"}
                  </span>
              </div>

              <div class="status-meta ${statusClass}">
                  Status: ${status}
              </div>                <div class="progresso">
            <input 
              type="range"
              min="0"
              max="100"
              value="${meta.progresso ?? 0}"
              oninput="this.nextElementSibling.textContent = this.value + '%'"
              onchange="atualizarProgresso(${meta.id}, this.value, this)"
            >
            <span>${meta.progresso ?? 0}%</span>
          </div>
        </div>
        <div class="acoes">
          <button class="btn-editar" data-id="${meta.id}" data-titulo="${encodeURIComponent(meta.titulo)}" data-descricao="${encodeURIComponent(meta.descricao)}" data-data="${meta.data_meta}" data-prioridade="${meta.prioridade ?? ''}" data-categoria="${meta.categoria ?? ''}" data-progresso="${meta.progresso ?? 0}">Editar</button>
          <select class="status-select ${statusClass}" data-id="${meta.id}">
            <option value="a fazer" ${status === 'a fazer' ? 'selected' : ''}>A Fazer</option>
            <option value="em andamento" ${status === 'em andamento' ? 'selected' : ''}>Em andamento</option>
            <option value="concluída" ${status === 'concluída' ? 'selected' : ''}>Concluída</option>
          </select>
          <button onclick="excluirMeta(${meta.id})">Excluir</button>
        </div>
      </div>
    `;
  });
}

function carregarMetas() {
  fetch("metas.php")
    .then(response => {
      if (!response.ok) throw new Error("Erro na comunicação com o servidor.");
      return response.json();
    })
    .then(data => {
      if (data.status === 'erro' && data.mensagem === 'Usuário não logado') {
        window.location.href = "../index.html"; 
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
      mostrarMensagem("Erro ao carregar metas.", "erro");
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

  fetch("metas.php", { method: "POST", body: formData })
    .then(response => response.json())
    .then(data => {
      mostrarMensagem(data.mensagem, data.status);
      carregarMetas();
      this.reset();
      fecharModal();
    })
    .catch(error => mostrarMensagem("Erro ao salvar meta.", "erro"));
});

function atualizarProgresso(id, valor, elemento) {
  let formData = new FormData();
  formData.append("acao", "progresso");
  formData.append("id", id);
  formData.append("progresso", valor);

  fetch("metas.php", { method: "POST", body: formData })
    .then(response => response.json())
    .then(data => mostrarMensagem(data.mensagem, data.status))
    .catch(error => mostrarMensagem("Erro ao atualizar progresso.", "erro"));
}

function atualizarStatus(id, status, elemento) {
  let formData = new FormData();
  formData.append("acao", "status");
  formData.append("id", id);
  formData.append("status", status);

  fetch("metas.php", { method: "POST", body: formData })
    .then(response => response.json())
    .then(data => {
      mostrarMensagem(data.mensagem, data.status);
      if (data.status === 'sucesso') {
        const select = elemento;
        const colorMap = {
          'a fazer': '#6b7280',
          'em andamento': '#2563eb',
          'concluído': '#16a34a',
          'concluída': '#16a34a'
        };
        const backgroundColor = colorMap[status] || '#2563eb';

        if (select) {
          select.classList.remove('status-fazer', 'status-andamento', 'status-concluido');
          select.classList.add(getStatusClass(status));
          select.style.backgroundColor = backgroundColor;
          select.style.color = '#ffffff';

          const card = select.closest('.meta');
          if (card) {
            const statusLabel = card.querySelector('.status-meta');
            if (statusLabel) {
              statusLabel.textContent = 'Status: ' + status;
              statusLabel.classList.remove('status-fazer', 'status-andamento', 'status-concluido');
              statusLabel.classList.add(getStatusClass(status));
              statusLabel.style.backgroundColor = backgroundColor;
              statusLabel.style.color = '#ffffff';
            }
          }
        }
      }
    })
    .catch(error => mostrarMensagem("Erro ao atualizar status.", "erro"));
}

function excluirMeta(id) {
  if (!confirm("Deseja realmente excluir esta meta?")) return;

  let formData = new FormData();
  formData.append("acao", "excluir");
  formData.append("id", id);

  fetch("metas.php", { method: "POST", body: formData })
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
  if (elCategoria) elCategoria.value = categoria || '';
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