# Gte_SQR @ 0x45F930 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `affb5edf73e77e77ad2a72b7ec5ff163a2fdccb1d8422fe5a3c08262c0572dfa`, 36 EA / 176 octets ; [sémantique](../semantic/0x45F930__Gte_SQR.md).
- C exact SHA-256 `4b77300cbc269a6570fe49ba040ff734c74f31091bde710dd70e8d566c61d83a` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 2122 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
                     
                                                                          
                                                                                     
                                                                           
                                                                          
                                                                                 
                                                                            
                                                                                  
                                                     
                                                                                          
                                                       
                                                           
   

extern unsigned int mem_01CA8A34;
extern unsigned int mem_01CA8A38;
extern unsigned int mem_01CA8A3C;
extern unsigned int mem_01CA8A74;
extern unsigned int mem_01CA8A78;
extern unsigned int mem_01CA8A7C;
extern unsigned int mem_01CA92F8;

unsigned int __cdecl sub_0045F930(void)
{
    int v0;
    int v1;
    int v2;
    unsigned int v3;

    v0 = (int)(short)mem_01CA8A34;
    v1 = (int)(short)mem_01CA8A38;
    v0 = v0 * v0;
    v2 = (int)(short)mem_01CA8A3C;
    v1 = v1 * v1;
    v2 = v2 * v2;

    mem_01CA92F8 = 0;
    mem_01CA8A74 = (unsigned int)v0;
    mem_01CA8A78 = (unsigned int)v1;
    mem_01CA8A7C = (unsigned int)v2;

    if ((unsigned int)v0 > 0x7FFFu) {
        v0 = (~(v0 >> 31)) & 0x7FFF;
        mem_01CA92F8 = 0x81000000u;
    }
    mem_01CA8A34 = (unsigned int)v0;

    if ((unsigned int)v1 > 0x7FFFu) {
        v3 = mem_01CA92F8;
        v1 = (~(v1 >> 31)) & 0x7FFF;
        v3 |= 0x80800000u;
        mem_01CA92F8 = v3;
    }
    mem_01CA8A38 = (unsigned int)v1;

    if ((unsigned int)v2 > 0x7FFFu) {
        v3 = mem_01CA92F8;
        v2 = (~(v2 >> 31)) & 0x7FFF;
        v3 |= 0x400000u;
        mem_01CA92F8 = v3;
    }
    mem_01CA8A3C = (unsigned int)v2;
    return (unsigned int)v2;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `953e765164e603e53e608a90557530fa29e5581fa06a5a960f284803ad10ca20` ; copie gelée `tools/_tmp_semantic_triple/0x45f930/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# Gte_SQR @ 0x45F930

- Instr (live): 36
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=13
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=9
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=9
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl Gte_SQR(void)
- Notes parent: 3× movsx s16 34/38/3C, imul², stores DWORD unsaturés 74/78/7C puis sat. jbe (76) unsigned vs 7FFFh (pas jle). Sat SAR 31/NOT/AND 7FFF. FLAG 1CA92F8: MOV 0 ; ov1 MOV 81000000h ; ov2 OR 80800000h ; ov3 OR 400000h (pas bit31). EAX=3e carré. Tag 07/code 24, TEST AL,2, occupancy 1+2, +44h/+2Ch absents. Leaf cdecl retn C3.

## C réconcilié

```c
/* Gte_SQR @ 0x45F930
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 36 instr, size 0xB0, end exclusive 0x45F9E0. cdecl, 0 args, retn C3, no EBP frame.
 * Leaf: no calls, no add esp. EAX leftover = sat-or-original third square.
 * movsx word ptr 1CA8A34/38/3C (0F BF), two-operand IMUL squares (0F AF).
 * Unsaturated DWORD stores 1CA8A74/78/7C then optional sat; write back 34/38/3C.
 * cmp + jbe (76, unsigned <= 0x7FFF), not jle. Sat: SAR 31, NOT, AND 7FFFh.
 * FLAG 1CA92F8: always MOV 0; ov1 MOV 81000000h; ov2 OR 80800000h; ov3 OR 400000h
 * (no bit31 on third). Encoding != hardware GTE SQR.
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / +44h GF Exists: ABSENT. TEST AL,2 unlink: ABSENT.
 * OT tag 07 / GPU code 24 / obj+44h / obj+2Ch: ABSENT.
 * No setcc, no jump table. No packed struct. No 66 stores.
 */

extern unsigned int dword_1CA8A34;
extern unsigned int dword_1CA8A38;
extern unsigned int dword_1CA8A3C;
extern unsigned int dword_1CA8A74;
extern unsigned int dword_1CA8A78;
extern unsigned int dword_1CA8A7C;
extern unsigned int dword_1CA92F8;

unsigned int __cdecl Gte_SQR(void)
{
    int sq1;
    int sq2;
    int sq3;
    unsigned int flag;

    sq1 = (int)(short)dword_1CA8A34;
    sq2 = (int)(short)dword_1CA8A38;
    sq1 = sq1 * sq1;
    sq3 = (int)(short)dword_1CA8A3C;
    sq2 = sq2 * sq2;
    sq3 = sq3 * sq3;

    dword_1CA92F8 = 0;
    dword_1CA8A74 = (unsigned int)sq1;
    dword_1CA8A78 = (unsigned int)sq2;
    dword_1CA8A7C = (unsigned int)sq3;

    if ((unsigned int)sq1 > 0x7FFFu) {
        sq1 = (~(sq1 >> 31)) & 0x7FFF;
        dword_1CA92F8 = 0x81000000u;
    }
    dword_1CA8A34 = (unsigned int)sq1;

    if ((unsigned int)sq2 > 0x7FFFu) {
        flag = dword_1CA92F8;
        sq2 = (~(sq2 >> 31)) & 0x7FFF;
        flag |= 0x80800000u;
        dword_1CA92F8 = flag;
    }
    dword_1CA8A38 = (unsigned int)sq2;

    if ((unsigned int)sq3 > 0x7FFFu) {
        flag = dword_1CA92F8;
        sq3 = (~(sq3 >> 31)) & 0x7FFF;
        flag |= 0x400000u;
        dword_1CA92F8 = flag;
    }
    dword_1CA8A3C = (unsigned int)sq3;
    return (unsigned int)sq3;
}
```
````
