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

## Fase 6.5: Correção de Bugs de Cadastro e Seleção (Concluída)

**Status: Concluída**

**Objetivo:** Corrigir bugs críticos que impedem a seleção de registros recém-cadastrados e ajustar o comportamento da busca.

**Roteiro Detalhado:**
1.  **Correção do Carregamento de Dados:**
    *   **Arquivo:** `src/store/app-store.ts`
    *   **Lógica:** Modificar a ação `reloadData` no store para garantir que, ao salvar um novo registro (cliente, produto, etc.), a lista de dados correspondente seja imediatamente atualizada no estado global.
2.  **Ajuste da Busca de Clientes/Mecânicos:**
    *   **Arquivo:** `src/components/sections/persons-section.tsx`
    *   **Lógica:** Refinar a função de filtro para que ela pesquise tanto no campo `nome` quanto no `nomeFantasia`. Garantir que, se nenhum resultado for encontrado, a tabela exiba a mensagem "Nenhum registro encontrado".
3.  **Verificação Cruzada:**
    *   **Arquivos:** `src/components/sections/devolucao-register-section.tsx` e `src/components/warranty-form.tsx`.
    *   **Lógica:** Garantir que os componentes `Combobox` para Cliente e Mecânico em ambos os formulários estejam utilizando a lista de `persons` do `app-store`, garantindo que os novos registros apareçam e sejam selecionáveis.

**Benefícios:**
*   **Confiabilidade:** Restaura a funcionalidade essencial de cadastro e seleção.
*   **Melhor Experiência:** Remove a frustração do usuário ao não conseguir usar um dado que acabou de cadastrar.

---

## Fase 7: Validador de Duplicidade (Concluída)

**Status: Concluída**

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

## Fase 8: Melhorias de Fluxo e Usabilidade (Concluída)

**Status: Concluída**

**Objetivo:** Aumentar a produtividade do usuário adicionando atalhos de cadastro e melhorando a experiência em telas de consulta.

**Roteiro Detalhado:**
1.  **Cadastro Rápido nos Formulários:**
    *   **Arquivos:** `src/components/warranty-form.tsx` e `src/components/sections/devolucao-register-section.tsx`.
    *   **UI:** Adicionar um botão "+" ao lado dos campos de seleção de Cliente, Mecânico e Fornecedor.
    *   **Lógica:** Ao clicar no botão, abrir um `Dialog` (janela modal) contendo o formulário de cadastro correspondente (`PersonForm` ou `SupplierForm`). Após salvar, o novo registro deve ser automaticamente selecionado no formulário original.
2.  **Manter Filtros na Consulta de Garantia:**
    *   **Arquivo:** `src/store/app-store.ts` e `src/components/sections/query-section.tsx`.
    *   **Lógica:** Modificar a forma como os dados são recarregados para que os estados dos filtros (termo de busca, período) não sejam resetados após uma edição ou exclusão.
3.  **Botões para Limpar Formulários:**
    *   **Arquivo:** `src/components/warranty-form.tsx` e `src/components/sections/devolucao-register-section.tsx`.
    *   **UI:** Adicionar um botão "Limpar" ao lado do botão "Salvar".
    *   **Lógica:** O `onClick` do botão chamará a função `form.reset()` para limpar todos os campos, facilitando o início de um novo cadastro.

**Benefícios:**
*   **Agilidade:** Reduz drasticamente o número de cliques e a navegação entre telas.
*   **Fluxo Contínuo:** Permite que o usuário permaneça no contexto da tarefa que está executando.

---

## Fase 9: Campo "Código Externo" e Melhorias de Consulta (Concluída)

**Status: Concluída**

**Objetivo:** Adicionar um campo de código para clientes e fornecedores e melhorar a interface das consultas.

**Roteiro Detalhado:**
1.  **Atualizar Tipos:**
    *   **Arquivo:** `src/lib/types.ts`.
    *   **Lógica:** Adicionar o campo `codigoExterno?: string` às interfaces `Person` e `Supplier`.
2.  **Atualizar Formulários:**
    *   **Arquivo:** `src/components/person-form.tsx` e `src/components/supplier-form.tsx`.
    *   **UI:** Adicionar um novo `FormField` para o `codigoExterno`.
3.  **Atualizar Tabelas de Exibição e Busca:**
    *   **Arquivos:** `src/components/sections/persons-section.tsx`, `src/components/sections/suppliers-section.tsx`.
    *   **UI:** Adicionar uma nova coluna na tabela para exibir o `codigoExterno` e incluí-lo na lógica de busca.
4.  **Botão "Editar" nas Devoluções do Dia:**
    *   **Arquivo:** `src/components/sections/dashboard-section.tsx`.
    *   **UI:** Adicionar uma coluna com um botão "Editar" na tabela de devoluções recentes no dashboard.

**Benefícios:**
*   **Interoperabilidade:** Facilita a integração de dados com outros sistemas.
*   **Acesso Rápido:** Melhora a usabilidade, permitindo encontrar registros por códigos alternativos e editar itens recentes diretamente do dashboard.

---

## Fase 10: Preferências do Usuário e Segurança (Concluída)

**Status: Concluída**

**Objetivo:** Permitir personalização da interface e ajustar comportamentos padrão para melhorar a segurança.

**Roteiro Detalhado:**
1.  **Aba Fixa no Dashboard:**
    *   **Arquivo:** `src/components/sections/dashboard-section.tsx`.
    *   **Lógica:** Usar o `localStorage` para salvar a última aba selecionada ("Garantias" ou "Devoluções") e abri-la como padrão no próximo acesso.
