// ==========================================
// 1. CONFIGURAÇÕES VISUAIS DA GRELHA E ESTADOS
// ==========================================
let CELL_SIZE = 20;
let GAP = 3;
let BLOCK_MARGIN = 22;
let Y_OFFSET_START = 8;

let BLOCK_WIDTH;
let ADVANCE_X;
let BLOCK_ROW_GAP = 20;

function updateGridSizes() {
  const w = window.innerWidth;

  if (w < 480) {
    CELL_SIZE = 15;
    GAP = 2;
    BLOCK_MARGIN = 10;
    Y_OFFSET_START = 6;
  } else if (w < 700) {
    CELL_SIZE = 17;
    GAP = 2;
    BLOCK_MARGIN = 14;
    Y_OFFSET_START = 7;
  } else {
    CELL_SIZE = 20;
    GAP = 3;
    BLOCK_MARGIN = 22;
    Y_OFFSET_START = 8;
  }

  BLOCK_WIDTH = (5 * CELL_SIZE) + (4 * GAP);
  ADVANCE_X = BLOCK_WIDTH + BLOCK_MARGIN;

  // Espaçamento vertical entre linhas de blocos (mais apertado em mobile)
  if (w < 480) {
    BLOCK_ROW_GAP = 14;
  } else if (w < 700) {
    BLOCK_ROW_GAP = 16;
  } else {
    BLOCK_ROW_GAP = 20;
  }
}

updateGridSizes();

const btnTabText = document.getElementById('btnTabText');
const btnTabDraw = document.getElementById('btnTabDraw');
const tabText = document.getElementById('tabText');
const tabDraw = document.getElementById('tabDraw');
const btnTabGame = document.getElementById('btnTabGame');
const tabGame = document.getElementById('tabGame');

let palavraAtualJogo = "";
let blocosJogo = [];

const canvasGame = document.getElementById('canvasGame');
const ctxGame = canvasGame.getContext('2d');
const inputGame = document.getElementById('gameInput');
const feedbackGame = document.getElementById('feedbackGame');
const btnNovaPalavra = document.getElementById('btnNovaPalavra');
const btnMostrarResposta = document.getElementById('btnMostrarResposta');

btnTabText.addEventListener('click', () => {
    btnTabText.classList.add('active'); btnTabDraw.classList.remove('active'); btnTabGame.classList.remove('active');
    tabText.classList.add('active'); tabDraw.classList.remove('active'); tabGame.classList.remove('active');
});

btnTabDraw.addEventListener('click', () => {
    btnTabDraw.classList.add('active'); btnTabText.classList.remove('active'); btnTabGame.classList.remove('active');
    tabDraw.classList.add('active'); tabText.classList.remove('active'); tabGame.classList.remove('active');
    renderizarModoManual();
});

btnTabGame.addEventListener('click', () => {
    btnTabGame.classList.add('active'); btnTabText.classList.remove('active'); btnTabDraw.classList.remove('active');
    tabGame.classList.add('active'); tabText.classList.remove('active'); tabDraw.classList.remove('active');
    requestAnimationFrame(() => {
      if (!palavraAtualJogo) iniciarNovaRodadaJogo(); else renderizarJogo();
    });
});

function desenharFormaCelula(ctx, x, y, estado) {
    if (estado === 0) return;
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2;
    
    if (estado === 1 || estado === 4) { 
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE); 
    } else if (estado === 2 || estado === 3) { 
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE); 
    }
    
    if (estado === 3) {
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (estado === 4) {
        // Estado 4: célula preenchida + círculo vazio (stroke) ao centro
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
    }
}

function desenharEstruturaCentro(ctx, xOffset, baseY = Y_OFFSET_START) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
    ctx.lineWidth = 1;
    const startX = xOffset + 1 * (CELL_SIZE + GAP) - (GAP / 2);
    const startY = baseY + 1 * (CELL_SIZE + GAP) - (GAP / 2);
    const size = (3 * CELL_SIZE) + (3 * GAP);
    ctx.strokeRect(startX, startY, size, size);
}

