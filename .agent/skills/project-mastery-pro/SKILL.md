---
name: project-mastery-pro
description: Padronização de governança do projeto, incluindo Git, documentação e sincronia de planos.
---

# 🏆 Skill: Project Mastery Pro

Esta Skill garante que o projeto Synergia OS mantenha um histórico limpo e uma documentação que reflete a realidade do código.

## 📋 Regras de Ouro

### 1. Padrão de Commits (Conventional Commits)
Todo commit deve seguir o padrão: `tipo: descrição curta em português`.
- `feat:` Nova funcionalidade (ex: `feat: botão de aprovação de usuários`).
- `fix:` Correção de bug (ex: `fix: erro de importação no signup`).
- `docs:` Apenas documentação (ex: `docs: atualiza REFACTOR_PLAN.md`).
- `refactor:` Mudança de código que não corrige bug nem adiciona feature.
- `chore:` Tarefas de manutenção (ex: `chore: atualiza dependências`).

### 2. Sincronia de Documentação
Ao completar uma fase do plano de refatoração:
1. Atualize o status no arquivo `REFACTOR_PROGRESS.md`.
2. Se a mudança afetar o cronograma futuro, atualize o `REFACTOR_PLAN.md`.
3. Garanta que o `task.md` na pasta de brain esteja sempre espelhando o progresso atual.

### 3. Gestão de Branch
- Toda vida de desenvolvimento acontece na branch `refactor`.
- A branch `main` é reservada apenas para versões estáveis aprovadas pelo usuário.
- NUNCA faça push direto para `main` sem validação prévia.

### 4. Gestão de Fases
Se uma nova necessidade surgir (como a Segurança Híbrida), ela deve ser registrada como uma sub-fase (ex: `Fase 11a`) no `REFACTOR_PLAN.md` antes de ser implementada.

## 🔍 Como Validar
- O log do Git (`git log --oneline`) deve ser legível e organizado.
- Ao ler o `REFACTOR_PROGRESS.md`, deve ser possível saber exatamente onde o projeto parou.
