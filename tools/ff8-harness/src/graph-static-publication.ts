/** Parent-configured OFFLINE file target; not a native/IDA publication adapter.
 * File fsync/readback supports recovery, not cross-SQLite/FS or power-loss atomicity.
 */
import { closeSync, constants, fstatSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { canonical, fingerprint } from "./validation";
import { parsePublicationMaterializationV1, parseStaticPublicationPolicyV1, publicationTargetIdV1, type StaticPublicationPolicyV1 } from "./graph-publication-materialization";

export interface StaticPublicationPort {
  readonly kind: "offline-static-publication-v1"; readonly policy: StaticPublicationPolicyV1;
  write(request: Readonly<{ targetId: string; requestDigest: string; content: string }>): Promise<void>;
  read(request: Readonly<{ targetId: string; requestDigest: string }>): Promise<{ targetId: string; requestDigest: string; content: string; source: string }>;
}
function check(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`rms-static-publication: ${message}`); }
export function staticPublicationReadbackSourceV1(policy: StaticPublicationPolicyV1, targetId: string): string {
  return `offline-static-byte-readback:${canonical({ policy, targetId })}`;
}
export function createStaticPublicationPort(rawPolicy: StaticPublicationPolicyV1): StaticPublicationPort {
  const policy = Object.freeze(parseStaticPublicationPolicyV1(rawPolicy));
  const root = policy.targetRoot;
  check(isAbsolute(root) && resolve(root) === root && realpathSync(root) === root, "explicit existing canonical parent-owned root required");
  const rootStat = lstatSync(root); check(rootStat.isDirectory() && !rootStat.isSymbolicLink(), "root must be an existing real directory");
  function path(targetId: string): string {
    const prefix = `${policy.targetNamespace}:`; check(targetId.startsWith(prefix) && /^[a-f0-9]{64}$/.test(targetId.slice(prefix.length)), "closed target ID required");
    const current = lstatSync(root); check(current.isDirectory() && !current.isSymbolicLink() && current.dev === rootStat.dev && current.ino === rootStat.ino && realpathSync(root) === root, "parent-owned root changed");
    return join(root, `${targetId.slice(prefix.length)}.json`);
  }
  function readBytes(file: string): Buffer {
    const before = lstatSync(file); check(before.isFile() && !before.isSymbolicLink(), "target must be a regular non-symlink file");
    const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const stat = fstatSync(fd); check(stat.isFile() && stat.dev === before.dev && stat.ino === before.ino, "target changed during read");
      const bytes = readFileSync(fd), after = lstatSync(file);
      check(after.isFile() && !after.isSymbolicLink() && after.dev === stat.dev && after.ino === stat.ino && after.size === bytes.length, "target changed during readback");
      return bytes;
    } finally { closeSync(fd); }
  }
  return {
    kind: "offline-static-publication-v1", policy,
    async write(request) {
      check(/^[a-f0-9]{64}$/.test(request.requestDigest), "pending request digest required");
      const manifest = parsePublicationMaterializationV1(JSON.parse(request.content));
      check(canonical(manifest) === request.content && manifest.policySha256 === fingerprint(policy) && manifest.targetId === request.targetId && publicationTargetIdV1(manifest, policy) === request.targetId, "exact canonical manifest/target required");
      const file = path(request.targetId), bytes = Buffer.from(request.content, "utf8"); let fd: number;
      try { fd = openSync(file, "wx", 0o600); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        check(readBytes(file).equals(bytes), "existing target differs (partial/divergent publication retained)"); return;
      }
      try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
      check(readBytes(file).equals(bytes), "written target readback mismatch");
    },
    async read(request) {
      check(/^[a-f0-9]{64}$/.test(request.requestDigest), "pending request digest required");
      const bytes = readBytes(path(request.targetId));
      const content = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
      check(Buffer.from(content, "utf8").equals(bytes), "nonexact UTF8 readback");
      return { ...request, content, source: staticPublicationReadbackSourceV1(policy, request.targetId) };
    },
  };
}
