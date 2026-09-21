# Relatório de Auditoria e Inspeção de Código - Código e Banco de Dados

Este relatório apresenta as vulnerabilidades, inconsistências e inconformidades com as práticas e diretrizes técnicas do projeto em relação à lógica de programação, tratamento de dados, segurança da sessão e banco de dados IndexedDB.

---

## 1. Conflito e Ambiguidade no Hook de Rota Protegida (`useAuthGuard`)

* **Arquivo:** `src/hooks/use-auth-guard.ts` e `src/hooks/use-auth-guard.tsx`
* **Localização:** Pasta `src/hooks/`
* **Descrição:** Existem dois arquivos com o mesmo nome base mas extensões diferentes. Ambos declaram e exportam o hook `useAuthGuard`, mas suas implementações internas diferem significativamente:
  - O arquivo `.ts` utiliza `router.replace` para redirecionamento e retorna `{ isAuthenticated, loading, user }`.
  - O arquivo `.tsx` utiliza `router.push`, cria um estado local `isChecking` para controle interno e retorna `{ isLoading, isAuthenticated }`.
* **Causa:** Sobra de código de refatorações passadas que não foi removida.
* **Impacto:** **Severo**. Risco de o bundler (Turbopack/Webpack) do Next.js carregar implementações diferentes em tempo de desenvolvimento vs tempo de build de produção, gerando loops infinitos de redirecionamento ou falhas silenciosas na detecção de estado do Firebase Auth.
* **Nível de severidade:** 🔴 Alta
* **Recomendação:** Remover o arquivo `use-auth-guard.tsx` duplicado e unificar a lógica no `use-auth-guard.ts` (ou vice-versa), ajustando todos os arquivos importadores (`LoginPage` e `AuthGuard`) para usar a mesma assinatura estrutural.

---

## 2. Validação Permissiva de Peças no Cadastro de Devoluções

* **Arquivo:** [devolucao-register-section.tsx](file:///d:/Dev/FIREBASE/garantia-devolucao-firebase-PRODUCAO/src/components/sections/devolucao-register-section.tsx)
* **Localização:** Linhas 36-41 (`itemDevolucaoSchema`)
* **Descrição:** Os campos `codigoPeca` e `descricaoPeca` dentro do esquema Zod `itemDevolucaoSchema` estão definidos com `.optional()` e sem limite mínimo de caracteres.
* **Causa:** Falha de modelagem na validação do array de itens do formulário.
* **Impacto:** **Inconsistência de Banco de Dados**. Um usuário pode submeter e finalizar uma devolução com código de peça ou descrição em branco. Isso corrompe os relatórios analíticos de devoluções por cliente e mecânico.
* **Nível de severidade:** 🟠 Média
* **Recomendação:** Ajustar o esquema do Zod no frontend para exigir dados mínimos em cada peça:
  ```typescript
  codigoPeca: z.string().min(1, 'Código é obrigatório').transform(val => val.trim().toUpperCase()),
  descricaoPeca: z.string().min(1, 'Descrição é obrigatória').transform(val => val.trim().toUpperCase()),
  ```

---

## 3. Sobrecarga de Transações Sequenciais em Migrações do IndexedDB

* **Arquivo:** [db.ts](file:///d:/Dev/FIREBASE/garantia-devolucao-firebase-PRODUCAO/src/lib/db.ts)
* **Localização:** Linhas 444-504 (`migrateContactsToArrays`)
* **Descrição:** As migrações executadas na inicialização do aplicativo varrem todos os registros e chamam as funções `updatePerson` e `updateSupplier` dentro de loops `for`.
* **Causa:** Cada uma destas chamadas de atualização cria uma nova transação `"readwrite"` no IndexedDB de forma isolada.
* **Impacto:** **Lentidão e Queda de Performance**. Em dispositivos com grandes volumes de cadastros locais, a thread principal do navegador pode ficar bloqueada (travamento visível na tela) por criar centenas de transações consecutivas na inicialização do app.
* **Nível de severidade:** 🟠 Média
* **Recomendação:** Reescrever as funções de migração para abrir uma única transação `"readwrite"` para o Object Store correspondente e realizar todas as atualizações em lote dentro do mesmo fluxo de transação.

---

## 4. Omissão de Normalização de Textos (Uppercase) no Zod do Frontend

* **Arquivos:** [product-form.tsx](file:///d:/Dev/FIREBASE/garantia-devolucao-firebase-PRODUCAO/src/components/product-form.tsx) e [supplier-form.tsx](file:///d:/Dev/FIREBASE/garantia-devolucao-firebase-PRODUCAO/src/components/supplier-form.tsx)
* **Localização:** Esquemas Zod do formulário (`formSchema`)
* **Descrição:** Campos cruciais de string como `referencia`, `marca`, `codigoExterno`, `bairro` e `cidade` não possuem transformações no Zod do frontend. A sanitização depende exclusivamente do método fallback `normalizeData` do IndexedDB.
* **Causa:** Falha na aplicação consistente da regra de transformação de strings direto no Zod Schema.
* **Impacto:** **Inconsistência Visual**. O usuário vê o texto em letras minúsculas no input até que o formulário seja recarregado ou os dados sejam consultados após gravação, gerando quebra da expectativa de UI.
* **Nível de severidade:** 🟡 Baixa
* **Recomendação:** Adicionar `.transform(val => val ? val.trim().toUpperCase() : '')` em todos os campos do frontend.

---

## 5. Risco de Falha Silenciosa em Upgrade de Versão do IndexedDB

* **Arquivo:** [db.ts](file:///d:/Dev/FIREBASE/garantia-devolucao-firebase-PRODUCAO/src/lib/db.ts)
* **Localização:** Linhas 78-79 e 92-93
* **Descrição:** Utilização da referência `request.transaction?.objectStore(...)` dentro da função `onupgradeneeded`.
* **Causa:** Uso de referência global do request aberto.
* **Impacto:** **Falha Silenciosa**. Dependendo do ambiente ou da versão do navegador (ou sob sandboxing rígido), `request.transaction` pode ser nulo durante o evento de upgrade. Isso faz com que os novos índices (como `codigoExterno`) deixem de ser criados.
* **Nível de severidade:** 🟡 Baixa
* **Recomendação:** Acessar a transação ativa de upgrade por meio do evento: `(event.target as IDBOpenDBRequest).transaction`.
