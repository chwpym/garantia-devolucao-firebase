# Plano de Refatoração do Synergia OS

Este documento descreve o roteiro para refatorar e melhorar a arquitetura do código do aplicativo Synergia OS. As mudanças serão aplicadas em fases para garantir estabilidade e segurança.

## Fase 1: Fundações de UI e Navegação

**Objetivo:** Implementar uma navegação em abas para permitir a troca rápida entre funcionalidades e adicionar um sistema de navegação "Voltar" mais intuitivo.

**Roteiro Detalhado:**

1.  **Implementar Navegação em Abas:**
    *   **Arquivo:** `src/store/app-store.ts`
        *   **Lógica:** Adicionar ao estado do Zustand um array para gerenciar as abas ativas (ex: `tabs: NavItem[]`) e uma variável para a aba atual (ex: `activeTabId: string`).
        *   **Ações:** Criar ações para `openTab`, `closeTab` e `setActiveTab`.
    *   **Arquivo:** `src/components/app-layout.tsx`
        *   **Lógica:** Adicionar um componente de `Tabs` (Shadcn) abaixo do cabeçalho principal para renderizar as abas ativas do `app-store`. Cada `TabTrigger` mostrará o ícone e o nome da aba. Adicionar um botão "fechar" em cada aba.
    *   **Arquivo:** `src/app/page.tsx`
        *   **Lógica:** Refatorar o `renderContent` para não usar mais um `switch` baseado em `activeView`, mas sim renderizar o componente correspondente à `activeTabId` dentro de um `TabsContent`.

2.  **Adicionar Botão "Voltar" Inteligente:**
    *   **Arquivo:** `src/store/app-store.ts`
        *   **Lógica:** Adicionar um array para o histórico de navegação (ex: `navigationHistory: string[]`).
        *   **Ações:** Modificar a ação `setActiveView` (ou `setActiveTab`) para registrar a navegação no histórico. Criar uma ação `goBack` que remove o último item do histórico e define a nova view/tab ativa.
    *   **Arquivo:** `src/components/app-layout.tsx`
        *   **Lógica:** Adicionar um componente de botão "Voltar" no cabeçalho. O botão ficará visível apenas quando `navigationHistory.length > 0` e, ao ser clicado, chamará a ação `goBack`.

**Benefícios:**
*   **Multitarefa Real:** Usuários poderão alternar entre o cadastro de uma garantia e a consulta de um produto sem perder dados.
*   **Navegação Fluida:** Reduz o número de cliques necessários para navegar entre seções relacionadas.

---

## Fase 2: Melhorias de Usabilidade nas Garantias

**Objetivo:** Enriquecer as telas de "Lotes" e "Consulta" com mais informações e funcionalidades de gerenciamento em massa.

**Roteiro Detalhado:**

1.  **Cards de Lote Informativos:**
    *   **Arquivo:** `src/components/sections/lotes-section.tsx`
    *   **Lógica:** Na função `loadData`, após buscar os lotes e as garantias, criar um mapa para contar os itens de cada lote e seus status.
    *   **UI:** Modificar o JSX do card do lote para exibir os novos contadores (Total de itens, Aprovados, Recusados, Pagos, Pendentes).

2.  **Gerenciamento em Massa nos Detalhes do Lote:**
    *   **Arquivo:** `src/components/sections/lote-detail-section.tsx`
    *   **Lógica:**
        *   Adicionar um estado (`useState`) para armazenar os IDs das garantias selecionadas (`selectedWarrantyIds`).
        *   Adicionar uma `Checkbox` na `TableHead` para selecionar/desselecionar todos os itens.
        *   Adicionar uma `Checkbox` em cada `TableRow` para seleção individual.
    *   **UI:**
        *   Criar um menu de ação (`DropdownMenu`) que fica visível quando `selectedWarrantyIds.size > 0`.
        *   Adicionar itens no menu para "Alterar Status em Massa" (Aprovada, Recusada, etc.).
        *   Implementar destaque visual (cor de fundo) nas linhas da tabela (`TableRow`) com base no `status` da garantia, usando `data-state` ou `className`.

3.  **Novos Status e Filtros:**
    *   **Arquivo:** `src/lib/types.ts`
        *   **Lógica:** Adicionar os status "Aguardando Envio" e "Enviado para Análise" ao tipo `WarrantyStatus`.
    *   **Arquivo:** `src/components/sections/query-section.tsx`
        *   **Lógica:**
            *   Adicionar um filtro de `Combobox` para `cliente`.
            *   Modificar a lógica de `filteredWarranties` para incluir o filtro por cliente.
            *   Adicionar uma `Checkbox` "Mostrar garantias já em lotes" e ajustar o filtro para incluir ou não itens com `loteId`.