function renderizarBlocosEmCanvas(canvas, ctx, blocos) {
    const parent = canvas.parentElement;
    const available = Math.max(280, parent.clientWidth - 24);
    const blocksPerRow = Math.max(1, Math.floor(available / ADVANCE_X));
    const numRows = Math.ceil(Math.max(1, blocos.length) / blocksPerRow);
    const canvasW = Math.min(available, blocksPerRow * ADVANCE_X + 16);
    if (canvas.width !== canvasW) canvas.width = canvasW;
    const blockContentH = 5 * CELL_SIZE + 4 * GAP;
    const rowH = blockContentH + BLOCK_ROW_GAP;
    const neededH = Y_OFFSET_START + numRows * rowH + 4;
    if (canvas.height !== neededH) canvas.height = neededH;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blocos.forEach((bloco, i) => {
        const row = Math.floor(i / blocksPerRow);
        const col = i % blocksPerRow;
        const xOffset = 10 + col * ADVANCE_X;
        const baseY = Y_OFFSET_START + row * rowH;
        desenharEstruturaCentro(ctx, xOffset, baseY);
        for (let l = 0; l < 5; l++) {
            for (let c = 0; c < 5; c++) {
                const estado = bloco.grid[l][c];
                const xPos = xOffset + (c * (CELL_SIZE + GAP));
                const yPos = baseY + (l * (CELL_SIZE + GAP));
                desenharFormaCelula(ctx, xPos, yPos, estado);
            }
        }
    });
}

// ==========================================
// 2. DICIONÁRIOS REVERSOS (TRADUÇÃO)
// ==========================================
const reverseVogais = ['A', 'E', 'I', 'O', 'U'];
const reverseConsoantes = {
    '1,1': 'T', '1,2': 'N', '1,3': 'M',
    '2,1': 'R', '2,2': 'L', '2,3': 'J',
    '3,1': 'K', '3,2': 'F', '3,3': 'P'
};

// ==========================================
// 3. MODO 1: TEXTO PARA VISUAL
// ==========================================
const canvasText = document.getElementById('canvasText');
const ctxText = canvasText.getContext('2d');
const input = document.getElementById('textInput');
const toggleInputTexto = document.getElementById('toggleInputTexto');

const mapVogais = { 'A': 0, 'E': 1, 'I': 2, 'O': 3, 'U': 4 };
const mapConsoantes = {
    'T': [1, 1], 'D': [1, 1], 'N': [1, 2], 'M': [1, 3], 'R': [2, 1],
    'L': [2, 2], 'J': [2, 3], 'C': [3, 1], 'X': [2, 3], 'K': [3, 1], 'Q': [3, 1], 'G': [3, 1],
    'F': [3, 2], 'V': [3, 2], 'P': [3, 3], 'B': [3, 3], 'Ç': null, 'S': null, 'Z': null
};

function criarMatrizVazia() { return Array(5).fill(0).map(() => Array(5).fill(0)); }

function preProcessarTexto(texto) {
    let resultado = texto
        .replace(/[çÇ]/g, 'S')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    resultado = resultado.replaceAll('CH', 'X');
    resultado = resultado.replaceAll('LH', 'L');
    resultado = resultado.replaceAll('NH', 'N');
    resultado = resultado.replaceAll('RR', 'R');

    resultado = resultado.replaceAll('Y', 'I');
    resultado = resultado.replaceAll('U', 'O');

    resultado = resultado.replaceAll('CE', 'SE');
    resultado = resultado.replaceAll('CI', 'SI');
    resultado = resultado.replaceAll('GE', 'JE');
    resultado = resultado.replaceAll('GI', 'JI');

    return resultado;
}

