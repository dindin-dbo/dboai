import { execSync } from 'child_process';

export function getStagedDiff() {
  try {
    const diff = execSync('git diff --staged', { encoding: 'utf-8' });
    return diff.trim();
  } catch {
    return null;
  }
}

export function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
