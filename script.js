// ==========================================
// 1. CONFIGURAÇÕES VISUAIS DA GRELHA
// ==========================================
const CELL_SIZE = 25;   
const GAP = 4;          
const BLOCK_MARGIN = 40;
const ROW_MARGIN = 40;  // Novo: Margem vertical entre as linhas de blocos

// Elementos do DOM
const canvas = document.getElementById('canvasGrid');
const ctx = canvas.getContext('2d');
const input = document.getElementById('textInput');
const gridToggle = document.getElementById('gridToggle');

let showGrid = false;

// ==========================================
// 2. DICIONÁRIOS (O MAPEAMENTO)
// ==========================================
const mapVogais = { 'A': 0, 'E': 1, 'I': 2, 'O': 3, 'U': 4 };

const mapConsoantes = {
    'T': [1, 1], 'D': [1, 1], 
    'N': [1, 2],              
    'M': [1, 3],
    'G': [3, 1],              
    'R': [2, 1],              
    'L': [2, 2],              
    'J': [2, 3], 'C': [3, 1], 
    'K': [3, 1], 'Q': [3, 1], 
    'F': [3, 2], 'V': [3, 2], 
    'P': [3, 3], 'B': [3, 3], 
    'S': null, 'Z': null, 'X': null,      
};

// ==========================================
// 3. O PARSER (MÁQUINA DE ESTADOS)
// ==========================================
function limparTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function processarTexto(textoOriginal) {
    const texto = limparTexto(textoOriginal);
    const blocos = [];
    
    function criarNovoBloco() {
        return {
            grid: Array(5).fill(0).map(() => Array(5).fill(0)), 
            hasContent: false, 
            hasCenter: false,
            hasRight: false,
            countLeft: 0,
            countCenter: 0,
            countRight: 0
        };
    }

    let blocoAtual = criarNovoBloco();
    let aguardarNovaPalavra = false; 

    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];

        if (char === ' ') {
            aguardarNovaPalavra = true;
            continue;
        }

        const isVogal = mapVogais[char] !== undefined;
        // Atualizado para incluir explicitamente o X na validação
        const isConsoante = mapConsoantes[char] !== undefined || char === 'S' || char === 'Z' || char === 'X';

        if (isVogal || isConsoante) {
            if (aguardarNovaPalavra && blocoAtual.hasContent) {
                blocos.push(blocoAtual);
                blocoAtual = criarNovoBloco();
            }
            
            aguardarNovaPalavra = false;  
            blocoAtual.hasContent = true; 
        }

        if (isVogal) {
            let linha = mapVogais[char];
            
            if (!blocoAtual.hasCenter) {
                blocoAtual.countLeft++;
                let estado = Math.min(blocoAtual.countLeft, 3); 
                blocoAtual.grid[linha][0] = estado;
            } else {
                blocoAtual.hasRight = true;
                blocoAtual.countRight++;
                let estado = Math.min(blocoAtual.countRight, 3);
                blocoAtual.grid[linha][4] = estado;
            }
        } 
        else if (isConsoante) {
            if (blocoAtual.hasRight) {
                blocos.push(blocoAtual);
                blocoAtual = criarNovoBloco();
                blocoAtual.hasContent = true; 
            }

            blocoAtual.hasCenter = true;
            blocoAtual.countCenter++;
            let estado = Math.min(blocoAtual.countCenter, 3);
            
            const coords = mapConsoantes[char];
            if (coords !== null && coords !== undefined) {
                let linha = coords[0];
                let coluna = coords[1];
                blocoAtual.grid[linha][coluna] = estado;
            }
        }
    }
    
    blocos.push(blocoAtual);
    return blocos;
}

// ==========================================
// 4. RESPONSIVIDADE DO CANVAS (NOVO)
// ==========================================
function ajustarLarguraCanvas() {
    // Ajusta a largura para o tamanho da janela, com um limite máximo de 800px para computadores
    const margemEcra = window.innerWidth < 600 ? 20 : 40;
    canvas.width = Math.min(window.innerWidth - margemEcra, 800);
}

