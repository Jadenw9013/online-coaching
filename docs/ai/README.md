# AI Orchestration — Steadfast Coach Platform

This directory documents how to use Ruflo (claude-flow v3.5.14) for multi-agent orchestration in this repo.

## Setup Summary

- **Runtime**: Ruflo v3.5.14 (globally installed as `claude-flow`)
- **Config**: `.claude/settings.json` + `.claude-flow/config.yaml`
- **MCP**: `.mcp.json` (project-scoped, auto-loaded by Claude Code)
- **Agents**: `.claude/agents/` (6 project-aware specialists)

## Quick Start

```bash
# Check Ruflo is working
claude-flow --version

# Start MCP server (Claude Code connects automatically via .mcp.json)
claude-flow mcp start

# Initialize memory store (first time)
claude-flow memory init

# View available skills
claude-flow skills list
```

## Specialist Agents

All agents in `.claude/agents/` are pre-loaded with Steadfast's exact stack and file paths. Use `@` mentions in Claude Code to invoke them:

```
@backend-dev   Add a server action for X
@frontend-dev  Build the UI component for Y
@security-qa   Review the auth flow in app/actions/check-in.ts
@release-manager  Run the full release gate
```

See [`agents.md`](./agents.md) for each agent's scope and best use cases.

## Common Workflows

See [`workflows.md`](./workflows.md) for swarm patterns and multi-agent task examples.

## Files

| File | Purpose |
|------|---------|
| `agents.md` | Agent role descriptions and when to use each |
| `workflows.md` | Multi-agent workflow patterns for common tasks |
