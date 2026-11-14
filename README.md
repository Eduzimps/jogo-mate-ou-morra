# SKY STRIKE 1945 — Ultimate / atualização 1

Shoot ’em up vertical original feito com **Phaser 3, TypeScript e Vite**. Campo lógico de 540 × 960, interface em português, controles por teclado/mouse/toque e progresso local. Sprites SVG e cenários são gerados pelo projeto; efeitos e trilhas são sintetizados com Web Audio. As fontes Barlow são distribuídas localmente por Fontsource (OFL).

## Instalação e execução

Requer Node.js 20.19+ ou 22.12+ (validado com Node 24).

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (porta padrão 5173). O servidor aceita conexões em `0.0.0.0`. Neste ambiente, se o cache padrão do npm não for gravável, use `npm install --cache /workspace/.npm-cache`.

```bash
npm run build
npm run preview
```

O build fica em `dist/` e pode ser servido por qualquer hospedagem estática. Não abra `index.html` por `file://`. Nenhum backend, conta, chave de API ou serviço pago é necessário. O service worker é ativado apenas no build de produção, em HTTPS ou localhost, e permite reabrir offline os recursos já carregados. O primeiro acesso exige carregamento completo.

## Como jogar

1. Escolha a aeronave no **Hangar**. A Sentinel inicial vem desbloqueada e há 1.200 moedas para melhorias.
2. Abra **Campanha** e selecione uma missão disponível.
3. Elimine as ondas e derrote o chefe para liberar a próxima missão.
4. Use as moedas no hangar para comprar aviões, melhorar vida/dano/cadência ou aumentar o nível de companheiros e dispositivos.

| Ação                                     | Controle                                           |
| ---------------------------------------- | -------------------------------------------------- |
| Mover                                    | WASD, setas ou movimento do mouse no campo         |
| Mover no celular                         | Arrastar; avião aparece 75 unidades acima do toque |
| Disparar                                 | Automático                                         |
| Bomba, escudo, laser, mísseis, reparação | 1, 2, 3, 4, 5 ou botões na tela                    |
| Pausar/continuar                         | Esc ou botão II                                    |

Equipe até três dispositivos. Cada um possui recarga independente. É possível trocar a seleção no hangar. A bomba limpa tiros inimigos; o escudo bloqueia danos; o laser causa dano contínuo; os mísseis buscam alvos; a reparação recupera vida. O jogo pausa ao perder foco.

## Ultimate Brazil 2.5D — Etapa 1: Operação Guanabara

A missão de ID **0** agora é **Operação Guanabara**, no Rio de Janeiro. Duração, recompensa, desbloqueios e os IDs de todas as 30 missões foram preservados. As missões 1–29 continuam com seus cenários existentes. Esta entrega conclui o recorte do mapa do Rio; não implementa o arsenal customizável ou novos mapas brasileiros.

A rota de 6.400 unidades é percorrida uma única vez: **oceano → costa de Copacabana → mata do Corcovado → sobrevoo do Cristo → defesa da Guanabara**. O cenário combina arte original de relevo, cidade e costa com água animada, barcos decorativos, nuvens independentes e sombras. A câmera do combate permanece fixa; apenas as camadas do cenário se deslocam. O trecho do Cristo desacelera o scroll, muda a sequência musical e suspende novas ondas para dar destaque ao marco. O chefe só entra após o sobrevoo.

O Cristo é paisagem: não possui vida, arma, colisão nem recebe dano. A ilustração é uma interpretação artística, não um mapa cartográfico. Sua passagem ocorre abaixo das aeronaves, preservando os controles livres. As artes ficam em `public/assets/rio/` e somam aproximadamente **940 KiB**, em três WebP; nenhuma textura passa de 1.100px por eixo. A fase carrega esses recursos na GPU apenas quando selecionada. O service worker do build guarda as artes para permitir reabertura offline após a preparação inicial.

