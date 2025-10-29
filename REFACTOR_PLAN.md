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
    *   **Arquivo:** `src/components/sections/query-section.tsx` e `src/components/sections/devolucao-query-section.tsx`
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
        *   **Lógica:** Na função `useMemo` que calcula `filteredProducts`, modificar a lógica de `filter` para que a busca verifique o termo no `codigo`, na `descricao`, na `marca` e na `referencia`.
    *   **Arquivo:** `src/components/sections/persons-section.tsx`
        *   **Lógica:** Na função `useMemo` de `filteredPersons`, atualizar a busca para funcionar para o campo `nome` (Razão Social), `nomeFantasia` e também para o novo `codigoExterno`.

2.  **Busca Inteligente nos Formulários de Cadastro:**
    *   **Arquivo:** `src/components/warranty-form.tsx` (Garantias)
        *   **Produtos:** Substituir a busca atual pelo novo componente `ComboboxSearch`, garantindo que a busca seja feita por código e descrição.
        *   **Clientes/Mecânicos:** Na lógica do componente `Combobox`, aprimorar o filtro para que ele verifique o `nome`, `nomeFantasia` e o novo `codigoExterno` ao buscar na lista de pessoas.
    *   **Arquivo:** `src/components/sections/devolucao-register-section.tsx` (Devoluções)
        *   **Produtos:** Substituir a busca atual pelo novo componente `ComboboxSearch`.
        *   **Clientes/Mecânicos:** Aplicar a mesma melhoria na busca de clientes e mecânicos.
    *   **Arquivo:** `src/components/sections/batch-register-section.tsx` (Garantia em Lote)
        *   **Lógica:** Aplicar a mesma melhoria de busca de clientes/mecânicos (nome, fantasia, código) no `Combobox` usado nesta tela.

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

---

## Fase 5: Aprimoramento de Segurança da Sessão

**Objetivo:** Aumentar a segurança do sistema, dando ao usuário o controle sobre a persistência de sua sessão de login.

**Roteiro Detalhado:**

1.  **Adicionar Opção "Lembrar de mim":**
    *   **Arquivo:** `src/app/login/page.tsx`
    *   **UI:** Adicionar um componente `Checkbox` com o label "Lembrar de mim" na tela de login, logo acima do botão "Entrar". O estado inicial deve ser **desmarcado**.
    *   **Estado:** Gerenciar o estado do checkbox (marcado/desmarcado) com um `useState`.

2.  **Implementar Lógica de Persistência:**
    *   **Arquivo:** `src/app/login/page.tsx`
    *   **Lógica:** Importar a função `setPersistence` e os tipos `browserSessionPersistence` e `localPersistence` (ou `indexedDBLocalPersistence`) do Firebase.
    *   **Ações:**
        *   Dentro das funções `onSubmit` (login com e-mail) e `handleGoogleSignIn` (login com Google):
        *   **Antes** de chamar a função de login (`signInWith...`):
            *   Verificar o estado do checkbox "Lembrar de mim".
            *   Se estiver **marcado**, chamar `setPersistence(auth, localPersistence)`. A sessão persistirá após fechar o navegador.
            *   Se estiver **desmarcado**, chamar `setPersistence(auth, browserSessionPersistence)`. A sessão será encerrada ao fechar o navegador.

**Benefícios:**
*   **Segurança Aprimorada:** O comportamento padrão do sistema se tornará mais seguro, exigindo um novo login a cada sessão do navegador, a menos que o usuário opte ativamente por manter-se conectado.
*   **Controle do Usuário:** Oferece a flexibilidade para o usuário escolher entre conveniência e segurança, um padrão em aplicações web modernas.
*   **Conformidade:** Alinha o comportamento do sistema com as expectativas de segurança para aplicações de gestão.

---

## Fase 6: Refinamento do Fluxo de Status de Garantia

**Objetivo:** Substituir o sistema de status de garantia por um fluxo mais detalhado e visualmente intuitivo, alinhado ao processo de negócio real.