2.  **Comportamento Padrão do "Lembrar de mim":**
    *   **Arquivo:** `src/app/login/page.tsx`.
    *   **Lógica:** Alterar o estado inicial do checkbox "Lembrar de mim" na tela de login para `false` (desmarcado).

**Benefícios:**
*   **Personalização:** Adapta o sistema ao fluxo de trabalho preferido do usuário.
*   **Segurança Aprimorada:** O comportamento padrão se torna mais seguro, pois a sessão não persiste a menos que o usuário solicite.

---

## Fase 11: Cadastro de Status Dinâmicos (Dificuldade: Alta)

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

## Fase 12: Análise de Tempo Médio de Devolução (Dificuldade: Alta)

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
    *   **UI:** Adicionar um novo `Card` ou Tabela na tela de relatórios de devolução para exibir o tempo médio por cliente.

**Benefícios:**
*   **Inteligência de Negócio:** Fornece um indicador valioso sobre o comportamento dos clientes.
*   **Análise Preditiva:** Ajuda a prever fluxos de devolução e a gerenciar melhor o estoque.

---

## Fase 13: Melhorias na Consulta de Devoluções (Dificuldade: Média)

**Objetivo:** Melhorar a visualização de dados na tela de consulta de devoluções.

**Roteiro Detalhado:**
1.  **Hover no Modo Escuro:**
    *   **Arquivo:** `src/components/ui/table.tsx`.
    *   **UI (CSS):** Analisar a classe `hover:bg-muted/50` aplicada à `TableRow`. Garantir que a cor da variável `--muted` no tema escuro (`globals.css`) tenha contraste suficiente para o efeito de hover ser visível.
2.  **Ícone de Informação do Mecânico:**
    *   **Arquivo:** `src/components/sections/devolucao-query-section.tsx`.
    *   **UI:** Na `TableRow`, adicionar uma condição para renderizar um ícone (`<Info />` de `lucide-react`) ao lado do nome do cliente se `item.mecanico` existir e for diferente de `item.cliente`. Envolver este ícone com o componente `<Tooltip>` do Shadcn para exibir as informações.

**Benefícios:**
*   **Consistência de UI:** Garante que a experiência do usuário seja a mesma nos modos claro e escuro.
*   **Acesso Rápido à Informação:** Permite que o usuário veja informações importantes sem precisar navegar para outra tela.

---

## Fase 14: Máscara Automática para Telefone (Dificuldade: Média)

**Objetivo:** Implementar uma máscara de formatação automática para o campo de telefone.

**Roteiro Detalhado:**
1.  **Criar Função Utilitária:**
    *   **Arquivo:** `src/lib/utils.ts`.
    *   **Lógica:** Criar e exportar uma função `formatPhoneNumber(value: string)` que aplique a máscara `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`.
2.  **Aplicar no Formulário:**
    *   **Arquivo:** `src/components/person-form.tsx`.
    *   **Lógica:** No `FormField` de telefone, usar a função `formatPhoneNumber` no `onChange`.

**Benefícios:**
*   **Código Limpo:** Centraliza a lógica de formatação.
*   **Padronização de Dados:** Garante que todos os telefones sigam o mesmo formato.

---

## Fase 15: Múltiplos Contatos (Dificuldade: Alta)

**Objetivo:** Permitir o cadastro de múltiplos telefones e emails para clientes, mecânicos e fornecedores.

**Roteiro Detalhado:**
1.  **Atualizar Tipos:**
    *   **Arquivo:** `src/lib/types.ts`.
    *   **Lógica:** Criar `ContactInfo { type: string; value: string; }` e substituir os campos de telefone/email por `telefones?: ContactInfo[]` e `emails?: ContactInfo[]`.
2.  **Formulários com Campos Dinâmicos:**
    *   **Arquivos:** `src/components/person-form.tsx`, `src/components/supplier-form.tsx`.
    *   **Lógica:** Usar `useFieldArray` de `react-hook-form` para adicionar/remover campos de contato.
3.  **Atualizar Exibição:**
    *   **Arquivos:** `src/components/sections/persons-section.tsx`, `src/components/sections/suppliers-section.tsx`.
    *   **UI:** Mostrar o primeiro contato e usar `<Tooltip>` para exibir os demais.
4.  **Atualizar Busca:**
    *   **Lógica:** Aprimorar a busca para pesquisar nos arrays de contatos.

**Benefícios:**
*   **Flexibilidade:** Atende à necessidade real de ter múltiplos contatos.
*   **Organização:** Permite categorizar os contatos (Comercial, Financeiro).

---

## Fase 16: Comportamento Padrão do "Lembrar de mim" (Concluída)

**Status: Concluída**

**Objetivo:** Alterar o estado padrão do checkbox "Lembrar de mim" para desmarcado.

**Roteiro Detalhado:**
1.  **Alterar Estado Inicial:**
    *   **Arquivo:** `src/app/login/page.tsx`
    *   **Lógica:** Alterar a declaração de estado `useState(true)` para `useState(false)`.

**Benefícios:**
*   **Segurança Aprimorada:** A persistência da sessão se torna uma ação explícita do usuário.

---

## Nota sobre Importação de Dados do Sistema Antigo

Para facilitar a migração de dados de outros sistemas, a funcionalidade de "Backup / Restore" na tela de Backup deve ser utilizada.

*   **Formato Ideal:** **JSON**. Este é o formato nativo que o sistema usa para backups e restaurações.
*   **Ação Necessária:** Criar um arquivo `modelo-importacao.json` na raiz do projeto. Este arquivo servirá como um guia, contendo a estrutura exata de `products`, `persons` e `suppliers` que o sistema espera. Com base neste modelo, os dados de qualquer sistema antigo podem ser convertidos para o formato correto e importados com segurança, alimentando as tabelas de Clientes, Fornecedores e Produtos.
