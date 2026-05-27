/* ═══════════════════════════════════════════════════════════════
   LÚMEN — Admin  (adm-index.js)
   Todos os PHPs estão em projeto/admin/ junto com este arquivo.
   Fetch usa caminhos relativos simples: './adm_xxx.php'
═══════════════════════════════════════════════════════════════ */

let todosUsuarios          = [];
let excluirIdPendente      = null;
let todosAdmins            = [];
let excluirAdminIdPendente = null;

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
function fecharModal(id) {
  $(id).classList.remove('aberto');
  document.body.style.overflow = '';

  // Resetar formulário interno se houver
  const form = $(id)?.querySelector('form');
  if (!form) return;

  form.reset();

  // Limpar estados visuais de validação
  form.querySelectorAll('.input-erro, .input-valido').forEach(el =>
    el.classList.remove('input-erro', 'input-valido')
  );
  form.querySelectorAll('.erro-input').forEach(el => el.textContent = '');
  form.querySelectorAll('.msg-form').forEach(el => {
    el.textContent = '';
    el.className = 'msg-form oculto';
  });

  // Restaurar campos de senha para tipo password
  form.querySelectorAll('.toggle-senha').forEach(btn => {
    const alvo = document.getElementById(btn.dataset.alvo);
    if (alvo) alvo.type = 'password';
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-eye';
  });
}

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

  // ── Modais usuário ───────────────────────────────────────────────
  $('fecharModal').addEventListener('click',      () => fecharModal('modalEditar'));
  $('cancelarModal').addEventListener('click',    () => fecharModal('modalEditar'));
  $('fecharModalExcluir').addEventListener('click',() => fecharModal('modalExcluir'));
  $('cancelarExcluir').addEventListener('click',  () => fecharModal('modalExcluir'));

  ['modalEditar', 'modalExcluir'].forEach(id => {
    $(id).addEventListener('click', e => { if (e.target === $(id)) fecharModal(id); });
  });

  $('formEditar').addEventListener('submit', salvarEdicao);
  $('confirmarExcluir').addEventListener('click', confirmarExclusao);

  // ── Modais admin ─────────────────────────────────────────────────
  $('formNovoAdmin').addEventListener('submit', criarNovoAdmin);
  $('confirmarExcluirAdmin').addEventListener('click', confirmarExclusaoAdmin);

  ['modalNovoAdmin', 'modalExcluirAdmin'].forEach(id => {
    $(id).addEventListener('click', e => { if (e.target === $(id)) fecharModal(id); });
  });

  // ── Logoff ───────────────────────────────────────────────────────
  $('btnLogoff').addEventListener('click', logoff);

  // ── Toggle de senha (todos os campos tipo password) ───────────────
  document.querySelectorAll('.toggle-senha').forEach(btn => {
    btn.addEventListener('click', () => {
      const alvo = document.getElementById(btn.dataset.alvo);
      if (!alvo) return;
      const mostrar = alvo.type === 'password';
      alvo.type = mostrar ? 'text' : 'password';
      btn.querySelector('i').className = mostrar
        ? 'fa-solid fa-eye-slash'
        : 'fa-solid fa-eye';
    });
  });
});

