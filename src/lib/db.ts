/**
 * Petite couche IndexedDB : un object store par collection, clé `id`.
 * Les migrations sont déclarées par numéro de version dans `MIGRATIONS`.
 */
export const DB_NAME = 'suivi-alternance'
export const DB_VERSION = 1

export type StoreName = 'profile' | 'criteria' | 'companies' | 'jobs' | 'files' | 'settings'
export const STORE_NAMES: StoreName[] = ['profile', 'criteria', 'companies', 'jobs', 'files', 'settings']

const MIGRATIONS: Record<number, (db: IDBDatabase, tx: IDBTransaction) => void> = {
  1: (db) => {
    for (const name of STORE_NAMES) db.createObjectStore(name, { keyPath: 'id' })
  },
  // Évolution future, par exemple :
  // 2: (_db, tx) => { tx.objectStore('jobs').createIndex('byStatus', 'status') },
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error("IndexedDB n'est pas disponible dans ce navigateur."))
        return
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (event) => {
        const tx = req.transaction
        if (!tx) return
        for (let v = event.oldVersion + 1; v <= (event.newVersion ?? DB_VERSION); v++) MIGRATIONS[v]?.(req.result, tx)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error ?? new Error("Impossible d'ouvrir la base locale."))
      req.onblocked = () => reject(new Error('Base locale bloquée par un autre onglet. Fermez-le puis rechargez.'))
    }).catch((e: unknown) => {
      dbPromise = null
      throw e
    })
  }
  return dbPromise
}

async function run<T = undefined>(
  stores: StoreName[],
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const database = await openDb()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(stores, mode)
    const req = work(tx)
    tx.oncomplete = () => resolve(req ? req.result : undefined)
    tx.onerror = () => reject(tx.error ?? new Error('Erreur IndexedDB'))
    tx.onabort = () => reject(tx.error ?? new Error('Transaction annulée (espace disque insuffisant ?)'))
  })
}

export const db = {
  async getAll<T>(store: StoreName): Promise<T[]> {
    return (await run<T[]>([store], 'readonly', (tx) => tx.objectStore(store).getAll())) ?? []
  },
  async put<T extends { id: string }>(store: StoreName, value: T): Promise<void> {
    await run([store], 'readwrite', (tx) => tx.objectStore(store).put(value))
  },
  async putMany<T extends { id: string }>(store: StoreName, values: T[]): Promise<void> {
    await run([store], 'readwrite', (tx) => {
      const os = tx.objectStore(store)
      for (const v of values) os.put(v)
    })
  },
  async remove(store: StoreName, id: string): Promise<void> {
    await run([store], 'readwrite', (tx) => tx.objectStore(store).delete(id))
  },
  async clear(stores: StoreName[]): Promise<void> {
    await run(stores, 'readwrite', (tx) => {
      for (const s of stores) tx.objectStore(s).clear()
    })
  },
}