Nenhuma alteração do formato de save foi necessária nesta etapa. Também foi corrigido um vazamento de sombras que ocorria no disparo de aeronaves com dispersão ou nível 4+: agora há uma única sombra por jogador.

Validação adicional: `tests/rio-route.test.ts` verifica a linha do tempo, monotonicidade, desaceleração e sobrevoo antes do chefe; `tests/rio-browser.mjs` verifica as cinco seções renderizadas, profundidade, pausa, controles, cenário da missão seguinte, preservação de save antigo, limite de textura e regressão de alocações de sombras. Os testes de navegador avançam o tempo para tornar as transições determinísticas; isso não substitui uma revisão de balanceamento integral em celulares físicos.

## Atualização Ultimate — primeira entrega

A base existente foi preservada. Esta versão contém **13 aeronaves jogáveis**, não 60. As 12 originais conservam IDs, nomes, atributos de combate, preços e níveis. Cada uma ganhou uma silhueta vetorial própria com painéis, rebites, cockpit, armamento e transparência real. O BR-29 Falcão do Brasil usa o novo ID 12, custa 650 moedas e pode ser comprado desde a primeira missão.

- **Tempestade Verde:** Espaço ou botão na batalha; rajadas durante dois segundos, finalizando em dois mísseis guiados. Recarga de 16 segundos; dano acompanha o nível.
- **Hangar:** prévia sem compra automática, pesquisa, filtros por coleção/raridade/tier, favoritos, inventário, comparação, compra, equipar e melhorias. Prévia de armamento é informativa; o teste real acontece na batalha.
- **Companheiros:** quatro sprites próprios; Kite usa dispersão, Ghost dispara projéteis de energia que atravessam até três alvos e Lynx usa mísseis guiados. A formação atual continua sendo uma dupla do mesmo tipo, sem dois slots independentes.
- **HUD:** vida numérica e percentual, cores por estado, alerta crítico com som, barra azul de escudo e destaque das três fases do chefe. Botões não são recriados a cada atualização.
- **Configurações:** efeitos reduzidos, tremor opcional, HUD ampliado, deslocamento do avião acima do dedo e sensibilidade do ponteiro.
- **Lobby:** inventário, missões, eventos (resgate diário) e conquistas (os desafios existentes). Não foram anunciados novos modos fictícios.
- **Recursos:** miniaturas 200px com carregamento preguiçoso; arte detalhada 640px no hangar; batalha rasteriza apenas a aeronave equipada a 160px e o companheiro a 80px. Os cenários foram mantidos.

### Proteção do progresso

A chave continua sendo `sky-strike`. O formato v1 migra para v2 e cria uma cópia byte a byte em `sky-strike.backup-v1`. Um save ilegível abre uma tela de recuperação e **não é substituído automaticamente**. É possível baixar o arquivo original, restaurar uma cópia anterior ou importar um JSON válido. Criar um novo progresso é uma ação explícita e preserva o original em `sky-strike.unreadable`.

Em **Opções**, exporte/importe backups JSON para transferir seu progresso. Antes de uma importação válida, o valor anterior fica em `sky-strike.before-import`. Arquivos inválidos são rejeitados sem alteração da chave principal. A versão anterior do jogo não deve voltar a ser publicada sobre saves v2, pois seu leitor v1 não conhece o novo formato.

## Conteúdo implementado

- 13 aeronaves em quatro tiers, três famílias de armas, compras e melhorias; tiers abrem a cada quatro missões.
- 30 missões configuradas com seis paletas/terrenos, dificuldade crescente e três classes de chefe com três fases por vida restante.
- 12 perfis de inimigo com velocidades, resistência e padrões distintos; vários compartilham o sprite-base. Tanques, torres e navios possuem arte específica.
- Quatro companheiros selecionáveis, dupla em formação e níveis individuais por tipo.
- Cinco dispositivos melhoráveis, três dificuldades e recompensas de vitória/derrota.
- Hangar, campanha, desafios, resgate diário por calendário local, configurações, pausa, vitória e derrota.
- Estrelas por integridade restante: três com 100% de vida, duas com pelo menos 45%, uma abaixo disso.
- Save em LocalStorage (`sky-strike`), sons e sequências musicais sintetizadas, fontes e arte locais.
- Pool de projéteis, emissor de partículas reutilizado e descarte de entidades fora do campo.

