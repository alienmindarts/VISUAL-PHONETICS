// ==========================================
// 1. CONFIGURAÇÕES VISUAIS DA GRELHA E ESTADOS
// ==========================================
const CELL_SIZE = 25;
const GAP = 4;
const BLOCK_MARGIN = 40;
const BLOCK_WIDTH = (5 * CELL_SIZE) + (4 * GAP); 
const ADVANCE_X = BLOCK_WIDTH + BLOCK_MARGIN;
const Y_OFFSET_START = 10;

const btnTabText = document.getElementById('btnTabText');
const btnTabDraw = document.getElementById('btnTabDraw');
const tabText = document.getElementById('tabText');
const tabDraw = document.getElementById('tabDraw');

btnTabText.addEventListener('click', () => {
    btnTabText.classList.add('active'); btnTabDraw.classList.remove('active');
    tabText.classList.add('active'); tabDraw.classList.remove('active');
});

btnTabDraw.addEventListener('click', () => {
    btnTabDraw.classList.add('active'); btnTabText.classList.remove('active');
    tabDraw.classList.add('active'); tabText.classList.remove('active');
    renderizarModoManual();
});

function desenharFormaCelula(ctx, x, y, estado) {
    if (estado === 0) return;
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2;
    
    if (estado === 1) { 
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE); 
    } else if (estado === 2 || estado === 3) { 
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE); 
    }
    
    if (estado === 3) {
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function desenharEstruturaCentro(ctx, xOffset) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
    ctx.lineWidth = 1;
    const startX = xOffset + 1 * (CELL_SIZE + GAP) - (GAP / 2);
    const startY = Y_OFFSET_START + 1 * (CELL_SIZE + GAP) - (GAP / 2);
    const size = (3 * CELL_SIZE) + (3 * GAP);
    ctx.strokeRect(startX, startY, size, size);
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

const mapVogais = { 'A': 0, 'E': 1, 'I': 2, 'O': 3, 'U': 4 };
const mapConsoantes = {
    'T': [1, 1], 'D': [1, 1], 'N': [1, 2], 'M': [1, 3], 'R': [2, 1],
    'L': [2, 2], 'J': [2, 3], 'C': [2, 3], 'K': [3, 1], 'Q': [3, 1],
    'F': [3, 2], 'V': [3, 2], 'P': [3, 3], 'B': [3, 3], 'S': null, 'Z': null
};

function criarMatrizVazia() { return Array(5).fill(0).map(() => Array(5).fill(0)); }

function processarTexto(textoOriginal) {
    const texto = textoOriginal.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const blocos = [];
    let blocoAtual = { grid: criarMatrizVazia(), hasCenter: false, hasRight: false, cLeft: 0, cCenter: 0, cRight: 0 };

    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];
        if (char === ' ') { 
            blocos.push(blocoAtual); 
            blocoAtual = { grid: criarMatrizVazia(), hasCenter: false, hasRight: false, cLeft: 0, cCenter: 0, cRight: 0 }; 
            continue; 
        }
        
        if (mapVogais[char] !== undefined) {
            let linha = mapVogais[char];
            if (!blocoAtual.hasCenter) {
                blocoAtual.cLeft++; blocoAtual.grid[linha][0] = Math.min(blocoAtual.cLeft, 3);
            } else {
                blocoAtual.hasRight = true; blocoAtual.cRight++; blocoAtual.grid[linha][4] = Math.min(blocoAtual.cRight, 3);
            }
        } else if (mapConsoantes[char] !== undefined || char === 'S' || char === 'Z') {
            if (blocoAtual.hasRight) { 
                blocos.push(blocoAtual); 
                blocoAtual = { grid: criarMatrizVazia(), hasCenter: false, hasRight: false, cLeft: 0, cCenter: 0, cRight: 0 }; 
            }
            blocoAtual.hasCenter = true; blocoAtual.cCenter++;
            const coords = mapConsoantes[char];
            if (coords) blocoAtual.grid[coords[0]][coords[1]] = Math.min(blocoAtual.cCenter, 3);
        }
    }
    blocos.push(blocoAtual);
    return blocos;
}

