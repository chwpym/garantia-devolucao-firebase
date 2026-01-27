---
name: auth-resilience-pro
description: Regras para manter o fluxo de autenticação estável e resiliente contra loops de re-renderização.
---

# 🔐 Skill: Auth Resilience Pro

Esta Skill define padrões para evitar que falhas de lógica no `AuthProvider` ou redirecionamentos mal configurados travem a aplicação.

## 📋 Regras de Ouro

### 1. Memoização Obrigatória do Contexto
Sempre que o `AuthProvider` expor um valor (ex: `user`, `loading`), use `useMemo` com dependências explícitas.
```tsx
const value = useMemo(() => ({ user, loading }), [user, loading]);
```
- **Por que?** Evita que todos os consumidores do contexto (como o `AuthGuard`) sejam recriados em cada re-renderização do pai.

### 2. Estabilização de Hooks Auxiliares
Nunca coloque funções instáveis retornadas por hooks (como o `toast` do `useToast`) em arrays de dependência de `useEffect` sem extrema necessidade.
- **Preferência**: Importe funções globais ou use referências se possível.

### 3. Redirecionamento de Login (AuthGuard)
A página de login deve ser capaz de detectar se o usuário já está autenticado e redirecioná-lo automaticamente.
- Use o hook `useAuthGuard()` dentro da `LoginPage`.

### 4. Proteção de Rota Unificada
Utilize a estrutura de pastas `(protected)` do Next.js App Router para separar páginas públicas de privadas.

## 🔍 Como Validar
- Verifique se o log de "Bootstrap" ou "Checking user profile" não se repete infinitamente no console.
- Teste o login e garantindo que o redirecionamento ocorre assim que o Firebase confirma a identidade.
