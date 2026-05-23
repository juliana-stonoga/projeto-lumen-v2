// ── Estado ─────────────────────────────────────────────────────────────────
var todasMemorias  = [];
var memoriaAtualId = null;
var arquivoSelecionado = null;   // File object do input

// ── Mapas ──────────────────────────────────────────────────────────────────
const humorLabel = {
  muito_bem: '😄 Muito bem',
  bem:       '🙂 Bem',
  neutro:    '😐 Neutro',
  saudade:   '🥺 Saudade'
};

const catIcone = {
  'Viagem': '✈️', 'Família': '👨‍👩‍👧', 'Amigos': '👥',
  'Conquista': '🏆', 'Amor': '❤️', 'Trabalho': '💼', 'Outro': '📌'
};

const catPill = {
  'Viagem': 'pill-viagem', 'Família': 'pill-familia', 'Amigos': 'pill-amigos',
  'Conquista': 'pill-conquista', 'Amor': 'pill-amor',
  'Trabalho': 'pill-trabalho', 'Outro': 'pill-outro'
};

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarMemorias();

  // abrir / fechar modais
  document.getElementById('abrirModalMemoria').addEventListener('click', abrirModalNova);
  document.getElementById('fecharModalMemoria').addEventListener('click', fecharModal);
  document.getElementById('cancelarModal').addEventListener('click', fecharModal);
  document.getElementById('fecharModalVisualizar').addEventListener('click', fecharModalViz);

  document.getElementById('modalMemoria').addEventListener('click', e => { if (e.target === e.currentTarget) fecharModal(); });
  document.getElementById('modalVisualizar').addEventListener('click', e => { if (e.target === e.currentTarget) fecharModalViz(); });

  // submit
  document.getElementById('formMemoria').addEventListener('submit', salvarMemoria);

  // ── upload: clique na área abre o file picker ──
  const uploadArea   = document.getElementById('uploadArea');
  const inputImagem  = document.getElementById('inputImagem');

  uploadArea.addEventListener('click', e => {
    // não disparar quando clicar nos botões de remover/trocar
    if (e.target.closest('.btn-remover-img') || e.target.closest('.btn-trocar-img')) return;
    inputImagem.click();
  });

  inputImagem.addEventListener('change', () => {
    if (inputImagem.files && inputImagem.files[0]) {
      selecionarArquivo(inputImagem.files[0]);
    }
  });

  // ── drag & drop ──
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', ()  => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) selecionarArquivo(file);
  });

  // ── remover / trocar ──
  document.getElementById('removerImagem').addEventListener('click', e => { e.stopPropagation(); limparImagem(); });
  document.getElementById('trocarImagem').addEventListener('click',  e => { e.stopPropagation(); inputImagem.click(); });

  // ── visualizar: ações ──
  document.getElementById('vizEditar').addEventListener('click', () => {
    const m = todasMemorias.find(x => x.id == memoriaAtualId);
    fecharModalViz();
    if (m) abrirModalEditar(m);
  });
  document.getElementById('vizExcluir').addEventListener('click', () => {
    fecharModalViz();
    excluirMemoria(memoriaAtualId);
  });

  // zoom na imagem do modal de visualização
  document.getElementById('vizImg').addEventListener('click', abrirZoom);
});

// ── Upload helpers ─────────────────────────────────────────────────────────
function selecionarArquivo(file) {
  const maxMB = 5;
  if (file.size > maxMB * 1024 * 1024) {
    alert(`A imagem deve ter no máximo ${maxMB} MB.`);
    return;
  }
  arquivoSelecionado = file;

  const reader = new FileReader();
  reader.onload = ev => mostrarPreview(ev.target.result);
  reader.readAsDataURL(file);
}

function mostrarPreview(src) {
  const preview = document.getElementById('uploadPreview');
  const placeholder = document.getElementById('uploadPlaceholder');
  const img = document.getElementById('imgPreview');

  img.src = src;
  placeholder.style.display = 'none';
  preview.style.display = 'block';
}

function limparImagem() {
  arquivoSelecionado = null;
  document.getElementById('inputImagem').value = '';
  document.getElementById('imagemUrlSalva').value = '';
  document.getElementById('imgPreview').src = '';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'flex';
}

