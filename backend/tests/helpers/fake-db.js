// ============================================================
// IN-PROCESS FAKE MONGODB
// ------------------------------------------------------------
// This environment cannot download a MongoDB binary, so analytics
// (and any other) tests that need a real collection API run against
// this lightweight stand-in. When `mongodb-memory-server` is
// installable the analytics suite will prefer it automatically.
//
// Supports the subset of the driver surface that our analytics and
// creator routes actually use: find/findOne/insertOne/insertMany/
// updateOne/deleteOne/countDocuments/aggregate + ObjectId equality.
// ============================================================

import { ObjectId } from 'mongodb';
import { EventEmitter } from 'events';

function deepClone(value) {
  if (value instanceof ObjectId) return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(deepClone);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepClone(v);
    return out;
  }
  return value;
}

function idsEqual(a, b) {
  if (a == null || b == null) return a === b;
  if (a instanceof ObjectId || b instanceof ObjectId) {
    return String(a) === String(b);
  }
  if (typeof a === 'object' && a._id) return idsEqual(a._id, b);
  if (typeof b === 'object' && b._id) return idsEqual(a, b._id);
  return a === b || String(a) === String(b);
}

function matchValue(actual, expected) {
  if (expected && typeof expected === 'object' && !(expected instanceof ObjectId) && !(expected instanceof Date) && !Array.isArray(expected)) {
    if ('$in' in expected) {
      return expected.$in.some((v) => idsEqual(actual, v) || actual === v);
    }
    if ('$gte' in expected || '$gt' in expected || '$lte' in expected || '$lt' in expected) {
      const t = actual instanceof Date ? actual.getTime() : new Date(actual).getTime();
      if ('$gte' in expected) {
        const bound = expected.$gte instanceof Date ? expected.$gte.getTime() : new Date(expected.$gte).getTime();
        if (!(t >= bound)) return false;
      }
      if ('$gt' in expected) {
        const bound = expected.$gt instanceof Date ? expected.$gt.getTime() : new Date(expected.$gt).getTime();
        if (!(t > bound)) return false;
      }
      if ('$lte' in expected) {
        const bound = expected.$lte instanceof Date ? expected.$lte.getTime() : new Date(expected.$lte).getTime();
        if (!(t <= bound)) return false;
      }
      if ('$lt' in expected) {
        const bound = expected.$lt instanceof Date ? expected.$lt.getTime() : new Date(expected.$lt).getTime();
        if (!(t < bound)) return false;
      }
      return true;
    }
    if ('$ne' in expected) return !idsEqual(actual, expected.$ne) && actual !== expected.$ne;
    if ('$exists' in expected) return expected.$exists ? actual !== undefined : actual === undefined;
  }
  if (expected instanceof RegExp) return expected.test(String(actual ?? ''));
  return idsEqual(actual, expected) || actual === expected;
}

function matchDoc(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$or') {
      if (!Array.isArray(expected) || !expected.some((clause) => matchDoc(doc, clause))) return false;
      continue;
    }
    if (key === '$and') {
      if (!Array.isArray(expected) || !expected.every((clause) => matchDoc(doc, clause))) return false;
      continue;
    }
    const actual = doc[key];
    if (!matchValue(actual, expected)) return false;
  }
  return true;
}

function compareForSort(a, b, sort) {
  for (const [field, dir] of Object.entries(sort || {})) {
    const av = a[field];
    const bv = b[field];
    let cmp = 0;
    if (av instanceof Date || bv instanceof Date) {
      cmp = new Date(av).getTime() - new Date(bv).getTime();
    } else if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv;
    } else {
      cmp = String(av ?? '').localeCompare(String(bv ?? ''));
    }
    if (cmp !== 0) return dir < 0 ? -cmp : cmp;
  }
  return 0;
}

class FakeCursor {
  constructor(docs) {
    this._docs = docs;
  }
  sort(sortSpec) {
    const sorted = [...this._docs].sort((a, b) => compareForSort(a, b, sortSpec));
    return new FakeCursor(sorted);
  }
  skip(n) {
    return new FakeCursor(this._docs.slice(n));
  }
  limit(n) {
    return new FakeCursor(this._docs.slice(0, n));
  }
  project(proj) {
    if (!proj) return this;
    const include = Object.entries(proj).filter(([, v]) => v).map(([k]) => k);
    if (!include.length) return this;
    const projected = this._docs.map((d) => {
      const out = { _id: d._id };
      for (const k of include) if (k in d) out[k] = d[k];
      return out;
    });
    return new FakeCursor(projected);
  }
  async toArray() {
    return this._docs.map(deepClone);
  }
  async next() {
    return this._docs.length ? deepClone(this._docs.shift()) : null;
  }
  [Symbol.asyncIterator]() {
    const docs = this._docs.map(deepClone);
    let i = 0;
    return {
      async next() {
        if (i >= docs.length) return { done: true, value: undefined };
        return { done: false, value: docs[i++] };
      },
    };
  }
}

