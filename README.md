# SKY STRIKE 1945 — Ultimate Brazil 2.5D · 1.3.0

Shoot ’em up vertical original em **Phaser 3, TypeScript e Vite**, com campo lógico de 540 × 960, interface em português e controles para PC e celular. Esta versão reúne o arsenal customizável, loadouts por aeronave, treino gratuito, seis mapas brasileiros, partes destrutíveis de chefes, hangar ilustrado, áudio dinâmico e PWA.

O conteúdo jogável atual é **13 aeronaves, 30 missões, quatro companheiros e cinco dispositivos legados**, além dos **31 armamentos** do novo arsenal. Os IDs antigos e a progressão existente foram preservados. A expansão anterior para 60 aeronaves e 100 missões não faz parte do conteúdo disponível nesta versão.

## Instalação e execução

Requer Node.js 20.19+ ou 22.12+; validado com Node 24.

```bash
npm install
npm run dev
```

O Vite escuta em `0.0.0.0:5173`. Se o cache padrão do npm não for gravável neste ambiente, use `npm install --cache /workspace/.npm-cache`.

```bash
npm run build
npm run preview
```

O build fica em `dist/` e funciona em hospedagem estática. Não abra o HTML por `file://`. O jogo não exige backend, conta, API paga ou serviços externos durante as partidas; fontes, sprites, mapas e sons ficam no projeto.

## Começar a jogar

1. No **Hangar**, escolha sua aeronave. A P-41 Sentinel começa desbloqueada e há 1.200 moedas iniciais.
2. Abra o **Arsenal** para comprar armamentos, melhorar seus níveis e equipar os cinco slots da aeronave.
3. Use o **Campo de teste** para experimentar qualquer um dos 31 armamentos e seus níveis de 1/5 a 5/5, sem comprar ou gastar recursos.
4. Na **Campanha**, vença missões para receber moedas e liberar a próxima fase. Volte ao hangar ou arsenal para evoluir seu equipamento.

| Ação                               | Controle                                                 |
| ---------------------------------- | -------------------------------------------------------- |
| Mover                              | WASD, setas ou movimento do mouse dentro do campo        |
| Mover no celular                   | Arrastar; deslocamento acima do dedo ajustável em Opções |
| Disparo principal e armas das asas | Automático                                               |
| Especial do loadout                | Espaço ou botão na tela                                  |
| Tático do loadout                  | T ou botão na tela                                       |
| Cinco dispositivos legados         | Teclas 1–5 ou respectivos botões, conforme equipamento   |
| Pausar/continuar                   | Esc ou botão II                                          |

Os especiais, táticos e dispositivos possuem recargas. A partida pausa ao perder foco. As opções incluem resposta do ponteiro, deslocamento do avião acima do dedo, HUD ampliado, tremor de câmera e efeitos reduzidos.

## Arsenal e loadouts

Cada aeronave possui uma configuração salva separadamente: **principal, asa esquerda, asa direita, especial e tático**. Armas secundárias podem ser combinadas nas duas asas; as montagens aparecem na prévia e na batalha. Comprar uma arma não a equipa automaticamente: escolha o slot desejado no catálogo.

| Categoria    | Quantidade | Armamentos                                                                                                                        |
| ------------ | ---------: | --------------------------------------------------------------------------------------------------------------------------------- |
| Principais   |         10 | Metralhadora simples, dupla, canhão triplo, minigun, shotgun aérea, canhão pesado, laser, plasma, raio elétrico e canhão quântico |
| Armas de asa |          7 | Foguetes, mísseis guiados, bombas, pods de metralhadora, plasma lateral, dispersores elétricos e drones                           |
| Especiais    |          8 | Bomba, EMP, onda de choque, ataque orbital, Destruidor Ômega, Tempestade Verde, barragem de mísseis e super laser                 |
| Táticos      |          6 | Escudo, reparação, turbo, refletor, barreira e campo de desaceleração                                                             |

Os níveis de arma são individuais no inventário e vão de **1/5 a 5/5**; melhorar uma arma beneficia as aeronaves que a equiparem. Dano, cadência, efeitos e força/duração aplicável evoluem de verdade. O catálogo mostra dano por disparo, cadência, DPS estimado, nível, custo e comparação com o equipamento atual. DPS é uma estimativa do padrão: acertos, explosões, alcance e quantidade de alvos alteram o resultado de uma batalha.

O treino utiliza o mesmo sistema de armas da campanha. Seus seletores permitem trocar armamento e nível durante a sessão; o reinício repõe os alvos. Treinar não muda moedas, recompensas, desbloqueios ou o loadout salvo.

Os cinco dispositivos anteriores — bomba, escudo, laser, mísseis e reparação — foram mantidos com seus níveis e teclas. Eles coexistem com os slots especial e tático do novo arsenal.

