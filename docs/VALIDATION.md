# Validação da versão entregue

Execução local de 8 de novembro de 2026, em Windows, com Node.js 24.22.1 e Microsoft Edge 157.0.4341.42.

| Verificação executada | Resultado observado |
|---|---|
| node build.mjs | index.html e ui/game.js gerados com React local; TypeScript estrito passou |
| node --test tests/*.test.mjs | 41 testes aprovados; zero falhas, cancelamentos ou testes ignorados |
| node tests/simulate.mjs 210 | 210 partidas de IA terminaram com vencedor, em 39.128 turnos e 540.394 decisões legais |
| node tests/browser.mjs | Partida pelo HTML aberto diretamente no Edge. Vitória do assento humano no turno 80, com 319 ações do assento acionadas pelos controles da interface. Zero erros de página e zero requisições HTTP/HTTPS |
| node tests/reopen.mjs | Registro de partida recuperado após encerrar e iniciar novamente o navegador com o mesmo perfil; verificação de largura da interface em janela de 390 px |

## O que os testes exercitam

O simulador usa sementes de 1 a 210, alterna mesas de dois a seis treinadores e as três dificuldades. Todos os assentos passam pela mesma observação e escolhem exclusivamente ações legais. Depois de cada decisão, o teste verifica a conservação das 150 fichas e a quantidade de cada tipo de item e evento. Cartas de bônus reservadas durante o combate e o rival retirado para a final entram na contagem. A execução falha se a partida não terminar até 50.000 decisões.

Os testes unitários incluem o limite de mão; 300 encontros finais adicionais; as 36 combinações possíveis de dois dados; a privacidade de cartas, iniciais e fichas de captura; e a identidade do estado reconstruído em salvamentos intermediários. Microcenários de teste ficam restritos a tests/.

O teste de navegador pesquisou Dratini na coleção, alterou o zoom, abriu as regras, configurou uma partida, recarregou, continuou a mesa e conduziu os turnos até a tela de vitória. A semente e o ritmo da IA foram fixados no ambiente de teste. O jogador humano foi operado pelo Playwright.

## Limites

As simulações testam integridade e término das partidas com as regras cadastradas. A autenticidade das peças e os casos interpretativos estão em RULES_REFERENCE.md. O teste de navegador foi executado no Edge informado acima. Desempenho em GPUs integradas específicas, taxas sustentadas de quadros e outros navegadores permanecem sem medição.

## Auditoria da edição desktop 2.4

Base: edição de computador 2.2. A versão Android 2.3 segue separada.

- 45 testes de motor/dados aprovados, incluindo regressões de ajuste de captura e migração.
- 210 partidas completas com sementes distintas, 2–6 participantes e três dificuldades. 46.752 turnos, 662.692 decisões. O simulador verifica após cada decisão a conservação das fichas, das cartas por tipo e dos rivais.
- Três partidas reais de interface automatizadas no Edge com sementes 1, 8 e 16. Chegaram à vitória nos turnos 110, 80 e 59, sem erros de página ou requisições externas. Os testes aceleram as animações e operam os controles do jogador.
- Conferência visual da abertura de captura e das faces-alvo. Verificação do histórico recolhível, pausa, salvamento e reabertura no mesmo perfil. Replay produzido pelo motor 2.2 com ajuste zero recuperado com as mesmas equipes, fichas, itens e estado do gerador.
- O exame das capturas contra o manual fornecido corrigiu uma possibilidade extra nas três bolas. O ajuste zero existe somente sem carta nas novas decisões. Os cálculos de chance e as faces exibidas usam os mesmos modificadores do motor.
- A interface resolve passes, confirmações de bônus sem alternativa, ajustes únicos e trajetos únicos sem uma nova escolha. Cada transição passa pelo motor e entra no histórico. Batalhas ainda permitem escolher itens, usar a Máquina do Tempo e consultar os totais.
- A partida usa as artes do usuário e mantém as pendências físicas de Saffron, dos grupos evolutivos, do ataque de Dratini e do inventário por tipo de carta. A simulação não homologa os campos pendentes. A experiência foi testada por automação e inspeção visual, sem estudo com crianças.
Desktop 2.8: 47 testes aprovados. No Edge foram exercitados enquadramento, legenda no mapa, dica, seleção de destino, animação de deslocamento e resultado de captura. O teste de partida completa terminou no turno 80, sem erros de página ou requisições externas.
