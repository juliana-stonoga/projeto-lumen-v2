/* ═══════════════════════════════════════════════════════════════
   LÚMEN — Admin  (adm-index.js)
   Todos os PHPs estão em projeto/admin/ junto com este arquivo.
   Fetch usa caminhos relativos simples: './adm_xxx.php'
═══════════════════════════════════════════════════════════════ */

let todosUsuarios       = [];
let excluirIdPendente   = null;

const $ = id => document.getElementById(id);

/* ─── Toast ─── */
function showToast(msg, tipo = 'ok') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = msg;
  t.style.background = tipo === 'erro'
    ? 'linear-gradient(135deg,#ef4444,#dc2626)'
    : '';
  t.classList.add('visivel');
  setTimeout(() => t.classList.remove('visivel'), 3000);
}

function abrirModal(id)  { $(id).classList.add('aberto');    document.body.style.overflow = 'hidden'; }
function fecharModal(id) { $(id).classList.remove('aberto'); document.body.style.overflow = ''; }

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  validarSessaoAdmin();
  carregarUsuarios();

  $('fecharModal').addEventListener('click',       () => fecharModal('modalEditar'));
  $('cancelarModal').addEventListener('click',     () => fecharModal('modalEditar'));
  $('fecharModalExcluir').addEventListener('click',() => fecharModal('modalExcluir'));
  $('cancelarExcluir').addEventListener('click',   () => fecharModal('modalExcluir'));

  ['modalEditar','modalExcluir'].forEach(id => {
    $(id).addEventListener('click', e => { if (e.target === $(id)) fecharModal(id); });
  });

  $('formEditar').addEventListener('submit', salvarEdicao);
  $('confirmarExcluir').addEventListener('click', confirmarExclusao);
  $('btnLogoff').addEventListener('click', logoff);
});

/* ═══════════════════════════════════════
   SESSÃO
═══════════════════════════════════════ */
async function validarSessaoAdmin() {
  try {
    const resp  = await fetch('../php/valida_sessao.php');
    const dados = await resp.json();
    const usuario = Array.isArray(dados.data) ? dados.data[0] : dados.data;
    if (dados.status !== 'ok' || usuario?.email !== 'adm@adm') {
      window.location.href = '../login/login.html';
    }
  } catch {
    window.location.href = '../login/login.html';
  }
}

async function logoff() {
  try { await fetch('../php/cliente_logoff.php', { method: 'POST' }); } finally {
    window.location.href = '../login/login.html';
  }
}

/* ═══════════════════════════════════════
   TROCA DE ABA
═══════════════════════════════════════ */
function trocarAba(aba) {
  document.querySelectorAll('.aba').forEach(el => el.classList.remove('ativa'));
  document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
  $(`aba-${aba}`).classList.add('ativa');
  document.querySelector(`.menu a[data-tab="${aba}"]`).classList.add('active');
  if (aba === 'metricas') carregarMetricas();
}

/* ═══════════════════════════════════════
   USUÁRIOS — CARREGAR
═══════════════════════════════════════ */
async function recarregarUsuarios() {
  const btn = $('btnAtualizar');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-rotate-right fa-spin"></i> Atualizando…';
  $('campoBusca').value = '';
  await carregarUsuarios();
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Atualizar';
  showToast('<i class="fa-solid fa-rotate-right"></i> Lista atualizada!');
}

async function carregarUsuarios() {
  try {
    const resp  = await fetch('./adm_get_usuarios.php?t=' + Date.now());
    const dados = await resp.json();

    if (dados.status !== 'ok') {
      mostrarErroTabela(dados.mensagem || 'Erro ao carregar usuários.');
      return;
    }

    todosUsuarios = dados.data || [];
    atualizarCards();
    renderTabela(todosUsuarios);

  } catch (err) {
    console.error('[Admin]', err);
    mostrarErroTabela('Falha na comunicação com o servidor.');
  }
}

