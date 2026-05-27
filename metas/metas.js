// ── Estado ─────────────────────────────────────────────────────────────────
let metasCache   = [];

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
let metaAtualId  = null;
let tasksNoModal = [];
let dropdownAtivo = null; // { el, parent } — dropdown movido para body

// ── Init ───────────────────────────────────────────────────────────────────
carregarMetas();

const filtroStatus       = document.getElementById('filtroStatus');
const filtroPrioridade   = document.getElementById('filtroPrioridade');
const botaoLimparFiltros = document.getElementById('limparFiltrosMetas');
if (filtroStatus)       filtroStatus.addEventListener('change', renderMetas);
if (filtroPrioridade)   filtroPrioridade.addEventListener('change', renderMetas);
if (botaoLimparFiltros) botaoLimparFiltros.addEventListener('click', limparFiltrosMetas);

window.addEventListener('scroll', fecharTodosDropdowns, true);
window.addEventListener('resize', fecharTodosDropdowns);

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizarStatus(s) {
  if (!s) return 'a fazer';
  s = s.toLowerCase();
  if (s.includes('concl')) return 'concluída';
  if (s.includes('andamento')) return 'em andamento';
  return 'a fazer';
}

function verificarVencimento(data_meta) {
  if (!data_meta) return '';
  const dias = Math.ceil((new Date(data_meta) - new Date()) / 86400000);
  if (dias < 0) return 'meta-vencida';
  if (dias <= 2) return 'meta-alerta';
  return '';
}

function calcularProgresso(tasks) {
  if (!tasks?.length) return 0;
  return Math.round(tasks.filter(t => t.concluida).length / tasks.length * 100);
}

