# Plano de Refatoração do Synergia OS

Este documento descreve o roteiro para refatorar e melhorar a arquitetura do código do aplicativo Synergia OS. As mudanças serão aplicadas em fases para garantir estabilidade e segurança.

## Fase 1: Fundações de UI e Navegação

**Objetivo:** Implementar uma navegação em abas para permitir a troca rápida entre funcionalidades e adicionar um sistema de navegação "Voltar" mais intuitivo.

**Roteiro:**

1.  **Implementar Navegação em Abas:**
    *   Refatorar o `AppLayout` e o `page.tsx` para suportar um sistema de abas dinâmicas.
    *   Cada item de menu principal abrirá em uma nova aba, mantendo o estado da anterior.
    *   Utilizar o Zustand para gerenciar as abas ativas e seus estados.

2.  **Adicionar Botão "Voltar" Inteligente:**
    *   Integrar ao gerenciador de estado um histórico de navegação simples.
    *   Adicionar um componente de "Voltar" no `AppLayout` que utilize esse histórico para retornar à "view" anterior, evitando o uso constante do menu lateral.

**Benefícios:**
*   **Multitarefa Real:** Usuários poderão alternar entre o cadastro de uma garantia e a consulta de um produto sem perder dados.
*   **Navegação Fluida:** Reduz o número de cliques necessários para navegar entre seções relacionadas.

---

## Fase 2: Melhorias de Usabilidade nas Garantias

**Objetivo:** Enriquecer as telas de "Lotes" e "Consulta" com mais informações e funcionalidades de gerenciamento em massa.

**Roteiro:**

1.  **Cards de Lote Informativos:**
    *   Na `LotesSection.tsx`, calcular e exibir contadores para cada lote: total de itens, itens aprovados, recusados, pagos e pendentes.

2.  **Gerenciamento em Massa nos Detalhes do Lote:**
    *   No `LoteDetailSection.tsx`, adicionar checkboxes para selecionar múltiplos itens.
    *   Criar um menu de ação para "Alterar Status em Massa" para os itens selecionados.
    *   Adicionar um destaque visual (cor de fundo) nas linhas da tabela de acordo com o status da garantia.

3.  **Novos Status e Filtros:**
    *   Adicionar os status "Aguardando Envio" e "Enviado para Análise".
    *   Atualizar a tela `QuerySection.tsx` para permitir a filtragem por cliente e um modo de visualização "Todas as Garantias" (incluindo as que já estão em lotes).

**Benefícios:**
*   **Visão Rápida:** O usuário saberá o estado de um lote sem precisar abri-lo.
*   **Produtividade:** Ações em massa economizam tempo e reduzem cliques repetitivos.
*   **Clareza no Fluxo:** Os novos status e filtros tornam o processo de garantia mais transparente.

---

## Fase 3: Melhorias de Fluxo de Cadastro e Consulta

**Objetivo:** Otimizar a performance e o fluxo de trabalho nas telas de cadastro e consulta.

**Roteiro:**

1.  **Manter na Tela de Cadastro:**
    *   Modificar a lógica no `AppStore` e nos componentes `RegisterSection`/`DevolucaoRegisterSection` para que, após salvar, o formulário seja limpo, mas o usuário permaneça na mesma tela.
    *   Criar um novo componente lateral que exibirá uma lista simples dos itens cadastrados na sessão atual (ou no dia).

2.  **Otimizar Telas de Consulta:**
    *   Alterar as seções `QuerySection` e `DevolucaoQuerySection` para que, por padrão, carreguem apenas os registros dos últimos 7 ou 30 dias.
    *   Manter os filtros de data para que o usuário possa buscar períodos mais antigos se necessário.

**Benefícios:**
*   **Lançamento Rápido:** O usuário pode cadastrar dezenas de itens em sequência sem interrupções.
*   **Performance Aprimorada:** As telas de consulta carregarão quase que instantaneamente.

---

## Fase 4: Busca Inteligente e Melhorias de UI

**Objetivo:** Implementar uma busca mais flexível em todo o sistema e aplicar a paleta de cores para enriquecer a interface.

**Roteiro:**

1.  **Busca Aprimorada nas Telas de Consulta:**
    *   **Produtos (`ProductsSection`):** Modificar a lógica para que a busca verifique o termo no `código` e na `descrição`.
    *   **Clientes/Mecânicos (`PersonsSection`):** Atualizar a busca para funcionar para o campo `nome` (Razão Social) e também para o `nomeFantasia`.

2.  **Busca Inteligente nos Formulários de Cadastro:**
    *   **Garantias (`RegisterSection`):** Aprimorar a busca de produto para permitir encontrar um item pela descrição, não apenas pelo código.
    *   **Devoluções (`DevolucaoRegisterSection`):** Aplicar a mesma melhoria na busca de produtos da tela de devoluções.

3.  **Cards Coloridos:**
    *   Aplicar a paleta de cores do sistema (primária, azul, verde, laranja) aos cards de resumo no **Dashboard** e aos cards de **Lotes de Garantia**.
    *   As cores serão usadas para destacar o status ou a categoria, tornando a identificação visual mais rápida e intuitiva.

**Benefícios:**
*   **Busca Flexível e Rápida:** Encontrar registros se torna mais fácil em todo o sistema, agilizando o fluxo de trabalho.
*   **Interface mais Rica:** O uso estratégico de cores melhora a experiência do usuário e a leitura rápida das informações.