// ── Modais ─────────────────────────────────────────────────────────────────
function abrirModalNova() {
  memoriaAtualId = null;
  document.getElementById('formMemoria').reset();
  document.getElementById('memoriaId').value = '';
  document.getElementById('modalTitulo').textContent = 'Nova Memória';
  limparImagem();
  document.getElementById('modalMemoria').style.display = 'flex';
}

function abrirModalEditar(m) {
  memoriaAtualId = m.id;
  document.getElementById('memoriaId').value     = m.id;
  document.getElementById('titulo').value        = m.titulo      || '';
  document.getElementById('descricao').value     = m.descricao   || '';
  document.getElementById('data_memoria').value  = m.data_memoria || '';
  document.getElementById('categoria').value     = m.categoria   || '';

  const r = document.querySelector(`input[name="humor"][value="${m.humor}"]`);
  if (r) r.checked = true;

  // preview da imagem existente
  limparImagem();
  if (m.imagem_url) {
    document.getElementById('imagemUrlSalva').value = m.imagem_url;
    mostrarPreview(m.imagem_url);
  }

  document.getElementById('modalTitulo').textContent = 'Editar Memória';
  document.getElementById('modalMemoria').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalMemoria').style.display = 'none';
  document.getElementById('formMemoria').reset();
  limparImagem();
  memoriaAtualId = null;
}

function abrirModalViz(m) {
  memoriaAtualId = m.id;
  const box = document.getElementById('modalVizBox');

  document.getElementById('vizTitulo').textContent = m.titulo || '';
  document.getElementById('vizData').textContent   = formatarData(m.data_memoria);

  // categoria
  const ic = catIcone[m.categoria] || '';
  document.getElementById('vizCategoria').textContent = ic ? `${ic} ${m.categoria}` : (m.categoria || '—');
  document.getElementById('vizCatLinha').style.display = m.categoria ? 'flex' : 'none';

  // humor
  document.getElementById('vizHumor').textContent = humorLabel[m.humor] || '';
  document.getElementById('vizHumorLinha').style.display = m.humor ? 'flex' : 'none';

  // descrição
  const descWrap = document.getElementById('vizDescWrap');
  if (m.descricao) {
    document.getElementById('vizDescricao').textContent = m.descricao;
    descWrap.style.display = 'block';
  } else {
    descWrap.style.display = 'none';
  }

  // imagem
  const imgCol = document.getElementById('vizImgCol');
  const vizImg = document.getElementById('vizImg');
  if (m.imagem_url) {
    vizImg.src = m.imagem_url;
    imgCol.style.display = 'flex';
    box.classList.remove('sem-foto');
  } else {
    imgCol.style.display = 'none';
    box.classList.add('sem-foto');
  }

  document.getElementById('modalVisualizar').style.display = 'flex';
}

function fecharModalViz() {
  document.getElementById('modalVisualizar').style.display = 'none';
}

// ── Zoom ───────────────────────────────────────────────────────────────────
function abrirZoom() {
  const src = document.getElementById('vizImg').src;
  if (!src) return;

  const overlay = document.createElement('div');
  overlay.className = 'zoom-overlay';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity .2s ease';

  const img = document.createElement('img');
  img.src = src;

  const btn = document.createElement('button');
  btn.className = 'zoom-close';
  btn.innerHTML = '✖';

  overlay.appendChild(img);
  overlay.appendChild(btn);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.style.opacity = '1');

  const fechar = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };

  btn.addEventListener('click', fechar);
  overlay.addEventListener('click', e => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc); }
  });
}

// ── CRUD ───────────────────────────────────────────────────────────────────
function salvarMemoria(e) {
  e.preventDefault();

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

  const id           = document.getElementById('memoriaId').value;
  const titulo       = document.getElementById('titulo').value.trim();
  const descricao    = document.getElementById('descricao').value.trim();
  const data_memoria = document.getElementById('data_memoria').value;
  const categoria    = document.getElementById('categoria').value;
  const humor        = (document.querySelector('input[name="humor"]:checked') || {}).value || '';
  const imagemExist  = document.getElementById('imagemUrlSalva').value;

  const fd = new FormData();
  fd.append('acao',         id ? 'editar' : 'adicionar');
  fd.append('titulo',       titulo);
  fd.append('descricao',    descricao);
  fd.append('data_memoria', data_memoria);
  fd.append('categoria',    categoria);
  fd.append('humor',        humor);

  if (arquivoSelecionado) {
    // novo arquivo selecionado pelo usuário
    fd.append('imagem_file', arquivoSelecionado);
    fd.append('imagem_url',  '');
  } else {
    // mantém URL existente (edição sem trocar foto)
    fd.append('imagem_url',  imagemExist);
  }

  if (id) fd.append('id', id);

  fetch('memorias.php', { method: 'POST', credentials: 'same-origin', body: fd })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'erro') console.error(data.mensagem);
      fecharModal();
      carregarMemorias();
    })
    .catch(err => {
      console.error(err);
      alert('Erro ao salvar. Verifique a conexão.');
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Memória';
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
      popularAnos();
      aplicarFiltro();
    })
    .catch(console.error);
}