## Campanha brasileira e combate

As seis primeiras missões receberam rotas próprias, sem mudar seus IDs, duração, recompensas ou requisitos de desbloqueio. As outras **24 missões** continuam disponíveis com seus cenários existentes.

| ID  | Missão                       | Percurso                                                                            |
| --- | ---------------------------- | ----------------------------------------------------------------------------------- |
| 0   | Operação Guanabara           | Oceano, costa de Copacabana, mata do Corcovado, sobrevoo do Cristo e defesa da baía |
| 1   | Operação Rio Negro           | Rio amazônico, pontes na floresta, pista camuflada e posto militar                  |
| 2   | Operação Águas Douradas      | Alagados do Pantanal, passarelas, palafitas e forte ao pôr do sol                   |
| 3   | Operação Eixo Monumental     | Avenidas de Brasília, arquitetura moderna, espelhos d’água e comando tecnológico    |
| 4   | Operação Garganta do Diabo   | Cânion do Iguaçu, cataratas, pontes e complexo hidrelétrico                         |
| 5   | Operação Fortaleza Atlântica | Mar aberto, arquipélago, muralhas costeiras e porto fortificado                     |

Os mapas são arte original em perspectiva aérea 2.5D, com água animada, nuvens, sombras e elementos de cenário. São interpretações artísticas, não mapas cartográficos. As camadas do mundo se deslocam sem mover a câmera de combate ou alterar as coordenadas de colisão. Apenas o mapa selecionado é carregado na GPU; os cinco novos WebP têm 512 × 1536 e somam cerca de 1,4 MB.

No Corcovado, a rolagem desacelera, a música muda e novas ondas dão espaço ao marco; o chefe entra depois do sobrevoo. O Cristo é apenas paisagem: não possui vida, arma, alvo ou colisão.

Os três arquétipos — **Fortaleza Voadora, Encouraçado de Guerra e Máquina de Destruição** — possuem três fases e partes independentes: canhão esquerdo, canhão direito e reator. Destruir um canhão interrompe os seus disparos. Ataques são anunciados visualmente, e o HUD mostra vida, fase e situação de cada parte.

Os 12 perfis de inimigos, tanques, torres e navios continuam na campanha. Cenários incluem construções e veículos decorativos; nem todo objeto ilustrado é um alvo destrutível. Estrelas e recompensas continuam ligadas ao resultado da missão, com proteção contra duplicação da tela de resultado.

## Aeronaves, hangar e apresentação

As 12 aeronaves originais mantêm seus IDs 0–11; o **BR-29 Falcão do Brasil** usa o ID 12, custa 650 moedas e pode ser comprado desde o início. A Tempestade Verde possui rajadas auriverdes e finalização com mísseis guiados. As aeronaves têm sprites transparentes, cockpit, armamento, painéis, sombras e inclinação em movimento.

O lobby e o hangar usam arte original de uma base brasileira. O hangar mantém pesquisa, filtros, favoritos, comparação, compra, equipamento e melhorias; o arsenal acrescenta a montagem visual das armas. Raridade é metadado visual e não altera os atributos antigos por si só.

Os quatro companheiros mantêm níveis por tipo: Wasp, Kite, Ghost e Lynx. A formação atual continua sendo uma dupla do tipo selecionado. O HUD apresenta vida numérica/percentual, estado estável/atenção/crítico, alerta sonoro e barra azul de escudo.

## Áudio, qualidade e aplicativo instalável

O Web Audio sintetiza sons e trilhas originais para lobby, hangar, campanha, batalha, treino, chefe, trecho do Cristo e resultados. Há barramentos separados para **volume geral, música, efeitos e interface**, limite de vozes e redução da música na pausa. O navegador desbloqueia o áudio após uma interação do jogador.

Em **Opções**, a qualidade pode ser baixa, média ou alta. O modo baixo busca 30 FPS e reduz efeitos; o médio usa uma densidade intermediária de partículas e fumaça, e o alto usa a densidade completa. Médio e alto usam alvo de 60 FPS em hardware compatível. Isso define o comportamento do jogo, sem garantir essa taxa em todo aparelho.

O build inclui manifesto, ícones e service worker para instalação como **PWA**, sem tornar a instalação obrigatória:

- No Chrome compatível, use a opção **Instalar app** do navegador; o botão do jogo aparece quando o navegador disponibiliza a instalação.
- No Safari do iPhone/iPad, use **Compartilhar → Adicionar à Tela de Início** quando disponível.

O funcionamento offline exige o primeiro carregamento completo em HTTPS ou localhost. O service worker prepara os mapas, arte do hangar e recursos do aplicativo e mantém cache dos arquivos carregados. O armazenamento de progresso permanece local ao navegador/origem.

