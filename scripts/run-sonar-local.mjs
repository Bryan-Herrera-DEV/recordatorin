import { spawnSync } from 'node:child_process'
import { platform } from 'node:os'

const token = process.env.SONAR_TOKEN
const hostUrl = process.env.SONAR_HOST_URL ?? 'http://host.docker.internal:9000'

if (!token) {
  console.error('SONAR_TOKEN is required. Create a token in SonarQube and export it before running npm run sonar:scan.')
  process.exit(1)
}

const args = [
  'run',
  '--rm',
  '--add-host=host.docker.internal:host-gateway',
  '-e',
  `SONAR_HOST_URL=${hostUrl}`,
  '-e',
  `SONAR_TOKEN=${token}`,
  '-v',
  `${process.cwd()}:/usr/src`,
  'sonarsource/sonar-scanner-cli:latest',
]

const result = spawnSync('docker', args, {
  shell: platform() === 'win32',
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