**Benefícios:**
*   **Visão Rápida:** O usuário saberá o estado de um lote sem precisar abri-lo.
*   **Produtividade:** Ações em massa economizam tempo e reduzem cliques repetitivos.
*   **Clareza no Fluxo:** Os novos status e filtros tornam o processo de garantia mais transparente.

---

## Fase 3: Melhorias de Fluxo de Cadastro e Performance

**Objetivo:** Otimizar a performance e o fluxo de trabalho nas telas de cadastro e consulta.

**Roteiro Detalhado:**

1.  **Manter na Tela de Cadastro:**
    *   **Arquivo:** `src/store/app-store.ts`
        *   **Lógica:** Modificar a ação `handleWarrantySave` para não mudar mais a `activeView`.
    *   **Arquivo:** `src/components/sections/register-section.tsx` e `devolucao-register-section.tsx`
        *   **Lógica:** Após salvar um item com sucesso (na função `handleSave` ou `onSubmit`), em vez de navegar, apenas limpar o formulário com `form.reset()`.
    *   **UI:** Criar um novo componente (ex: `RecentItemsList.tsx`) que será renderizado em uma barra lateral ou em um card na tela de cadastro. Este componente buscará e exibirá uma lista simples (ex: "Código: 123, Cliente: ABC") dos itens cadastrados no dia.

2.  **Otimizar Telas de Consulta:**
    *   **Arquivo:** `src/components/sections/query-section.tsx` e `devolucao-query-section.tsx`
    *   **Lógica:** Na função `loadData`, modificar a busca inicial no `useEffect` para que, por padrão, o `dateRange` inicial seja dos últimos 30 dias.
    *   **UI:** Manter os filtros de data (`DatePickerWithRange`) visíveis para que o usuário possa limpar o filtro ou selecionar um período mais antigo se desejar.

**Benefícios:**
*   **Lançamento Rápido:** O usuário pode cadastrar dezenas de itens em sequência sem interrupções.
*   **Performance Aprimorada:** As telas de consulta carregarão quase que instantaneamente.

---

## Fase 4: Busca Inteligente e Melhorias de UI

**Objetivo:** Implementar uma busca mais flexível em todo o sistema e aplicar a paleta de cores para enriquecer a interface.

**Roteiro Detalhado:**

1.  **Busca Aprimorada nas Telas de Consulta:**
    *   **Arquivo:** `src/components/sections/products-section.tsx`
        *   **Lógica:** Na função `useMemo` que calcula `filteredProducts`, modificar a lógica de `filter` para que a busca verifique o termo no `código` e na `descrição`.
    *   **Arquivo:** `src/components/sections/persons-section.tsx`
        *   **Lógica:** Na função `useMemo` de `filteredPersons`, atualizar a busca para funcionar para o campo `nome` (Razão Social) e também para o `nomeFantasia`.

2.  **Busca Inteligente nos Formulários de Cadastro:**
    *   **Arquivo:** `src/components/warranty-form.tsx` (Garantias) e `src/components/sections/devolucao-register-section.tsx` (Devoluções)
        *   **Produtos:** Na lógica do `Popover` ou `Command` de busca de produtos, alterar a função de filtro para que ela busque o termo digitado tanto no `codigo` quanto na `descricao` da lista de produtos.
        *   **Clientes/Mecânicos:** Na lógica do componente `Combobox`, aprimorar o filtro para que ele verifique o `nome` e o `nomeFantasia` ao buscar na lista de pessoas.
    *   **Arquivo:** `src/components/sections/batch-register-section.tsx` (Garantia em Lote)
        *   **Lógica:** Aplicar a mesma melhoria de busca de clientes/mecânicos no `Combobox` usado nesta tela.

3.  **Cards Coloridos e Visualmente Informativos:**
    *   **Arquivo:** `src/components/sections/dashboard-section.tsx`
        *   **UI:** Aplicar a paleta de cores do sistema (verde para aprovado, vermelho para recusado, amarelo para pendente) às classes Tailwind dos componentes `Card` de resumo de Garantias e Devoluções. Isso pode ser feito adicionando `className` com `border-green-500`, `text-green-500`, etc.
    *   **Arquivo:** `src/components/sections/lotes-section.tsx`
        *   **UI:** Modificar a `className` do componente `Card` de cada lote para incluir uma cor de borda diferente com base no seu `status` (ex: `border-primary` para "Enviado", `border-destructive` para "Recusado").
    *   **Arquivo:** `src/components/sections/calculators-section.tsx`
        *   **UI:** Utilizar as cores de destaque (`accent-blue`, `accent-green`, `third`) nos ícones ou em uma pequena tag dentro de cada `Card` de calculadora para diferenciá-las visualmente.

**Benefícios:**
*   **Busca Flexível e Rápida:** Encontrar registros se torna mais fácil em todo o sistema, agilizando o fluxo de trabalho.
*   **Interface mais Rica:** O uso estratégico de cores melhora a experiência do usuário e a leitura rápida das informações, tornando o sistema mais agradável e profissional.
