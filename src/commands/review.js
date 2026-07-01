import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { loadConfig } from '../utils/config.js';
import { getStagedDiff, isGitRepo } from '../utils/git.js';
import { callAI } from '../providers/ai.js';
import { readRule, ruleExists, listRules, getDefaultRuleName, RULES_DIR } from '../utils/rules.js';

const WRAPPER_INSTRUCTION = `You are a senior code reviewer. Below is a code review rule document. It defines its own rules, checklist, and required output format.

Follow the rule document's instructions EXACTLY as written, including:
- The exact output structure/format it specifies
- The language it requires for findings (e.g. Bahasa Indonesia if specified)
- Any required tagging, severity levels, or report structure described in the document

Do not invent your own output format. Use only what the rule document defines.`;

function hasGlow() {
  try {
    execSync('which glow', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function renderOutput(result) {
  if (hasGlow()) {
    const tmpFile = path.join(os.tmpdir(), `dboai-review-${Date.now()}.md`);
    fs.writeFileSync(tmpFile, result);
    try {
      execSync(`glow "${tmpFile}"`, { stdio: 'inherit' });
    } finally {
      fs.unlinkSync(tmpFile);
    }
  } else {
    console.log(chalk.dim('─'.repeat(60)));
    console.log(result);
    console.log(chalk.dim('─'.repeat(60)));
    console.log(chalk.dim('\n💡 Tip: install `glow` for nicer markdown rendering → brew install glow\n'));
  }
}

export async function reviewCommand(name) {
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

  const ruleName = name || getDefaultRuleName();

  if (!ruleName) {
    console.log(chalk.red(`❌ No rule plans found in ${RULES_DIR}`));
    console.log(chalk.yellow('   Create one with: dboai rules add <name>'));
    process.exit(1);
  }
  if (!ruleExists(ruleName)) {
    console.log(chalk.red(`❌ Rule "${ruleName}" not found.`));
    const available = listRules();
    if (available.length > 0) {
      console.log(chalk.dim(`   Available: ${available.join(', ')}`));
    } else {
      console.log(chalk.dim('   No rule plans exist yet. Create one with: dboai rules add <name>'));
    }
    process.exit(1);
  }

  console.log(chalk.dim(`📄 Rule: ${ruleName}\n`));

  const rulePlanContent = readRule(ruleName);
  const systemPrompt = `${WRAPPER_INSTRUCTION}\n\n---\n\n${rulePlanContent}`;

  const spinner = ora(`Reviewing staged changes (${ruleName})...`).start();

  try {
    const result = await callAI(config, systemPrompt, `Staged diff:\n${diff}`);
    spinner.stop();

    console.log(chalk.cyan.bold('\n🔍 Code Review\n'));
    renderOutput(result);
  } catch (err) {
    spinner.fail('Review failed.');
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}