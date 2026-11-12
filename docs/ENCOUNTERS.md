# Encontros entre treinadores

O controlador de encontros integra a máquina de turnos em `game-core/engine.mjs`. O arquivo `game-core/encounters.mjs` também expõe funções independentes para verificar os cálculos sem um tabuleiro carregado. A reprodução segue as seções *How to Trade Pokémon*, *How to Fight in a Trainer Battle*, *Item Cards*, *Evolution Bonus* e *Begin the Final Battle* do [manual Hasbro de 1999](https://manualzz.com/doc/22673156/hasbro-pokemon-master-trainer-game-instructions). As forças e tabelas dos cinco Mestres vêm das cartas registradas em [CATALOG.md](CATALOG.md).

| Componente | Transição implementada | Verificação em `tests/encounters.test.mjs` |
|---|---|---|
| Ficha e cartas de ataque | Escolha de lutadores, reserva de até dois bônus, dados, total e nova rodada de dados em empate. O competidor nocauteado perde a capacidade de lutar e pontuar. | Compromisso, empate, sigilo e descarte |
| Recompensa | Sorteio sem reposição na mão do perdedor. Se faltarem cartas, o vencedor decide se compra o complemento. | Mão insuficiente, complemento aceito e recusado, conservação |
| Fichas da equipe | Troca de um par com preservação da condição individual. Uma oferta comum admite incentivos em itens e recusa. | Aceite, retorno à movimentação, iniciais inelegíveis |
| Evento de troca e Boneca Pokémon | Escolha de fichas elegíveis, aceite obrigatório ou reação por Boneca. | Recusa inválida sem Boneca, devolução da carta ao fundo |
| Centros e Poção | Recuperação individual ou desafio com múltiplos nocauteados nas cidades permitidas. | Seis faces, reviver ficha apta é inválido |
| Grupos evolutivos | Cálculo de bônus a partir das famílias cadastradas em `evolutionGroups`. A validação dos demais grupos depende da tampa da caixa. | Grupo completo e incompleto de dois e três membros |
| Indigo Plateau e cartas de rival | Eleição entre adversários, segredo do rival, compromisso do desafiante, revelação, dado e bônus do rival. Vitória termina a partida. Derrota devolve o desafiante a Cinnabar e dá duas cartas ao representante do Mestre. | Vitória, derrota, nocaute, retorno e reembaralhamento |
| Máquina do Tempo | Cada lançamento de ataque ou da eleição abre oportunidade de reação. Durante o confronto final, o representante do Mestre não usa itens. | Reação de outro treinador e reprodução de estado intermediário |

## Contrato com o motor

`enterEncounter(state, kind, opponent)` recebe um estado de rascunho e cria o encontro. Os tipos aceitos são `battle`, `event-battle`, `trade`, `forced-trade` e `final`. A final escolhe o representante dos rivais quando o chamador omite o adversário. `encounterActions(state)` fornece as opções do ator atual. `applyEncounter(state, action)` valida e executa uma delas. O motor externo valida o identificador de quem age antes de chamar o módulo.

As reservas de ataque pertencem ao encontro até sua liquidação. Uma carta reservada sai da mão e volta à base do baralho após a batalha, inclusive na final. A ordem de reserva é preservada. Dados, ator, reações, propostas, incentivos e carta de rival em uso são serializáveis.

`encounterView(state, viewer)` constrói a observação. Ações de outro participante, dados futuros, índices das cartas em sua mão e identidade do rival antes da revelação ficam fora da projeção. A quantidade de bônus reservados é pública. Compromissos próprios, cartas reveladas após empate e ofertas já enviadas ficam visíveis ao destinatário. `evaluateEncounterAction(observation, action, difficulty)` usa somente essa observação e os valores públicos do catálogo.

## Pontos de interpretação

- A eleição empatada repete apenas entre os maiores resultados. O manual pede que o maior dado represente o rival e não detalha o desempate dessa eleição.
- Após uma rolagem, o autor do dado tem a primeira oportunidade de reação, seguida pelos demais em ordem de assento. Cada novo lançamento por Máquina do Tempo reabre essa janela. O manual determina uso imediato e deixa a ordem entre reações simultâneas em aberto.
- Quando uma Boneca cancela um desafio de passagem, o treinador retoma o deslocamento. O manual é explícito quanto à retomada após recusa de troca. O destino após cancelamento do desafio pela Boneca ainda precisa de confirmação.
- As fichas nocauteadas continuam na coleção. Ao calcular um grupo completo, contam como membros da coleção, embora não lutem nem somem pontos de poder. O manual não especifica outra restrição para membros auxiliares nocauteados.
- Se nenhum dos dois lados pode apresentar um combatente apto, a camada de turnos ignora o evento impraticável. O manual não fornece uma alternativa específica para esse caso.

## Teste local

Na pasta do projeto, execute `node --test tests/encounters.test.mjs`. O teste de 300 confrontos finais exercita eleição, revelação, vitória, derrota e conservação de cartas com sementes diferentes. Ele complementa as simulações de partidas realizadas pelo motor completo.