function renderizarModoTexto(blocos) {
    const larguraNecessaria = Math.max(800, (blocos.length * ADVANCE_X) + 40);
    if (canvasText.width !== larguraNecessaria) canvasText.width = larguraNecessaria;

    ctxText.clearRect(0, 0, canvasText.width, canvasText.height);
    let xOffset = 10;

    blocos.forEach(bloco => {
        desenharEstruturaCentro(ctxText, xOffset);
        for (let l = 0; l < 5; l++) {
            for (let c = 0; c < 5; c++) {
                const estado = bloco.grid[l][c];
                const xPos = xOffset + (c * (CELL_SIZE + GAP));
                const yPos = Y_OFFSET_START + (l * (CELL_SIZE + GAP));
                desenharFormaCelula(ctxText, xPos, yPos, estado);
            }
        }
        xOffset += ADVANCE_X;
    });
}

input.addEventListener('input', (e) => renderizarModoTexto(processarTexto(e.target.value)));
renderizarModoTexto(processarTexto("")); 


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
    const larguraNecessaria = Math.max(700, (blocosManuais.length * ADVANCE_X));
    if (canvasDraw.width !== larguraNecessaria) canvasDraw.width = larguraNecessaria;

    ctxDraw.clearRect(0, 0, canvasDraw.width, canvasDraw.height);
    let xOffset = 10;
    const mostrarTraducao = toggleTraducao.checked;

    blocosManuais.forEach(grid => {
        desenharEstruturaCentro(ctxDraw, xOffset);

        for (let l = 0; l < 5; l++) {
            for (let c = 0; c < 5; c++) {
                const xPos = xOffset + (c * (CELL_SIZE + GAP));
                const yPos = Y_OFFSET_START + (l * (CELL_SIZE + GAP));
                
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
            ctxDraw.font = '16px monospace';
            ctxDraw.textAlign = 'center';
            ctxDraw.fillText(texto, xOffset + (BLOCK_WIDTH / 2), Y_OFFSET_START + BLOCK_WIDTH + 25);
        }

        xOffset += ADVANCE_X;
    });
}

toggleTraducao.addEventListener('change', renderizarModoManual);

btnAddNewBlock.addEventListener('click', () => {
    blocosManuais.push(criarMatrizVazia());
    renderizarModoManual();
    setTimeout(() => {
        btnAddNewBlock.parentElement.scrollLeft = btnAddNewBlock.parentElement.scrollWidth;
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

    for (let b = 0; b < blocosManuais.length; b++) {
        const blocoStartX = 10 + (b * ADVANCE_X);
        const blocoEndX = blocoStartX + BLOCK_WIDTH;
        const blocoEndY = Y_OFFSET_START + BLOCK_WIDTH;

        if (clickX >= blocoStartX && clickX <= blocoEndX && clickY >= Y_OFFSET_START && clickY <= blocoEndY) {
            const localX = clickX - blocoStartX;
            const localY = clickY - Y_OFFSET_START;
            
            const coluna = Math.floor(localX / (CELL_SIZE + GAP));
            const linha = Math.floor(localY / (CELL_SIZE + GAP));

            if (coluna < 5 && linha < 5) {
                let estadoAtual = blocosManuais[b][linha][coluna];

                if (estadoAtual > 0) {
                    // Célula já ativa: Itera normalmente para permitir edição ou apagar (0)
                    blocosManuais[b][linha][coluna] = (estadoAtual + 1) % 4;
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

                        // Define o estado (1, 2 ou 3). Se já houver 3 ativas, a 4ª recebe estado 3 por defeito.
                        blocosManuais[b][linha][coluna] = Math.min(celulasAtivasNaSeccao + 1, 3);
                    }
                }
                
                renderizarModoManual();
                return;
            }
        }
    }
}