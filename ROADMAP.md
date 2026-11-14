# Ultimate Brazil 2.5D — estado da versão 1.3.0

## Entregas implementadas

| Etapa                     | Resultado disponível                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Rio                   | Operação Guanabara no ID 0, percurso de oceano/costa/mata/Corcovado, sobrevoo do Cristo, desaceleração e chefe após o marco    |
| 2 — Aeronaves e combate   | 13 aeronaves, quatro companheiros, inimigos com apresentação melhorada, efeitos, sombras, HUD e controles preservados          |
| 3 — BR-29, lobby e hangar | Falcão do Brasil jogável, Tempestade Verde, arte original de hangar brasileiro e telas funcionais de coleção/evolução          |
| 4 — Arsenal               | 31 armamentos, cinco slots por aeronave, compra, evolução 1–5, configuração persistente e campo de teste gratuito              |
| 5 — Chefes e campanha     | Três chefes com canhões/reator destrutíveis; Amazônia, Pantanal, Brasília, Iguaçu e Fortaleza Atlântica; áudio por barramentos |
| 6 — Polimento             | Save v3 com migração/backup, recuperação, qualidade gráfica, PWA, build, domínio, cinco suítes de navegador e offline          |

O catálogo jogável possui **13 aeronaves, 30 missões, quatro companheiros, cinco dispositivos legados e 31 armamentos**. As seis primeiras missões têm rotas brasileiras próprias; as outras 24 continuam com seus cenários anteriores. A missão e o equipamento não são renumerados para incorporar novas artes ou sistemas.

A publicação automática executa as cinco suítes de navegador e o teste offline antes do deploy. Depois, o job Verify published game in Chromium valida o jogo no endereço HTTPS publicado. Envio de código e publicação confirmada são resultados distintos: conferir os três jobs no Actions.

## Quatro cenários brasileiros planejados

O pedido atual permite criar ou planejar estes cenários. Eles são a próxima expansão de mapas, sem cartões, promessas de disponibilidade ou alterações de progresso antes da implementação. A proposta é refazer os cenários das missões existentes de IDs 6–9, mantendo duração, recompensas, dificuldade, desbloqueios e estrelas salvas; não é necessário aumentar artificialmente a campanha.

### ID 6 — Base Aérea Noturna

- Percurso: aproximação sobre mata escura → vias de serviço iluminadas → hangares e pista → radar de comando.
- Arte: relevo em tons azulados, cones de luz, balizamento de pista, reflexos de chuva e hangares com sombras. Iluminação ambiente legível e baixa densidade de efeitos para distinguir tiros inimigos.
- Objetos: radares e plataformas como alvos; aviões estacionados e veículos de serviço como decoração. Uma luz de busca acompanha uma trajetória anunciada, sem causar dano invisível.
- Validação: comparar contraste de projéteis em baixa/média/alta qualidade, toque em telas pequenas, GPU com texturas até 2048px e reabertura offline.

### ID 7 — Serra e Montanhas

- Percurso: vale fluvial → estrada serrana → desfiladeiro e pontes → base no cume.
- Arte: camadas de encostas com sombras de altitude, mata, paredões de granito, neblina baixa e passagem de nuvens independente do terreno.
- Objetos: comboio em estrada e torres nas pontes. As rochas não colidem com o avião; perigo e alvos continuam no plano de combate para preservar o controle livre.
- Validação: progressão sem repetição, câmera monótona, ausência de saltos nas transições e conservação das hitboxes ao passar sob nuvens.

### ID 8 — Zona Industrial Brasileira

- Percurso: canal portuário → pátio ferroviário → complexo de fábricas → central de energia militar.
- Arte: galpões, telhados, guindastes, tubulações, reservatórios, sombras de chaminés e fumaça em camadas. Cores quentes industriais contrastam com os verdes e azuis dos mapas naturais.
- Objetos: depósitos e geradores com vida própria e limites de efeitos; vagões, dutos e boa parte dos telhados são decorativos. Destruir um gerador pode desligar uma torre associada.
- Validação: dano em área sem recompensas duplicadas, descarte de destroços, custo de partículas e compatibilidade com as armas elétricas/laser.

### ID 9 — Arquipélago Tropical

- Percurso: águas rasas → ilhas com recifes → pontes/fortificações → porto insular.
- Arte: ilhas de silhuetas próprias, espuma costeira, transparência da água, vegetação, praias e profundidade sugerida por cor e sombras. A rota será distinta da Fortaleza Atlântica, sem reaproveitar apenas sua paleta.
- Objetos: embarcações móveis, baterias costeiras e ponte como cenário marcante; o chefe marítimo usa as mesmas regras verificáveis de partes destrutíveis.
- Validação: comparação visual entre começo/meio/fim, alvos claramente separados da decoração, sombra das aeronaves sobre a água e pré-cache dos novos recursos.

Cada mapa deverá ter arte otimizada, dados de rota em módulo independente, carregamento sob demanda, teste de início/meio/final, revisão visual e teste offline antes de substituir o cenário antigo.

## Portões de manutenção e publicação

1. Rodar `npm test` (28 testes de domínio da entrega), `npm run build` e as cinco suítes de `npm run test:browser`.
2. Rodar o offline com preview de produção e verificar também o prefixo `/jogo-mate-ou-morra/` usado no Pages.
3. Preservar o round-trip de saves v1, v2 e v3; testar posse, moedas, níveis, slots, mapa e seleções. Uma falha de importação ou carregamento não pode sobrescrever o save.
4. Conferir 1920×1080, 1366×768, 360×800, 390×844, 412×915 e 768×1024; atualizar evidências quando a alteração afetar o layout.
5. Enviar uma versão estável à `main` e acompanhar o workflow. Só registrar o deploy como confirmado depois do sucesso da execução e da abertura do HTTPS.

## Validação em hardware e evolução futura

A emulação Chromium valida os fluxos automatizados, mas não substitui testes em Android e Safari reais. A próxima rodada em hardware deve medir resposta ao toque, áudio, retomada após perder foco, consumo de memória, temperatura e taxa de quadros nas três qualidades. O alvo de 60 FPS depende do aparelho; o modo econômico usa alvo de 30 FPS.

As propostas de **60 aeronaves, 100 missões, 12 companheiros, Gamepad API, personalizações e cooperativo** pertencem ao plano amplo anterior e não são anunciadas como conteúdo entregue nesta versão. Uma eventual expansão deverá reservar novos IDs, criar arte e comportamento completos e testar compra, equipamento, evolução e migração antes de disponibilizar cada item. Raridade continua sendo uma característica de apresentação; novas regras de evolução exigem balanceamento e testes próprios, sem reduzir o progresso adquirido.
