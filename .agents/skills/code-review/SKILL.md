---
name: code-review
description: "Review changes since a fixed point evaluating 2 axes: Standards (follows Firebase project docs/skills?) and Spec (does what the issue asked?). Runs both axes and reports. Use when the user wants to review a branch/PR."
---

**IMPORTANT: Always present the final review report and respond to the user in Portuguese (PT-BR).**

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards**: does the code follow the documented standards of this repository (e.g., the skills in the `.agent/skills/` folder regarding UI, Firebase, IndexedDB)?
- **Spec**: does the code faithfully implement what the issue/specification requested?

Both axes run as **parallel sub-agents** so they don't pollute the context, aggregating the findings later.

## Process

### 1. Pin the fixed point

Check the specified comparison point (e.g., a base branch, `HEAD~5`, etc.) using `git diff <fixed-point>...HEAD`.

### 2. Identify the spec source

Look for the original issue or document that generated the changes (commit messages, passed argument, spec file, etc.).

### 3. Standards Sources

Check the `SKILL.md` files or global Firebase, UI, Crud rules in the `.agent/skills/` folder. In addition, use the basic **code smells** (Fowler):
- **Mysterious Name**, **Duplicated Code**, **Feature Envy**, **Very long classes/functions**, **Giant hooks in React**, etc.

Remember: the repository's Firebase/React rules always override the generic baseline.

### 4. Spawn parallel sub-agents

- The **Standards** sub-agent will look for violations based on reading the diffs and architecture patterns of the project.
- The **Spec** sub-agent will focus strictly on meeting the described requirements.

### 5. Aggregate

Present the two reports under `## Padrões` (Standards) and `## Especificação` (Spec) in Portuguese. Do not merge the responses, and list the most severe violation in each area (if any).
