# Inventário de componentes

O conjunto de regras segue o manual americano de 1999. Para identificar a edição dos recursos locais, o rodapé de diversas cartas credita uma atualização gráfica a Alcmaster. A pasta fornecida se chama `Jogo Original`. Os campos das 150 fichas e das cinco cartas de rival foram comparados visualmente em folhas de contato geradas das imagens dessa pasta.

| Componente e campo | Dados cadastrados | Evidência e pendências |
| --- | --- | --- |
| Distribuição das fichas | 6 iniciais, 35 rosas, 41 verdes, 38 azuis, 26 vermelhas e 4 amarelas | Totais do manual, seção Contents. |
| Fichas individuais | Número, espécie, categoria, poder, ataque impresso em português, força e faces de captura | `Imagens/Original`, seis subpastas. Os identificadores numéricos resolvem inclusive os nomes de arquivo divergentes de Electabuzz e Gyarados. |
| Charmander | Poder 5, força 4 | Ficha local 004 e diagrama 1 do manual local. A tabela auxiliar da Bulbapedia inverte esses números. |
| Dratini | Poder 7, força 5 | A ficha local 147 mostra Tapa 5. A listagem auxiliar americana informa Wrap 6. O catálogo segue a imagem fornecida. Conferir a ficha americana original para homologar a correspondência com a edição de 1999. |
| Itens e eventos | 12 tipos de item e 8 tipos de evento, com multiplicidades | Faces em `Imagens/Itens/Original` e `Imagens/Eventos/Original`. O manual confirma um total de 54 por baralho. Cada face aparece uma vez na pasta. A distribuição das cópias por tipo vem do inventário BGG. |
| Rivais | Lorelei 10, Bruno 11, Agatha 12, Lance 14 e Gary 15 | Cinco faces em `Imagens/Rivals/Original`. Todos apresentam bônus +6 nas faces 1/6, +7 em 2/4 e +8 em 3/5. O exemplo de Lance também consta do diagrama 5 do manual. |
| Grupos evolutivos | Dois grupos ativos em `evolutionGroups` | Diagrama 4 do manual fornecido. A relação completa depende dos demais painéis da caixa. |

## Conferência adicional da edição americana

O diagrama 4 confirma os grupos de Pikachu e Bulbasaur. O autor da foto parcial da tampa identificou nas categorias do registro as duas espécies de Paras, as duas de Venonat e as três de Abra. Esses três grupos são pistas de pesquisa. O motor habilita apenas os dois grupos explicitamente demonstrados no manual fornecido. O registro também identifica Machop, sem identificar outros membros da sua família. A regra e a disposição de Eevee com Vaporeon, Jolteon e Flareon continuam pendentes. [Registro da foto da tampa de 1999](https://archives.bulbagarden.net/wiki/File%3AEvolution_Groups_-_Pok%C3%A9mon_Master_Trainer_%281999%29.png)

A arte local de Saffron oferece recuperação. O manual americano enumera Cerulean e Vermilion como as duas cidades de recuperação e cita Saffron apenas na bifurcação de Cerulean. Para determinar a instrução exata da casa norte-americana de Saffron é preciso ler o tabuleiro dessa impressão. A ficha de Dratini da edição americana também permanece em aberto. A referência secundária registra ataque 6, enquanto a face local apresenta 5. [Manual Hasbro de 1999](https://manualzz.com/doc/22673156/hasbro-pokemon-master-trainer-game-instructions) · [Tabela de fichas](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Master_Trainer_%281999%29)

## Divergências de texto nas cartas

- A imagem local da Bola Grande menciona apenas somar 1. O manual de 1999 permite escolher +1 ou −1 após a rolagem, tendo comprometido a carta antes dela.
- A carta local Oportunidade menciona ficha virada para cima de cor livre. O manual usa a cor da casa do evento, permite fichas abertas ou fechadas e libera as demais cores comuns caso aquela cor tenha se esgotado.
- A imagem local de Poção traz uma restrição de momento após a rolagem de movimento. Na seção de itens, o manual descreve a recuperação de uma ficha nocauteada. A correspondência do rodapé de momento com a carta física americana permanece pendente.
- Os textos de ataque em português seguem a grafia das fichas fornecidas. Vários diferem dos golpes listados na tabela americana. Eles identificam o ataque, e a força impressa determina a resolução do combate.

Fontes consultadas em 8 de novembro de 2026.

- Regulamento Hasbro de 1999, transcrição do documento americano 41215-1. [Manual](https://manualzz.com/doc/22673156/hasbro-pokemon-master-trainer-game-instructions)
- Tabelas auxiliares da edição Kanto. [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Master_Trainer_%281999%29)
- Inventário auxiliar com a composição dos baralhos. [BoardGameGeek](https://boardgamegeek.com/boardgame/1381/pokemon-master-trainer/wiki)

O arquivo `tests/catalog.test.mjs` verifica a distribuição, os identificadores, as faces de captura, as forças e bônus dos rivais, as quantidades totais dos baralhos e os exemplos dos diagramas 1 e 4.


