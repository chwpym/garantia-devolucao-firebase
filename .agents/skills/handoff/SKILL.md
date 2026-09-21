---
name: handoff
description: Compact the current conversation and state into a handoff document for another agent to continue the work.
argument-hint: "What will be the focus of the next session?"
disable-model-invocation: true
---

**IMPORTANT: The handoff document and your response to the user must be written in Portuguese (PT-BR).**

Write a "handoff" (transition) document summarizing the current conversation so that a new agent can pick up the work. Save it to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section, naming which skills the next agent should use. In the context of this project, remember to mention specific authentication or database (Firebase/IndexedDB) skills that were in focus.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs). Just reference them via path or URL.

Hide and remove any sensitive information, such as API keys, passwords, or PII.

If the user passed arguments, treat them as a description of what the next session will focus on and adjust the document accordingly.
