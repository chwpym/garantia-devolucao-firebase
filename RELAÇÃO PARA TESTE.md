# Guia de Testes - Suite Fiscal

Para garantir que a estabilização foi 100% eficaz, utilize este checklist focado tanto na identidade visual quanto na integridade dos dados.

## 1. Testes Globais (Em todas as telas)
- [ ] **Troca de Tema:** Alterne entre Light e Dark Mode. Verifique se todos os textos continuam legíveis e se não existem "bordas brancas" ou "fundos cinzas" que não combinam com o tema selecionado.
- [ ] **Importação Lote:** No topo de qualquer calculadora, use o botão "Importar XML" e selecione 3 ou mais arquivos `.xml` simultaneamente. Verifique se o contador de arquivos no topo atualiza corretamente (ex: "3 XMLs").
- [ ] **Persistência de Estado:** Importe um XML na primeira calculadora, mude para outra e volte. Os itens da nota devem permanecer carregados.

## 2. Testes por Módulo

### A. Origem de Mercadoria (`nfe-origin-calculator.tsx`)
- [ ] **Tabela:** Verifique se a tabela exibe corretamente os códigos de 0 a 8.
- [ ] **Modal:** Clique no botão "Legenda de Origens" e veja se o modal abre com o estilo novo (bordas arredondadas e fundo escuro se estiver no Dark Mode).

### B. Simulador de Compra (`purchase-simulator-calculator.tsx`)
- [ ] **Edição:** Altere a "Quantidade Simulada" de um item. O campo deve ter um fundo levemente colorido para indicar que é editável.
- [ ] **Rateio Global:** Insira um valor no campo "Frete" do Rateio Global e clique em "Aplicar Rateio". O "Custo Un. Final" de todos os itens deve ser recalculado na hora.
- [ ] **Visibilidade:** Garanta que os cards de "Total Simulado" e "Diferença/Economia" no topo estejam com cores vibrantes e legíveis.

### C. Análise Técnica Pro (`advanced-cost-analysis-calculator.tsx`)
- [ ] **Regime Tributário:** Alterne o seletor entre "Lucro Real" e "Simples Nacional". Verifique se os créditos de PIS/COFINS aparecem/somem da tabela.
- [ ] **Reforma Tributária:** Ative o toggle "Simular Reforma Tributária". Se o XML tiver dados de IBS/CBS, o custo final deve ser impactado.

### D. Auditoria Fiscal de Entrada (`tax-analysis-calculator.tsx`)
- [ ] **Cards de Resumo:** Verifique se os cards (ICMS, IPI, PIS/COFINS) no topo estão alinhados e com as cores corretas (Verde para créditos, Vermelho para débitos).
- [ ] **Tooltip:** Passe o mouse sobre o valor de PIS/COF na tabela para ver o detalhamento da alíquota no popup.

### E. Comparador de XMLs (`nfe-comparator.tsx`)
- [ ] **Comparação:** Importe 2 XMLs do mesmo fornecedor (ou diferentes) e veja se ele lista os produtos lado a lado.
- [ ] **Precisão:** Verifique se o preço unitário está exibindo 4 casas decimais (ex: R$ 10,5432).

### F. Precificação em Lote (`batch-pricing.tsx`)
- [ ] **Cálculo Global:** Defina uma "Margem Global" (ex: 30%) e verifique se todos os preços de venda sugeridos são calculados automaticamente para a lista toda.

### G. Calculadoras Rápidas (Painel Inferior)
- [ ] **Preço Médio:** Insira valores manuais e veja se a média ponderada faz sentido.
- [ ] **Markup & Venda:** Teste se ao mudar o "Markup", o preço de venda atualiza instantaneamente.
- [ ] **Custo Unitário:** Verifique se a divisão simples está correta.
- [ ] **Porcentagem:** Teste cálculos rápidos para garantir que o estilo dos inputs está padronizado.

## Checklist de "Sentimento Premium"
- [ ] Os botões de "Exportar PDF" estão todos com o mesmo estilo?
- [ ] As tabelas têm efeito de hover (mudar de cor ao passar o mouse)?
- [ ] Os ícones no Painel Principal (`calculators-section`) estão coloridos ou seguem o tom do tema? (Devem seguir o tom `primary` agora).
- [ ] Ao clicar em "Voltar para o Painel", a transição é suave?

Se todos os itens acima estiverem marcados, a suite está pronta para produção!
