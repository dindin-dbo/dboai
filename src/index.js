#!/usr/bin/env node
import { program } from 'commander';
import { setupCommand } from './commands/setup.js';
import { subtaskCommand } from './commands/subtask.js';
import { reviewCommand } from './commands/review.js';

program
  .name('dboai')
  .description('AI-powered Git tools for Jira subtask generation & code review')
  .version('1.0.0');

program
  .command('setup')
  .description('Configure AI provider, API keys, and Jira credentials')
  .option('--provider', 'Change AI provider only')
  .option('--jira', 'Change Jira credentials only')
  .action(setupCommand);

program
  .command('subtask')
  .description('Generate Jira subtasks from staged changes')
  .requiredOption('--issue <key>', 'Parent Jira issue key (e.g. PROJ-123)')
  .action(subtaskCommand);

program
  .command('review')
  .description('Code review staged changes based on your rule plan')
  .action(reviewCommand);

program.parse();
