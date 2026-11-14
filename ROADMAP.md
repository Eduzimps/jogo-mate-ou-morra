# Ultimate — continuidade técnica

## Entregue nesta atualização

Primeira atualização de qualidade visual e interface: 12 aeronaves redesenhadas, BR-29 jogável com Tempestade Verde, quatro companheiros redesenhados, novo hangar e lobby, HUD visível e opções mobile. Migração segura, recuperação e backups foram antecipados porque protegem o progresso antes da expansão.

O catálogo possui 13 aeronaves, quatro companheiros, cinco dispositivos e as 30 missões existentes. A raridade é visual nesta etapa. Os sprites são vetores originais; não são recortes das referências nem uma promessa de equivalência artística com um jogo comercial.

## Etapa 2: coleção brasileira e sistemas de progressão

1. Reservar IDs 13–23 para as outras 11 brasileiras; manter 0–11 e BR-29 ID 12 imutáveis. Cada adição deve incluir silhueta própria em `art/aircraft.ts`, configuração no catálogo e teste de compra/equipamento/batalha/upgrades.
2. Extrair o trecho de disparo de `Battle.update` para `weapons.ts`. Definir padrões por dados com limites de projéteis, dano por segundo e cadência; preservar o desempenho das aeronaves antigas antes do rebalanceamento.
3. Definir potencial de raridade por dados e migração, sem reduzir níveis já adquiridos. Acrescentar atributos de upgrade independentes apenas com testes de efeito real no combate.
4. Adicionar companheiros IDs 4–11 e migrar a formação para dois slots independentes, preservando a dupla antiga como padrão. Testar formação, soma de dano e custo por tipo.
5. Generalizar habilidades com duração, recarga e ativação. Manter os cinco dispositivos e a Tempestade Verde existentes.

## Etapa 3: coleção completa

Clássicos IDs 24–35, modernos 36–47, experimentais 48–59. Não criar cartões ou nomes disponíveis antes de finalizar sprite, configuração, armas, seleção, compra e upgrades. Validar sprites transparentes e medir memória antes de aumentar o catálogo; manter thumbs pequenas e carregamento da aeronave equipada sob demanda.

## Etapa 4: campanha e chefes

1. Criar primeiro `BossPart` (HP, posição local, hitbox, arma e estado destruído) na Fortaleza Voadora. Um canhão destruído deve parar de atirar. Testar colisão, dano e mudança de padrão antes de adaptar os demais chefes.
2. Configurar dez encontros com telegráficos de ataques e trajetórias esquiváveis. Não anunciar dez chefes por apenas alterar cor ou nome.
3. Expandir missões com objetivos próprios (escolta, comboio, sobrevivência), mantendo IDs 0–29 e progresso. Adicionar 30–99 só com objetivos, ondas e duração revisados.
4. Implementar modos infinito, sobrevivência, boss rush, diário, tempo e treinamento, separados da recompensa/desbloqueio da campanha para evitar duplicação.

## Etapa 5: polimento

Áudio por barramento, trilhas originais mais variadas, tutorial opcional, personalização cosmética, novos desafios reais e PWA com manifesto/ícones/cache versionado. Gamepad API com mapeamento configurável e teste em controle físico. Cooperativo local permanece opcional após estabilidade.

## Portões de validação e publicação

- `npm test`, `npm run build`, `npm run test:browser`, `node tests/offline.mjs` com preview ativo.
- Saves v1 e v2 devem preservar moedas, gemas, IDs, seleção, níveis, equipamento, estrelas, missão e estatísticas.
- Conferir seis resoluções e combate/resultado/reinício. Emulação Chromium não comprova funcionamento em Safari iOS ou hardware Android real.
- Validar balanço e FPS em dispositivos reais antes de prometer 60 FPS ou campanha inteira balanceada.
- Publicação pelo workflow existente em `.github/workflows/pages.yml`. Enviar código ao GitHub não equivale a confirmar deploy; conferir a execução e o endereço HTTPS quando o acesso estiver disponível.
