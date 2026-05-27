/* ═══════════════════════════════════════════════════════════════
   LÚMEN — Diário  (diario.js)
   Consome o backend diario.php via fetch/FormData.
   Funcionalidades:
   - Listar, criar, editar e excluir entradas (CRUD)
   - Mini calendário com marcação de dias com entradas
   - Filtro por data (clique no calendário) + busca textual
   - Registro por voz via Web Speech API (SpeechRecognition)
═══════════════════════════════════════════════════════════════ */

/* ─── CONFIGURAÇÃO ─── */
const API_URL = 'diario.php';          // mesmo diretório

/* ─── ESTADO ─── */
let entradas        = [];              // cache vindo do PHP
let calAno          = new Date().getFullYear();
let calMes          = new Date().getMonth();   // 0-based
let dataSelecionada = null;            // 'YYYY-MM-DD' | null
let idEditando      = null;
let reconhecedor    = null;
let gravando        = false;

/* ─── MAPAS DE HUMOR ─── */
const HUMOR_META = {
    muito_bem: { emoji: '😄', label: 'Ótimo',     classe: 'humor-muito_bem' },
    bem:       { emoji: '🙂', label: 'Bem',        classe: 'humor-bem'       },
    neutro:    { emoji: '😐', label: 'Neutro',     classe: 'humor-neutro'    },
    mal:       { emoji: '😞', label: 'Mal',        classe: 'humor-mal'       },
    muito_mal: { emoji: '😔', label: 'Muito mal',  classe: 'humor-muito_mal' },
};

/* ─── HELPERS ─── */
const $  = id => document.getElementById(id);
const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formataDataBR(strISO) {
    const [a, m, d] = strISO.split('-');
    const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                   'julho','agosto','setembro','outubro','novembro','dezembro'];
    return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${a}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
}

function showToast(msg, tipo = 'ok') {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.innerHTML = msg;
    t.classList.add('visivel');
    if (tipo === 'erro') t.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
    else                 t.style.background = '';
    setTimeout(() => t.classList.remove('visivel'), 3000);
}

function setCarregando(carregando) {
    const btn = $('abrirModalEntrada');
    if (btn) btn.disabled = carregando;
}

/* ═══════════════════════════════════════
   API — FETCH HELPERS
═══════════════════════════════════════ */

async function apiFetch(formData) {
    const resp = await fetch(API_URL, { method: 'POST', body: formData });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
}

async function carregarEntradas() {
    setCarregando(true);
    try {
        const resp = await fetch(API_URL);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const dados = await resp.json();

        if (dados.status !== 'sucesso') {
            if (dados.mensagem && dados.mensagem.includes('autenticado')) {
                window.location.href = '../login/login.html';
                return;
            }
            throw new Error(dados.mensagem || 'Erro ao carregar entradas.');
        }

        entradas = dados.entradas || [];
        renderCalendario();
        renderEntradas();

    } catch (err) {
        console.error('[Diário]', err);
    } finally {
        setCarregando(false);
    }
}

/* ═══════════════════════════════════════
   CALENDÁRIO
═══════════════════════════════════════ */

function datasComEntrada() {
    return new Set(entradas.map(e => e.data_entrada));
}