function atualizarCards() {
  $('totalUsuarios').textContent = todosUsuarios.length;

  // toLocaleDateString('sv') retorna YYYY-MM-DD no fuso local do browser,
  // compatível com o criado_em gravado pelo MySQL com NOW()
  const hoje       = new Date().toLocaleDateString('sv');
  const semanaAtras = new Date(Date.now() - 7 * 86400000).toLocaleDateString('sv');

  $('cadastrosHoje').textContent =
    todosUsuarios.filter(u => u.criado_em?.startsWith(hoje)).length;

  $('cadastros7dias').textContent =
    todosUsuarios.filter(u => u.criado_em?.slice(0,10) >= semanaAtras).length;
}

function mostrarErroTabela(msg) {
  $('tabelaWrap').innerHTML = `
    <div class="estado-vazio">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${escapeHtml(msg)}</span>
    </div>`;
}

/* ═══════════════════════════════════════
   USUÁRIOS — RENDER TABELA
═══════════════════════════════════════ */
function renderTabela(lista) {
  if (lista.length === 0) {
    $('tabelaWrap').innerHTML = `
      <div class="estado-vazio">
        <i class="fa-solid fa-users-slash"></i>
        <span>Nenhum usuário encontrado.</span>
      </div>`;
    return;
  }

  const linhas = lista.map(u => {
    const inicial       = (u.nome || '?')[0].toUpperCase();
    const dataFormatada = u.criado_em
      ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '—';

    return `
      <tr>
        <td>
          <div class="cell-nome">
            <div class="avatar">${escapeHtml(inicial)}</div>
            ${escapeHtml(u.nome)}
          </div>
        </td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.telefone || '—')}</td>
        <td><span class="senha-oculta">••••••••</span></td>
        <td>${dataFormatada}</td>
        <td>
          <div class="acoes-tabela">
            <button class="btn-tabela btn-editar-tabela"
              onclick='abrirEdicao(${JSON.stringify(u)})'>
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-tabela btn-excluir-tabela"
              onclick='pedirExclusao(${u.id}, ${JSON.stringify(u.nome)})'>
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  $('tabelaWrap').innerHTML = `
    <table class="tabela-usuarios">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>E-mail</th>
          <th>Telefone</th>
          <th>Senha</th>
          <th>Cadastro</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

/* ─── Busca em tempo real ─── */
function filtrarTabela() {
  const termo    = ($('campoBusca').value || '').toLowerCase().trim();
  const filtrados = todosUsuarios.filter(u =>
    (u.nome  || '').toLowerCase().includes(termo) ||
    (u.email || '').toLowerCase().includes(termo)
  );
  renderTabela(filtrados);
}

/* ═══════════════════════════════════════
   USUÁRIOS — EDITAR
═══════════════════════════════════════ */
function abrirEdicao(usuario) {
  $('editId').value       = usuario.id;
  $('editNome').value     = usuario.nome     || '';
  $('editEmail').value    = usuario.email    || '';
  $('editTelefone').value = usuario.telefone || '';
  $('editSenha').value    = '';

  const msg = $('msgEditar');
  msg.textContent = '';
  msg.className   = 'msg-form oculto';

  abrirModal('modalEditar');
}

async function salvarEdicao(e) {
  e.preventDefault();

  const id       = $('editId').value;
  const nome     = $('editNome').value.trim();
  const email    = $('editEmail').value.trim();
  const telefone = $('editTelefone').value.trim();
  const senha    = $('editSenha').value;

  const btn = $('formEditar').querySelector('.btn-salvar');
  btn.disabled    = true;
  btn.textContent = 'Salvando…';

  const fd = new FormData();
  fd.append('id', id); fd.append('nome', nome);
  fd.append('email', email); fd.append('telefone', telefone);
  if (senha) fd.append('senha', senha);

  try {
    const resp  = await fetch('./adm_alterar_usuario.php', { method: 'POST', body: fd });
    const dados = await resp.json();
    const msg   = $('msgEditar');

    if (dados.status === 'ok') {
      msg.textContent = 'Usuário atualizado com sucesso!';
      msg.className   = 'msg-form sucesso';

      const idx = todosUsuarios.findIndex(u => String(u.id) === String(id));
      if (idx !== -1) todosUsuarios[idx] = { ...todosUsuarios[idx], nome, email, telefone };

      setTimeout(() => {
        fecharModal('modalEditar');
        renderTabela(todosUsuarios);
        atualizarCards();
        showToast('<i class="fa-solid fa-pen-to-square"></i> Usuário atualizado!');
      }, 800);
    } else {
      msg.textContent = dados.mensagem || 'Erro ao salvar.';
      msg.className   = 'msg-form erro';
    }
  } catch (err) {
    console.error('[Admin]', err);
    $('msgEditar').textContent = 'Falha na comunicação com o servidor.';
    $('msgEditar').className   = 'msg-form erro';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
  }
}

/* ═══════════════════════════════════════
   USUÁRIOS — EXCLUIR
═══════════════════════════════════════ */
function pedirExclusao(id, nome) {
  excluirIdPendente = id;
  $('excluirNome').textContent = nome;
  abrirModal('modalExcluir');
}

async function confirmarExclusao() {
  if (!excluirIdPendente) return;

  const btn = $('confirmarExcluir');
  btn.disabled    = true;
  btn.textContent = 'Excluindo…';

  try {
    const resp  = await fetch(`./adm_excluir_usuario.php?id=${excluirIdPendente}`);
    const dados = await resp.json();

    if (dados.status === 'ok') {
      todosUsuarios = todosUsuarios.filter(u => u.id !== excluirIdPendente);
      fecharModal('modalExcluir');
      renderTabela(todosUsuarios);
      atualizarCards();
      showToast('<i class="fa-solid fa-trash"></i> Usuário removido.');
    } else {
      showToast('<i class="fa-solid fa-circle-xmark"></i> ' + (dados.mensagem || 'Erro ao excluir.'), 'erro');
    }
  } catch (err) {
    console.error('[Admin]', err);
    showToast('<i class="fa-solid fa-circle-xmark"></i> Falha na comunicação.', 'erro');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fa-solid fa-trash"></i> Excluir';
    excluirIdPendente = null;
  }
}

/* ═══════════════════════════════════════
   MÉTRICAS
═══════════════════════════════════════ */
async function carregarMetricas() {
  const grid = $('metricasGrid');
  grid.innerHTML = `
    <div class="estado-vazio">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Carregando métricas…</span>
    </div>`;

  try {
    const resp  = await fetch('./adm_metricas.php');
    const dados = await resp.json();

    if (dados.status !== 'ok') {
      grid.innerHTML = `
        <div class="estado-vazio">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>${escapeHtml(dados.mensagem || 'Erro ao carregar métricas.')}</span>
        </div>`;
      return;
    }

    const m = dados.data;
    grid.innerHTML = `
      <div class="metrica-card mod-usuarios">
        <div class="metrica-titulo">
          <i class="fa-solid fa-users"></i>
          <span>Usuários</span>
        </div>
        <div class="metrica-numero">${m.total_usuarios}</div>
        <div class="metrica-sub">Contas cadastradas</div>
      </div>

      <div class="metrica-card mod-metas">
        <div class="metrica-titulo">
          <i class="fa-solid fa-bullseye"></i>
          <span>Metas</span>
        </div>
        <div class="metrica-numero">${m.total_metas}</div>
        <div class="metrica-sub">${m.metas_concluidas} concluídas · ${m.metas_andamento} em andamento</div>
      </div>

      <div class="metrica-card mod-financeiro">
        <div class="metrica-titulo">
          <i class="fa-solid fa-wallet"></i>
          <span>Financeiro</span>
        </div>
        <div class="metrica-numero">${m.total_transacoes}</div>
        <div class="metrica-sub">${m.transacoes_entrada} entradas · ${m.transacoes_saida} saídas</div>
      </div>

      <div class="metrica-card mod-memorias">
        <div class="metrica-titulo">
          <i class="fa-solid fa-image"></i>
          <span>Memórias</span>
        </div>
        <div class="metrica-numero">${m.total_memorias}</div>
        <div class="metrica-sub">Registros criados</div>
      </div>

      <div class="metrica-card mod-diario">
        <div class="metrica-titulo">
          <i class="fa-solid fa-book-open"></i>
          <span>Diário</span>
        </div>
        <div class="metrica-numero">${m.total_diario}</div>
        <div class="metrica-sub">Entradas registradas</div>
      </div>`;

  } catch (err) {
    console.error('[Admin]', err);
    grid.innerHTML = `
      <div class="estado-vazio">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>Falha na comunicação com o servidor.</span>
      </div>`;
  }
}