function excluirMemoria(id) {
  if (!confirm('Deseja realmente excluir esta memória?')) return;

  const fd = new FormData();
  fd.append('acao', 'excluir');
  fd.append('id', id);

  fetch('memorias.php', { method: 'POST', credentials: 'same-origin', body: fd })
    .then(r => r.json())
    .then(() => carregarMemorias())
    .catch(console.error);
}

// ── Filtros ────────────────────────────────────────────────────────────────
function aplicarFiltro() {
  const cat = document.getElementById('filtroCategoria').value;
  const ano = document.getElementById('filtroAno').value;

  const lista = todasMemorias.filter(m => {
    const okCat = !cat || m.categoria === cat;
    const okAno = !ano || (m.data_memoria || '').startsWith(ano);
    return okCat && okAno;
  });

  renderGaleria(lista);
}

function limparFiltros() {
  document.getElementById('filtroCategoria').value = '';
  document.getElementById('filtroAno').value = '';
  aplicarFiltro();
}

function popularAnos() {
  const anos = [...new Set(
    todasMemorias.map(m => (m.data_memoria || '').split('-')[0]).filter(Boolean)
  )].sort((a, b) => b - a);

  const sel = document.getElementById('filtroAno');
  const val = sel.value;
  sel.innerHTML = '<option value="">Todos os anos</option>';
  anos.forEach(a => {
    const o = document.createElement('option');
    o.value = a; o.textContent = a;
    sel.appendChild(o);
  });
  if (val) sel.value = val;
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderGaleria(lista) {
  const g = document.getElementById('galeria');
  if (!lista.length) {
    g.innerHTML = '<p class="vazio">Nenhuma memória encontrada.</p>';
    return;
  }

  g.innerHTML = lista.map(m => {
    const ic   = catIcone[m.categoria] || '📌';
    const pill = catPill[m.categoria]  || 'pill-cat';
    const emoji = m.humor ? (humorLabel[m.humor] || '').split(' ')[0] : '';

    const fotoInner = m.imagem_url
      ? `<img class="card-foto" src="${esc(m.imagem_url)}" alt="${esc(m.titulo)}" loading="lazy"
             data-ic="${ic}" onerror="imgErr(this)">`
      : `<div class="card-placeholder">${ic}</div>`;

    return `<div class="card-memoria" onclick="abrirModalViz(todasMemorias.find(x=>x.id==${m.id}))">
      <div class="card-foto-wrap">${fotoInner}</div>
      <div class="card-body">
        <div class="card-titulo">${esc(m.titulo)}</div>
        ${m.descricao ? `<div class="card-desc">${esc(m.descricao)}</div>` : ''}
        <div class="card-rodape">
          <span class="card-data"><i class="fa-regular fa-calendar" style="opacity:.65"></i> ${formatarData(m.data_memoria)}</span>
          <div class="card-badges">
            ${m.categoria ? `<span class="pill ${pill}">${ic} ${esc(m.categoria)}</span>` : ''}
            ${emoji       ? `<span class="pill pill-humor" title="${humorLabel[m.humor]}">${emoji}</span>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── imgErr — fallback limpo sem HTML inline quebrado ─────────────────────
function imgErr(img) {
  img.onerror = null;
  const ic = img.getAttribute('data-ic') || '📌';
  img.parentElement.innerHTML = '<div class="card-placeholder">' + ic + '</div>';
}

// ── Utils ──────────────────────────────────────────────────────────────────
function formatarData(s) {
  if (!s) return '—';
  const [a, m, d] = s.split('-');
  return d && m && a ? `${d}/${m}/${a}` : s;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}