
# Claude Flow (Ruflo) Integration Guide

This document explains the Claude Flow (Ruflo) integration in this repository and how the team can use it to improve development workflows.

---

# Overview

This project integrates **Claude Flow (Ruflo)** to enable structured AI-assisted development directly inside the repository.

Claude Flow provides:

- Multi‑agent development workflows
- Specialized AI roles for different engineering tasks
- Swarm orchestration for large tasks
- Memory and coordination across AI agents
- MCP (Model Context Protocol) integration with Claude Code

The integration allows developers to use AI as **specialized teammates** instead of a single general assistant.

---

# Why Claude Flow Was Added

The goal of integrating Claude Flow is to:

- Speed up feature development
- Improve code quality through specialized AI reviews
- Provide security and release auditing
- Enable parallel AI task execution when needed
- Give Claude consistent context about the repository

Instead of asking one AI to do everything, we can now assign tasks to **specialized agents**.

---

# Architecture of the Integration

Claude Flow adds several important directories and config files.

## `.claude/`

Contains the AI development configuration.

### `settings.json`
Defines:

- agent permissions
- allowed operations
- model preferences
- workflow hooks

### `agents/`

Specialist AI agents for this project:

| Agent | Responsibility |
|------|------|
| backend-dev | Server actions, Prisma, APIs, database logic |
| frontend-dev | Next.js UI, React components, Tailwind layout |
| security-qa | Security review, auth checks, vulnerability detection |
| product-lead | Feature scope, user flows, product decisions |
| product-designer | UX, layout hierarchy, accessibility |
| release-manager | Build checks, deployment readiness |

Each agent contains instructions tailored to this repository.

### `skills/`

Reusable AI capabilities including:

- swarm orchestration
- pair programming
- SPARC methodology
- verification workflows
- stream chaining

### `commands/`

Custom slash commands that can trigger workflows.

---

## `.claude-flow/`

Runtime configuration for Ruflo.

Contains:

- swarm configuration
- memory store configuration
- MCP server settings

The MCP server allows Claude Code to coordinate multiple agents.

---

## `.mcp.json`

Defines how Claude Code connects to the Ruflo MCP server.

When the repo opens in Claude Code, it automatically connects.

---

# Starting the Claude Flow MCP Server

From the repository root:

```bash
claude-flow mcp start
```

This launches the MCP server used by Claude Code.

Default configured port:

```
3001
```

---

# Using Claude Flow Agents

Agents can be invoked using `@agent-name` inside Claude Code.

Example:

```
@backend-dev create a new server action for updating macro targets
```

Example:

```
@frontend-dev build a responsive meal plan card component
```

Example:

```
@security-qa review the check-in submission flow for auth issues
```

---

# Typical Development Workflow

## 1. Feature Planning

Use the product lead to scope work.

```
@product-lead design the user flow for adding workout programs
```

---

## 2. Implementation

Split tasks across agents.

Example:

```
@backend-dev implement the server actions and prisma queries
@frontend-dev implement the UI components
```

---

## 3. Security Review

Before merging:

```
@security-qa audit the feature for security issues
```

---

## 4. Release Readiness

```
@release-manager run build checks and release validation
```

---

# Swarm Mode (Parallel AI Development)

Claude Flow can coordinate multiple agents working together.

Initialize swarm:

```bash
claude-flow swarm init
```

Start swarm:

```bash
claude-flow swarm start --topology mesh
```

Optional memory store:

```bash
claude-flow memory init
```

Background workers:

```bash
claude-flow daemon start
```

Swarm mode is useful when:

- implementing large features
- refactoring across many files
- performing large code audits

---

# Best Practices for Using Claude Flow

## 1. Use specialized agents

Always prefer a specific agent over general instructions.

Good:

```
@frontend-dev improve meal plan UI layout
```

Bad:

```
Claude fix the UI
```

---

## 2. Keep tasks focused

Small tasks produce higher quality results.

---

## 3. Run security review before releases

Security‑QA should review:

- authentication
- secrets
- API endpoints
- file uploads
- authorization checks

---

## 4. Use swarm for complex features

Swarm mode works best when a feature touches:

- database
- backend
- frontend
- security

---

# Example Workflow for a New Feature

Example: **Workout Program System**

Step 1 — Planning

```
@product-lead design workout program feature and user flows
```

Step 2 — Backend

```
@backend-dev design prisma models and server actions
```

Step 3 — Frontend

```
@frontend-dev build workout program editor UI
```

Step 4 — Security

```
@security-qa verify role access and data exposure
```

Step 5 — Release

```
@release-manager verify build and deployment readiness
```

---

# When NOT to Use Claude Flow

Claude Flow is not necessary for:

- small one-line fixes
- trivial UI tweaks
- quick debugging

It is most valuable for **structured feature development and audits**.

---

# Summary

Claude Flow turns Claude into a **coordinated AI engineering team**.

With this integration we now have:

- specialized development agents
- swarm orchestration
- project‑aware AI workflows
- integrated security review
- structured release validation

Using these tools correctly will significantly improve development velocity and reliability for this project.
