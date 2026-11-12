# Pokémon Master Trainer · Edição digital local

## Jogar

Extraia a pasta inteira do ZIP e abra **index.html** no Edge ou Chrome atual. A página carrega o tabuleiro e as fichas da pasta assets. Não há instalação para jogar.

1. Clique em **Singleplayer** no menu inicial. Escolha de um a cinco adversários, a dificuldade da mesa e a cor do seu peão. Clique em **Iniciar partida**.
2. Escolha sua ficha inicial. As fichas se revelam quando todos os treinadores terminam a escolha.
3. No seu turno, use o painel ao lado do mapa. Após o dado, passe o ponteiro sobre uma rota para ver a trilha. Escolha uma das setas no mapa ou uma ação do painel. Os encontros listam opções de batalha e troca.
4. Use **+** e **−** para ampliar o tabuleiro. Arraste a área ampliada. Clique numa ficha exposta para ler seus valores. A coleção permite consultar espécies sem revelar a posição das fichas ocultas.
5. Junte pelo menos 20 PP válidos. Em Cinnabar, **Entrar no Indigo Plateau** aparece antes de rolar. A vitória exige vencer uma batalha contra o Mestre.

O navegador salva as decisões após cada ação. Ao reabrir o mesmo arquivo, no mesmo perfil de navegador, clique em **Continuar partida**. Mover a pasta, usar navegação privada ou limpar os dados locais pode tornar o salvamento anterior indisponível. **Mesa de jogo** retorna ao menu e pausa os adversários. Em Configurações é possível ajustar o ritmo deles.

## O que está disponível

- Tabuleiro da pasta fornecida, com peões identificados por número e cor, 90 casas e 37 encaixes de captura na estrada.
- 150 fichas e cinco rivais, dois baralhos com 54 cartas cada, capturas, trocas, cura, batalha normal e confronto final.
- Um treinador humano e até cinco IAs locais, escolhas de reação fora do turno e três dificuldades.
- Aplicação jogável de Pallet Town até a vitória. **A fidelidade integral à edição americana de 1999 ainda depende da conferência de componentes.**

## Pendências de fidelidade

- Em **Saffron City**, a arte entregue imprime cura. O manual identifica Cerulean e Vermilion como os dois centros. A mesa registra o conflito e encerra a resolução da casa sem atribuir um efeito. Essa lacuna pode alterar o resultado de um turno.
- Só os grupos **Pikachu–Raichu** e **Bulbasaur–Ivysaur–Venusaur** recebem bônus nesta versão. São os exemplos documentados no manual fornecido. Falta a tampa da edição de 1999 para homologar os demais grupos. O livro de evoluções da variante RPG não fornece essa confirmação.
- **Dratini** usa ataque 5 da ficha entregue. A listagem americana auxiliar indica 6. A quantidade de cópias de cada tipo de carta também precisa de conferência física. O total de cada baralho consta do manual.
- A regra de Chance, a Bola Grande e outros limites de interpretação estão registrados na matriz. Os peões numerados e sua paleta são representações digitais provisórias. As ilustrações de jogo vêm dos arquivos do usuário.

## Código e testes

O tabuleiro interativo usa React, TypeScript estrito e SVG. Os menus e painéis usam DOM. O motor e a IA são módulos locais independentes. Para desenvolvimento, use Node 22+ e pnpm. Para jogar, basta abrir index.html.

```sh
pnpm install --frozen-lockfile
pnpm exec tsc
node build.mjs
node --test tests/*.test.mjs
node tests/simulate.mjs 210
```

O teste de interface usa Playwright e um navegador Chromium compatível. Com Playwright resolvível no projeto, execute `node tests/browser.mjs`. Também é possível indicar sua instalação existente por PLAYWRIGHT_MODULE e o executável do navegador por BROWSER_BIN.

| Documento | Conteúdo |
|---|---|
| [Arquitetura](docs/ARCHITECTURE.md) | Estados, privacidade, aleatoriedade, persistência, componentes e dependências |
| [Matriz de regras](docs/RULES_REFERENCE.md) | Regra, componente, fonte, implementação, teste e lacuna |
| [Tabuleiro](docs/BOARD.md) | Coordenadas, bifurcações, restrições e divergência em Saffron |
| [Catálogo](docs/CATALOG.md) | Origem de cada campo e multiplicidades |
| [Encontros](docs/ENCOUNTERS.md) | Batalha, troca, rival e janelas de reação |
| [Validação](docs/VALIDATION.md) | Resultados efetivamente observados |

