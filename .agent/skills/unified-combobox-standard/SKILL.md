---
name: unified-combobox-standard
description: Regras para padronização de buscas nativas no sistema utilizando componentes Combobox Mestres, abolindo buscas re-escritas com Popovers e Commands avulsos.
---

# Unified Combobox Standard

Este documento estabelece as diretrizes de engenharia para lidar com autocompletar e caixas de busca de entidades no sistema ERP, padronizando o comportamento de debounce, estabilidade visual e integridade da experiência do usuário.

## 1. Nunca Recriar "Do Zero"

As interfaces do ERP não devem conter estruturas complexas de `<Popover>`, `<Command>`, `<CommandList>`, etc., soltas e copiadas. A proliferação desse código leva a lógicas de busca divergentes.

### Ferramentas Obrigatórias

Sempre que o usuário precisar referenciar uma entidade de negócio existente, importe os componentes globais:

- **Para Peças e Produtos**: `<ComboboxProduct />` (Suporte nativo a Debounce, e busca smart em múltiplas colunas)
- **Para Clientes, Mecânicos e Fornecedores**: `<ComboboxPerson />` e `<ComboboxSearch />`.

## 2. Sintaxe Mínima do ComboboxProduct

Ao plugar um `ComboboxProduct` no React Hook Form, utilize o seguinte padrão:

```tsx
import ComboboxProduct from "@/components/combobox-product";

<FormField
  control={form.control}
  name="codigoDaPeca"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Código / Peça</FormLabel>
      <ComboboxProduct
        value={field.value}
        onProductSelect={(product) => {
          // Função para preencher descrição, valores e etc
          fillProductData(product);
        }}
        onInputChange={field.onChange}
        onAddNew={() => openQuickRegisterModal()}
      />
      <FormMessage />
    </FormItem>
  )}
/>;
```

## 3. Benefícios Estruturais Mapeados

O componente encapsulado do Combobox traz melhorias que qualquer componente local espalhado na página quebrará:

1. **Debounce (300ms)**: Reduz a sobrecarga de renderização. Evita travamento na digitação de peças num DB com mais de 2.000 itens.
2. **Cadastro in-place**: O botão de "+ Adicionar (Novo)" flui da mesma fonte em todas as telas (`onAddNew`).
3. **Pré-Carregamento Seguro**: A limitação de `slice(0, 50)` protege o DOM contra enchentes de tags `<div>` durante um select vazio.
