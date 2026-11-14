# SKY STRIKE 1945

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

## Conteúdo implementado

- 12 aeronaves em quatro tiers, três famílias de armas, compras e melhorias; tiers abrem a cada quatro missões.
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

Os testes de domínio cobrem economia, compra duplicada, upgrades, persistência e desbloqueio. O teste de navegador usa Playwright e `/usr/bin/chromium`; use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para outro executável. Capturas são geradas em `artifacts/` (ignorado pelo Git). Ele verifica menus, teclado, mouse, toque emulado, habilidades, pausa, dano, fases de chefe, vitória, desbloqueio, derrota, reinício e layout mobile. Para verificar transições de resultado de maneira determinística, o teste acelera a missão e altera a vida do chefe pelo acesso de diagnóstico disponível **somente no Vite de desenvolvimento**; ele não comprova o balanceamento de uma campanha completa.

## Estrutura

- `src/main.ts`: navegação, interface, inventário, recompensas e ligação com a batalha.
- `src/battle.ts`: cena Phaser, controles, armas, pool, IA, colisões, efeitos e chefes.
- `src/data.ts`: catálogo, campanha, economia, melhorias e modelo de save.
- `src/art.ts`: aeronaves, fortaleza, navio e veículos em SVG original.
- `src/audio.ts`: síntese sonora e sequências musicais.
- `src/style.css`: interface responsiva.
- `public/sw.js`: cache offline do build.
- `tests/`: testes de domínio e fluxos de navegador.

## Limites desta versão

Esta é uma versão arcade funcional com arte vetorial própria, não uma reprodução da produção artística das referências. As 30 missões combinam um gerador compartilhado de ondas e seis cenários procedurais; não são 30 mapas desenhados à mão. Chefes mudam densidade e ritmo dos ataques, mas não têm componentes destrutíveis independentes. Evolução por estrelas é automática por nível; não há árvore de fusão. Gemas são recompensas de conquistas, sem loja de gemas. O desafio diário é um resgate, não uma lista renovada de objetivos. Ainda não há testes de balanceamento integral das 30 missões, benchmark de 60 FPS em celulares reais ou teste de áudio em dispositivos físicos. O build avisa sobre o tamanho do bundle do Phaser; isso não impede a compilação.
