import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import type { Database as DatabaseConnection } from 'better-sqlite3'
import type { AppSnapshot } from '@/shared/domain/snapshot'
import { isAppSnapshot } from '@/shared/domain/snapshot'

type StateRow = {
  readonly value: string
}

export class SnapshotRepository {
  readonly #db: DatabaseConnection

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true })
    this.#db = new Database(databasePath)
    this.#db.pragma('journal_mode = WAL')
    this.#db.pragma('foreign_keys = ON')
    this.#db
      .prepare(
        `CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      )
      .run()
  }

  load(): AppSnapshot | null {
    const row = this.#db
      .prepare('SELECT value FROM app_state WHERE key = ?')
      .get('snapshot') as StateRow | undefined

    if (row === undefined) {
      return null
    }

    const parsed: unknown = JSON.parse(row.value)
    return isAppSnapshot(parsed) ? parsed : null
  }

  save(snapshot: AppSnapshot): void {
    this.#db
      .prepare(
        `INSERT INTO app_state (key, value, updated_at)
         VALUES (@key, @value, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      )
      .run({
        key: 'snapshot',
        value: JSON.stringify(snapshot),
      })
  }

  close(): void {
    this.#db.close()
  }
}
