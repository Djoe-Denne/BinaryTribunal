import type { Store } from "../store";
import type { RepositoryTransactionV1, RepositoryV1 } from "../ports/repository";

/** Borrow one existing Store. Never opens/closes a connection or copies authority. */
export function createStoreRepositoryV1(store: Store): RepositoryV1 {
  const operations = (check: () => void): RepositoryTransactionV1 => {
    const api: RepositoryTransactionV1 = {
    create: snapshot => { check(); return store.create(snapshot); },
    load: missionId => { check(); return store.load(missionId); },
    acquireLease: (missionId, owner, now, ttlMs) => { check(); return store.acquireLease(missionId, owner, now, ttlMs); },
    assertLease: (lease, now) => { check(); store.assertLease(lease, now); },
    renewLease: (lease, now, ttlMs) => { check(); return store.renewLease(lease, now, ttlMs); },
    commit: (snapshot, revision, lease, now) => { check(); return store.commit(snapshot, revision, lease, now); },
    };
    return Object.freeze(api);
  };
  let running = false;
  return Object.freeze({
    ...operations(() => {}), version: "rms-repository-v1" as const,
    transaction<T>(work: (tx: RepositoryTransactionV1) => T): T {
      if (running) throw new Error("repository transaction reentry is forbidden");
      running = true;
      try {
        return store.transaction(() => {
          let active = true;
          const tx = operations(() => { if (!active) throw new Error("repository transaction scope is closed"); });
          try { return work(tx); } finally { active = false; }
        });
      } finally { running = false; }
    },
  });
}
