---
name: list-performance
description: Padrões para renderização de alta performance em listas grandes e busca otimizada.
---

# 🚀 Skill: List Performance

Esta Skill deve ser utilizada ao lidar com componentes que exibem grandes conjuntos de dados (como tabelas de consultas ou históricos) para garantir que a interface permaneça responsiva.

## 📋 Regras de Ouro

1.  **Debounce em Buscas**: Nunca execute filtros em tempo real em listas com >100 itens. Use um debounce de no mínimo 300ms.
2.  **Virtualização/Chunking**: Se a lista puder exceder 200 itens, implemente renderização por partes (chunks) ou virtualização.
3.  **Memoização Estratégica**: Use `useMemo` para cálculos de filtros e `useCallback` para funções passadas a componentes filhos.
4.  **Lazy Modals**: Carregue modais de edição/detalhes apenas quando solicitados, para não pesar o bundle inicial da seção.

## 🛠️ Padrões de Implementação

### 1. Busca com Debounce
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

const filteredItems = useMemo(() => {
  return items.filter(item => smartSearch(item, debouncedSearch));
}, [items, debouncedSearch]);
```

### 2. Renderização em Chunks (Lazy List)
Ao renderizar listas grandes, use um limite inicial e um botão "Carregar Mais" ou scroll infinito para não travar a thread principal do navegador.

### 3. Evitar Redirecionamentos Inúteis
Em formulários de alta frequência, prefira a opção "Salvar e Continuar", limpando o estado local em vez de navegar para fora da página.

## 🔍 Como Validar
- Verifique se o `FPS` do navegador não cai abaixo de 30 durante o scroll.
- Confirme se o log de renderização do React (Profiler) não mostra re-renders excessivos em itens da lista que não mudaram.
