import fs from 'fs';
import path from 'path';
import os from 'os';

export const RULES_DIR = path.join(os.homedir(), '.dboai', 'rules');

function ensureRulesDir() {
  if (!fs.existsSync(RULES_DIR)) fs.mkdirSync(RULES_DIR, { recursive: true });
}

function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function filePath(name) {
  return path.join(RULES_DIR, `${slugify(name)}.md`);
}

export function listRules() {
  ensureRulesDir();
  return fs
    .readdirSync(RULES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export function ruleExists(name) {
  return fs.existsSync(filePath(name));
}

export function getRulePath(name) {
  return filePath(name);
}

export function readRule(name) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return null;
  return fs.readFileSync(fp, 'utf-8');
}

export function writeRule(name, content) {
  ensureRulesDir();
  fs.writeFileSync(filePath(name), content);
  return filePath(name);
}

export function deleteRule(name) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return false;
  fs.unlinkSync(fp);
  return true;
}

export function getDefaultRuleName() {
  const rules = listRules();
  return rules.length > 0 ? rules[0] : null;
}