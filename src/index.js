#!/usr/bin/env node
import { program } from 'commander';
import { setupCommand } from './commands/setup.js';
import { subtaskCommand } from './commands/subtask.js';
import { reviewCommand } from './commands/review.js';
import {
  rulesListCommand,
  rulesAddCommand,
  rulesEditCommand,
  rulesShowCommand,
  rulesDeleteCommand,
} from './commands/rules.js';

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
  .command('subtask <issue>')
  .description('Generate Jira subtasks from staged changes')
  .action(subtaskCommand);

program
  .command('review [name]')
  .description('Code review staged changes using a named rule plan (defaults to first available)')
  .action(reviewCommand);

const rules = program
  .command('rules')
  .description('Manage code review rule plans (~/.dboai/rules/*.md)');

rules
  .command('list')
  .description('List all rule plans')
  .action(rulesListCommand);

rules
  .command('add <name>')
  .description('Create a new rule plan and open it in your editor')
  .action(rulesAddCommand);

rules
  .command('edit <name>')
  .description('Edit an existing rule plan')
  .action(rulesEditCommand);

rules
  .command('show <name>')
  .description('Print a rule plan to stdout')
  .action(rulesShowCommand);

rules
  .command('delete <name>')
  .description('Delete a rule plan')
  .action(rulesDeleteCommand);

program.parse();