function parseTasks(json) {
  if (!json) return [];
  try {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Render Kanban ──────────────────────────────────────────────────────────
function renderMetas() {
  const statusFiltro     = filtroStatus?.value ? normalizarStatus(filtroStatus.value) : '';
  const prioridadeFiltro = filtroPrioridade?.value || '';
  const board            = document.getElementById('listaMetas');
  board.innerHTML        = '';

  const filtradas = metasCache.filter(m => {
    if (statusFiltro     && normalizarStatus(m.status_meta) !== statusFiltro) return false;
    if (prioridadeFiltro && (m.prioridade || '') !== prioridadeFiltro)        return false;
    return true;
  });

  const colunas = [
    { key: 'a fazer',      label: 'A Fazer',      cls: 'col-fazer',     icon: 'fa-circle-dot' },
    { key: 'em andamento', label: 'Em Andamento',  cls: 'col-andamento', icon: 'fa-spinner' },
    { key: 'concluída',    label: 'Concluído',     cls: 'col-concluida', icon: 'fa-circle-check' },
  ];

  colunas.forEach(col => {
    const metas = filtradas.filter(m => normalizarStatus(m.status_meta) === col.key);

    const colEl = document.createElement('div');
    colEl.className = `kanban-col ${col.cls}`;
    colEl.innerHTML = `
      <div class="kanban-col-header">
        <span><i class="fa-solid ${col.icon}" style="margin-right:7px;opacity:.7"></i>${col.label}</span>
        <span class="col-count">${metas.length}</span>
      </div>
      <div class="kanban-cards" id="cards-${col.key.replace(/ /g,'-')}"></div>`;
    board.appendChild(colEl);

    const cardsEl = colEl.querySelector('.kanban-cards');

    if (!metas.length) {
      cardsEl.innerHTML = `<div class="kanban-vazio">Sem metas aqui</div>`;
      return;
    }

    metas.forEach(meta => {
      cardsEl.appendChild(criarCardEl(meta));
    });
  });

}

// ── Criar elemento do card ─────────────────────────────────────────────────
function criarCardEl(meta) {
  const status  = normalizarStatus(meta.status_meta);
  const prio    = (meta.prioridade || '').toLowerCase();
  const prioClass = prio === 'alta' ? 'prioridade-alta'
                  : prio === 'média' || prio === 'media' ? 'prioridade-media'
                  : prio === 'baixa' ? 'prioridade-baixa' : '';
  const badgePrioClass = prio === 'alta' ? 'badge-alta'
                       : prio === 'média' || prio === 'media' ? 'badge-media'
                       : prio === 'baixa' ? 'badge-baixa' : '';
  const vencClass    = verificarVencimento(meta.data_meta);
  const tasks        = parseTasks(meta.tasks_json);
  const progresso    = calcularProgresso(tasks);
  const total        = tasks.length;
  const concluidas   = tasks.filter(t => t.concluida).length;
  const dataFormatada = meta.data_meta ? meta.data_meta.split('-').reverse().join('/') : null;

  // resumo de tasks
  const taskResumo = total
    ? `<i class="fa-solid fa-list-check"></i> ${concluidas} de ${total} ${total === 1 ? 'tarefa' : 'tarefas'}`
    : `<i class="fa-regular fa-square-check" style="opacity:.45"></i> Sem tarefas`;

  // lista de tasks para o painel expansível
  const tasksListHTML = tasks.map((t, i) => `
    <li class="task-item ${t.concluida ? 'concluida' : ''}" data-meta-id="${meta.id}" data-task-idx="${i}">
      <input type="checkbox" class="task-check" ${t.concluida ? 'checked' : ''}
        onchange="toggleTask(${meta.id}, ${i}, this)">
      <span class="task-label">${escHtml(t.texto)}</span>
    </li>`).join('');

  const card = document.createElement('div');
  card.className = `card-meta ${prioClass} ${vencClass}`;
  card.dataset.id = meta.id;

  card.innerHTML = `
    <div class="card-body-meta">

      <!-- Header: título + menu ⋮ -->
      <div class="card-meta-header">
        <div class="card-meta-titulo">${escHtml(meta.titulo)}</div>
        <div class="card-menu-wrap">
          <button class="btn-menu-card" data-id="${meta.id}" title="Opções">⋮</button>
          <div class="card-dropdown" id="dropdown-${meta.id}">
            <button class="dropdown-item btn-editar" data-id="${meta.id}">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <div class="dropdown-divider"></div>
            <div class="dropdown-status-label">Mover para</div>
            <div class="dropdown-status-group">
              <button class="dropdown-item dropdown-status ${status === 'a fazer' ? 'ativo' : ''}"
                data-id="${meta.id}" data-status="a fazer">
                <i class="fa-solid fa-circle-dot"></i> A Fazer
              </button>
              <button class="dropdown-item dropdown-status ${status === 'em andamento' ? 'ativo' : ''}"
                data-id="${meta.id}" data-status="em andamento">
                <i class="fa-solid fa-spinner"></i> Em Andamento
              </button>
              <button class="dropdown-item dropdown-status ${status === 'concluída' ? 'ativo' : ''}"
                data-id="${meta.id}" data-status="concluída">
                <i class="fa-solid fa-circle-check"></i> Concluído
              </button>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" data-id="${meta.id}" data-action="excluir">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      </div>

      <!-- Descrição -->
      ${meta.descricao ? `<div class="card-meta-descricao">${escHtml(meta.descricao)}</div>` : ''}

      <!-- Badges -->
      <div class="card-meta-badges">
        ${badgePrioClass ? `<span class="badge-pill ${badgePrioClass}"><i class="fa-solid fa-flag"></i> ${meta.prioridade}</span>` : ''}
        ${meta.categoria ? `<span class="badge-pill badge-categoria"><i class="fa-solid fa-tag"></i> ${escHtml(meta.categoria)}</span>` : ''}
      </div>

      <!-- Prazo -->
      ${dataFormatada ? `<div class="card-meta-data"><i class="fa-regular fa-calendar"></i> ${dataFormatada}</div>` : ''}

      <!-- Progresso -->
      <div class="progresso-wrapper">
        <div class="progresso-header">
          <span>Progresso</span>
          <span id="label-prog-${meta.id}">${progresso}%</span>
        </div>
        <div class="progresso-barra-track">
          <div class="progresso-barra-fill" id="fill-${meta.id}" style="width:${progresso}%"></div>
        </div>
      </div>

    </div>

    <!-- Tasks recolhidas -->
    ${total ? `
    <div class="tasks-summary">
      <button class="tasks-toggle-btn" data-meta-id="${meta.id}">
        <span class="task-resumo-txt">${taskResumo}</span>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </button>
      <ul class="tasks-lista-wrap" id="tasks-wrap-${meta.id}">
        ${tasksListHTML}
      </ul>
    </div>` : ''}
  `;

  return card;
}

// ── Handler único de clique — ordem importa ────────────────────────────────
document.addEventListener('click', function(e) {

  // 1. Toggle expansão de tasks
  const tasksBtn = e.target.closest('.tasks-toggle-btn');
  if (tasksBtn) {
    const wrap = document.getElementById('tasks-wrap-' + tasksBtn.dataset.metaId);
    if (wrap) {
      tasksBtn.classList.toggle('aberto');
      wrap.classList.toggle('aberto');
    }
    return;
  }

  // 2. Abrir/fechar dropdown ⋮
  const menuBtn = e.target.closest('.btn-menu-card');
  if (menuBtn) {
    e.stopPropagation();
    const id     = menuBtn.dataset.id;
    const isOpen = dropdownAtivo?.el?.id === 'dropdown-' + id;
    fecharTodosDropdowns();
    if (!isOpen) abrirDropdown(id);
    return;
  }

  // 3. Editar — deve vir antes de fecharTodosDropdowns
  const editBtn = e.target.closest('.btn-editar');
  if (editBtn) {
    const meta = metasCache.find(m => String(m.id) === String(editBtn.dataset.id));
    if (meta) abrirModalEditar(meta);
    fecharTodosDropdowns();
    return;
  }

  // 4. Mudar status via dropdown
  const statusBtn = e.target.closest('.dropdown-status');
  if (statusBtn) {
    const { id, status } = statusBtn.dataset;
    fecharTodosDropdowns();
    atualizarStatus(id, status);
    return;
  }

  // 5. Excluir
  const excluirBtn = e.target.closest('[data-action="excluir"]');
  if (excluirBtn) {
    const id = excluirBtn.dataset.id;
    fecharTodosDropdowns();
    excluirMeta(id);
    return;
  }

  // 6. Clicar fora de qualquer dropdown fecha tudo
  if (!e.target.closest('.card-dropdown')) {
    fecharTodosDropdowns();
  }
});
function toggleTask(metaId, taskIdx, checkbox) {
  const meta = metasCache.find(m => String(m.id) === String(metaId));
  if (!meta) return;

  const tasks = parseTasks(meta.tasks_json);
  tasks[taskIdx].concluida = checkbox.checked;
  meta.tasks_json = JSON.stringify(tasks);

  const progresso = calcularProgresso(tasks);
  const concluidas = tasks.filter(t => t.concluida).length;

  // Atualiza barra
  const fill  = document.getElementById('fill-'       + metaId);
  const label = document.getElementById('label-prog-' + metaId);
  if (fill)  fill.style.width    = progresso + '%';
  if (label) label.textContent   = progresso + '%';

  // Atualiza visual do item
  checkbox.closest('.task-item')?.classList.toggle('concluida', checkbox.checked);

  // Atualiza resumo
  const resumoTxt = document.querySelector(`.tasks-toggle-btn[data-meta-id="${metaId}"] .task-resumo-txt`);
  if (resumoTxt) {
    const total = tasks.length;
    resumoTxt.innerHTML = `<i class="fa-solid fa-list-check"></i> ${concluidas} de ${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
  }

  salvarTasks(metaId, tasks, progresso);
}

function salvarTasks(metaId, tasks, progresso) {
  const fd = new FormData();
  fd.append('acao', 'tasks');
  fd.append('id', metaId);
  fd.append('tasks_json', JSON.stringify(tasks));
  fd.append('progresso', progresso);
  fetch('metas.php', { method: 'POST', credentials: 'same-origin', body: fd })
    .then(r => r.json())
    .catch(e => console.warn('Erro tasks:', e));
}

function abrirDropdown(id) {
  fecharTodosDropdowns();
  const dd  = document.getElementById('dropdown-' + id);
  const btn = document.querySelector(`.btn-menu-card[data-id="${id}"]`);
  if (!dd || !btn) return;

  const rect = btn.getBoundingClientRect();
  dd.style.position = 'fixed';
  dd.style.top      = (rect.bottom + 4) + 'px';
  dd.style.right    = (window.innerWidth - rect.right) + 'px';
  dd.style.left     = 'auto';
  dd.classList.add('aberto');
  dropdownAtivo = { el: dd, parent: dd.parentElement };
  document.body.appendChild(dd);
}

function fecharTodosDropdowns() {
  if (dropdownAtivo) {
    const { el, parent } = dropdownAtivo;
    el.classList.remove('aberto');
    el.style.position = '';
    el.style.top      = '';
    el.style.right    = '';
    el.style.left     = '';
    if (parent) parent.appendChild(el);
    dropdownAtivo = null;
  }
  document.querySelectorAll('.card-dropdown.aberto').forEach(d => d.classList.remove('aberto'));
}

// ── CRUD ───────────────────────────────────────────────────────────────────
function carregarMetas() {
  fetch('metas.php', { credentials: 'same-origin' })
    .then(r => { if (!r.ok) throw new Error('Erro no servidor'); return r.json(); })
    .then(data => {
      if (data.status === 'erro' && data.mensagem === 'Usuário não logado') {
        window.location.href = '../login/login.html'; return;
      }
      if (data.status === 'erro') { showToast('<i class="fa-solid fa-circle-xmark"></i> ' + (data.mensagem || 'Erro ao carregar metas.'), 'erro'); return; }
      metasCache = data.metas || [];
      renderMetas();
    })
    .catch(err => showToast('<i class="fa-solid fa-circle-xmark"></i> ' + err.message, 'erro'));
}

document.getElementById('formMeta').addEventListener('submit', function(e) {
  e.preventDefault();
  const fd = new FormData(this);
  fd.append('acao', metaAtualId ? 'editar' : 'adicionar');
  if (metaAtualId) fd.append('id', metaAtualId);
  fd.append('tasks_json', JSON.stringify(tasksNoModal));
  fd.append('progresso', calcularProgresso(tasksNoModal));

  fetch('metas.php', { method: 'POST', credentials: 'same-origin', body: fd })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'sucesso') {
        showToast(metaAtualId
          ? '<i class="fa-solid fa-pen-to-square"></i> Meta atualizada!'
          : '<i class="fa-solid fa-circle-check"></i> Meta salva!');
      } else {
        showToast('<i class="fa-solid fa-circle-xmark"></i> ' + (data.mensagem || 'Erro ao salvar.'), 'erro');
      }
      carregarMetas();
      fecharModal();
    })
    .catch(err => showToast('<i class="fa-solid fa-circle-xmark"></i> ' + err.message, 'erro'));
});

function atualizarStatus(id, status) {
  const fd = new FormData();
  fd.append('acao', 'status');
  fd.append('id', id);
  fd.append('status', status);

  // Atualiza cache e re-render imediato (otimista)
  const meta = metasCache.find(m => String(m.id) === String(id));
  if (meta) { meta.status_meta = status; renderMetas(); }

  fetch('metas.php', { method: 'POST', credentials: 'same-origin', body: fd })
    .then(r => r.json())
    .then(data => { if (data.status !== 'sucesso') carregarMetas(); })
    .catch(() => carregarMetas());
}

function excluirMeta(id) {
  confirmarExclusao({
    titulo:      'Excluir meta?',
    mensagem:    'Esta ação é permanente e não poderá ser desfeita.',
    onConfirmar: () => {
      const fd = new FormData();
      fd.append('acao', 'excluir');
      fd.append('id', id);
      fetch('metas.php', { method: 'POST', credentials: 'same-origin', body: fd })
        .then(r => r.json())
        .then(data => {
          if (data.status === 'sucesso') showToast('<i class="fa-solid fa-trash"></i> Meta excluída.');
          else showToast('<i class="fa-solid fa-circle-xmark"></i> ' + (data.mensagem || 'Erro ao excluir.'), 'erro');
          carregarMetas();
        })
        .catch(() => showToast('<i class="fa-solid fa-circle-xmark"></i> Erro ao excluir.', 'erro'));
    }
  });
}

// ── Modal ──────────────────────────────────────────────────────────────────
function abrirModalEditar(meta) {
  metaAtualId = meta.id;
  document.getElementById('titulo').value     = meta.titulo || '';
  document.getElementById('descricao').value  = meta.descricao || '';
  document.getElementById('data_meta').value  = meta.data_meta || '';
  document.getElementById('prioridade').value = meta.prioridade || '';

  const elCat = document.getElementById('categoria');
  if (elCat) {
    const cat = meta.categoria || '';
    if (cat && !Array.from(elCat.options).some(o => o.value === cat)) {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat; elCat.appendChild(opt);
    }
    elCat.value = cat;
  }

  document.getElementById('modal-title').textContent = 'Editar Meta';
  tasksNoModal = parseTasks(meta.tasks_json).map(t => ({ ...t }));
  renderTasksModal();
  abrirModal();
}

function abrirModal() {
  document.getElementById('modalMeta').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('modalMeta').classList.remove('aberto');
  metaAtualId  = null;
  tasksNoModal = [];
  document.getElementById('formMeta').reset();
  document.getElementById('modal-title').textContent = 'Nova Meta';
  renderTasksModal();
}

document.getElementById('abrirModal')?.addEventListener('click', () => {
  metaAtualId  = null;
  tasksNoModal = [];
  renderTasksModal();
  abrirModal();
});
document.getElementById('fecharModal')?.addEventListener('click', fecharModal);
document.getElementById('cancelarModal')?.addEventListener('click', fecharModal);
document.getElementById('modalMeta')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) fecharModal();
});

// ── Tasks no modal ─────────────────────────────────────────────────────────
function renderTasksModal() {
  const ul = document.getElementById('listaTasks');
  if (!ul) return;
  ul.innerHTML = '';
  tasksNoModal.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = 'task-modal-item';
    li.innerHTML = `
      <i class="fa-solid fa-grip-lines" style="color:var(--text-light);font-size:.75rem;opacity:.45"></i>
      <span>${escHtml(task.texto)}</span>
      <button type="button" onclick="removerTaskModal(${i})" title="Remover">
        <i class="fa-solid fa-xmark"></i>
      </button>`;
    ul.appendChild(li);
  });
}

function adicionarTaskModal() {
  const input = document.getElementById('novaTaskInput');
  const texto = input.value.trim();
  if (!texto) return;
  tasksNoModal.push({ texto, concluida: false });
  input.value = '';
  input.focus();
  renderTasksModal();
}

function removerTaskModal(idx) {
  tasksNoModal.splice(idx, 1);
  renderTasksModal();
}

document.getElementById('novaTaskInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); adicionarTaskModal(); }
});
document.getElementById('btnAdicionarTask')?.addEventListener('click', adicionarTaskModal);

// ── Filtros ────────────────────────────────────────────────────────────────
function limparFiltrosMetas() {
  if (filtroStatus)     filtroStatus.value = '';
  if (filtroPrioridade) filtroPrioridade.value = '';
  renderMetas();
}
