import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const DEFAULT_ENV_FILE = '.env'
const DEFAULT_HOST_URL = 'http://localhost:9000'
const DEFAULT_OUTPUT_FILE = 'sonar-issues.json'
const MAX_PAGE_SIZE = 500

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  printHelp()
  process.exit(0)
}

loadEnvFile(resolve(process.cwd(), args.envFile ?? process.env.SONAR_ENV_FILE ?? DEFAULT_ENV_FILE))

const token = process.env.SONAR_TOKEN
const hostUrl = process.env.SONAR_HOST_URL ?? DEFAULT_HOST_URL
const projectKey = process.env.SONAR_PROJECT_KEY ?? readSonarProjectKey()
const outputFile = args.outputFile ?? process.env.SONAR_ISSUES_OUT ?? DEFAULT_OUTPUT_FILE
const pageSize = getPageSize(process.env.SONAR_ISSUES_PAGE_SIZE)

if (!token) {
  console.error('SONAR_TOKEN is required. Add it to .env or export it before running npm run sonar:issues.')
  process.exit(1)
}

if (!projectKey) {
  console.error('SONAR_PROJECT_KEY is required when sonar-project.properties does not define sonar.projectKey.')
  process.exit(1)
}

const filters = {
  resolved: 'false',
  severities: normalizeList(process.env.SONAR_ISSUES_SEVERITIES),
  types: normalizeList(process.env.SONAR_ISSUES_TYPES),
  rules: normalizeList(process.env.SONAR_ISSUES_RULES),
  tags: normalizeList(process.env.SONAR_ISSUES_TAGS),
  organization: process.env.SONAR_ORGANIZATION,
}

const issues = await fetchAllIssues({
  hostUrl,
  token,
  projectKey,
  pageSize,
  filters,
})

const output = {
  exportedAt: new Date().toISOString(),
  hostUrl,
  projectKey,
  filters: Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))),
  total: issues.length,
  issues: issues.map(toExportedIssue),
}

const outputPath = resolve(process.cwd(), outputFile)
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)

console.log(`Exported ${issues.length} SonarQube issue(s) to ${outputFile}`)

function parseArgs(argv) {
  const parsed = {}

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      continue
    }

    if (arg.startsWith('--env=')) {
      parsed.envFile = arg.slice('--env='.length)
      continue
    }

    if (arg.startsWith('--out=')) {
      parsed.outputFile = arg.slice('--out='.length)
      continue
    }

    console.error(`Unknown argument: ${arg}`)
    printHelp()
    process.exit(1)
  }

  return parsed
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const normalizedLine = line.startsWith('export ') ? line.slice('export '.length).trim() : line
    const separatorIndex = normalizedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = normalizedLine.slice(0, separatorIndex).trim()
    const value = parseEnvValue(normalizedLine.slice(separatorIndex + 1).trim())

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function parseEnvValue(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replaceAll('\\n', '\n')
      .replaceAll('\\r', '\r')
      .replaceAll('\\t', '\t')
      .replaceAll('\\"', '"')
      .replaceAll('\\\\', '\\')
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1)
  }

  return value.replace(/\s+#.*$/, '').trim()
}

function readSonarProjectKey() {
  const propertiesPath = resolve(process.cwd(), 'sonar-project.properties')

  if (!existsSync(propertiesPath)) {
    return undefined
  }

  const content = readFileSync(propertiesPath, 'utf8')
  const line = content
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('sonar.projectKey='))

  return line?.slice('sonar.projectKey='.length).trim() || undefined
}

function getPageSize(value) {
  if (!value) {
    return MAX_PAGE_SIZE
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
    console.error(`SONAR_ISSUES_PAGE_SIZE must be between 1 and ${MAX_PAGE_SIZE}.`)
    process.exit(1)
  }

  return parsed
}

function normalizeList(value) {
  if (!value) {
    return undefined
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(',')
}

async function fetchAllIssues({ hostUrl, token, projectKey, pageSize, filters }) {
  const authHeader = `Basic ${Buffer.from(`${token}:`).toString('base64')}`
  const issues = []
  let page = 1
  let total = 0

  do {
    const url = buildIssuesUrl({ hostUrl, projectKey, page, pageSize, filters })
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`SonarQube API request failed with HTTP ${response.status}.`)
      console.error(body)
      process.exit(1)
    }

    const data = await response.json()
    const pageIssues = Array.isArray(data.issues) ? data.issues : []

    total = typeof data.total === 'number' ? data.total : issues.length + pageIssues.length
    issues.push(...pageIssues)
    console.log(`Fetched ${issues.length}/${total} issue(s)`)

    if (pageIssues.length === 0) {
      break
    }

    page += 1
  } while (issues.length < total)

  return issues
}

function buildIssuesUrl({ hostUrl, projectKey, page, pageSize, filters }) {
  const url = new URL('api/issues/search', ensureTrailingSlash(hostUrl))

  url.searchParams.set('componentKeys', projectKey)
  url.searchParams.set('resolved', filters.resolved)
  url.searchParams.set('p', String(page))
  url.searchParams.set('ps', String(pageSize))

  for (const [key, value] of Object.entries(filters)) {
    if (key !== 'resolved' && value) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`
}

function toExportedIssue(issue) {
  return {
    key: issue.key,
    rule: issue.rule,
    severity: issue.severity,
    type: issue.type,
    component: issue.component,
    project: issue.project,
    line: issue.line,
    message: issue.message,
    status: issue.status,
    effort: issue.effort,
    debt: issue.debt,
    tags: issue.tags,
    creationDate: issue.creationDate,
    updateDate: issue.updateDate,
    textRange: issue.textRange,
    flows: issue.flows,
  }
}

function printHelp() {
  console.log(`Usage: npm run sonar:issues -- [--env=.env] [--out=sonar-issues.json]

Required variables:
  SONAR_TOKEN          SonarQube user token.

Optional variables:
  SONAR_HOST_URL       SonarQube URL. Defaults to ${DEFAULT_HOST_URL}.
  SONAR_PROJECT_KEY    Project key. Defaults to sonar.projectKey from sonar-project.properties.
  SONAR_ISSUES_OUT     Output JSON file. Defaults to ${DEFAULT_OUTPUT_FILE}.
  SONAR_ENV_FILE       Env file path. Defaults to ${DEFAULT_ENV_FILE}.
  SONAR_ORGANIZATION   Organization key, mainly for SonarCloud.
  SONAR_ISSUES_TYPES   Comma-separated BUG,VULNERABILITY,CODE_SMELL.
  SONAR_ISSUES_SEVERITIES Comma-separated BLOCKER,CRITICAL,MAJOR,MINOR,INFO.
  SONAR_ISSUES_RULES   Comma-separated rule keys.
  SONAR_ISSUES_TAGS    Comma-separated tags.
`)
}