Projeto pessoal e local. O ZIP inclui cópias otimizadas dos recursos fornecidos para que seja possível jogar sem conexão.



Na versão 1.2, escolha Multiplayer no menu para configurar de 2 a 6 jogadores locais. Complete os lugares disponíveis com IAs, se desejar. Quando o jogo pedir para passar o dispositivo, o próximo treinador deve clicar em Estou pronto para ver sua mão e decidir.
Na versão 1.3, o Histórico da partida permanece ao lado do tabuleiro. Role a lista para consultar ações anteriores; o salvamento reconstrói todas as mensagens ao continuar a partida.
Na versão 1.6, abra Configurações no menu principal ou pela engrenagem durante a partida para escolher o tema claro ou escuro. O navegador lembra a preferência.

## Versão 1.7

Na preparação, escolha nomes de até oito letras e cores distintas. Os assentos de IA recebem identidades sorteadas. A música começa em 30% e os controles ajustam cinco pontos por clique. O navegador pode exigir um primeiro clique para liberar o áudio. O botão Voltar ao menu permite guardar o progresso ou restaurar o salvamento existente ao iniciar a sessão. Nos confrontos, selecione a ficha do lutador e acompanhe os dados na janela da batalha. As cartas jogáveis aparecem com a imagem e o efeito.

## Versão 1.8 · Ação e histórico

A barra Ação indica quem decide e o próximo passo. Rotas únicas, capturas sem alternativa, ajustes únicos e encerramentos de turno sem itens opcionais seguem automaticamente. O jogador continua escolhendo entre rotas, bolas, bônus e combatentes. A rolagem é definitiva: esta versão desabilita o efeito de rerrolagem da Máquina do Tempo. Empates ainda exigem novos dados de desempate. A carta continua no inventário físico.

O histórico permanece disponível no próprio pop-up e retorna à coluna da mesa ao fechá-lo. Passe o mouse nas fichas, nos itens ou nos peões para inspecioná-los. Fichas fechadas só mostram a cor. Os controles de toque para consultar fichas e cartas continuam disponíveis.
Versão 1.9: escolha uma das dez sprites no cadastro do treinador. A cor do peão aparece na base e no contorno. A Máquina do Tempo volta a permitir uma nova rolagem, incluindo reações fora do turno. O resultado do dado permanece por cinco segundos após a animação; use × para antecipar o fechamento. As imagens de inspeção de cartas e fichas aparecem com 2,5 vezes a largura anterior, respeitando a tela.

## Versão 2.0 · Mesa guiada

As decisões abrem no centro da tela. Leia a instrução e a última jogada, depois selecione sua ação. Use **Avançar jogada da IA** para acompanhar um adversário no seu ritmo. O dado espera o botão **×**; resultados de batalha aguardam **Continuar após a batalha**. Para examinar o tabuleiro, feche o painel e use **Abrir painel da jogada** para voltar à decisão. Esse fluxo substitui os temporizadores descritos nas versões anteriores.
Versão 2.1: ao executar o movimento, a mesa exibe o trajeto legal da sprite casa por casa e reabre as decisões na chegada. Voo e reposicionamentos especiais são deslocamentos diretos. Durante capturas, o dado mostra as faces da ficha e, se aplicável, as faces úteis com a bola. Durante ataques, as faces de vitória são avaliadas a partir dos dados e bônus já conhecidos; resultados dependentes do oponente são identificados como possíveis.

## Versão 2.2

