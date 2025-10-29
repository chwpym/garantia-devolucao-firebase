# Plano de Refatoração do Synergia OS

Este documento descreve o roteiro para refatorar e melhorar a arquitetura do código do aplicativo Synergia OS. As mudanças serão aplicadas em fases para garantir estabilidade e segurança.

---

## Fase 1: Fundações de UI e Navegação (Concluída)

**Status: Concluída**

**Objetivo:** Implementar uma navegação em abas para permitir a troca rápida entre funcionalidades e adicionar um sistema de navegação "Voltar" mais intuitivo.

**Roteiro Detalhado:**
1.  **Implementar Navegação em Abas:**
    *   **Arquivo:** `src/store/app-store.ts`
    *   **Arquivo:** `src/components/app-layout.tsx`
    *   **Arquivo:** `src/app/page.tsx`
2.  **Adicionar Botão "Voltar" Inteligente:**
    *   **Arquivo:** `src/store/app-store.ts`
    *   **Arquivo:** `src/components/app-layout.tsx`

---

## Fase 2: Melhorias de Usabilidade nas Garantias (Concluída)

**Status: Concluída**

**Objetivo:** Enriquecer as telas de "Lotes" e "Consulta" com mais informações e funcionalidades de gerenciamento em massa.

**Roteiro Detalhado:**
1.  **Cards de Lote Informativos:**
    *   **Arquivo:** `src/components/sections/lotes-section.tsx`
2.  **Gerenciamento em Massa nos Detalhes do Lote:**
    *   **Arquivo:** `src/components/sections/lote-detail-section.tsx`
3.  **Novos Status e Filtros:**
    *   **Arquivo:** `src/lib/types.ts`
    *   **Arquivo:** `src/components/sections/query-section.tsx`

---

## Fase 3: Melhorias de Fluxo de Cadastro e Performance (Concluída)

**Status: Concluída**

**Objetivo:** Otimizar a performance e o fluxo de trabalho nas telas de cadastro e consulta.

**Roteiro Detalhado:**
1.  **Manter na Tela de Cadastro:**
    *   **Arquivo:** `src/store/app-store.ts`
    *   **Arquivo:** `src/components/sections/register-section.tsx` e `devolucao-register-section.tsx`
2.  **Otimizar Telas de Consulta:**
    *   **Arquivo:** `src/components/sections/query-section.tsx` e `src/components/sections/devolucao-query-section.tsx`

---

## Fase 4: Busca Inteligente e Melhorias de UI (Concluída)

**Status: Concluída**

**Objetivo:** Implementar uma busca mais flexível em todo o sistema e aplicar a paleta de cores para enriquecer a interface.

**Roteiro Detalhado:**
1.  **Busca Aprimorada nas Telas de Consulta:**
    *   **Arquivo:** `src/components/sections/products-section.tsx`
    *   **Arquivo:** `src/components/sections/persons-section.tsx`
2.  **Busca Inteligente nos Formulários de Cadastro:**
    *   **Arquivo:** `src/components/warranty-form.tsx` (Garantias)
    *   **Arquivo:** `src/components/sections/devolucao-register-section.tsx` (Devoluções)
    *   **Arquivo:** `src/components/sections/batch-register-section.tsx` (Garantia em Lote)
3.  **Cards Coloridos e Visualmente Informativos:**
    *   **Arquivo:** `src/components/sections/dashboard-section.tsx`
    *   **Arquivo:** `src/components/sections/lotes-section.tsx`
    *   **Arquivo:** `src/components/sections/calculators-section.tsx`

---

## Fase 5: Aprimoramento de Segurança da Sessão (Concluída)

**Status: Concluída**

**Objetivo:** Aumentar a segurança do sistema, dando ao usuário o controle sobre a persistência de sua sessão de login.

**Roteiro Detalhado:**
1.  **Adicionar Opção "Lembrar de mim":**
    *   **Arquivo:** `src/app/login/page.tsx`
2.  **Implementar Lógica de Persistência:**
    *   **Arquivo:** `src/app/login/page.tsx`

---

## Fase 6: Refinamento do Fluxo de Status de Garantia (Concluída)

