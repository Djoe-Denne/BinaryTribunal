# Render_FramePresent_Dispatch @ 0x41DF0C — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `314cbeb3174b5d5fb68747b37fe8b672308acff94f2a074dd3364ae38dd1d973`, 19 EA / 48 octets ; [sémantique](../semantic/0x41DF0C__Render_FramePresent_Dispatch.md).
- C exact SHA-256 `546e523a8e3ff9738509b58ea696927c9b7d300c3cd97945901de2e24377cc17` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
int __cdecl sub_41DF0C(_DWORD *a1)
{
    _DWORD *local_4;
    int eax;

    local_4 = (_DWORD *)sub_4098EE(a1);
    eax = (int)local_4;
    if (a1[0xB88 / 4] != 0) {
        eax = ((int (__cdecl *)(_DWORD *))local_4[0x10 / 4])(a1);
    }
    return eax;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `ee3a35a7b40b84ddee3efb42e94e1dcf7b73c1b96a442b905deb1bb63eb0c595` ; copie gelée `tools/_tmp_semantic_triple/0x41df0c/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# Render_FramePresent_Dispatch @ 0x41DF0C

- Instr (live): 19
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Render_FramePresent_Dispatch(_DWORD *)
- Notes parent: jz latch engine+0xB88==0 skip present. FF 50 10 call [eax+10h] slot driver 4 (pas occupancy 0xF8). EAX skip=GetBufApp leftover, present=slot+16. DWORD partout. Occupancy/0xD0/0x1D0/GF+44 absents.

## C réconcilié

```c
/* Render_FramePresent_Dispatch @ 0x41DF0C
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 19 instr, size 0x30, end 0x41DF3C. cdecl, 1 arg, retn C3. EBP frame, push ecx.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Width: all DWORD (89 45 FC / 83 B9 88 0B 00 00 00). No 66 prefix. No setcc. jz only.
 * FF 50 10 = call [eax+10h] driver slot 4, not occupancy 0xF8.
 * EAX skip = GetBufApp leftover; EAX present = slot+16 return.
 */

int __cdecl Render_FramePresent_Dispatch(_DWORD *engine)
{
    _DWORD *var_4;                      /* ebp-4: GetBufApp_0xA74 result (driver) */
    int eax;

    var_4 = (_DWORD *)GetBufApp_0xA74(engine);
    eax = (int)var_4;
    if (engine[0xB88 / 4] != 0) {       /* cmp dword [ecx+0B88h],0 ; jz loc_41DF38 */
        eax = ((int (__cdecl *)(_DWORD *))var_4[0x10 / 4])(engine);
                                        /* FF 50 10 call [eax+10h]; add esp,4 */
    }
    return eax;                         /* loc_41DF38: no extra EAX write */
}
```
````