function renderCalendario() {
    $('calTitulo').textContent = `${MESES_PT[calMes]} ${calAno}`;

    const grid   = $('calGrid');
    grid.innerHTML = '';

    const datas        = datasComEntrada();
    const hojeStr      = hoje();
    const primeiroDia  = new Date(calAno, calMes, 1).getDay();
    const diasNoMes    = new Date(calAno, calMes+1, 0).getDate();
    const diasMesAnt   = new Date(calAno, calMes, 0).getDate();

    for (let i = primeiroDia - 1; i >= 0; i--) {
        const cel = document.createElement('div');
        cel.className = 'cal-dia outro-mes';
        cel.textContent = diasMesAnt - i;
        grid.appendChild(cel);
    }

    for (let d = 1; d <= diasNoMes; d++) {
        const strData = `${calAno}-${String(calMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cel = document.createElement('div');
        cel.className = 'cal-dia';
        cel.textContent = d;

        if (strData === hojeStr)         cel.classList.add('hoje');
        if (datas.has(strData))          cel.classList.add('tem-entrada');
        if (strData === dataSelecionada) cel.classList.add('selecionado');

        cel.addEventListener('click', () => selecionarData(strData));
        grid.appendChild(cel);
    }

    const totalCels = Math.ceil((primeiroDia + diasNoMes) / 7) * 7;
    const extras    = totalCels - primeiroDia - diasNoMes;
    for (let d = 1; d <= extras; d++) {
        const cel = document.createElement('div');
        cel.className = 'cal-dia outro-mes';
        cel.textContent = d;
        grid.appendChild(cel);
    }
}

function selecionarData(strData) {
    if (dataSelecionada === strData) {
        dataSelecionada = null;
        $('tituloLista').textContent = 'Todas as entradas';
    } else {
        dataSelecionada = strData;
        $('tituloLista').textContent = `Entradas — ${formataDataBR(strData)}`;
    }
    renderCalendario();
    renderEntradas();
}

$('mesAnterior').addEventListener('click', () => {
    calMes--;
    if (calMes < 0) { calMes = 11; calAno--; }
    renderCalendario();
});

$('mesSeguinte').addEventListener('click', () => {
    calMes++;
    if (calMes > 11) { calMes = 0; calAno++; }
    renderCalendario();
});

/* ═══════════════════════════════════════
   RENDER LISTA DE ENTRADAS
═══════════════════════════════════════ */

function filtrarEntradas() {
    const busca = ($('campoBusca').value || '').toLowerCase().trim();
    let lista = [...entradas].sort((a, b) => b.data_entrada.localeCompare(a.data_entrada));

    if (dataSelecionada) lista = lista.filter(e => e.data_entrada === dataSelecionada);
    if (busca)           lista = lista.filter(e => e.texto.toLowerCase().includes(busca));

    return lista;
}

function renderEntradas() {
    const container = $('listaEntradas');
    const lista     = filtrarEntradas();

    if (lista.length === 0) {
        const msg = dataSelecionada
            ? 'Nenhuma entrada nesta data.'
            : 'Nenhuma entrada ainda. Comece escrevendo hoje!';
        container.innerHTML = `
            <p class="vazio">
                <i class="fa-solid fa-book-open"></i>
                <span>${msg}</span>
            </p>`;
        return;
    }

    container.innerHTML = lista.map(e => {
        const h = HUMOR_META[e.humor] || { emoji: '📝', label: '', classe: '' };
        return `
        <div class="entrada-card" data-id="${e.id}">
            <div class="entrada-emoji">${h.emoji}</div>
            <div class="entrada-info">
                <div class="entrada-data">${formataDataBR(e.data_entrada)}</div>
                ${h.label ? `<span class="entrada-humor-badge ${h.classe}">${h.label}</span>` : ''}
                <p class="entrada-preview">${escapeHtml(e.texto)}</p>
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.entrada-card').forEach(card => {
        card.addEventListener('click', () => abrirVisualizacao(card.dataset.id));
    });
}

/* ═══════════════════════════════════════
   MODAIS
═══════════════════════════════════════ */

function abrirModal(id) {
    $(id).classList.add('aberto');
    document.body.style.overflow = 'hidden';
}

function fecharModal(id) {
    $(id).classList.remove('aberto');
    document.body.style.overflow = '';
    pararGravacao();
}

document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) fecharModal(m.id); });
});

$('abrirModalEntrada').addEventListener('click', () => {
    idEditando = null;
    $('modalTitulo').textContent = 'Nova Entrada';
    $('formEntrada').reset();
    $('entradaData').value = hoje();
    $('entradaId').value   = '';
    abrirModal('modalEntrada');
});

['fecharModal','cancelarModal'].forEach(id => {
    $(id).addEventListener('click', () => fecharModal('modalEntrada'));
});

$('fecharViz').addEventListener('click', () => fecharModal('modalVisualizar'));

$('formEntrada').addEventListener('submit', async e => {
    e.preventDefault();

    const texto        = $('entradaTexto').value.trim();
    const data_entrada = $('entradaData').value;
    const humor        = document.querySelector('input[name="humor"]:checked')?.value || '';
    const id           = $('entradaId').value;

    if (!texto || !data_entrada) return;

    const fd = new FormData();
    fd.append('acao',         id ? 'editar' : 'adicionar');
    fd.append('data_entrada', data_entrada);
    fd.append('texto',        texto);
    fd.append('humor',        humor);
    if (id) fd.append('id', id);

    const btnSalvar = $('formEntrada').querySelector('.salvar');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando…';

    try {
        const dados = await apiFetch(fd);

        if (dados.status !== 'sucesso') {
            showToast('<i class="fa-solid fa-circle-xmark"></i> ' + (dados.mensagem || 'Erro ao salvar.'), 'erro');
            return;
        }

        showToast(id ? '<i class="fa-solid fa-pen-to-square"></i> Entrada atualizada!' : '<i class="fa-solid fa-floppy-disk"></i> Entrada salva!');
        fecharModal('modalEntrada');
        await carregarEntradas();

    } catch (err) {
        console.error('[Diário]', err);
        showToast('<i class="fa-solid fa-circle-xmark"></i> Falha na comunicação com o servidor.', 'erro');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Entrada';
    }
});