function processarTexto(textoOriginal) {
    const texto = preProcessarTexto(textoOriginal);
    const blocos = [];
    let blocoAtual = { grid: criarMatrizVazia(), hasCenter: false, hasRight: false, cLeft: 0, cCenter: 0, cRight: 0 };

    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];
        if (char === ' ') { 
            // Só cria um novo bloco se o atual tiver conteúdo.
            // Espaços isolados ou múltiplos não geram blocos vazios.
            if (blocoAtual.hasCenter || blocoAtual.cLeft > 0 || blocoAtual.cRight > 0) {
                blocos.push(blocoAtual);
            }
            blocoAtual = { grid: criarMatrizVazia(), hasCenter: false, hasRight: false, cLeft: 0, cCenter: 0, cRight: 0 };
            continue; 
        }
        
        if (mapVogais[char] !== undefined) {
            let linha = mapVogais[char];
            if (!blocoAtual.hasCenter) {
                blocoAtual.cLeft++; blocoAtual.grid[linha][0] = Math.min(blocoAtual.cLeft, 4);
            } else {
                blocoAtual.hasRight = true; blocoAtual.cRight++; blocoAtual.grid[linha][4] = Math.min(blocoAtual.cRight, 4);
            }
        } else if (mapConsoantes[char] !== undefined || char === 'S' || char === 'Z') {
            if (blocoAtual.hasRight) { 
                blocos.push(blocoAtual); 
                blocoAtual = { grid: criarMatrizVazia(), hasCenter: false, hasRight: false, cLeft: 0, cCenter: 0, cRight: 0 }; 
            }
            blocoAtual.hasCenter = true; blocoAtual.cCenter++;
            const coords = mapConsoantes[char];
            if (coords) blocoAtual.grid[coords[0]][coords[1]] = Math.min(blocoAtual.cCenter, 4);
        }
    }
    // Só adiciona o último bloco se ele tiver conteúdo real
    if (blocoAtual.hasCenter || blocoAtual.cLeft > 0 || blocoAtual.cRight > 0) {
        blocos.push(blocoAtual);
    }
    return blocos;
}

function renderizarModoTexto(blocos) {
    renderizarBlocosEmCanvas(canvasText, ctxText, blocos);
}

input.addEventListener('input', (e) => renderizarModoTexto(processarTexto(e.target.value)));
renderizarModoTexto(processarTexto("")); 

// Toggle para esconder/mostrar o input de texto no Modo Texto
if (toggleInputTexto) {
    toggleInputTexto.addEventListener('change', () => {
        input.style.display = toggleInputTexto.checked ? '' : 'none';
    });

    // Estado inicial (caso o toggle venha desmarcado)
    if (!toggleInputTexto.checked) {
        input.style.display = 'none';
    }
}


// ==========================================
// 4. MODO 2: DESENHO MANUAL E TRADUÇÃO
// ==========================================
const canvasDraw = document.getElementById('canvasDraw');
const ctxDraw = canvasDraw.getContext('2d');
const btnAddNewBlock = document.getElementById('btnAddNewBlock');
const toggleTraducao = document.getElementById('toggleTraducao');

let blocosManuais = [ criarMatrizVazia() ];

function descodificarBloco(grid) {
    let left = [], center = [], right = [];
    let isCompletelyEmpty = true;
    let hasConsoanteCentro = false;

    for (let l = 0; l < 5; l++) {
        for (let c = 0; c < 5; c++) {
            let estado = grid[l][c];
            if (estado > 0) {
                isCompletelyEmpty = false;
                if (c === 0) left.push({ char: reverseVogais[l], state: estado });
                else if (c === 4) right.push({ char: reverseVogais[l], state: estado });
                else if (l >= 1 && l <= 3 && c >= 1 && c <= 3) {
                    center.push({ char: reverseConsoantes[`${l},${c}`], state: estado });
                    hasConsoanteCentro = true;
                }
            }
        }
    }

    if (isCompletelyEmpty) return "";

    left.sort((a, b) => a.state - b.state);
    center.sort((a, b) => a.state - b.state);
    right.sort((a, b) => a.state - b.state);

    let txtLeft = left.map(x => x.char).join('');
    let txtRight = right.map(x => x.char).join('');
    let txtCenter = hasConsoanteCentro ? center.map(x => x.char).join('') : "S";

    return txtLeft + txtCenter + txtRight;
}