**Status: Concluída**

**Objetivo:** Substituir o sistema de status de garantia por um fluxo mais detalhado e visualmente intuitivo, alinhado ao processo de negócio real.

**Roteiro Detalhado:**
1.  **Atualizar Definição de Status:**
    *   **Arquivo:** `src/lib/types.ts`
2.  **Ajustar Status Padrão:**
    *   **Arquivo:** `src/components/warranty-form.tsx`
3.  **Atualizar Componentes de UI:**
    *   **Arquivo:** `src/components/warranty-form.tsx`
    *   **Arquivo:** `src/components/lote-detail-section.tsx`
4.  **Implementar Cores Visuais:**
    *   **Arquivo:** `src/app/globals.css`
    *   **Arquivos:** `src/components/warranty-table.tsx`, `src/components/lote-detail-section.tsx`

---
# Novas Funcionalidades e Melhorias

## Fase 7: Validador de Duplicidade (Dificuldade: Baixa)

**Objetivo:** Impedir o cadastro de itens duplicados, avisando o usuário quando um código de produto, CNPJ de fornecedor ou CPF/CNPJ de cliente já existe.

**Roteiro Detalhado:**
1.  **Validação de Produto:**
    *   **Arquivo:** `src/components/product-form.tsx`.
    *   **Lógica:** Na função `handleSave`, antes de chamar `db.addProduct`, realizar uma busca (`db.getProductByCode`) com o código do formulário. Se um produto for encontrado, exibir um `toast` de erro ("Já existe um produto com este código.") e interromper o salvamento.
2.  **Validação de Fornecedor:**
    *   **Arquivo:** `src/components/supplier-form.tsx`.
    *   **Lógica:** Na função `handleSave`, antes de salvar, buscar todos os fornecedores (`db.getAllSuppliers`) e verificar se o CNPJ digitado (se houver) já existe na base de dados. Se sim, exibir um `toast` de erro e interromper.
3.  **Validação de Cliente/Mecânico:**
    *   **Arquivo:** `src/components/person-form.tsx`.
    *   **Lógica:** Similar ao fornecedor, na função `handleSave`, buscar todas as pessoas (`db.getAllPersons`) e verificar se o CPF/CNPJ digitado (se houver) já existe. Se sim, exibir um `toast` de erro.

**Benefícios:**
*   **Integridade dos Dados:** Garante que a base de dados permaneça limpa e sem registros duplicados.
*   **Melhor Experiência:** Evita que o usuário cadastre a mesma informação duas vezes por engano.

---

## Fase 8: Campo "Código Externo" para Clientes/Fornecedores (Dificuldade: Baixa)

**Objetivo:** Adicionar um campo de código para clientes e fornecedores, permitindo a integração com outros sistemas.

**Roteiro Detalhado:**
1.  **Atualizar Tipos:**
    *   **Arquivo:** `src/lib/types.ts`.
    *   **Lógica:** Adicionar o campo `codigoExterno?: string` às interfaces `Person` e `Supplier`.
2.  **Atualizar Formulários:**
    *   **Arquivo:** `src/components/person-form.tsx`.
    *   **UI:** Adicionar um novo `FormField` para o `codigoExterno`. Pode ser posicionado próximo ao campo de nome.
    *   **Arquivo:** `src/components/supplier-form.tsx`.
    *   **UI:** Adicionar um novo `FormField` para o `codigoExterno` no formulário de fornecedor.
3.  **Atualizar Tabela de Exibição e Busca (Recomendado):**
    *   **Arquivos:** `src/components/sections/persons-section.tsx`, `src/components/sections/suppliers-section.tsx`.
    *   **UI:** Adicionar uma nova coluna na tabela para exibir o `codigoExterno`.
    *   **Lógica:** Atualizar a lógica de filtro da barra de busca para que ela também pesquise no campo `codigoExterno`.

**Benefícios:**
*   **Interoperabilidade:** Facilita a importação/exportação e a sincronização de dados com outros softwares de gestão (ERPs).
*   **Usabilidade:** Permite ao usuário encontrar um cliente ou fornecedor pelo código que ele já usa em outro sistema.