Nas janelas de decisão da IA, a jogada avança após quatro segundos. O × antecipa a ação, e o resultado do dado da IA também pode ser fechado antes do prazo. Cada combatente tem um placar com ataque base, bônus de coleção, cartas e dado; bônus secretos são revelados na resolução da rodada. As equipes adversárias ficam abertas em Treinadores. A abertura pixelada das batalhas respeita a preferência de movimento reduzido.
Versão desktop 2.4, derivada da 2.2. Os encontros selvagens exibem a ficha e os dados de captura em uma abertura pixelada. Consulte Como funciona? ou Histórico da mesa quando precisar. A nova barra de poder mostra quanto falta para 20 PP. O botão Pausar abre as opções de saída inclusive durante uma decisão da IA. Veja os resultados da auditoria em docs/VALIDATION.md.
## Versão 2.5 · Escolhas no tabuleiro
Na coluna ao lado do mapa, role o dado e compare os destinos. Passe o ponteiro sobre um símbolo para ver o efeito da casa antes de clicar. Fichas ocultas mostram somente a cor; fichas reveladas mostram a espécie e as faces de captura. Se houver vários caminhos ou encontros associados ao mesmo destino, escolha o percurso na lista. Os trajetos sem alternativa avançam pelo mapa.
Escolha o ritmo da IA na barra da música. Guiado conserva as pausas de leitura; Rápido apresenta os movimentos e turnos comuns dos adversários no mapa. Decisões humanas e oportunidades de reação continuam aguardando sua escolha. Capturas, trocas e combates mantêm suas janelas.
Mudanças de poder mostram o total anterior e o novo, a ficha adquirida e a distância até 20 PP. Cinnabar recebe uma bandeira quando uma equipe apta está fora do Plateau. A campanha, o gerador de dados e as ações legais são os da versão 2.4.

## Versão 2.6 · Revelações, dado e câmera

Após a escolha de todos os iniciais, cada treinador vê sua ficha com uma apresentação. Os textos Boa escolha, Ótima escolha e Excelente escolha correspondem a 3, 4 e 5 pontos de poder. São descrições visuais sem bônus de jogo.

O dado mostra o resultado efetivo ou explica qual decisão falta. Um ajuste de bola escolhido depois de rolar pode abrir o resultado com a mesma face, sem repetir o lançamento. O contador mostra 3, 2, 1 para a IA e 4, 3, 2, 1 para o humano. O × antecipa o fechamento. Uma decisão humana nunca é selecionada pelo contador.

A câmera aproxima a sprite apenas depois de definido o percurso e devolve a escala e a rolagem ao enquadramento anterior na chegada. O painel O que aconteceu realça as consequências da última ação, com ficha ilustrada quando o texto identifica o Pokémon.
Versão desktop 2.7: preparação ilustrada, retrato do treinador ativo, acesso direto às fichas acima do tabuleiro, cartas de item ilustradas e nova composição da arena. Os recursos visuais são locais e acompanham os temas claro e escuro.
## Versão 2.8 · Bifurcações
Quando há mais de uma rota legal, a câmera enquadra a origem, as trilhas e os destinos. Cada percurso recebe uma letra; trechos compartilhados aparecem em cor neutra. Pontos e traços distinguem caminhos além da cor. A letra no mapa corresponde às opções do painel. Os rótulos exibem o efeito conhecido de cada casa. Em trajetos diferentes com o mesmo destino, a marca combina as letras e abre a escolha de percurso/encontro.
Na primeira bifurcação há uma orientação curta. Abra Me dá uma dica para consultar uma sugestão baseada nas fichas públicas e na equipe atual. Após a escolha, a câmera passa do planejamento à caminhada. Ao chegar a uma cidade, uma placa junto à sprite identifica o local. Animações de realce respeitam movimento reduzido.

## Versão 3.0 · Computador e Android
O menu usa a floresta de Kanto; o cadastro de treinadores usa a Poké Bola orbital. Escolha um dos nove peões ilustrados, além de nome e cor. A área Equipes de treinadores alterna as coleções pelo nome de cada participante. A mão do jogador local agrupa as cartas repetidas e indica a quantidade. O adversário mantém os itens privados. Salvamentos antigos que usavam o décimo personagem passam a mostrá-lo com a aparência de Dusty.

O APK 3.0 inclui o jogo offline, suporta retrato e paisagem e usa o mesmo identificador e a mesma chave da distribuição Android 2.3. Instale o APK sobre a versão anterior para conservar os dados locais. Não desinstale para atualizar. O sistema usa o Android System WebView atualizado. Consulte android/build.py para reconstrução no Windows com JDK 17, SDK Android 35 e Build Tools 35. A chave de assinatura fica fora do pacote.
