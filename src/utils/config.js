import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.dboai');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
export const RULE_PLAN_FILE = path.join(CONFIG_DIR, 'Code Review Rule Plan.md');

export function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadRulePlan() {
  if (!fs.existsSync(RULE_PLAN_FILE)) return null;
  return fs.readFileSync(RULE_PLAN_FILE, 'utf-8');
}

export function configExists() {
  return fs.existsSync(CONFIG_FILE);
}
