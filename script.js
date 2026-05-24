// ==========================================
// 1. CONFIGURAÇÕES VISUAIS DA GRELHA
// ==========================================
const CELL_SIZE = 25;   
const GAP = 4;          
const BLOCK_MARGIN = 40;

// Elementos do DOM
const canvas = document.getElementById('canvasGrid');
const ctx = canvas.getContext('2d');
const input = document.getElementById('textInput');
const gridToggle = document.getElementById('gridToggle');

// Estado da grelha (ligado/desligado)
let showGrid = false;

// ==========================================
// 2. DICIONÁRIOS (O MAPEAMENTO)
// ==========================================
const mapVogais = { 'A': 0, 'E': 1, 'I': 2, 'O': 3, 'U': 4 };

const mapConsoantes = {
    'T': [1, 1], 'D': [1, 1], 
    'N': [1, 2],              
    'M': [1, 3],              
    'R': [2, 1],              
    'L': [2, 2],              
    'J': [2, 3], 'C': [2, 3], 
    'K': [3, 1], 'Q': [3, 1], 
    'F': [3, 2], 'V': [3, 2], 
    'P': [3, 3], 'B': [3, 3], 
    'S': null, 'Z': null      
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
            hasContent: false, // NOVA FLAG: Verifica se a grelha já tem desenhos
            hasCenter: false,
            hasRight: false,
            countLeft: 0,
            countCenter: 0,
            countRight: 0
        };
    }

    let blocoAtual = criarNovoBloco();
    let aguardarNovaPalavra = false; // NOVA FLAG: Gere a ação do espaço

    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];

        // Se for um espaço, apenas avisamos o sistema para aguardar a próxima letra
        if (char === ' ') {
            aguardarNovaPalavra = true;
            continue;
        }

        const isVogal = mapVogais[char] !== undefined;
        const isConsoante = mapConsoantes[char] !== undefined || char === 'S' || char === 'Z';

        if (isVogal || isConsoante) {
            // Se carregámos no espaço antes e o bloco atual já tem algo desenhado, 
            // fechamos o bloco e abrimos o da nova palavra.
            if (aguardarNovaPalavra && blocoAtual.hasContent) {
                blocos.push(blocoAtual);
                blocoAtual = criarNovoBloco();
            }
            
            aguardarNovaPalavra = false;  // Reset do espaço
            blocoAtual.hasContent = true; // O bloco ganha conteúdo
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
                blocoAtual.hasContent = true; // O novo bloco já nasce com a consoante
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
// 4. MOTOR DE RENDERIZAÇÃO
// ==========================================
function desenharBlocos(blocos) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let xOffset = 20; 
    const yOffset = 20; 

    blocos.forEach(bloco => {
        const blockSize = 5 * CELL_SIZE + 4 * GAP;

        // --- PASSO A: SE ATIVADO, DESENHA A GRELHA DE SUPORTE EM SEGUNDO PLANO ---
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

        // --- PASSO B: DESENHA AS LETRAS ATIVAS DO BLOCO ---
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
        
        xOffset += blockSize + BLOCK_MARGIN;
    });
}

// ==========================================
// 5. EVENT LISTENERS (AÇÃO EM TEMPO REAL)
// ==========================================

input.addEventListener('input', (e) => {
    const blocosProcessados = processarTexto(e.target.value);
    desenharBlocos(blocosProcessados);
});

gridToggle.addEventListener('change', (e) => {
    showGrid = e.target.checked;
    const blocosProcessados = processarTexto(input.value);
    desenharBlocos(blocosProcessados);
});

desenharBlocos([ { grid: Array(5).fill(0).map(() => Array(5).fill(0)) } ]);