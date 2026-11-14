# Ultimate Brazil 2.5D — entregas em etapas

## Etapa atual concluída: 1 — missão do Rio

Operação Guanabara (ID 0): arte original de costa/cidade/relevo, água animada, nuvens e sombras, cinco trechos sem repetição, desaceleração no Corcovado, sobrevoo do Cristo e chefe depois do marco. Saves e as outras 29 missões preservados. Registros e comandos de validação estão no README e nos testes `rio-route`/`rio-browser`.

A referência visual é Rio em perspectiva aérea 2.5D. O mapa é uma interpretação artística; não usamos as fotografias anexadas como assets. A arte otimizada está versionada com o código.

## Próximas entregas do pedido Brazil 2.5D

2. **Aeronaves, combate e HUD:** partir dos 13 aviões e quatro companheiros já redesenhados; revisar inimigos/bombardeiros, fumaça e impacto sem reduzir a leitura dos projéteis. Manter testes de textura, alocação e HUD.
3. **BR-29, lobby e hangar:** BR-29 e Tempestade Verde já funcionam; preservar IDs e upgrades. Acrescentar ambientação brasileira ao hangar e lobby sem substituir os filtros/compra/comparação existentes por telas decorativas.
4. **Arsenal/loadouts/campo de teste:** adicionar catálogo de armas, posse e evolução 1–5; migrar saves v2 por aeronave com a arma antiga como default. Testar custo, compatibilidade, DPS real, visual das montagens e a impossibilidade de equipar item não possuído. Só anunciar armas com comportamento implementado. Campo de teste separado da economia/campanha.
5. **Chefes, objetos, mapas brasileiros e áudio:** primeiro implementar partes destrutíveis em um chefe existente com arma que para ao ser destruída; depois expandir Amazônia/Pantanal/Brasília/Foz com objetivos e rotas próprias. Não duplicar a fase do Rio apenas mudando cor.
6. **Polimento e publicação de cada entrega:** build, domínio, navegador, desktop/mobile, offline e caminho do Pages. Publicação por workflow existente; confirmar deploy pelo GitHub e HTTPS quando o acesso estiver disponível. Testes em Android/Safari físico e benchmark continuam necessários antes de prometer 60 FPS nesses aparelhos.

Cada entrega deve ficar jogável, com testes e commit próprios. Não avançar para uma expansão de conteúdo deixando regressões abertas na etapa atual. A entrega 1 não inclui o arsenal, os loadouts, o campo de teste ou outros mapas brasileiros.

---

## Plano mais amplo da Ultimate anterior (continuidade)

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