**Roteiro Detalhado:**

1.  **Atualizar Definição de Status:**
    *   **Arquivo:** `src/lib/types.ts`
    *   **Lógica:** Modificar o tipo `WarrantyStatus` para refletir o novo fluxo.
        *   **Remover:** `Em análise`, `Aprovada`, `Paga`.
        *   **Adicionar:** `Aguardando Envio`, `Enviado para Análise`, `Aprovada - Peça Nova`, `Aprovada - Crédito NF`, `Aprovada - Crédito Boleto`, `Recusada`.

2.  **Ajustar Status Padrão:**
    *   **Arquivo:** `src/components/warranty-form.tsx`
    *   **Lógica:** Definir o `status` inicial para novas garantias como `'Aguardando Envio'`.

3.  **Atualizar Componentes de UI:**
    *   **Arquivo:** `src/components/warranty-form.tsx`
        *   **UI:** Atualizar o `Select` de status no formulário para exibir as novas opções.
    *   **Arquivo:** `src/components/lote-detail-section.tsx`
        *   **UI:** Atualizar o menu de `Dropdown` para alteração de status (individual e em massa) para conter os novos status.

4.  **Implementar Cores Visuais:**
    *   **Arquivo:** `src/app/globals.css`
        *   **UI:** Adicionar uma nova variável de cor (`--accent-green-dark`) para diferenciar os tipos de crédito.
    *   **Arquivos:** `src/components/warranty-table.tsx`, `src/components/lote-detail-section.tsx`
        *   **UI:** Implementar uma função (`getWarrantyStatusClass`) que aplica classes de cor específicas ao componente `Badge` com base em cada novo status, melhorando a identificação visual:
            *   **Amarelo/Laranja:** `Aguardando Envio`
            *   **Azul:** `Enviado para Análise`
            *   **Verde Claro:** `Aprovada - Peça Nova`
            *   **Roxo:** `Aprovada - Crédito NF`
            *   **Verde Escuro:** `Aprovada - Crédito Boleto`
            *   **Vermelho:** `Recusada`

**Benefícios:**
*   **Clareza Operacional:** Os status refletem com precisão cada etapa do processo de garantia, desde o cadastro até a resolução.
*   **Eficiência Financeira:** A distinção entre os tipos de crédito ("Peça Nova", "Crédito NF", "Crédito Boleto") facilita o controle financeiro e a conciliação.
*   **Interface Intuitiva:** O uso estratégico de cores permite uma identificação rápida e clara do estado de cada garantia, melhorando a usabilidade.

---
# Novas Funcionalidades e Melhorias

## Fase 7: Validador de Duplicidade (Dificuldade: Baixa)

**Objetivo:** Impedir o cadastro de itens duplicados, avisando o usuário quando um código de produto, CNPJ de fornecedor ou CPF/CNPJ de cliente já existe.

**Roteiro Detalhado:**
1.  **Validação de Produto:**
    *   **Arquivo:** `src/components/product-form.tsx`.
    *   **Lógica:** Na função `handleSave`, antes de chamar `db.addProduct`, realizar uma busca (`db.getProductByCode`) com o código do formulário. Se um produto for encontrado, exibir um `toast` de erro e interromper o salvamento.
2.  **Validação de Fornecedor:**
    *   **Arquivo:** `src/components/supplier-form.tsx`.
    *   **Lógica:** Na função `handleSave`, antes de salvar, buscar todos os fornecedores e verificar se o CNPJ digitado já existe. Se sim, exibir um `toast` de erro.
3.  **Validação de Cliente/Mecânico:**
    *   **Arquivo:** `src/components/person-form.tsx`.
    *   **Lógica:** Similar ao fornecedor, na função `handleSave`, buscar todas as pessoas e verificar se o CPF/CNPJ digitado (se houver) já existe. Se sim, exibir um `toast` de erro.

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