## Testes

```bash
npm test
npm run build
# Com npm run dev ativo em outro terminal:
npm run test:browser
# Com npm run preview -- --port 4173 ativo:
node tests/offline.mjs
```

Os testes de domínio cobrem economia, compra duplicada, upgrades, persistência, desbloqueio, migração v1/v2 e importação atômica de backups. O teste de navegador usa Playwright e `/usr/bin/chromium`; use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para outro executável. Capturas são geradas em `artifacts/` (ignorado pelo Git). A suíte verifica menus, teclado, mouse, toque emulado, habilidades, pausa, dano, fases de chefe, vitória, desbloqueio, derrota, reinício, filtros, favoritos, transparência dos 17 sprites, Tempestade Verde, recuperação de save e layouts em 1920×1080, 1366×768, 360×800, 390×844, 412×915 e tablet 768×1024. Para verificar transições de resultado de maneira determinística, o teste acelera a missão e altera a vida do chefe pelo acesso de diagnóstico disponível **somente no Vite de desenvolvimento**; ele não comprova o balanceamento de uma campanha completa.

## Estrutura

- `src/main.ts`: navegação, interface, inventário, recompensas e ligação com a batalha.
- `src/battle.ts`: cena Phaser, controles, armas, pool, IA, colisões, efeitos e chefes.
- `src/data.ts`: catálogo, campanha, economia, melhorias e modelo de save.
- `src/catalog.ts`: 13 aeronaves, raridades, descrições e companheiros.
- `src/ui/hangar.ts`: catálogo filtrável, comparação e equipamentos.
- `src/persistence.ts`: migração, cópias de recuperação e importação validada.
- `src/art/aircraft.ts`: 13 silhuetas detalhadas e quatro companheiros em SVG original.
- `src/art.ts`: acesso aos sprites, fortaleza, navio e veículos em SVG original.
- `src/world/rioRoute.ts`: linha do tempo e deslocamento absoluto da missão do Rio.
- `src/world/RioWorld.ts`: camadas, arte em chunks, água, nuvens e percurso do cenário.
- `src/audio.ts`: síntese sonora e sequências musicais.
- `src/style.css`: interface responsiva.
- `public/sw.js`: cache offline do build.
- `tests/`: testes de domínio e fluxos de navegador.

## Limites desta versão e próximas etapas

O escopo completo da Ultimate ainda não foi concluído; consulte [ROADMAP.md](ROADMAP.md) para a sequência técnica. Raridade é metadado visual nesta entrega e não muda os atributos antigos; a evolução por raridade ficará na etapa de balanceamento. Não há 60 aeronaves, 100 missões, 12 companheiros, novos modos, Gamepad API ou PWA instalável nesta entrega. O offline do build está preservado.

Esta é uma versão arcade funcional com arte vetorial própria, não uma reprodução da produção artística das referências. A missão do Rio usa um percurso ilustrado próprio; as outras 29 combinam o gerador compartilhado de ondas com os cenários procedurais existentes. Não são 30 mapas desenhados à mão. Chefes mudam densidade e ritmo dos ataques, mas não têm componentes destrutíveis independentes. Evolução por estrelas é automática por nível; não há árvore de fusão. Gemas são recompensas de conquistas, sem loja de gemas. O desafio diário é um resgate, não uma lista renovada de objetivos. Ainda não há testes de balanceamento integral das 30 missões, benchmark de 60 FPS em celulares reais ou teste de áudio em dispositivos físicos. O build avisa sobre o tamanho do bundle do Phaser; isso não impede a compilação.
