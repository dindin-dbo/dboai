# dboai

AI-powered Git CLI tools: auto-generate Jira subtasks & code review from staged changes.

## Install

```bash
npm install -g .
# or
npm link
```

## Setup

```bash
dboai setup
```

Saved to `~/.dboai/config.json`. Supports:
- **Anthropic** (Claude)
- **OpenAI** (GPT-4o, o1, o3)
- **Google Gemini**
- **DeepSeek**
- **Kimi (Moonshot)**
- **OpenRouter** (all models)
- **Groq**
- **Mistral**

### Code Review Rule Plan

Place your markdown rules at:
```
~/.dboai/Code Review Rule Plan.md
```

This single file is shared across all your projects.

## Usage

### Generate Jira Subtasks

```bash
git add .
dboai subtask --issue PROJ-123
```

- Reads staged diff
- Generates subtasks with SP 1/2/3
- Shows preview for confirmation
- Creates subtasks in Jira

### Code Review

```bash
git add .
dboai review
```

- Reviews staged diff against your rule plan
- Outputs Critical / Warning / Suggestion findings
- Verdict: PASS / PASS WITH NOTES / NEEDS REVISION

### Change AI Provider

```bash
dboai setup --provider
```

## Config Reference

`~/.dboai/config.json`:

```json
{
  "ai_provider": "anthropic",
  "ai_model": "claude-sonnet-4-6",
  "ai_api_key": "sk-...",
  "jira_url": "https://yourcompany.atlassian.net",
  "jira_email": "you@company.com",
  "jira_api_token": "...",
  "jira_default_project": "PROJ"
}
```

> **Note:** Jira story points use `customfield_10016`. If your Jira uses a different field, edit `src/utils/jira.js`.
