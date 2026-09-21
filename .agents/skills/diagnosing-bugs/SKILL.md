---
name: diagnosing-bugs
description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
---

# Diagnosing Bugs

A rigorous discipline for resolving hard bugs in Firebase and React. Skip phases only when explicitly justified.

**IMPORTANT: Always respond to the user and write any reports or summaries in Portuguese (PT-BR).**

When exploring the codebase, read `CONTEXT.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the affected area. Also consider the project's `IndexedDB` and `Auth` patterns.

## Redact

This skill requires you to show commands, outputs, and captured artifacts. **Redact any secret first**: write `<REDACTED>` in its place. Build test loops against env vars to keep credentials in the environment rather than logs. If the redacted output is insufficient, tell the user (in Portuguese).

## Phase 1: Build a feedback loop

**This is the core of the skill.** Everything else is mechanical. If you have a clear, narrow failure signal (one that goes red on *this* bug), you will find the cause.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one (suggested order)

1. **Failing test** at any boundary: unit, integration, etc.
2. **HTTP Script / Firebase Function** against local emulator or dev server.
3. **CLI Invocation** comparing to known output.
4. **Headless Browser Script** for re-renders or UI problems.
5. **Differential loop**: run input in old vs new version and compare.
6. **Local IndexedDB or Isolated Auth test.**

Treat the loop as a product. Refine it to be **fast**, **focused**, and **deterministic**.
If you cannot build the loop, stop and list what you tried. Ask the user (in Portuguese) for access or captured artifacts.

Phase 1 is complete when you have a failing and reproducible loop.

## Phase 2: Reproduce and Minimise

Run the loop and watch it fail.
Cut dependencies, components, and steps one by one, testing again. Keep only what is strictly necessary to reproduce the failure (minimizing the scenario reduces the hypothesis space).

## Phase 3: Hypothesise

Generate **3 to 5 hypotheses** before testing any. Generating a single hypothesis anchors you to the first idea.
Every hypothesis must be falsifiable: "If X is the cause, changing Y will make the bug disappear." Show the list to the user before testing (in Portuguese), as they may have essential business context.

## Phase 4: Instrument

Change one variable at a time, mapping each test to a hypothesis.
Add focused logs (e.g., `[DEBUG-BUG]` in the Firebase console or browser console) instead of logging everything. For performance issues, establish a baseline (e.g., using `performance.now()`).

## Phase 5: Fix + Regression Test

Write the regression test before the fix, but only if applicable and touches the real failure (excessive re-renders, IndexedDB lock, etc.).
Validate the fix.
Clean up the instrumentation (Phase 6).

## Phase 6: Cleanup

Required before declaring done:
- The original bug no longer occurs.
- Regression test passes.
- All `[DEBUG-...]` logs have been removed.
- Throwaway prototypes deleted.
- The correct hypothesis is documented in the commit/PR for future context.
