# au_re_BdLinkTask @ 0x500DD0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `23247984be526e3e36c9492b6a022aabc2ca074decc3fc78e8d3b9fac328b228`, 7 EA / 23 octets ; [sémantique](../semantic/0x500DD0__au_re_BdLinkTask.md).
- C exact SHA-256 `e67f41355b0cfb1548b2c6be0a1c4f18e4a1505cf913ab4f8a2058802e359662` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 865 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
/* 0x500DD0: existing named source, identifier/comment neutralization ONLY.
 * Live numeric pack: 7 instructions, 23 bytes, [0x500DD0,0x500DE7).
 * Reused declarations are historical C, not a newly inferred prototype.
 * Entry DWORD [esp+4]; push input, push 0x01D96D78; direct call 0x508360;
 * add esp,8; MOV BYTE [full returned EAX+0x0D],0; RET. No NULL test.
 * 0x508360 is an opaque backend, not invocation of the input value.
 * Stable ordinary RAM/private frame/C32/backend conditions apply.
 * No C quality acceptance, fix, regeneration or compiled runtime proof.
 */

extern unsigned int g_01D96D78[4]; /* historical extent, native binding 0x01D96D78 */

extern int __cdecl sub_508360(int arg0, int arg1);

int __cdecl sub_500DD0(int arg1)
{
    int v0;

    v0 = sub_508360((int)&g_01D96D78, arg1);
    *(unsigned char *)(v0 + 0x0D) = 0;
    return v0;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `f27639b289a641e0a0824d6340bf09a5b144bd107abfb966d3132e307bf2b910` ; copie gelée `tools/_tmp_semantic_triple/0x500dd0/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# au_re_BdLinkTask @ 0x500DD0

- Instr (live): 7
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl au_re_BdLinkTask(int callback)
- Notes parent: cdecl Register(list_head, callback) add esp,8. push offset 0x1D96D78. C6 BYTE [eax+0x0D]=0. Retour = nœud EAX. Occupancy/GetRandomInt/0xD0/0x1D0 absents. Pas de test NULL.

## C réconcilié

```c
/* au_re_BdLinkTask @ 0x500DD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 7 instr, size 0x17, end 0x500DE7. IDA type int __cdecl(int).
 * cdecl: EAX=[esp+4] callback DWORD, push callback, push offset list head,
 * call BdLinkTask_Register, add esp,8.
 * C6 40 0D 00: BYTE [node+0x0D]=0. No 66. No NULL test.
 * Return EAX = node from Register (C6 does not clobber EAX).
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int g_BattleTaskQueueListHead[4]; /* 0x1D96D78 _DWORD[4] */

extern int __cdecl BdLinkTask_Register(int list_head, int callback);

int __cdecl au_re_BdLinkTask(int callback)
{
    int node;

    node = BdLinkTask_Register((int)&g_BattleTaskQueueListHead, callback);
    *(unsigned char *)(node + 0x0D) = 0;
    return node;
}
```
````
