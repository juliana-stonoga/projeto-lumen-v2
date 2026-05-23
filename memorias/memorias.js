// ── Estado global ──────────────────────────────────────────────────────────
var todasMemorias = [];
var memoriaAtualId = null;

// ── Mapa de humor ──────────────────────────────────────────────────────────
const humorMap = {
  muito_bem: '😄 Muito bem',
  bem:       '🙂 Bem',
  neutro:    '😐 Neutro',
  saudade:   '🥺 Saudade'
};

// ── Mapa de ícones por categoria ───────────────────────────────────────────
const categoriaIcone = {
  'Viagem':    '✈️',
  'Família':   '👨‍👩‍👧',
  'Amigos':    '👥',
  'Conquista': '🏆',
  'Amor':      '❤️',
  'Trabalho':  '💼',
  'Outro':     '📌'
};

const categoriaBadgeClass = {
  'Viagem':    'badge-viagem',
  'Família':   'badge-familia',
  'Amigos':    'badge-amigos',
  'Conquista': 'badge-conquista',
  'Amor':      'badge-amor',
  'Trabalho':  'badge-trabalho',
  'Outro':     'badge-outro'
};

// ── Inicialização ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  carregarMemorias();

  // Abrir modal
  document.getElementById('abrirModalMemoria').addEventListener('click', abrirModalNova);

  // Fechar modais
  document.getElementById('fecharModalMemoria').addEventListener('click', fecharModal);
  document.getElementById('cancelarModal').addEventListener('click', fecharModal);
  document.getElementById('fecharModalVisualizar').addEventListener('click', fecharModalVisualizar);

  // Fechar ao clicar fora
  document.getElementById('modalMemoria').addEventListener('click', function (e) {
    if (e.target === this) fecharModal();
  });
  document.getElementById('modalVisualizar').addEventListener('click', function (e) {
    if (e.target === this) fecharModalVisualizar();
  });

  // Submit
  document.getElementById('formMemoria').addEventListener('submit', salvarMemoria);

  // Preview da imagem ao digitar URL
  document.getElementById('imagem_url').addEventListener('input', atualizarPreview);

  // Remover imagem
  document.getElementById('removerImagem').addEventListener('click', function () {
    document.getElementById('imagem_url').value = '';
    document.getElementById('previewImagem').style.display = 'none';
  });

  // Ações do modal de visualização
  document.getElementById('vizEditar').addEventListener('click', function () {
    fecharModalVisualizar();
    const m = todasMemorias.find(x => x.id == memoriaAtualId);
    if (m) abrirModalEditar(m);
  });

  document.getElementById('vizExcluir').addEventListener('click', function () {
    fecharModalVisualizar();
    excluirMemoria(memoriaAtualId);
  });
});

// ── Preview de imagem ──────────────────────────────────────────────────────
function atualizarPreview() {
  const url = document.getElementById('imagem_url').value.trim();
  const wrap = document.getElementById('previewImagem');
  const img  = document.getElementById('imgPreview');
  if (url) {
    img.src = url;
    img.onload  = () => { wrap.style.display = 'block'; };
    img.onerror = () => { wrap.style.display = 'none'; };
  } else {
    wrap.style.display = 'none';
  }
}

// ── Modais ─────────────────────────────────────────────────────────────────
function abrirModalNova() {
  memoriaAtualId = null;
  document.getElementById('formMemoria').reset();
  document.getElementById('memoriaId').value = '';
  document.getElementById('modalTitulo').textContent = 'Nova Memória';
  document.getElementById('previewImagem').style.display = 'none';
  document.getElementById('modalMemoria').style.display = 'flex';
}

