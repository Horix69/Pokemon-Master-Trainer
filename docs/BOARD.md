# Tabuleiro e movimentação

A transcrição utiliza a imagem local `Jogo Original/Imagens/Mapa/Map_Kanto_Original_300dpi_pt.png`, de 2268 × 1512 pixels. A inspeção percorreu cada estrada da imagem e a comparou novamente com uma sobreposição das ligações e dos identificadores. Nenhuma imagem de terceiros foi baixada para construir o mapa.

| Componente na arte | Cadastro | Conferência |
|---|---|---|
| Estradas | 10 cidades, 29 eventos, 37 capturas | Cada círculo pequeno é uma casa. Os encaixes grandes das fichas não contam como passos extras. |
| Fichas de estrada | 10 rosas, 10 verdes, 10 azuis, 7 vermelhas | Posições dos encaixes separadas das posições dos treinadores. |
| Indigo Plateau | 14 casas, 2 de confronto final | Ordem conferida pelas setas amarelas impressas. A seta da ilha leva à casa de chegada. |
| Unknown Dungeon | 4 posições em área comum | Organização visual em duas fileiras, dentro da reserva amarela. Essas posições ficam fora do grafo de movimento. |
| Cidades com cura | Cerulean e Vermilion | Nomes explícitos no manual. Há uma divergência em Saffron descrita abaixo. |

## API

- `board/kanto.mjs` exporta `kantoBoard`, `spaces`, `startSpace` e `chipPositions`. Todas as coordenadas públicas estão em porcentagens em relação à imagem integral. O critério de posicionamento é o centro visual das casas, com precisão aproximada de alguns pixels.
- `board/graph.mjs` valida IDs, conexões dirigidas e entrada no circuito. `getLegalRoutes(board, movement)` recebe origem, dado, ocupação, jogador ativo, histórico de Cerulean e poder válido. Cada resultado contém o percurso integral, destino, encontros possíveis e o sinalizador de contagem exata.
- `resolveRoute(board, movement, path)` recalcula as opções legais e recupera a rota correspondente. Uma trajetória ausente da lista retorna `null`.
- A casa de origem pertence ao percurso, mas não consome movimento. A chegada da ilha também antecede a contagem no circuito. O controlador pode registrar a entrada antes do lançamento usando `indigo-arrival` como origem.
- Para um encontro, a posição do oponente e o índice do passo estão em `meetings`. A decisão estratégica e a fase de resposta cabem ao motor de turno. Se a troca for recusada, o percurso preserva o destino inicialmente escolhido.

## Referências e pendências

As seções *Traveling the Land*, *Occupying Spaces*, *Cinnabar Island* e *Indigo Plateau* descrevem direção, ocupação, a parada facultativa na ilha e a circulação horária. A preparação e as regras de recuperação identificam Pallet Town e os dois Centros Pokémon. A tradução fornecida traz essas regras nas páginas 2–5, 8 e 12. [Manual Hasbro de 1999, transcrição](https://manualzz.com/doc/22673156/hasbro-pokemon-master-trainer-game-instructions)

Em Saffron, tanto o PNG quanto o PDF local para gráfica imprimem uma instrução de recuperação. O manual de 1999 restringe essa recuperação a Cerulean e Vermilion. O grafo registra `verify-saffron` para que a camada de regras possa lidar explicitamente com a divergência. Uma foto legível da casa Saffron em um exemplar físico da edição americana de 1999 resolveria qual instrução foi impressa na edição canônica. A geometria e a conectividade foram conferidas contra a arte local fornecida.

Os testes em `tests/board.test.mjs` cobrem contagem e distribuição das casas, alcançabilidade, reciprocidade das estradas, bifurcações, ocupação, encontro ao passar, Cinnabar, circulação horária, contagem exata e rejeição de atalhos. Os micrografos sintéticos usados para testar limites permanecem no arquivo de teste.
