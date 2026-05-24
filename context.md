Relatório de Projeto: Alfabeto Fonético 5x5
1. Conceito e Objetivo do Projeto
O projeto consiste no desenvolvimento de uma ferramenta web para escrever, visualizar e descodificar uma linguagem visual/fonética original. Esta linguagem representa consoantes e vogais através de uma grelha geométrica de 5x5.

O objetivo da aplicação é ter um ambiente bidirecional:

Um motor que traduza texto normal (alfabeto latino) para blocos visuais 5x5 em tempo real.

Uma interface interativa (Canvas) que permita ao utilizador desenhar os blocos visuais e obter a tradução fonética inversa.

2. A Gramática Visual (Regras da Matriz 5x5)
A grelha de 25 casas está dividida em três secções funcionais e gere o tempo (ordem das letras) através da profundidade visual da própria célula.

A. O Mapa Espacial
Consoantes (O Núcleo): Ocupam um quadrado 3x3 no centro da matriz 5x5. O mapeamento segue a lógica do Sistema Fonético Major de 1 a 9 (ex: 1=T/D, 5=L, 9=P/B). A ausência de pontos no quadrado central (0) representa os sons S/Z. As células de topo e base das colunas centrais são zonas mortas (margens).

Vogais (As Laterais): Ocupam as colunas exteriores. A Coluna 1 (Esquerda) representa as vogais que soam antes das consoantes do bloco. A Coluna 5 (Direita) representa as vogais que soam depois. O eixo vertical (Linhas 1 a 5) está mapeado para as vogais A, E, I, O, U, respetivamente.

B. O Eixo Cronológico (Estados da Célula)
Quando múltiplas letras ativam a mesma secção (ex: encontros consonânticos como "TR", ou ditongos como "AI"), a ordem cronológica da sílaba é representada pela alteração visual da célula, permitindo sobreposição.

Estado 0: Vazio (transparente).

Estado 1 (1ª Letra): Preenchimento total (sólido).

Estado 2 (2ª Letra): Apenas contorno (stroke).

Estado 3 (3ª Letra): Contorno com um ponto preenchido ao centro.

3. Arquitetura e Stack Tecnológico
O projeto foi construído propositadamente sem frameworks para garantir máxima performance, controlo ao pixel e facilidade de alojamento estático (ex: GitHub Pages).

HTML5 & CSS3: Estrutura base com sistema de abas e design minimalista dark mode.

Vanilla JavaScript: Toda a lógica de estado e processamento.

HTML5 Canvas API: Usada como motor de renderização gráfico para desenhar as grelhas (primitivas geométricas).

4. Features Implementadas
Modo de Texto (Aba 1)
Input Normalizado: O texto introduzido sofre parsing, removendo acentos e convertendo para maiúsculas.

Máquina de Estados (Parser): O algoritmo lê a palavra e agrupa as sílabas em blocos 5x5 de forma inteligente. O bloco atual é fechado e um novo é criado se surgir um espaço ou se uma consoante for digitada após o lado direito (vogais pós-consoantes) já estar ocupado.

Renderização em Tempo Real: O Canvas desenha os estados 1, 2 e 3 instantaneamente à medida que o utilizador digita.

Modo de Desenho (Aba 2)
Canvas Interativo: O utilizador pode clicar nas células da grelha (suporta Rato e Touch) para desenhar os símbolos.

Iteração Inteligente por Secção: Ao clicar numa célula vazia, o algoritmo deteta a secção (Esquerda, Centro, Direita), conta quantas células já estão ativas nessa secção e atribui o próximo estado cronológico automaticamente.

Modo de Correção: Cliques subsequentes numa célula já ativa iteram de forma rotativa (Estado + 1 % 4) para permitir correções ou apagar a célula.

Adição de Blocos: Botão + dinâmico para adicionar novas grelhas de 5x5 à direita, com redimensionamento automático do canvas.

Engenharia Reversa (Tradução): Um toggle que ativa a função descodificarBloco(). O algoritmo lê os estados (1, 2, 3) desenhados na grelha, ordena cronologicamente as ações por secção e imprime a tradução fonética por baixo de cada bloco.

5. Estrutura Atual do Código (script.js)
O ficheiro principal de JavaScript está dividido nas seguintes secções fundamentais:

Configurações Visuais: Constantes como CELL_SIZE, GAP, e BLOCK_MARGIN.

Dicionários: mapVogais e mapConsoantes (e os seus equivalentes reversos para a tradução).

Gestão do DOM: Event listeners para a navegação das abas.

Funções de Desenho Globais: desenharFormaCelula() (gere o grafismo dos estados) e desenharEstruturaCentro() (desenha a moldura guia de 3x3).

Lógica do Modo Texto: Função processarTexto() que gere o array multidimensional da grelha.

Lógica do Modo Desenho: Gestão do array blocosManuais, deteção de coordenadas de clique no canvas lidarComCliqueGrid(), e a função de tradução descodificarBloco().