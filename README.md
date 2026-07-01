# dboai

AI-powered Git CLI tools: auto-generate Jira subtasks & code review from staged changes.

## Install

```bash
npm install
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
- **IYH** (custom OpenAI-compatible endpoint)

### Update only AI provider

```bash
dboai setup --provider
```

### Update only Jira config

```bash
dboai setup --jira
```

Asks for Jira URL, email, API token, default project key, and your `accountId` (for auto-assigning created subtasks to yourself).

#### Getting your Jira API Token

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Give it a name (e.g. `dboai`) and click **Create**
4. Copy the token — you won't be able to see it again

#### Getting your Jira Account ID

```bash
curl -u "your-email@company.com:your-api-token" \
  "https://yourcompany.atlassian.net/rest/api/3/myself" | python3 -m json.tool | grep accountId
```

## Recommended: Install `glow` for better review output

`dboai review` output is markdown. Install `glow` to render it nicely in the terminal with colored headings, formatted tables, and syntax-highlighted code blocks:

```bash
brew install glow
```

If `glow` is not installed, output falls back to plain text with a reminder to install it.

## Usage

### Generate Jira Subtasks

```bash
git add .
dboai subtask EX-1234
```

- Reads staged diff
- Generates subtasks with SP 1/2/3 (breaks down anything bigger)
- Shows preview for confirmation
- Creates subtasks in Jira, auto-assigned if `jira_account_id` is set

### Code Review

Code review rule plans are managed as standalone markdown files at `~/.dboai/rules/`. Each file is self-contained — it defines its own checklist, sections, and required output format. `dboai review` does not impose any output structure of its own; it simply hands your diff and the rule file to the AI and tells it to follow whatever format the rule file specifies.

This means a rule file can ask for plain PASS/FAIL/SKIP findings, severity-tagged inline comments, a ready-to-run `gh pr review` bash script — whatever you define.

#### Managing rule plans

```bash
dboai rules list                  # list all rule plans
dboai rules add react-native      # create a new one, opens in $EDITOR (or nano)
dboai rules edit react-native     # edit an existing one
dboai rules show react-native     # print contents to stdout
dboai rules delete react-native   # delete it
```

Rule plans are global (`~/.dboai/rules/<name>.md`), shared across every project — no per-repo setup needed. Add as many as you want: `react`, `react-native`, `golang`, `python`, `vue`, etc.

#### Running a review

```bash
git add .
dboai review                  # uses the first available rule plan (default)
dboai review react-native     # uses a specific named rule plan
dboai review golang
```

Output follows the format defined in the rule plan file, rendered with `glow` if installed. If the rule plan outputs a `gh pr review` bash script, you'll get back a ready-to-run script.

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
  "jira_default_project": "PROJ",
  "jira_account_id": "..."
}
```

> **Note:** Jira "Sub-task Point" field ID and `issuetype` name may differ per Jira instance. Check yours via:
> ```bash
> curl -u "email:token" \
>   "https://yourcompany.atlassian.net/rest/api/3/issue/createmeta?projectKeys=PROJ&issuetypeNames=Sub-task&expand=projects.issuetypes.fields"
> ```
> Then adjust the `customfield_XXXXX` and `issuetype.name` in `src/utils/jira.js` accordingly.

## Troubleshooting

**400 error when creating subtask:** Jira rejected a field. Check the printed error — it surfaces the `errors` object from Jira's response (e.g. `"story_points": "Field cannot be set..."`).

**429 error on review/subtask generation:** AI provider rate limit. Try a different/lighter model via `dboai setup --provider`.

**404 error:** Wrong model name for the selected provider. Re-run `dboai setup --provider` and pick "Enter manually" to type the exact model ID.

**`dboai review` says no rule plans found:** Run `dboai rules add <name>` first to create one.