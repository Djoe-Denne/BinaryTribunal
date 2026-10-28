# Legacy jsonData — exact numbered excerpt from pinned source

Original reference/src/lineage.ts; bytes 69662; SHA-256 7e650185c7dff1e1845c3c0f963cf73a72a29a515874eefd535a0733b78e82a9

```ts
924: function jsonData(value: unknown, parents = new Set<object>()): boolean {
925:   if (value === null || typeof value === "string" || typeof value === "boolean") return true;
926:   if (typeof value === "number") return Number.isFinite(value);
927:   if (typeof value !== "object" || parents.has(value) || parents.size > 128) return false;
928:   if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false;
929:   parents.add(value);
930:   let valid = true;
931:   if (Array.isArray(value)) {
932:     valid = Object.keys(value).length === value.length;
933:     for (let i = 0; valid && i < value.length; i++) valid = Object.hasOwn(value, i) && jsonData(value[i], parents);
934:   } else {
935:     for (const key of Reflect.ownKeys(value)) {
936:       const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
937:       if (typeof key !== "string" || !descriptor.enumerable || !("value" in descriptor) || !jsonData(descriptor.value, parents)) { valid = false; break; }
938:     }
939:   }
940:   parents.delete(value);
941:   return valid;
942: }
```
