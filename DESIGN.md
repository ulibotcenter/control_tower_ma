# Design da torre

Sala de guerra operacional: densa, em papel, com um acento só. Não é memorando e não é dashboard genérico.

## Princípios

- Um acento: laranja Eleva `#E05A24`. Navy `#0F172A` no cabeçalho e na sidebar. Miolo em papel.
- Semáforo (ir, esperar, alerta) é sinal de trabalho, não decoração. O ponto é visível; um filete de 3px não substitui o sinal.
- Laranja marca ação, filete e “estamos aqui”. Índigo e céu não entram no cromo.
- Três modos de sala na mesma URL. Apresentar é deck, não um quarto conjunto de dados.
- O que a sala não pode ver continua fora da tela. O cromo não anuncia o que foi escondido.

## Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| `--logo` / `--brand` | `#E05A24` | Ação, filete, estado ativo, “aqui” |
| `--ink` | `#0F172A` | Cabeçalho e sidebar |
| `--canvas` | `#F8FAFC` | Fundo |
| `--paper` | `#FFFFFF` | Superfície |
| `--line` | `#E2E8F0` | Divisória |
| `--go` `--wait` `--alert` | como hoje | Semáforo |
| `--sidebar-w` | `16.5rem` | Sidebar |
| `--header-h` | `3.5rem` | Barra, mais o filete de 3px |

`--brand-2` é o mesmo laranja, mais claro, e só aparece sobre navy. Não é segunda marca.

## Modos

- **Operar.** Tudo. Fora do cabeçalho: Bandeja, Decisões, Pack e sincronizar o Drive. No deal, sidebar com os seis pilares.
- **Assessores.** Fatos do deal. Sem transcrição, bandeja crua, notas internas, tese e preço internos. Sem a faixa de trabalho.
- **Alvo.** Só o deal travado, e só o formal. Sem o outro deal, sem decisão interna, preço, bandeja, pack ou sync.
- **Apresentar.** Deck. A sidebar some. Sem sync.

Atalhos `1`, `2`, `P`, `/` e `?` e o cookie de sessão continuam. Sair do Alvo continua a exigir a frase.

## O que é sagrado

Texto do corte, números, checklist, riscos e IDs de pasta do Drive. `lib/pillars.ts`, `lib/visibility.ts`, `lib/mode.ts` e o middleware. A ordem dos seis pilares. Sem papéis de usuário. Sem remover os modos de sala.

## Próximos blocos

Um por vez, nesta ordem: capa do portfólio, interior do deal, página do pilar, OPL / tarefas / notas, Drive, apresentação, bandeja com IA via OpenRouter, link em www.elevaprojects.com.

Este bloco é só token, este arquivo e o shell.

## IA

O modelo propõe. Quem opera aceita, edita ou descarta. O modelo não publica fato. Sem API e sem dependência de OpenRouter neste bloco.
