# Matriz de fidelidade · edição de 1999

A inspeção inicial encontrou o diretório de desenvolvimento vazio. O usuário indicou a pasta Jogo Original com o manual em português, a arte do tabuleiro, 150 fichas, itens, eventos e rivais. Os gráficos distribuídos são versões otimizadas desse acervo. A consulta textual da edição de 1999 usou as [instruções da Hasbro reproduzidas no Manualzz](https://manualzz.com/doc/22673156/hasbro-pokemon-master-trainer-game-instructions).

| Procedimento | Fonte / componente físico | Responsável | Testes e estado |
|---|---|---|---|
| Mistura por cor, reserva, seis iniciais e três baralhos | Setup, componentes locais | setup.mjs, random.mjs | setup.test, catalog.test, simulate. Quantidades por tipo de carta em CATALOG.md |
| Menor poder inicia; desempate; rotação de assentos | Who Begins the Journey First? / iniciais e dado | setup.mjs, engine.mjs | setup.test; novo empate repete entre empatados |
| 90 casas, bifurcações, direção até Cerulean, contagem, ocupação e encontros | Mapa fornecido; Traveling the Land; Occupying Spaces | board/kanto.mjs, board/graph.mjs | board.test. Ver BOARD.md |
| Revelar ficha, comprometer bola antes de lançar, ajustar depois | Skill One / ficha e carta | engine.mjs, capture.mjs | capture.test cobre quatro modos, seis faces e as cinco cores |
| Reposição da mesma cor e exposição na falha | Skill One / bandeja | capture.mjs | capture.test, simulate. Sem reserva, a casa fica vazia |
| Escolha de uma das amarelas e mistura após falha | Unknown Dungeon Pokémon / evento | engine.mjs, capture.mjs | turns.test, capture.test |
| Batalha normal, no máximo dois bônus secretos, empate, prêmio e KO | Skill Three / cartas e dois dados | encounters.mjs | encounters.test, simulate. Só fichas aptas lutam e somam poder |
| Proposta, incentivo, aceite, recusa, exceção dos iniciais e troca forçada | Skill Two, Trade Pokémon / fichas e evento | encounters.mjs, engine.mjs | encounters.test, turns.test. Rota preservada na recusa |
| Cura individual, desafio com 1/6 para equipe, evento Centro e Poção | Reviving Your Pokémon; itens e eventos | engine.mjs, encounters.mjs | turns.test e encounters.test |
| Compra, limite de sete, escolha do excedente, retorno ao fundo | Item Cards; cidades e casas do Plateau | engine.mjs | turns.test, simulate |
| Evento Chance, compre 1/2/3, luta, troca, Centro e Dungeon | Event Cards / oito faces fornecidas | engine.mjs, encounters.mjs | turns.test, encounters.test e simulação. Em Chance, o manual determina a cor da casa; se não há fichas da cor, exclui amarelas |
| Voar em vez de rolar; Máquina do Tempo logo após dado | Item Cards / carta e dado | engine.mjs, encounters.mjs | turns.test, encounters.test, simulate. Janelas e limites abaixo |
| Bônus de +3 / +5 conforme grupo completo | Evolution Bonus / diagrama 4 e tampa | encounters.mjs, catalog.mjs | encounters.test, catalog.test. Dois grupos ativos; demais pendentes |
| 20 PP válidos, Cinnabar, circuito horário e parada exata | Cinnabar Island, Indigo Plateau / tabuleiro | engine.mjs, graph.mjs | board.test, turns.test; 20 PP não encerram a partida |
| Eleger o representante, rival em segredo, revelar após compromisso, resultado e retorno | Begin the Final Battle / cinco cartas de rival | encounters.mjs | encounters.test, simulate e browser.mjs. Derrota nocauteia, retorna a Cinnabar, premia representante e reembaralha rivais |
| Compartilhamento de ações legais, observações privadas, replay | Requisito de digitalização | engine.mjs, ai/strategy.mjs, persistence/save.mjs | setup.test, simulate e browser.mjs |

## Divergências e interpretações em aberto

1. **Saffron** tem geometria e ocupação implementadas. A arte local atribui recuperação onde o manual cita somente Cerulean e Vermilion. A partida registra a pendência ao parar em Saffron e não aplica um efeito de cidade. Para fechar a regra, falta identificar a instrução dessa casa no exemplar de 1999 do usuário.
2. **Grupos evolutivos** usam a composição explícita dos exemplos de Pikachu e Bulbasaur. A conferência da tampa original é necessária para cadastrar os demais e o tratamento de Eevee. Ver CATALOG.md.
3. **Dratini** usa ataque 5, que está na ficha local. A referência americana auxiliar indica 6. As cópias de cada tipo de carta vieram de inventário auxiliar; o acervo tem uma face por tipo. [Inventário do jogo](https://boardgamegeek.com/boardgame/1381/pokemon-master-trainer/wiki)
4. **Cartas traduzidas**. Chance e Bola Grande seguem o texto do manual. A versão 2.4 exige o ajuste impresso após comprometer uma bola: Grande −1/+1, Ultra +1/+2, Master +1/+2/+3/+4. O zero somente é válido sem bola ou durante a reconstrução de uma decisão legada anterior à migração. A Poção está disponível após o dado de movimento e no encerramento do próprio turno. A carta local indica essa janela; a transcrição americana é menos específica. A ordem de reações simultâneas segue os assentos a partir do treinador que lança o dado. Ver ENCOUNTERS.md para a situação da Boneca e das fichas nocauteadas em grupos.
5. **Casos sem instrução explícita**. Na casa de evento sem cor do Plateau, Chance usa as cores comuns. Um desafio sem combatente apto não inicia batalha. Em empate para escolher o representante do Mestre, repetem os maiores resultados. As simulações exercitam essas decisões de implementação, que aguardam confirmação canônica.
6. **Apresentação e desempenho**. Os peões são marcadores numerados provisórios; os encaixes da Dungeon usam uma disposição visual na área comum. A interação não usa um laço contínuo de renderização. A meta de 60 FPS em hardware modesto permanece sem medição dedicada.

O detalhamento por componente está em CATALOG.md, BOARD.md e ENCOUNTERS.md. Os resultados da execução estão em VALIDATION.md.
Atualização da versão 1.8: por instrução do usuário, o resultado de cada dado é definitivo. A carta Máquina do Tempo conserva sua quantidade no baralho, mas o efeito opcional de rerrolagem está desativado. Empates obrigatórios continuam sendo desempatados por um novo lançamento. A descrição anterior de janelas de reação documenta o modo legado usado para reconstruir salvamentos.
Versão 1.9: restaura as janelas de Máquina do Tempo para os lançamentos de movimento, captura, recuperação, combate e escolha de Mestre. A limitação da versão 1.8 só é aplicada para reconstruir decisões já salvas naquela versão.