/* ═══════════════════════════════════════
   SESSÃO
═══════════════════════════════════════ */
async function validarSessaoAdmin() {
  try {
    const resp  = await fetch('../php/valida_sessao.php');
    const dados = await resp.json();
    const usuario = Array.isArray(dados.data) ? dados.data[0] : dados.data;
    if (dados.status !== 'ok' || usuario?.role !== 'admin') {
      window.location.href = '../login/login.html';
    } else {
      // Preenche widget de perfil na sidebar
      const email   = usuario.email || '';
      const inicial = email[0]?.toUpperCase() || 'A';
      const elId    = id => document.getElementById(id);
      if (elId('adm-iniciais')) elId('adm-iniciais').textContent = inicial;
      if (elId('adm-nome'))    elId('adm-nome').textContent    = 'Administrador';
      if (elId('adm-email'))   elId('adm-email').textContent   = email;
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
  if (aba === 'admins')   carregarAdmins();
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

    // ★★★ NOVO CAMPO — PASSO 2C DE 4: EXIBIR NA TABELA DE USUÁRIOS (Admin) ★★★
    // Adicione uma coluna <td> na tabela abaixo e o <th> correspondente no cabeçalho.
    // Exemplo para "nome_mae":
    //   <td>${escapeHtml(u.nome_mae || '—')}</td>
    // E no cabeçalho da tabela (renderTabela):
    //   <th>Nome da Mãe</th>
    // ★★★ FIM DA INSTRUÇÃO ★★★

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
  $('editSenha').value    = '';   // senha nunca pré-preenchida

  // ★★★ NOVO CAMPO — PASSO 2A DE 4: PRÉ-PREENCHER NO MODAL DE EDIÇÃO (Admin) ★★★
  // Preencha o input com o valor vindo do banco (objeto "usuario").
  // Exemplo para "nome_mae":
  //   $('editNomeMae').value = usuario.nome_mae || '';
  // (o campo precisa estar no SELECT de adm_get_usuarios.php — PASSO 3C)
  // ★★★ FIM DA INSTRUÇÃO ★★★

  // Limpar estados de validação visual de abertura anterior
  ['editNome', 'editEmail', 'editTelefone', 'editSenha'].forEach(campo => {
    const el   = $(campo);
    const erro = document.getElementById('erro-' + campo);
    if (el)   el.classList.remove('input-erro', 'input-valido');
    if (erro) erro.textContent = '';
  });

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

  // ★★★ NOVO CAMPO — PASSO 2B DE 4: ENVIAR NO FORMDATA (Admin) ★★★
  // Leia o valor do novo input e adicione ao FormData abaixo.
  // Exemplo:
  //   const nome_mae = $('editNomeMae').value.trim();
  //   fd.append('nome_mae', nome_mae);
  // ★★★ FIM DA INSTRUÇÃO ★★★

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

/* ═══════════════════════════════════════
   ADMINISTRADORES — CARREGAR
═══════════════════════════════════════ */
async function carregarAdmins() {
  $('tabelaAdminsWrap').innerHTML = `
    <div class="estado-vazio">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Carregando administradores…</span>
    </div>`;

  try {
    const resp  = await fetch('./adm_get_admins.php?t=' + Date.now());
    const dados = await resp.json();

    if (dados.status !== 'ok') {
      $('tabelaAdminsWrap').innerHTML = `
        <div class="estado-vazio">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>${escapeHtml(dados.mensagem || 'Erro ao carregar administradores.')}</span>
        </div>`;
      return;
    }

    todosAdmins = dados.data || [];
    renderTabelaAdmins(todosAdmins);

  } catch (err) {
    console.error('[Admin]', err);
    $('tabelaAdminsWrap').innerHTML = `
      <div class="estado-vazio">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>Falha na comunicação com o servidor.</span>
      </div>`;
  }
}

/* ═══════════════════════════════════════
   ADMINISTRADORES — RENDER TABELA
═══════════════════════════════════════ */
function renderTabelaAdmins(lista) {
  if (lista.length === 0) {
    $('tabelaAdminsWrap').innerHTML = `
      <div class="estado-vazio">
        <i class="fa-solid fa-user-slash"></i>
        <span>Nenhum administrador encontrado.</span>
      </div>`;
    return;
  }

  const linhas = lista.map(a => {
    const inicial  = (a.email || '?')[0].toUpperCase();
    const badgeEu  = a.eh_atual ? ' <span class="badge-eu">você</span>' : '';
    const btnExcluir = a.eh_atual
      ? `<button class="btn-tabela btn-excluir-tabela" disabled title="Não é possível excluir sua própria conta">
           <i class="fa-solid fa-trash"></i> Excluir
         </button>`
      : `<button class="btn-tabela btn-excluir-tabela"
           onclick='pedirExclusaoAdmin(${a.id}, ${JSON.stringify(a.email)})'>
           <i class="fa-solid fa-trash"></i> Excluir
         </button>`;

    return `
      <tr>
        <td>
          <div class="cell-nome">
            <div class="avatar avatar-admin">${escapeHtml(inicial)}</div>
            ${escapeHtml(a.email)}${badgeEu}
          </div>
        </td>
        <td><span class="senha-oculta">••••••••</span></td>
        <td>
          <div class="acoes-tabela">${btnExcluir}</div>
        </td>
      </tr>`;
  }).join('');

  $('tabelaAdminsWrap').innerHTML = `
    <table class="tabela-usuarios">
      <thead>
        <tr>
          <th>E-mail</th>
          <th>Senha</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

/* ═══════════════════════════════════════
   ADMINISTRADORES — CRIAR
═══════════════════════════════════════ */
async function criarNovoAdmin(e) {
  e.preventDefault();

  const email = $('novoAdminEmail').value.trim();
  const senha = $('novoAdminSenha').value;
  const msg   = $('msgNovoAdmin');
  const btn   = $('formNovoAdmin').querySelector('.btn-salvar');

  if (!email || !senha) {
    msg.textContent = 'Preencha e-mail e senha.';
    msg.className   = 'msg-form erro';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Criando…';
  msg.className   = 'msg-form oculto';

  const fd = new FormData();
  fd.append('email', email);
  fd.append('senha', senha);

  try {
    const resp  = await fetch('./adm_novo_admin.php', { method: 'POST', body: fd });
    const dados = await resp.json();

    if (dados.status === 'ok') {
      msg.textContent = 'Administrador criado com sucesso!';
      msg.className   = 'msg-form sucesso';
      setTimeout(() => {
        fecharModal('modalNovoAdmin');
        $('formNovoAdmin').reset();
        msg.className = 'msg-form oculto';
        carregarAdmins();
        showToast('<i class="fa-solid fa-user-plus"></i> Administrador criado!');
      }, 800);
    } else {
      msg.textContent = dados.mensagem || 'Erro ao criar administrador.';
      msg.className   = 'msg-form erro';
    }
  } catch (err) {
    console.error('[Admin]', err);
    msg.textContent = 'Falha na comunicação com o servidor.';
    msg.className   = 'msg-form erro';
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Criar';
  }
}

/* ═══════════════════════════════════════
   ADMINISTRADORES — EXCLUIR
═══════════════════════════════════════ */
function pedirExclusaoAdmin(id, email) {
  excluirAdminIdPendente = id;
  $('excluirAdminEmail').textContent = email;
  abrirModal('modalExcluirAdmin');
}

async function confirmarExclusaoAdmin() {
  if (!excluirAdminIdPendente) return;

  const btn = $('confirmarExcluirAdmin');
  btn.disabled    = true;
  btn.textContent = 'Excluindo…';

  try {
    const resp  = await fetch(`./adm_excluir_admin.php?id=${excluirAdminIdPendente}`);
    const dados = await resp.json();

    if (dados.status === 'ok') {
      todosAdmins = todosAdmins.filter(a => a.id !== excluirAdminIdPendente);
      fecharModal('modalExcluirAdmin');
      renderTabelaAdmins(todosAdmins);
      showToast('<i class="fa-solid fa-trash"></i> Administrador removido.');
    } else {
      showToast('<i class="fa-solid fa-circle-xmark"></i> ' + (dados.mensagem || 'Erro ao excluir.'), 'erro');
      fecharModal('modalExcluirAdmin');
    }
  } catch (err) {
    console.error('[Admin]', err);
    showToast('<i class="fa-solid fa-circle-xmark"></i> Falha na comunicação.', 'erro');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="fa-solid fa-trash"></i> Excluir';
    excluirAdminIdPendente = null;
  }
}
