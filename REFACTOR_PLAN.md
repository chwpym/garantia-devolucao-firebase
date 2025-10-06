# Plano de Refatoração do Synergia OS

Este documento descreve o roteiro para refatorar e melhorar a arquitetura do código do aplicativo Synergia OS. As mudanças serão aplicadas em fases para garantir estabilidade e segurança.

## Fase 1: Centralizar a Lógica de NF-e com o Hook `useNfeParser`

**Objetivo:** Eliminar a repetição de código nas calculadoras que processam XML de NF-e, centralizando a lógica de importação e processamento.

**Roteiro:**

1.  **Criação do Hook:**
    *   Criar um novo arquivo: `src/hooks/use-nfe-parser.ts`.
    *   Mover a lógica de `FileReader`, `fast-xml-parser` e extração de dados da NF-e para este hook.
    *   O hook retornará o estado da importação (`isLoading`, `fileName`), os dados extraídos (`nfeData`) e uma função para iniciar a importação (`handleFileImport`).

2.  **Refatoração Gradual das Calculadoras:**
    *   Substituir a lógica de importação duplicada em cada calculadora (`CostAnalysisCalculator`, `AdvancedCostAnalysisCalculator`, etc.) por uma chamada ao novo hook `useNfeParser`.

**Benefícios:**
*   **Código mais Limpo e Conciso:** Componentes focados em seus cálculos específicos.
*   **Manutenção Simplificada:** Alterações na lógica de parsing de NF-e são feitas em um único lugar.
*   **Redução de Bugs:** Menor risco de erros por código duplicado.

---

## Fase 2: Implementar o Gerenciamento de Estado Global com Zustand

**Objetivo:** Criar um "cérebro" central para o estado da aplicação, simplificando o `page.tsx` e preparando o terreno para a Fase 3.

**Roteiro:**

1.  **Instalação e Configuração do Zustand:**
    *   Adicionar a biblioteca `zustand` ao `package.json`.
    *   Criar um novo arquivo para o nosso "store" global: `src/store/app-store.ts`.

2.  **Criação do Store:**
    *   Definir o estado inicial, incluindo `activeView`, `isMobileMenuOpen`, e IDs de itens em edição.
    *   Criar as "ações" para modificar esse estado, como `setActiveView` e `toggleMobileMenu`.

3.  **Integração com a Aplicação:**
    *   No `src/app/page.tsx`, substituir o uso do `useState` pela chamada ao novo store do Zustand (`useAppStore`).
    *   A lógica de navegação e manipulação de estado será movida de `page.tsx` para os componentes relevantes ou para o próprio store.
    *   Componentes como `AppLayout` e `MobileSidebar` passarão a consumir o estado diretamente do store, em vez de receber props.

**Benefícios:**
*   **Componentes Desacoplados:** Cada parte do sistema pode acessar e modificar o estado de forma independente.
*   **Melhor Performance:** Evita re-renderizações desnecessárias em cascata.
*   **Código Organizado:** A lógica de estado é separada da lógica de apresentação.

---

## Fase 3: Desacoplar os Atalhos Rápidos

**Objetivo:** Fazer com que o `AppLayout` e seus componentes filhos (como `QuickShortcuts`) não precisem saber os detalhes de implementação de outras seções.

**Roteiro:**

1.  **Expandir o Store:**
    *   Adicionar um novo estado ao store criado na Fase 2 para controlar a visibilidade de janelas modais (ex: `isNewLoteModalOpen: false`).
    *   Criar ações para controlar esses novos estados (ex: `openNewLoteModal()`).

2.  **Atualizar os Componentes:**
    *   **`QuickShortcuts.tsx`:** O botão "Novo Lote" deixará de usar uma prop e passará a chamar a ação correspondente no store (`openNewLoteModal()`).
    *   **`LotesSection.tsx`:** Este componente vai "escutar" a mudança no estado `isNewLoteModalOpen` do store e, quando for `true`, se encarregará de abrir sua própria janela modal.

**Benefícios:**
*   **Maior Desacoplamento:** O layout apenas sinaliza uma intenção, e o componente responsável reage a ela.
*   **Escalabilidade:** Adicionar novos atalhos e modais no futuro se torna uma tarefa muito mais simples e segura.