function renderizarModoManual() {
    const parent = canvasDraw.parentElement;
    const available = Math.max(280, parent.clientWidth - 24);

    const blocksPerRow = Math.max(1, Math.floor(available / ADVANCE_X));
    const numRows = Math.ceil(Math.max(1, blocosManuais.length) / blocksPerRow);

    const canvasW = Math.min(available, blocksPerRow * ADVANCE_X + 16);
    if (canvasDraw.width !== canvasW) canvasDraw.width = canvasW;

    const mostrarTraducao = toggleTraducao.checked;
    const blockContentH = 5 * CELL_SIZE + 4 * GAP;
    const extraForLabel = mostrarTraducao ? 18 : 0;
    const rowH = blockContentH + BLOCK_ROW_GAP + extraForLabel;

    const neededH = Y_OFFSET_START + numRows * rowH + 6;
    if (canvasDraw.height !== neededH) canvasDraw.height = neededH;

    ctxDraw.clearRect(0, 0, canvasDraw.width, canvasDraw.height);

    blocosManuais.forEach((grid, i) => {
        const row = Math.floor(i / blocksPerRow);
        const col = i % blocksPerRow;

        const xOffset = 10 + col * ADVANCE_X;
        const baseY = Y_OFFSET_START + row * (blockContentH + BLOCK_ROW_GAP);

        desenharEstruturaCentro(ctxDraw, xOffset, baseY);

        for (let l = 0; l < 5; l++) {
            for (let c = 0; c < 5; c++) {
                const xPos = xOffset + (c * (CELL_SIZE + GAP));
                const yPos = baseY + (l * (CELL_SIZE + GAP));
                
                ctxDraw.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctxDraw.lineWidth = 1;
                ctxDraw.strokeRect(xPos, yPos, CELL_SIZE, CELL_SIZE);

                const estado = grid[l][c];
                desenharFormaCelula(ctxDraw, xPos, yPos, estado);
            }
        }

        if (mostrarTraducao) {
            const texto = descodificarBloco(grid);
            ctxDraw.fillStyle = '#888';
            const labelSize = Math.max(11, Math.min(15, Math.floor(CELL_SIZE * 0.8)));
            ctxDraw.font = `${labelSize}px monospace`;
            ctxDraw.textAlign = 'center';
            const gridBottom = baseY + blockContentH;
            ctxDraw.fillText(texto, xOffset + (BLOCK_WIDTH / 2), gridBottom + 14);
        }
    });
}

toggleTraducao.addEventListener('change', renderizarModoManual);

btnAddNewBlock.addEventListener('click', () => {
    blocosManuais.push(criarMatrizVazia());
    renderizarModoManual();
    setTimeout(() => {
        // Em layout vertical, rolar para o fundo quando adicionamos bloco novo
        const container = btnAddNewBlock.parentElement;
        if (container.scrollHeight > container.clientHeight) {
            container.scrollTop = container.scrollHeight;
        }
    }, 50);
});

canvasDraw.addEventListener('mousedown', lidarComCliqueGrid);
canvasDraw.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    lidarComCliqueGrid({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });

