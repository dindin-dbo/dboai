import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import { loadConfig, saveConfig, RULE_PLAN_FILE } from '../utils/config.js';
import { getProviderList, getModelsForProvider } from '../providers/ai.js';

export async function setupCommand(options) {
  console.log(chalk.cyan.bold('\n🔧 dboai setup\n'));

  const existing = loadConfig() || {};

  // AI Provider
  const providerList = getProviderList();
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select AI provider:',
      choices: providerList.map(p => ({ name: p.name, value: p.key })),
      default: existing.ai_provider,
    },
  ]);

  const models = getModelsForProvider(provider);
  const { model } = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: 'Select model:',
      choices: [...models, new inquirer.Separator(), { name: 'Enter manually', value: '__manual__' }],
      default: existing.ai_model,
    },
  ]);

  let finalModel = model;
  if (model === '__manual__') {
    const { manualModel } = await inquirer.prompt([
      { type: 'input', name: 'manualModel', message: 'Enter model name:' },
    ]);
    finalModel = manualModel;
  }

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter ${provider} API key:`,
      default: existing.ai_api_key ? '(keep existing)' : undefined,
      filter: (val) => (val === '(keep existing)' ? existing.ai_api_key : val),
    },
  ]);

  if (options?.provider) {
    // Only updating provider
    saveConfig({ ...existing, ai_provider: provider, ai_model: finalModel, ai_api_key: apiKey });
    console.log(chalk.green('\n✅ AI provider updated!\n'));
    return;
  }

  // Jira config
  console.log(chalk.cyan('\n📋 Jira Configuration\n'));
  const jiraAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'jira_url',
      message: 'Jira URL (e.g. https://yourcompany.atlassian.net):',
      default: existing.jira_url,
    },
    {
      type: 'input',
      name: 'jira_email',
      message: 'Jira email:',
      default: existing.jira_email,
    },
    {
      type: 'password',
      name: 'jira_api_token',
      message: 'Jira API token:',
      default: existing.jira_api_token ? '(keep existing)' : undefined,
      filter: (val) => (val === '(keep existing)' ? existing.jira_api_token : val),
    },
    {
      type: 'input',
      name: 'jira_default_project',
      message: 'Default Jira project key (e.g. PROJ):',
      default: existing.jira_default_project,
    },
  ]);

  const config = {
    ai_provider: provider,
    ai_model: finalModel,
    ai_api_key: apiKey,
    ...jiraAnswers,
  };

  saveConfig(config);
  console.log(chalk.green('\n✅ Config saved to ~/.dboai/config.json\n'));

  // Remind about rule plan
  if (!fs.existsSync(RULE_PLAN_FILE)) {
    console.log(chalk.yellow(`⚠️  Code Review Rule Plan not found.`));
    console.log(chalk.yellow(`   Place your markdown file at:`));
    console.log(chalk.white(`   ${RULE_PLAN_FILE}\n`));
  } else {
    console.log(chalk.green(`✅ Code Review Rule Plan found.\n`));
  }
}