---

## Fase 9: Botões para Limpar Formulários (Dificuldade: Baixa)

**Objetivo:** Adicionar um botão "Limpar" nos principais formulários de cadastro para facilitar a inserção de múltiplos registros em sequência.

**Roteiro Detalhado:**
1.  **Arquivo:** `src/components/warranty-form.tsx`
    *   **UI:** No `CardFooter`, ao lado do botão "Salvar", adicionar um botão "Limpar" com `variant="outline"`.
    *   **Lógica:** O `onClick` do botão deve chamar a função `form.reset(defaultValues)` para limpar todos os campos.
2.  **Arquivo:** `src/components/sections/devolucao-register-section.tsx`
    *   **UI:** Adicionar um botão "Limpar" no `CardFooter` do formulário de devolução.
    *   **Lógica:** O `onClick` deve limpar tanto os dados gerais quanto os itens da devolução.

**Benefícios:**
*   **Agilidade:** Otimiza o fluxo de trabalho para usuários que precisam cadastrar vários itens de uma só vez.

---

## Fase 10: Aba Fixa no Dashboard (Dificuldade: Baixa)

**Objetivo:** Permitir que o usuário escolha a aba padrão (Garantias ou Devoluções) a ser exibida ao abrir o Dashboard.

**Roteiro Detalhado:**
1.  **Armazenamento da Preferência:**
    *   **Lógica:** Usar o `localStorage` do navegador, que é simples e eficaz para preferências do usuário que não precisam ser sincronizadas.
2.  **UI no Dashboard:**
    *   **Arquivo:** `src/components/sections/dashboard-section.tsx`.
    *   **UI:** Adicionar um pequeno `Select` ou `RadioGroup` no cabeçalho da seção do dashboard com as opções: "Padrão: Garantias" e "Padrão: Devoluções".
    *   **Estado:** Usar um `useState` para controlar a preferência atual. Ao mudar a seleção, salvar o valor no `localStorage`.
3.  **Lógica de Carregamento:**
    *   **Arquivo:** `src/components/sections/dashboard-section.tsx`.
    *   **Lógica:** No `useEffect` inicial, ler o valor do `localStorage`. Se existir, definir o estado da aba ativa (`Tabs`) para a preferência salva. Caso contrário, usar "Garantias" como padrão.

**Benefícios:**
*   **Personalização:** Adapta o sistema ao fluxo de trabalho preferido do usuário.

---

## Fase 11: Melhorias na Consulta de Devoluções (Dificuldade: Média)

**Objetivo:** Melhorar a visualização de dados na tela de consulta de devoluções.

**Roteiro Detalhado:**
1.  **Hover no Modo Escuro:**
    *   **Arquivo:** `src/components/ui/table.tsx`.
    *   **UI (CSS):** Analisar a classe `hover:bg-muted/50` aplicada à `TableRow`. Garantir que a cor da variável `--muted` no tema escuro (`globals.css`) tenha contraste suficiente para o efeito de hover ser visível. Se necessário, ajustar a opacidade ou a cor.
2.  **Ícone de Informação do Mecânico:**
    *   **Arquivo:** `src/components/sections/devolucao-query-section.tsx`.
    *   **UI:**
        *   Na `TableRow`, adicionar uma condição para renderizar um ícone (`<Info />` de `lucide-react`) ao lado do nome do cliente se `item.mecanico` existir e for diferente de `item.cliente`.
        *   Envolver este ícone com o componente `<Tooltip>` do Shadcn.
        *   No `<TooltipContent>`, exibir as informações adicionais, como "Mecânico: {item.mecanico}".

**Benefícios:**
*   **Consistência de UI:** Garante que a experiência do usuário seja a mesma nos modos claro e escuro.
*   **Acesso Rápido à Informação:** Permite que o usuário veja informações importantes sem precisar navegar para outra tela, economizando cliques.

---

## Fase 12: Máscara Automática para Telefone (Dificuldade: Média)

**Objetivo:** Implementar uma máscara de formatação automática para o campo de telefone, garantindo a padronização dos dados.