function applyUpdate(doc, update) {
  const out = deepClone(doc);
  if (!update) return out;
  if (update.$set) Object.assign(out, deepClone(update.$set));
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      out[k] = (Number(out[k]) || 0) + Number(v);
    }
  }
  if (update.$max) {
    for (const [k, v] of Object.entries(update.$max)) {
      out[k] = Math.max(Number(out[k]) || 0, Number(v) || 0);
    }
  }
  if (update.$unset) {
    for (const k of Object.keys(update.$unset)) delete out[k];
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(out[k])) out[k] = [];
      out[k].push(deepClone(v));
    }
  }
  // Plain replacement fields (no operators)
  for (const [k, v] of Object.entries(update)) {
    if (k.startsWith('$')) continue;
    out[k] = deepClone(v);
  }
  return out;
}

function groupKey(doc, idSpec) {
  if (idSpec == null) return null;
  if (typeof idSpec !== 'object') return doc[idSpec];
  // Simple date operators are not needed for our analytics tests.
  const parts = {};
  for (const [k, v] of Object.entries(idSpec)) {
    if (typeof v === 'string' && v.startsWith('$')) parts[k] = doc[v.slice(1)];
    else parts[k] = v;
  }
  return JSON.stringify(parts);
}

function resolveField(doc, expr) {
  if (typeof expr === 'string' && expr.startsWith('$')) {
    return doc[expr.slice(1)];
  }
  if (expr && typeof expr === 'object') {
    if ('$sum' in expr) {
      const inner = expr.$sum;
      if (inner === 1) return 1;
      return Number(resolveField(doc, inner)) || 0;
    }
    if ('$avg' in expr) return Number(resolveField(doc, expr.$avg)) || 0;
    if ('$ifNull' in expr) {
      const [primary, fallback] = expr.$ifNull;
      const v = resolveField(doc, primary);
      return v == null ? resolveField(doc, fallback) : v;
    }
  }
  return expr;
}

class FakeCollection {
  constructor(name, store) {
    this.name = name;
    this._store = store;
  }
  _docs() {
    if (!this._store[this.name]) this._store[this.name] = [];
    return this._store[this.name];
  }
  find(filter = {}) {
    const matched = this._docs().filter((d) => matchDoc(d, filter));
    return new FakeCursor(matched.map(deepClone));
  }
  async findOne(filter = {}) {
    const docs = await this.find(filter).toArray();
    return docs[0] || null;
  }
  async insertOne(doc) {
    const copy = deepClone(doc);
    if (!copy._id) copy._id = new ObjectId();
    this._docs().push(copy);
    return { acknowledged: true, insertedId: copy._id };
  }
  async insertMany(docs) {
    const ids = [];
    for (const d of docs) {
      const r = await this.insertOne(d);
      ids.push(r.insertedId);
    }
    return { acknowledged: true, insertedIds: ids };
  }
  async updateOne(filter, update) {
    const docs = this._docs();
    const idx = docs.findIndex((d) => matchDoc(d, filter));
    if (idx < 0) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    docs[idx] = applyUpdate(docs[idx], update);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }
  async updateMany(filter, update) {
    const docs = this._docs();
    let n = 0;
    for (let i = 0; i < docs.length; i++) {
      if (matchDoc(docs[i], filter)) {
        docs[i] = applyUpdate(docs[i], update);
        n += 1;
      }
    }
    return { acknowledged: true, matchedCount: n, modifiedCount: n };
  }
  async deleteOne(filter) {
    const docs = this._docs();
    const idx = docs.findIndex((d) => matchDoc(d, filter));
    if (idx < 0) return { acknowledged: true, deletedCount: 0 };
    docs.splice(idx, 1);
    return { acknowledged: true, deletedCount: 1 };
  }
  async deleteMany(filter = {}) {
    const docs = this._docs();
    let n = 0;
    for (let i = docs.length - 1; i >= 0; i--) {
      if (matchDoc(docs[i], filter)) {
        docs.splice(i, 1);
        n += 1;
      }
    }
    return { acknowledged: true, deletedCount: n };
  }
  async countDocuments(filter = {}) {
    return this._docs().filter((d) => matchDoc(d, filter)).length;
  }
  async distinct(field, filter = {}) {
    const set = new Set();
    for (const d of this._docs()) {
      if (matchDoc(d, filter) && d[field] != null) set.add(String(d[field]));
    }
    return [...set];
  }
  aggregate(pipeline = []) {
    let rows = this._docs().map(deepClone);
    for (const stage of pipeline) {
      if (stage.$match) {
        rows = rows.filter((d) => matchDoc(d, stage.$match));
      } else if (stage.$group) {
        const groups = new Map();
        for (const doc of rows) {
          const key = groupKey(doc, stage.$group._id);
          if (!groups.has(key)) {
            const base = { _id: stage.$group._id == null ? null : key };
            for (const [field, expr] of Object.entries(stage.$group)) {
              if (field === '_id') continue;
              if (expr && typeof expr === 'object' && '$sum' in expr) base[field] = 0;
              else if (expr && typeof expr === 'object' && '$avg' in expr) base[field] = { sum: 0, n: 0 };
              else base[field] = null;
            }
            groups.set(key, base);
          }
          const g = groups.get(key);
          for (const [field, expr] of Object.entries(stage.$group)) {
            if (field === '_id') continue;
            if (expr && typeof expr === 'object' && '$sum' in expr) {
              const add = expr.$sum === 1 ? 1 : Number(resolveField(doc, expr.$sum)) || 0;
              g[field] += add;
            } else if (expr && typeof expr === 'object' && '$avg' in expr) {
              const v = Number(resolveField(doc, expr.$avg)) || 0;
              g[field].sum += v;
              g[field].n += 1;
            }
          }
        }
        rows = [...groups.values()].map((g) => {
          const out = { ...g };
          for (const [k, v] of Object.entries(out)) {
            if (v && typeof v === 'object' && 'sum' in v && 'n' in v) {
              out[k] = v.n ? v.sum / v.n : 0;
            }
          }
          // Restore structured _id when it was an object spec with no fields
          if (stage.$group._id == null) out._id = null;
          else if (typeof stage.$group._id === 'object') {
            // keep stringified key; tests only check numeric fields
          }
          return out;
        });
      } else if (stage.$sort) {
        rows = rows.sort((a, b) => compareForSort(a, b, stage.$sort));
      } else if (stage.$limit) {
        rows = rows.slice(0, stage.$limit);
      } else if (stage.$skip) {
        rows = rows.slice(stage.$skip);
      } else if (stage.$project) {
        rows = rows.map((d) => {
          const out = {};
          for (const [k, v] of Object.entries(stage.$project)) {
            if (v === 1 || v === true) out[k] = d[k];
            else if (typeof v === 'string' && v.startsWith('$')) out[k] = d[v.slice(1)];
          }
          if (stage.$project._id !== 0) out._id = d._id;
          return out;
        });
      }
    }
    return new FakeCursor(rows);
  }
}