function lidarComCliqueGrid(e) {
    const rect = canvasDraw.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const parent = canvasDraw.parentElement;
    const available = Math.max(280, parent.clientWidth - 24);
    const blocksPerRow = Math.max(1, Math.floor(available / ADVANCE_X));

    const blockContentH = 5 * CELL_SIZE + 4 * GAP;
    const rowH = blockContentH + BLOCK_ROW_GAP;

    for (let b = 0; b < blocosManuais.length; b++) {
        const row = Math.floor(b / blocksPerRow);
        const col = b % blocksPerRow;

        const blocoStartX = 10 + col * ADVANCE_X;
        const blocoStartY = Y_OFFSET_START + row * rowH;

        const blocoEndX = blocoStartX + BLOCK_WIDTH;
        const blocoEndY = blocoStartY + blockContentH;

        if (clickX >= blocoStartX && clickX <= blocoEndX &&
            clickY >= blocoStartY && clickY <= blocoEndY) {

            const localX = clickX - blocoStartX;
            const localY = clickY - blocoStartY;

            const coluna = Math.floor(localX / (CELL_SIZE + GAP));
            const linha = Math.floor(localY / (CELL_SIZE + GAP));

            if (coluna < 5 && linha < 5) {
                let estadoAtual = blocosManuais[b][linha][coluna];

                if (estadoAtual > 0) {
                    // Célula já ativa: Itera normalmente para permitir edição ou apagar (0)
                    blocosManuais[b][linha][coluna] = (estadoAtual + 1) % 5;
                } else {
                    // Célula nova: Determina a secção e calcula o estado sequencial
                    let seccao = null;
                    if (coluna === 0) seccao = "esquerda";
                    else if (coluna === 4) seccao = "direita";
                    else if (coluna >= 1 && coluna <= 3 && linha >= 1 && linha <= 3) seccao = "centro";

                    if (seccao !== null) {
                        let celulasAtivasNaSeccao = 0;

                        // Conta quantas células já estão ativas nesta secção específica
                        if (seccao === "esquerda") {
                            for (let l = 0; l < 5; l++) if (blocosManuais[b][l][0] > 0) celulasAtivasNaSeccao++;
                        } else if (seccao === "direita") {
                            for (let l = 0; l < 5; l++) if (blocosManuais[b][l][4] > 0) celulasAtivasNaSeccao++;
                        } else if (seccao === "centro") {
                            for (let l = 1; l <= 3; l++) {
                                for (let c = 1; c <= 3; c++) {
                                    if (blocosManuais[b][l][c] > 0) celulasAtivasNaSeccao++;
                                }
                            }
                        }

                        // Define o estado (1-4). Se já houver 4 ativas, a 5ª recebe estado 4 por defeito.
                        blocosManuais[b][linha][coluna] = Math.min(celulasAtivasNaSeccao + 1, 4);
                    }
                }

                renderizarModoManual();
                return;
            }
        }
    }
}

function iniciarNovaRodadaJogo() {
    const idx = Math.floor(Math.random() * PALAVRAS_JOGO.length);
    palavraAtualJogo = PALAVRAS_JOGO[idx].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    blocosJogo = processarTexto(palavraAtualJogo);
    inputGame.value = "";
    feedbackGame.innerHTML = "";
    feedbackGame.style.color = "";
    renderizarJogo();
    inputGame.focus();
}

function renderizarJogo() {
    renderizarBlocosEmCanvas(canvasGame, ctxGame, blocosJogo);
}

function verificarResposta() {
    const tentativa = inputGame.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    if (!palavraAtualJogo) return;
    if (tentativa === palavraAtualJogo) {
        feedbackGame.innerHTML = "\u2713 Certo!";
        feedbackGame.style.color = "#4ade80";
    } else if (tentativa.length > 0) {
        feedbackGame.innerHTML = "\u2717 Tenta outra vez";
        feedbackGame.style.color = "#f87171";
    } else {
        feedbackGame.innerHTML = "";
    }
}

inputGame.addEventListener('input', verificarResposta);
btnNovaPalavra.addEventListener('click', () => {
    iniciarNovaRodadaJogo();
});

if (btnMostrarResposta) {
    btnMostrarResposta.addEventListener('click', () => {
        if (palavraAtualJogo) {
            inputGame.value = palavraAtualJogo;
            verificarResposta();
        }
    });
}

window.addEventListener('resize', () => {
  updateGridSizes();
  renderizarModoTexto(processarTexto(input.value));
  renderizarModoManual();
  if (tabGame && tabGame.classList.contains('active')) renderizarJogo();
});