**Roteiro Detalhado:**
1.  **Lógica de Formatação:**
    *   **Arquivo:** `src/components/person-form.tsx`.
    *   **Lógica:** Criar uma função utilitária de formatação. A função receberá uma string de números e aplicará a máscara `(XX) XXXXX-XXXX` para celulares ou `(XX) XXXX-XXXX` para fixos, com base no comprimento do número.
2.  **Aplicar no Formulário:**
    *   **Arquivo:** `src/components/person-form.tsx`.
    *   **Lógica:** No `FormField` do campo `telefone`, modificar o `onChange` para que o valor do input seja sempre passado pela função de formatação antes de ser salvo no estado do formulário.

**Benefícios:**
*   **Padronização de Dados:** Todos os números de telefone seguirão o mesmo formato.
*   **Melhor Usabilidade:** O usuário não precisa se preocupar em formatar o número manualmente.

---

## Fase 13: Cadastro de Status Dinâmicos (Dificuldade: Alta)

**Objetivo:** Criar uma seção para que o administrador possa cadastrar, editar e excluir os status usados no sistema (garantias, lotes, etc.) e definir onde cada um pode ser usado.

**Roteiro Detalhado:**
1.  **Nova Tabela no Banco de Dados:**
    *   **Arquivo:** `src/lib/db.ts`.
    *   **Lógica:** Criar um novo `objectStore` chamado `statuses`. Cada objeto terá `id`, `nome`, `cor`, e um campo `aplicavelEm: ('garantia' | 'lote' | 'devolucao')[]`.
2.  **CRUD de Status:**
    *   **Arquivos:** Criar uma nova seção `src/components/sections/status-section.tsx` e um formulário `src/components/status-form.tsx`.
    *   **UI:** A seção listará os status em uma tabela. O formulário permitirá criar/editar um status, incluindo um seletor de cor e checkboxes para definir onde ele é aplicável.
    *   **Navegação:** Adicionar a nova seção ao menu em `src/config/nav-config.ts`.
3.  **Refatorar Componentes `Select`:**
    *   **Arquivos:** `src/components/warranty-form.tsx`, `src/components/lote-form.tsx`, etc.
    *   **Lógica:** Modificar todos os `Select` de status. Em vez de usar uma lista fixa (`WARRANTY_STATUSES`), eles deverão buscar os status do banco de dados (`db.getAllStatuses()`) e filtrar com base no campo `aplicavelEm`.

**Benefícios:**
*   **Flexibilidade Total:** A empresa pode adaptar o sistema exatamente ao seu fluxo de trabalho, criando e nomeando as etapas como desejar.
*   **Escalabilidade:** Facilita a adição de novos módulos que também precisem de status customizáveis no futuro.

---

## Fase 14: Análise de Tempo Médio de Devolução (Dificuldade: Alta)

**Objetivo:** Calcular e exibir o tempo médio que cada cliente leva para devolver as peças após a compra.

**Roteiro Detalhado:**
1.  **Lógica de Cálculo:**
    *   **Arquivo:** `src/components/sections/devolucao-report-section.tsx`.
    *   **Lógica:**
        *   Na função que gera os relatórios, buscar todas as devoluções (`getAllDevolucoes`).
        *   Agrupar as devoluções por cliente.
        *   Para cada cliente, iterar sobre suas devoluções, calcular a diferença em dias entre `dataDevolucao` e `dataVenda` para cada uma.
        *   Calcular a média de dias para cada cliente.
2.  **Exibição dos Dados:**
    *   **Arquivo:** `src/components/sections/devolucao-report-section.tsx`.
    *   **UI:**
        *   **Opção 1 (Card):** Adicionar um novo `Card` na tela de relatórios chamado "Tempo Médio de Devolução por Cliente".
        *   **Opção 2 (Tabela):** Exibir os resultados em uma nova tabela, com colunas "Cliente" e "Tempo Médio (dias)".

**Benefícios:**
*   **Inteligência de Negócio:** Fornece um indicador valioso sobre o comportamento dos clientes, podendo sinalizar problemas ou padrões de compra.
*   **Análise Preditiva:** Ajuda a prever fluxos de devolução e a gerenciar melhor o estoque.
