import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loadConfig } from '../utils/config.js';
import { getStagedDiff, isGitRepo } from '../utils/git.js';
import { callAI } from '../providers/ai.js';
import { createSubtask } from '../utils/jira.js';

const SYSTEM_PROMPT = `You are a Jira project manager assistant. Given a git diff of staged changes, generate Jira subtasks.

Rules:
- Story points: 1, 2, or 3 only
- If a task would be > 3 points, break it into multiple smaller subtasks
- Each subtask must be specific, actionable, and clear
- Focus on WHAT was changed, not HOW the code works
- Return ONLY valid JSON, no markdown, no explanation

Output format:
[
  { "summary": "Short actionable subtask title", "points": 2 },
  { "summary": "Another subtask", "points": 1 }
]`;

export async function subtaskCommand(options) {
  const { issue } = options;

  // Validate
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

  // Generate subtasks
  const spinner = ora(`Generating subtasks for ${chalk.cyan(issue)}...`).start();
  let subtasks;

  try {
    const raw = await callAI(
      config,
      SYSTEM_PROMPT,
      `Parent issue: ${issue}\n\nStaged diff:\n${diff}`
    );

    const clean = raw.replace(/```json|```/g, '').trim();
    subtasks = JSON.parse(clean);
    spinner.succeed('Subtasks generated!');
  } catch (err) {
    spinner.fail('Failed to generate subtasks.');
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  // Display for confirmation
  console.log(chalk.cyan(`\n📋 Subtasks for ${issue}:\n`));
  subtasks.forEach((t, i) => {
    const spColor = t.points === 1 ? chalk.green : t.points === 2 ? chalk.yellow : chalk.red;
    console.log(`  ${chalk.white(`${i + 1}.`)} ${t.summary} ${spColor(`[${t.points} SP]`)}`);
  });

  const totalSP = subtasks.reduce((sum, t) => sum + t.points, 0);
  console.log(chalk.dim(`\n  Total: ${subtasks.length} subtasks, ${totalSP} SP\n`));

  // Confirm
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Create these ${subtasks.length} subtasks in Jira?`,
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Cancelled.'));
    return;
  }

  // Extract project key from issue
  const projectKey = issue.split('-')[0];

  // Create subtasks
  console.log('');
  for (const task of subtasks) {
    const sp = ora(`Creating: ${task.summary}`).start();
    try {
      const result = await createSubtask(config, issue, projectKey, task.summary, task.points);
      sp.succeed(`${chalk.green(result.key)} — ${task.summary} ${chalk.dim(`[${task.points} SP]`)}`);
    } catch (err) {
      sp.fail(`Failed: ${task.summary}`);
      const data = err.response?.data;
      const messages = [
        ...(data?.errorMessages || []),
        ...(data?.errors ? Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`) : []),
      ];
      console.error(chalk.red(`  → ${messages.join(', ') || err.message}`));
    }
  }

  console.log(chalk.green('\n✅ Done!\n'));
}