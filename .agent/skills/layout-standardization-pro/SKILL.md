---
name: layout-standardization-pro
description: Padronização de hierarquia de containers e gerenciamento inteligente de scroll.
---

# 🏗️ Skill: Layout Standardization Pro

Esta Skill define como estruturar a hierarquia de componentes para garantir um visual premium, sem redundâncias e com scroll fluido ("Efeito App").

## 📋 Regras de Ouro

### 1. Hierarquia de Scroll Único

NUNCA permita que existam dois elementos com `overflow-auto` ou `overflow-y-scroll` aninhados no mesmo caminho do DOM. Isso causa o "scroll duplo" ou "scroll preso" expondo gaps indesejados no background da aplicação.

### 2. Padrão de Contenção Absoluta (Efeito App Base)

Para evitar vazamentos de background (Gaps escuros) e barrar a rolagem de fora do navegador:

- **Travamento Vertical (`app-layout.tsx`)**: O main layout deve utilizar `absolute inset-4 md:inset-8` em vez de p-4. A técnica trava os limites em relação ao viewport (`100vh`) nativamente.
- **Estruturação Mãe**: O container abaixo recebe `flex-1 w-full h-full overflow-auto flex flex-col`.

### 3. Padrão Formulários com Footer Fixo

Toda tela de Formulário (Cadastro de Garantia ou Devolução) baseada em Cards do ShadcnUI:

- **Card Wrapper**: Configure como `<Card className="w-full h-full flex flex-col ...">` (NUNCA min-h-full, e sempre h-full estrito para respeitar a herança e não estourar).
- **Tag do Form (Formik/RHF)**: Deve declarar `<form className="flex-1 flex flex-col min-h-0">`. O `min-h-0` liberta a div de tentar espremer infinitamente as flexboxes.
- **Cabeçalho (`flex-none`)**: Fica fixado no topo.
- **Área Interna Scrolável (`flex-1`)**: Todo o miolo interativo deve estar no `<CardContent className="flex-1 overflow-y-auto...">`.
- **Rodapé Cravado (`flex-none`)**: Ações primárias ("Cancelar", "Salvar e Sair") repousam abaixo em `<CardFooter className="flex-none py-4 border-t bg-muted/5">`, blindado na base da view, sempre aparente.

### 4. Coerência Visual em Blocos

- Mantenha seções de Informação Visual (`CardContent` divs internas) sem background quando triviais.
- Use `bg-muted/10 border-2 rounded-lg p-4` **EXCETO** para seções onde precisamos de Contraste Focado (ex: "Dados Fiscais e de Venda"). Seções de destaque exigem coerência nas outras páginas (Garantia <-> Devoluções).

### 5. Cabeçalhos de Resumo Compactos (Economia Vertical)

- Painéis de filtro (Consultar Garantias, Lotes, Lançamentos) com **Stats Cards** (`Pendentes`, `Cadastrados`) devem ser compactados na MESMA linha que o Título da Página.
- Use um `div` pai `flex flex-col md:flex-row gap-6 md:items-center` com o Titulo em um `flex-none` e o Resumo Grid (`grid-cols-4`) ocupando o `flex-1`.
- Reduza paddings internos dos Status Cards nestes cabeçalhos (`py-1 px-2`) para sobrar o MAIOR ESPAÇO VERITCAL possível na Tabela ou Malha abaixo.

## 🛠️ Exemplo de Estrutura Correta de Formulário

```tsx
<Card className="w-full h-full flex flex-col shadow-sm border-0 ...">
  <CardHeader className="flex-none bg-muted/5 border-b">
    <CardTitle>Cadastrar Garantia</CardTitle>
  </CardHeader>

  <div className="flex-1 flex flex-col min-h-0">
    <Form {...form}>
      <form className="flex-1 flex flex-col min-h-0">
        {/* Scroll Restrito no Meio */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">Campos</div>
        </CardContent>

        {/* Rodapé Fixo */}
        <CardFooter className="flex-none flex justify-between gap-2 py-4 border-t bg-muted/5">
          <Button>Cancelar</Button>
          <Button>Salvar</Button>
        </CardFooter>
      </form>
    </Form>
  </div>
</Card>
```

## 🔍 Como Validar

- O scroll externo do browser nunca aparece (a própria Navbar não afunda na tela, e não rola com botão do mouse do lado de fora do Card).
- O botão "Salvar e Sair" dos formulários NUNCA esconde embaixo do edge da tela precisando rolar a página. Ele sempre mora colado no rodapé.