// ==========================================
// 5. MOTOR DE RENDERIZAÇÃO
// ==========================================
function desenharBlocos(blocos) {
    const startX = 20; 
    const startY = 20; 
    const blockSize = 5 * CELL_SIZE + 4 * GAP;

    // PARTE 1: Calcular a altura necessária do Canvas antes de desenhar
    let tempX = startX;
    let tempY = startY;
    
    blocos.forEach(bloco => {
        // Se o próximo bloco ultrapassar a largura do canvas, fazemos quebra de linha visual
        if (tempX + blockSize > canvas.width && tempX !== startX) {
            tempX = startX;
            tempY += blockSize + ROW_MARGIN;
        }
        tempX += blockSize + BLOCK_MARGIN;
    });

    // Ajustar a altura real do elemento HTML canvas para caber tudo
    canvas.height = tempY + blockSize + startY;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // PARTE 2: Desenhar efetivamente os blocos nas posições calculadas
    let xOffset = startX;
    let yOffset = startY;

    blocos.forEach(bloco => {
        
        // Aplica a quebra de linha real
        if (xOffset + blockSize > canvas.width && xOffset !== startX) {
            xOffset = startX;
            yOffset += blockSize + ROW_MARGIN;
        }

        // --- PASSO A: GRELHA DE SUPORTE ---
        if (showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.lineWidth = 1;
            ctx.strokeRect(xOffset - 4, yOffset - 4, blockSize + 8, blockSize + 8);

            const innerStartX = xOffset + (CELL_SIZE + GAP);
            const innerStartY = yOffset + (CELL_SIZE + GAP);
            const innerSize = (3 * CELL_SIZE) + (2 * GAP); 
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; 
            ctx.setLineDash([4, 4]); 
            ctx.strokeRect(innerStartX - 2, innerStartY - 2, innerSize + 4, innerSize + 4);
            ctx.setLineDash([]); 

            for (let linha = 0; linha < 5; linha++) {
                for (let coluna = 0; coluna < 5; coluna++) {
                    const xPos = xOffset + (coluna * (CELL_SIZE + GAP));
                    const yPos = yOffset + (linha * (CELL_SIZE + GAP));
                    
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.strokeRect(xPos, yPos, CELL_SIZE, CELL_SIZE);
                }
            }
        }

        // --- PASSO B: LETRAS ATIVAS ---
        for (let linha = 0; linha < 5; linha++) {
            for (let coluna = 0; coluna < 5; coluna++) {
                
                const estado = bloco.grid[linha][coluna];
                if (estado === 0) continue; 

                const xPos = xOffset + (coluna * (CELL_SIZE + GAP));
                const yPos = yOffset + (linha * (CELL_SIZE + GAP));

                ctx.strokeStyle = '#ffffff';
                ctx.fillStyle = '#ffffff';
                ctx.lineWidth = 2;

                if (estado === 1) {
                    ctx.fillRect(xPos, yPos, CELL_SIZE, CELL_SIZE);
                } 
                else if (estado === 2) {
                    ctx.strokeRect(xPos, yPos, CELL_SIZE, CELL_SIZE);
                } 
                else if (estado === 3) {
                    ctx.strokeRect(xPos, yPos, CELL_SIZE, CELL_SIZE);
                    
                    const centerX = xPos + (CELL_SIZE / 2);
                    const centerY = yPos + (CELL_SIZE / 2);
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2); 
                    ctx.fill();
                }
            }
        }
        
        // Avançar para o lado
        xOffset += blockSize + BLOCK_MARGIN;
    });
}

// ==========================================
// 6. EVENT LISTENERS
// ==========================================

// Função auxiliar para redesenhar tudo
function atualizarEcra() {
    const blocosProcessados = processarTexto(input.value);
    desenharBlocos(blocosProcessados);
}

// Quando redimensionamos a janela do PC ou rodamos o telemóvel
window.addEventListener('resize', () => {
    ajustarLarguraCanvas();
    atualizarEcra();
});

input.addEventListener('input', atualizarEcra);

gridToggle.addEventListener('change', (e) => {
    showGrid = e.target.checked;
    atualizarEcra();
});

// Arranque inicial
ajustarLarguraCanvas();
atualizarEcra();