function abrirModalEditar(m) {
  memoriaAtualId = m.id;
  document.getElementById('memoriaId').value  = m.id;
  document.getElementById('titulo').value      = m.titulo || '';
  document.getElementById('descricao').value   = m.descricao || '';
  document.getElementById('data_memoria').value = m.data_memoria || '';
  document.getElementById('categoria').value   = m.categoria || '';
  document.getElementById('imagem_url').value  = m.imagem_url || '';

  // humor
  const r = document.querySelector(`input[name="humor"][value="${m.humor}"]`);
  if (r) r.checked = true;

  // preview
  if (m.imagem_url) {
    const img = document.getElementById('imgPreview');
    img.src = m.imagem_url;
    img.onload = () => { document.getElementById('previewImagem').style.display = 'block'; };
  } else {
    document.getElementById('previewImagem').style.display = 'none';
  }

  document.getElementById('modalTitulo').textContent = 'Editar Memória';
  document.getElementById('modalMemoria').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalMemoria').style.display = 'none';
  document.getElementById('formMemoria').reset();
  document.getElementById('previewImagem').style.display = 'none';
  memoriaAtualId = null;
}

function abrirModalVisualizar(m) {
  memoriaAtualId = m.id;

  document.getElementById('vizTitulo').textContent = m.titulo || '';

  // imagem
  const wrapImg = document.getElementById('vizImagemWrap');
  if (m.imagem_url) {
    const vizImg = document.getElementById('vizImg');
    vizImg.src = m.imagem_url;
    vizImg.onload  = () => { wrapImg.style.display = 'block'; };
    vizImg.onerror = () => { wrapImg.style.display = 'none'; };
  } else {
    wrapImg.style.display = 'none';
  }

  // data
  document.getElementById('vizData').textContent = formatarData(m.data_memoria);

  // categoria
  const cat = m.categoria || '—';
  const icone = categoriaIcone[cat] || '';
  document.getElementById('vizCategoria').textContent = icone ? `${icone} ${cat}` : cat;

  // humor
  const humorRow = document.getElementById('vizHumorRow');
  if (m.humor) {
    document.getElementById('vizHumor').textContent = humorMap[m.humor] || m.humor;
    humorRow.style.display = 'flex';
  } else {
    humorRow.style.display = 'none';
  }

  // descrição
  const descWrap = document.getElementById('vizDescricaoWrap');
  if (m.descricao) {
    document.getElementById('vizDescricao').textContent = m.descricao;
    descWrap.style.display = 'block';
  } else {
    descWrap.style.display = 'none';
  }

  document.getElementById('modalVisualizar').style.display = 'flex';
}

function fecharModalVisualizar() {
  document.getElementById('modalVisualizar').style.display = 'none';
}

// ── CRUD ───────────────────────────────────────────────────────────────────
function salvarMemoria(e) {
  e.preventDefault();

  const id          = document.getElementById('memoriaId').value;
  const titulo      = document.getElementById('titulo').value.trim();
  const descricao   = document.getElementById('descricao').value.trim();
  const data_memoria = document.getElementById('data_memoria').value;
  const categoria   = document.getElementById('categoria').value;
  const imagem_url  = document.getElementById('imagem_url').value.trim();
  const humorEl     = document.querySelector('input[name="humor"]:checked');
  const humor       = humorEl ? humorEl.value : '';

  const formData = new FormData();
  formData.append('acao',       id ? 'editar' : 'adicionar');
  formData.append('titulo',     titulo);
  formData.append('descricao',  descricao);
  formData.append('data_memoria', data_memoria);
  formData.append('categoria',  categoria);
  formData.append('imagem_url', imagem_url);
  formData.append('humor',      humor);
  if (id) formData.append('id', id);

  fetch('memorias.php', { method: 'POST', credentials: 'same-origin', body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'erro') { console.error(data.mensagem); }
      fecharModal();
      carregarMemorias();
    })
    .catch(() => {
      // fallback local (sem backend)
      if (id) {
        const idx = todasMemorias.findIndex(x => x.id == id);
        if (idx !== -1) {
          todasMemorias[idx] = { ...todasMemorias[idx], titulo, descricao, data_memoria, categoria, imagem_url, humor };
        }
      } else {
        todasMemorias.unshift({
          id: Date.now(),
          titulo, descricao, data_memoria, categoria, imagem_url, humor,
          criado_em: new Date().toISOString()
        });
      }
      fecharModal();
      aplicarFiltro();
      popularFiltroAnos();
    });
}

