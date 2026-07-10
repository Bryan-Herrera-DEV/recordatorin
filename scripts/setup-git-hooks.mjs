import { chmodSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const hookPath = '.githooks/pre-push'

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' })
if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

try {
  chmodSync(hookPath, 0o755)
} catch {
  // Git for Windows does not require POSIX executable bits for hooks.
}

console.log('Git hooks enabled. pre-push will run npm run validate:prepush.')
