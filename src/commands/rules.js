import chalk from 'chalk';
import { execSync } from 'child_process';
import {
  listRules,
  ruleExists,
  getRulePath,
  readRule,
  writeRule,
  deleteRule,
  RULES_DIR,
} from '../utils/rules.js';

function openInEditor(filePath) {
  const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
  try {
    execSync(`${editor} "${filePath}"`, { stdio: 'inherit' });
    return true;
  } catch {
    console.log(chalk.red(`❌ Failed to open editor (${editor}). Set $EDITOR or edit manually:`));
    console.log(chalk.white(`   ${filePath}`));
    return false;
  }
}

export function rulesListCommand() {
  const rules = listRules();
  if (rules.length === 0) {
    console.log(chalk.yellow(`No rule plans found in ${RULES_DIR}`));
    console.log(chalk.dim('Create one with: dboai rules add <name>'));
    return;
  }
  console.log(chalk.cyan.bold(`\n📋 Rule plans (${RULES_DIR})\n`));
  rules.forEach((name, i) => {
    const tag = i === 0 ? chalk.dim(' (default)') : '';
    console.log(`  ${chalk.green(name)}${tag}`);
  });
  console.log('');
}

export function rulesAddCommand(name) {
  if (!name) {
    console.log(chalk.red('❌ Usage: dboai rules add <name>'));
    process.exit(1);
  }
  if (ruleExists(name)) {
    console.log(chalk.yellow(`⚠️  Rule "${name}" already exists. Use \`dboai rules edit ${name}\` instead.`));
    process.exit(1);
  }
  const fp = writeRule(name, `# ${name} Code Review Rules\n\n## Section 1 — \n\n| # | Rule | What to Check |\n|---|------|---------------|\n| 1.1 | | |\n`);
  console.log(chalk.green(`✅ Created: ${fp}`));
  openInEditor(fp);
}

export function rulesEditCommand(name) {
  if (!name) {
    console.log(chalk.red('❌ Usage: dboai rules edit <name>'));
    process.exit(1);
  }
  if (!ruleExists(name)) {
    console.log(chalk.red(`❌ Rule "${name}" not found. Use \`dboai rules add ${name}\` to create it.`));
    process.exit(1);
  }
  openInEditor(getRulePath(name));
}

export function rulesShowCommand(name) {
  if (!name) {
    console.log(chalk.red('❌ Usage: dboai rules show <name>'));
    process.exit(1);
  }
  const content = readRule(name);
  if (!content) {
    console.log(chalk.red(`❌ Rule "${name}" not found.`));
    process.exit(1);
  }
  console.log(content);
}

export function rulesDeleteCommand(name) {
  if (!name) {
    console.log(chalk.red('❌ Usage: dboai rules delete <name>'));
    process.exit(1);
  }
  if (!ruleExists(name)) {
    console.log(chalk.red(`❌ Rule "${name}" not found.`));
    process.exit(1);
  }
  deleteRule(name);
  console.log(chalk.green(`✅ Deleted: ${name}`));
}