function carregarMemorias() {
  fetch('memorias.php', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'erro') {
        if (data.mensagem === 'Usuário não logado') {
          window.location.href = '../login/login.html';
          return;
        }
        console.error(data.mensagem);
        return;
      }
      todasMemorias = data.memorias || [];
      popularFiltroAnos();
      aplicarFiltro();
    })
    .catch(() => {
      aplicarFiltro();
      popularFiltroAnos();
    });
}

function excluirMemoria(id) {
  if (!confirm('Deseja realmente excluir esta memória?')) return;

  const formData = new FormData();
  formData.append('acao', 'excluir');
  formData.append('id', id);

  fetch('memorias.php', { method: 'POST', credentials: 'same-origin', body: formData })
    .then(r => r.json())
    .then(() => carregarMemorias())
    .catch(() => {
      todasMemorias = todasMemorias.filter(x => x.id != id);
      aplicarFiltro();
      popularFiltroAnos();
    });
}

// ── Filtros ────────────────────────────────────────────────────────────────
function aplicarFiltro() {
  const busca     = (document.getElementById('filtroBusca')?.value || '').toLowerCase();
  const categoria = document.getElementById('filtroCategoria')?.value || '';
  const ano       = document.getElementById('filtroAno')?.value || '';

  const filtradas = todasMemorias.filter(m => {
    const matchBusca     = !busca     || (m.titulo + ' ' + m.descricao).toLowerCase().includes(busca);
    const matchCategoria = !categoria || m.categoria === categoria;
    const matchAno       = !ano       || (m.data_memoria || '').startsWith(ano);
    return matchBusca && matchCategoria && matchAno;
  });

  renderizarGaleria(filtradas);
}

function limparFiltros() {
  ['filtroBusca', 'filtroCategoria', 'filtroAno'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  aplicarFiltro();
}

function popularFiltroAnos() {
  const anos = [...new Set(
    todasMemorias
      .map(m => (m.data_memoria || '').split('-')[0])
      .filter(Boolean)
  )].sort((a, b) => b - a);

  const sel = document.getElementById('filtroAno');
  const val = sel.value;
  sel.innerHTML = '<option value="">Todos os anos</option>';
  anos.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    sel.appendChild(opt);
  });
  if (val) sel.value = val;
}

// ── Renderização ───────────────────────────────────────────────────────────
function renderizarGaleria(lista) {
  const galeria = document.getElementById('galeria');

  if (!lista || lista.length === 0) {
    galeria.innerHTML = '<p class="vazio">Nenhuma memória encontrada.</p>';
    return;
  }

  galeria.innerHTML = lista.map(m => {
    const dataFmt    = formatarData(m.data_memoria);
    const catClass   = categoriaBadgeClass[m.categoria] || 'badge-cat';
    const catIcone   = categoriaIcone[m.categoria] || '📌';
    const humorEmoji = m.humor ? (humorMap[m.humor] || '').split(' ')[0] : '';

    const thumbHtml = m.imagem_url
      ? `<img class="card-thumb" src="${escHtml(m.imagem_url)}" alt="${escHtml(m.titulo)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
         <div class="card-thumb-placeholder" style="display:none;">${catIcone}</div>`
      : `<div class="card-thumb-placeholder">${catIcone}</div>`;

    return `
      <div class="card-memoria" onclick="abrirModalVisualizar(todasMemorias.find(x=>x.id==${m.id}))">
        ${thumbHtml}
        <div class="card-memoria-body">
          <div class="card-memoria-titulo">${escHtml(m.titulo)}</div>
          ${m.descricao ? `<div class="card-memoria-desc">${escHtml(m.descricao)}</div>` : ''}
          <div class="card-memoria-meta">
            <div class="card-data">
              <i class="fa-regular fa-calendar" style="opacity:.65"></i>
              ${dataFmt}
            </div>
            <div class="card-badges">
              ${m.categoria ? `<span class="badge-pill ${catClass}">${catIcone} ${escHtml(m.categoria)}</span>` : ''}
              ${humorEmoji  ? `<span class="badge-humor" title="${humorMap[m.humor] || ''}">${humorEmoji}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Utilitários ────────────────────────────────────────────────────────────
function formatarData(str) {
  if (!str) return '—';
  const [a, m, d] = str.split('-');
  return d && m && a ? `${d}/${m}/${a}` : str;
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}