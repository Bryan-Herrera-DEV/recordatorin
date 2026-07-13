import { spawn } from 'node:child_process'
import { join } from 'node:path'

const npmCli = process.env.npm_execpath
if (npmCli === undefined) {
  console.error('npm_execpath is not available. Run this script through npm run dist:win.')
  process.exit(1)
}

const nodeCommand = process.execPath
const electronBuilderCli = join(process.cwd(), 'node_modules', 'electron-builder', 'cli.js')

const run = (command, args) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    })

    let output = ''
    const append = (data, stream) => {
      stream.write(data)
      output += data.toString()
      output = output.slice(-100_000)
    }

    child.stdout.on('data', (data) => append(data, process.stdout))
    child.stderr.on('data', (data) => append(data, process.stderr))
    child.on('error', (error) => {
      console.error(error.message)
      resolve({ code: 1, output: error.message })
    })
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })

const build = await run(nodeCommand, [npmCli, 'run', 'build'])
if (build.code !== 0) {
  process.exit(build.code)
}

const builderArgs = ['--win', '--publish', 'never']
const firstBuild = await run(nodeCommand, [electronBuilderCli, ...builderArgs])
if (firstBuild.code === 0) {
  process.exit(0)
}

const appAsarWasLocked = /EBUSY[\s\S]*app\.asar|app\.asar[\s\S]*EBUSY/i.test(firstBuild.output)
if (!appAsarWasLocked) {
  process.exit(firstBuild.code)
}

const fallbackOutput = `release-local-${new Date().toISOString().replace(/[:.]/g, '-')}`
console.warn(`\nrelease/win-unpacked/resources/app.asar esta bloqueado.`)
console.warn(`Reintentando el empaquetado en ${fallbackOutput}/ ...\n`)

const fallbackBuild = await run(nodeCommand, [
  electronBuilderCli,
  ...builderArgs,
  `--config.directories.output=${fallbackOutput}`,
])
process.exit(fallbackBuild.code)