export class FakeDb {
  constructor(name = 'zenith_fake') {
    this.databaseName = name;
    this._store = Object.create(null);
  }
  collection(name) {
    return new FakeCollection(name, this._store);
  }
  async command(cmd) {
    if (cmd?.ping) return { ok: 1 };
    return { ok: 1 };
  }
  async dropDatabase() {
    this._store = Object.create(null);
  }
}

/**
 * Install a FakeDb (or any db handle) onto the live dbManager so route
 * handlers that go through requireDb / getDb see it as connected.
 * Returns a restore() function.
 */
export function installFakeDb(dbManager, fakeDb = new FakeDb()) {
  const previous = {
    db: dbManager.db,
    client: dbManager.client,
    state: dbManager.state,
    lastError: dbManager.lastError,
    connectedAt: dbManager.connectedAt,
  };

  // Minimal client stub so close() is safe.
  const client = {
    async close() {},
    db() {
      return fakeDb;
    },
  };

  dbManager.client = client;
  dbManager.db = fakeDb;
  dbManager.state = 'connected';
  dbManager.lastError = null;
  dbManager.connectedAt = new Date();
  // Cancel any pending retry so tests don't race a real reconnect.
  if (dbManager.retryTimer) {
    clearTimeout(dbManager.retryTimer);
    dbManager.retryTimer = null;
  }

  return {
    db: fakeDb,
    restore() {
      dbManager.db = previous.db;
      dbManager.client = previous.client;
      dbManager.state = previous.state;
      dbManager.lastError = previous.lastError;
      dbManager.connectedAt = previous.connectedAt;
    },
  };
}

/**
 * Try to spin up mongodb-memory-server. Resolves to null when the package
 * is missing or the binary cannot be downloaded (the common case here).
 */
export async function tryMemoryServer() {
  try {
    const mod = await import('mongodb-memory-server');
    const { MongoMemoryServer } = mod;
    const mongod = await MongoMemoryServer.create({
      instance: { dbName: 'zenith_test' },
    });
    const { MongoClient } = await import('mongodb');
    const uri = mongod.getUri();
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('zenith_test');
    return {
      kind: 'memory-server',
      db,
      async stop() {
        await client.close();
        await mongod.stop();
      },
    };
  } catch (err) {
    return null;
  }
}

/**
 * Preferred DB for analytics tests: memory server when reachable, else fake.
 * `attach(dbManager)` wires it in; `stop()` tears it down.
 */
export async function createTestDatabase(dbManager) {
  const memory = await tryMemoryServer();
  if (memory) {
    const installed = installFakeDb(dbManager, memory.db);
    // Override client so restore is clean, but keep real driver handle.
    return {
      kind: 'memory-server',
      db: memory.db,
      restore: installed.restore,
      async stop() {
        installed.restore();
        await memory.stop();
      },
    };
  }

  const fake = new FakeDb('zenith_test');
  const installed = installFakeDb(dbManager, fake);
  return {
    kind: 'fake',
    db: fake,
    restore: installed.restore,
    async stop() {
      installed.restore();
    },
  };
}

export { ObjectId, EventEmitter };
export default FakeDb;
