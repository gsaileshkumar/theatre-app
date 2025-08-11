import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

export default async function globalTeardown() {
  const runtimePath = path.resolve(__dirname, '../../.test-runtime.json');
  if (!fs.existsSync(runtimePath)) return;
  const data = JSON.parse(fs.readFileSync(runtimePath, 'utf-8'));
  if (data.skip) {
    fs.rmSync(runtimePath, { force: true });
    return;
  }
  const { containerId, pid } = data;
  try {
    if (pid) process.kill(pid, 'SIGTERM');
  } catch {}
  try {
    execSync(`docker rm -f ${containerId}`, { stdio: 'ignore' });
  } catch {}
  fs.rmSync(runtimePath, { force: true });
}