## Salvamento e recuperação

A chave continua sendo **`sky-strike`**. Saves v1 e v2 migram para **v3**, preservando moedas, gemas, IDs, aeronaves, seleção, níveis, companheiros, dispositivos, missões, estrelas, estatísticas e configurações. A migração acrescenta o arsenal e cria loadouts compatíveis com o equipamento anterior.

Antes de migrar, o valor original é guardado em `sky-strike.backup-v1` ou `sky-strike.backup-v2`. Em **Opções**, é possível exportar/importar JSON. A importação valida posse, categorias, slots, níveis e dados financeiros; um arquivo inválido não substitui o progresso. Antes de uma importação válida, a cópia anterior fica em `sky-strike.before-import`.

Se um save não puder ser lido, o jogo abre a recuperação e preserva os dados. É possível baixar o original, restaurar uma cópia anterior ou importar um backup. Criar um progresso novo é uma ação explícita e guarda o valor ilegível em `sky-strike.unreadable`. Evite republicar leitores antigos sobre saves v3, pois versões anteriores desconhecem a estrutura atual.

## Validação

```bash
npm test
npm run build
# Com npm run dev ativo em outro terminal:
npm run test:browser
# Com npm run preview -- --port 4173 ativo:
node tests/offline.mjs
```

A validação desta entrega reúne **28 testes de domínio**, build e **cinco suítes de navegador**: fluxo base, Ultimate, Rio/mapas brasileiros, arsenal/treino/chefes e apresentação/áudio. Ela cobre economia, posse/compra duplicada, upgrades 1–5, loadouts, saves v1/v2/v3, recuperação, controle de recursos, fases/partes dos chefes e as telas de resultado.

Os testes de interface usam Chromium/Playwright e incluem teclado, mouse, toque emulado, seis resoluções (1920×1080, 1366×768, 360×800, 390×844, 412×915 e tablet 768×1024), treino sem custo e reabertura offline em produção. Alguns testes avançam o relógio ou ajustam a vida de alvos pela interface de diagnóstico exclusiva do Vite de desenvolvimento para verificar transições de forma determinística.

Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para outro Chromium. Os testes de navegador aceitam `SKY_STRIKE_DEV_URL` quando indicado pela suíte; o offline aceita `SKY_STRIKE_TEST_URL` para conferir o caminho do GitHub Pages. As capturas ficam em `artifacts/`, ignorado pelo Git.

## Estrutura

- `src/main.ts`: navegação, telas, treino, recompensas e ligação com o Phaser.
- `src/data.ts`, `src/catalog.ts`, `src/persistence.ts`: campanha, aeronaves, economia e migração segura.
- `src/arsenal.ts`: 31 armamentos, níveis, compra, compatibilidade e loadouts.
- `src/ui/arsenal.ts`, `src/ui/hangar.ts`: catálogo, comparação e prévias.
- `src/battle.ts`: combate, inimigos, colisões, partes dos chefes e treino.
- `src/combat/WeaponSystem.ts`: comportamento compartilhado das armas na campanha e no campo de teste.
- `src/world/`: rotas, cenários, água, névoa e sombras.
- `src/art/`, `public/assets/`: sprites e arte original otimizada; arquivos `ART.md` descrevem os recursos.
- `src/audio.ts`: síntese, trilhas e barramentos de volume.
- `public/manifest.webmanifest`, `public/icons/`, `public/sw.js`: instalação PWA e cache offline.
- `tests/`: domínio, regressões, navegador e offline.

## Publicação e próximos mapas

O workflow existente em `.github/workflows/pages.yml` prepara e publica `dist/` no GitHub Pages a cada envio à `main`. O endereço configurado é [eduzimps.github.io/jogo-mate-ou-morra](https://eduzimps.github.io/jogo-mate-ou-morra/).

O workflow executa testes de domínio, build, cinco suítes de navegador e offline antes de publicar. Depois da publicação, o job **Verify published game in Chromium** abre o endereço HTTPS, inicia os seis mapas brasileiros e testa o arsenal/treino sem rede. Acompanhe o resultado no [workflow](https://github.com/Eduzimps/jogo-mate-ou-morra/actions/workflows/pages.yml); um envio de código só é considerado validado publicamente quando todos os jobs terminam com sucesso.

O pedido permite criar **ou planejar** os outros mapas brasileiros; os planos da Base Aérea Noturna, Serra, Zona Industrial e Arquipélago estão no [ROADMAP.md](ROADMAP.md). Eles não aparecem como mapas novos já disponíveis. Permanecem como validações externas o teste em Android/Safari físicos, a medição de FPS/temperatura em aparelhos reais e a revisão do balanceamento integral das 30 missões. O build pode avisar sobre o tamanho do bundle do Phaser sem impedir a compilação.
