# Cenários brasileiros originais

Cinco ambientes originais gerados para SKY STRIKE 1945 em novembro de 2026. São interpretações artísticas em perspectiva aérea 2.5D, não mapas cartográficos ou fotografias. Não usam recursos de jogos comerciais.

- `amazon.webp`: Rio Negro, mata tropical, ponte e pista militar camuflada.
- `pantanal.webp`: alagados ao pôr do sol, passarelas, palafitas e posto fortificado.
- `brasilia.webp`: avenidas, arquitetura moderna inspirada no Eixo Monumental, espelhos d’água e centro tecnológico.
- `iguacu.webp`: cânion, cataratas em vários níveis, pontes e complexo hidrelétrico.
- `atlantic.webp`: mar aberto, ilhas, muralhas costeiras, porto e fortaleza naval.

Cada textura distribuída possui 512 × 1536 pixels. O conjunto fica abaixo de 2 MB; o motor carrega apenas a região da missão selecionada e acrescenta reflexos de água, névoa, sombras, barcos e tráfego em camadas. O rio e a catarata recebem movimento adicional no renderizador.

As artes Amazônia/Pantanal e Brasília/Iguaçu foram geradas como folhas de duas colunas e separadas em arquivos independentes; a conversão para WebP otimiza sua distribuição. Os originais do workspace estão em `generated_images/exec-8c23ed56-5ca8-49a4-ae6b-bdce04af7c45.png`, `generated_images/exec-c4b5d375-6c9a-4d45-bcc8-3e3e21fc4da9.png` e `generated_images/exec-2ed33780-c648-49a7-b87d-d37d8de02809.png`. Esses originais não são dependências do build: todos os arquivos necessários estão neste diretório.
