# Entrega 3.1 — revisão e celebração

- Apresentações da IA reduzidas de 3 para 2 segundos (dados, ações, iniciais e itens). Reações rápidas e o ritmo rápido mantêm seus intervalos menores. Tempos de decisões humanas preservados.
- Hall da Fama animado com personagem e nome do vencedor, equipe, pontos de poder válidos, capturas com dado, total de turnos da mesa e usos da Máquina do Tempo.
- A celebração aguarda uma escolha, sem encerrar sozinha. É possível rever a mesa e retornar ao menu. Compatível com retomada de partidas concluídas.
- Corrigido o fechamento nativo de itens recebidos: o botão Voltar do Android agora libera a continuação da partida.
- Ações antigas da IA são ignoradas se a fase já mudou, evitando disputa entre avanço automático e clique manual.
- Cabeçalho da celebração isolado dos estilos do cabeçalho principal; layout adaptável e respeito a movimento reduzido.

As regras do motor não foram alteradas. Pendências de conferência dos componentes físicos seguem registradas no README e em RULES_REFERENCE.md.

Validação da entrega: 51 testes aprovados e TypeScript sem erros; 12 partidas simuladas (3.263 turnos / 49.712 decisões); partida completa no Edge com 142 turnos, sem erros JavaScript nem requisições externas. Celebração, retomada e retorno ao menu verificados em desktop, retrato e paisagem. Fechamento de itens pela API nativa de diálogo não bloqueia o andamento. APK com assinatura v3 validada e recursos conferidos contra a distribuição de computador; instalação em aparelho físico ainda não testada.