function abrirVisualizacao(id) {
    const e = entradas.find(en => String(en.id) === String(id));
    if (!e) return;

    const h = HUMOR_META[e.humor] || { emoji: '📝', label: '', classe: '' };

    $('vizData').textContent       = formataDataBR(e.data_entrada);
    $('vizHumorEmoji').textContent = h.emoji;
    $('vizHumor').textContent      = h.label;
    $('vizHumor').className        = `viz-humor-badge ${h.classe}`;
    $('vizTexto').textContent      = e.texto;

    $('vizEditar').onclick  = () => { fecharModal('modalVisualizar'); abrirEdicao(id); };
    $('vizExcluir').onclick = () => excluirEntrada(id);

    abrirModal('modalVisualizar');
}

function abrirEdicao(id) {
    const e = entradas.find(en => String(en.id) === String(id));
    if (!e) return;

    idEditando = id;
    $('modalTitulo').textContent = 'Editar Entrada';
    $('entradaId').value         = id;
    $('entradaData').value       = e.data_entrada;
    $('entradaTexto').value      = e.texto;

    document.querySelectorAll('input[name="humor"]').forEach(r => {
        r.checked = r.value === e.humor;
    });

    abrirModal('modalEntrada');
}

function excluirEntrada(id) {
    confirmarExclusao({
        titulo:      'Excluir entrada?',
        mensagem:    'Esta ação é permanente e não poderá ser desfeita.',
        onConfirmar: async () => {
            const fd = new FormData();
            fd.append('acao', 'excluir');
            fd.append('id',   id);

            try {
                const dados = await apiFetch(fd);

                if (dados.status !== 'sucesso') {
                    showToast('<i class="fa-solid fa-circle-xmark"></i> ' + (dados.mensagem || 'Erro ao excluir.'), 'erro');
                    return;
                }

                fecharModal('modalVisualizar');
                showToast('<i class="fa-solid fa-trash"></i> Entrada removida.');
                await carregarEntradas();

            } catch (err) {
                console.error('[Diário]', err);
                showToast('<i class="fa-solid fa-circle-xmark"></i> Falha na comunicação com o servidor.', 'erro');
            }
        }
    });
}

$('campoBusca').addEventListener('input', renderEntradas);

/* ═══════════════════════════════════════
   GRAVAÇÃO DE VOZ
═══════════════════════════════════════ */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

$('btnVoz').addEventListener('click', () => {
    gravando ? pararGravacao() : iniciarGravacao();
});

$('pararVoz').addEventListener('click', pararGravacao);

function iniciarGravacao() {
    if (!SpeechRecognition) {
        alert('Seu navegador não suporta reconhecimento de voz.\nUse Chrome ou Edge.');
        return;
    }

    reconhecedor = new SpeechRecognition();
    reconhecedor.lang            = 'pt-BR';
    reconhecedor.continuous      = true;
    reconhecedor.interimResults  = true;

    let textoBase    = $('entradaTexto').value;
    let interimAtual = '';

    reconhecedor.onresult = event => {
        interimAtual = '';
        let finalNovo = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalNovo  += t + ' ';
            else                          interimAtual += t;
        }

        if (finalNovo) textoBase += finalNovo;
        $('entradaTexto').value = textoBase + interimAtual;
    };

    reconhecedor.onerror = ev => {
        const msgs = {
            'not-allowed':  'Permissão de microfone negada.',
            'no-speech':    'Nenhuma fala detectada.',
            'audio-capture':'Microfone não encontrado.',
            'network':      'Erro de rede no reconhecimento de voz.',
        };
        pararGravacao();
        alert(msgs[ev.error] || `Erro: ${ev.error}`);
    };

    reconhecedor.onend = () => {
        if (gravando) {
            try { reconhecedor.start(); } catch(_) { pararGravacao(); }
        }
    };

    reconhecedor.start();
    gravando = true;

    $('btnVoz').classList.add('gravando');
    $('btnVoz').innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    $('statusVoz').classList.remove('oculto');
    $('statusVozTexto').textContent = 'Ouvindo… fale agora';
}

function pararGravacao() {
    if (!gravando) return;
    gravando = false;

    if (reconhecedor) {
        try { reconhecedor.stop(); } catch(_) {}
        reconhecedor = null;
    }

    $('btnVoz').classList.remove('gravando');
    $('btnVoz').innerHTML = '<i class="fa-solid fa-microphone"></i>';
    $('statusVoz').classList.add('oculto');
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
carregarEntradas();