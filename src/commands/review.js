import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, loadRulePlan, RULE_PLAN_FILE } from '../utils/config.js';
import { getStagedDiff, isGitRepo } from '../utils/git.js';
import { callAI } from '../providers/ai.js';

const BASE_SYSTEM_PROMPT = `You are a senior code reviewer. Review the provided git diff based on the given code review rules.

Output format (use exactly this structure):
## Summary
One sentence overall assessment.

## Findings

### 🔴 Critical
- file.ts:42 — description of issue

### 🟡 Warning  
- file.ts:10 — description of issue

### 🟢 Suggestion
- file.ts:5 — description of issue

## Verdict
PASS / PASS WITH NOTES / NEEDS REVISION

If no issues in a severity level, omit that section.
Be concise. Focus on real problems, not style nitpicks unless rules specify.`;

export async function reviewCommand() {
  const config = loadConfig();
  if (!config) {
    console.log(chalk.red('❌ Run `dboai setup` first.'));
    process.exit(1);
  }
  if (!isGitRepo()) {
    console.log(chalk.red('❌ Not a git repository.'));
    process.exit(1);
  }

  const diff = getStagedDiff();
  if (!diff) {
    console.log(chalk.yellow('⚠️  No staged changes found. Use `git add` first.'));
    process.exit(1);
  }

  const rulePlan = loadRulePlan();
  if (!rulePlan) {
    console.log(chalk.yellow(`⚠️  No rule plan found at: ${RULE_PLAN_FILE}`));
    console.log(chalk.yellow('   Proceeding with default review rules...\n'));
  }

  const systemPrompt = rulePlan
    ? `${BASE_SYSTEM_PROMPT}\n\n## Code Review Rules\n${rulePlan}`
    : BASE_SYSTEM_PROMPT;

  const spinner = ora('Reviewing staged changes...').start();

  try {
    const result = await callAI(config, systemPrompt, `Staged diff:\n${diff}`);
    spinner.stop();

    console.log(chalk.cyan.bold('\n🔍 Code Review\n'));
    console.log(chalk.dim('─'.repeat(60)));

    // Colorize output
    const lines = result.split('\n');
    for (const line of lines) {
      if (line.startsWith('## ')) {
        console.log(chalk.cyan.bold(line));
      } else if (line.startsWith('### 🔴')) {
        console.log(chalk.red.bold(line));
      } else if (line.startsWith('### 🟡')) {
        console.log(chalk.yellow.bold(line));
      } else if (line.startsWith('### 🟢')) {
        console.log(chalk.green.bold(line));
      } else if (line.includes('NEEDS REVISION')) {
        console.log(chalk.red.bold(line));
      } else if (line.includes('PASS WITH NOTES')) {
        console.log(chalk.yellow.bold(line));
      } else if (line.includes('PASS') && !line.includes('NOTES') && !line.includes('NEEDS')) {
        console.log(chalk.green.bold(line));
      } else {
        console.log(line);
      }
    }
    console.log(chalk.dim('─'.repeat(60)) + '\n');
  } catch (err) {
    spinner.fail('Review failed.');
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}
