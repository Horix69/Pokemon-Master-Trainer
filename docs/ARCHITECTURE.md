# Arquitetura

ui/Board.tsx renderiza fichas, peões, destinos e a camada de trajetos SVG por React DOM. Recebe apenas a observação e as ações legais. Menus e painéis permanecem em JavaScript. build.mjs usa esbuild para incorporar React em ui/game.js, executável offline por index.html.

## Estado e transições

- game-core/setup.mjs cria a mesa a partir de semente, número de participantes e dificuldade. A distribuição usa Fisher–Yates por cor e baralho.
- game-core/random.mjs implementa Mulberry32 com amostragem por rejeição. O dado só é amostrado pelo motor após validar a ação. O embaralhamento e as rolagens compartilham o estado registrado do gerador.
- game-core/engine.mjs expõe getLegalActions, observe e step. A validação confere o ator e os campos da ação contra opções calculadas. step aplica a transição a uma cópia. A origem permanece disponível em caso de exceção.
- game-core/capture.mjs opera sobre ficha, bola comprometida, dado e bandeja. game-core/encounters.mjs resolve trocas, combate, compromissos secretos, recuperação, eleição e confronto com o rival.
- board/graph.mjs enumera as rotas completas com a contagem do dado. board/kanto.mjs contém as conexões e as coordenadas normalizadas, separando peão e encaixe de captura. game-data/catalog.mjs fornece atributos físicos e quantidades.

O turno guarda separadamente o treinador ativo (turn) e o jogador que precisa decidir (actor). As fases de preparação são pick e tie. Após turn, a rolagem abre react e segue para move. A parada pode levar a capture, adjust, target, heal, eventTrade, eventFight ou encounter. Ao final, end resolve o limite de mão e a transferência a Cinnabar. won encerra a sequência de decisões. encounter contém uma segunda máquina de estados para a negociação, luta ou eleição do rival.

## Informações e IA

A observação descritiva inclui posição, fichas públicas, tamanho das mãos, cartas do observador e decisões públicas. A projeção dos encontros oculta bônus comprometidos e rival até a revelação prevista. As identidades das fichas fechadas, a ordem dos baralhos e o gerador ficam no estado privado do motor. O código da IA recebe somente essa projeção e as ações legais do ator. Esta separação protege a lógica da IA. O dono do computador tem acesso aos dados locais da aplicação.

A dificuldade fácil usa escolhas simples de posição e alvo. A normal compara ganho de PP, probabilidade de captura com cada bola e custos de recurso. A difícil considera as saídas seguintes de uma rota, o poder válido dos oponentes, o valor de troca de uma ficha nocauteada e a probabilidade de vitória nos 36 pares possíveis de dados. Antes da revelação do rival, a avaliação considera os cinco Mestres possíveis. A IA usa o mesmo redutor dos cliques do humano.

## Persistência

persistence/save.mjs escreve uma única chave versionada de localStorage. O arquivo lógico contém a configuração, a semente e o histórico integral de ações aceitas. A carga reconstrói e revalida cada decisão, inclusive a seleção secreta de cartas e os dados consumidos. O estado recuperado fica idêntico ao anterior para a mesma versão do motor e catálogo. Ao alterar regras que alteram o replay, é necessário migrar os salvamentos ou mudar a versão do formato. Dados corrompidos ou incompatíveis geram aviso na tela inicial. O log curto visível na interface e o histórico integral de replay servem a finalidades diferentes.

## Renderização e ferramentas

O mapa de 2268 × 1512 permanece montado, e o navegador reutiliza sua imagem. As camadas de fichas, peões, destinos e painel mudam após ações. O traço SVG acompanha a rota apontada. Os seis assentos usam peões circulares numerados. O temporizador da IA só existe durante uma decisão de adversário, e a abertura de um diálogo pausa a mesa.

O runtime da aplicação se restringe às APIs locais do navegador. Os testes de regras usam node:test e node:assert. O teste de interface usa Playwright. As artes fornecidas foram redimensionadas com Pillow durante a preparação; essa ferramenta não é necessária para jogar ou reconstruir o HTML.

