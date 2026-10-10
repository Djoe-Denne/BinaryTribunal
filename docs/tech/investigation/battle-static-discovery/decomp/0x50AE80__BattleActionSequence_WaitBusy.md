# BattleActionSequence_WaitBusy @ 0x50AE80 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `1cae8aac570d0787a803e460e27e56773207d8e5be0a9d4be050a2b6885c72ef`, 26 EA / 70 octets ; [sémantique](../semantic/0x50AE80__BattleActionSequence_WaitBusy.md).
- C exact SHA-256 `73ab4fcd3d9d92c043e8f280f0d27c067b0f590591d0aead78169c2306670917` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 1565 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
                                           
                                                                          
                                                                        
                                                                 
                                                                                 
                                                                            
                                                                               
                                                                     
                                                  
   

extern unsigned char g_01D972C0[];                             
extern int *g_01D96AAC;                
extern unsigned int g_01D97718;                                          
extern int __cdecl sub_501190(void);                                             

int __cdecl sub_50AE80(void)
{
    unsigned char *v0;                                     
    int v1;

    v0 = g_01D972C0 + 0x68;
    do {
        if ((v0[-0x68] & 2) != 0) {                    
            if (*(unsigned int *)(v0 - 4) != *(unsigned int *)v0)
                return 1;                 
        }
        v0 += 0x9C;                  
    } while ((int)v0 < (int)0x1D9776C);                                  

    if (g_01D96AAC)
        return 1;
    if ((unsigned char)g_01D97718)
        return 1;                             
    v1 = sub_501190();
    if (v1)
        return 1;
    return v1;                       
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `cc37d3c8646e8c64c35c336a03e97e85d1e8881df093d421b3cf9b36604c3268` ; copie gelée `tools/_tmp_semantic_triple/0x50ae80/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# BattleActionSequence_WaitBusy @ 0x50AE80

- Instr (live): 26
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_WaitBusy(void)
- Notes parent: Stride 0x9C presente (add eax,9Ch), 7 iters, bound jl signe vs 0x1D9776C. Occupancy 1+2 absente (BYTE mask 2 a [eax-68h] seulement). Camera A0 BYTE. Idle EAX=sub_501190 (0 args, pas add esp). Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_WaitBusy @ 0x50AE80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 26 instr, size 0x46, end 0x50AEC6. cdecl, 0 args. Saved ESI. retn C3.
 * BYTE TEST 84 48 98 [eax-68h], cl=2. DWORD 8B [eax-4] vs [eax].
 * add eax,9Ch (05 9C000000) stride PRESENT. Bound cmp+jl 7C SIGNED vs 0x1D9776C.
 * A1 DWORD CandidateA @ 0x1D96AAC. A0 BYTE g_BattleCameraFlags @ 0x1D97718.
 * call sub_501190 (0 args, no add esp); idle EAX leftover callee 0; busy B8 1.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No 66 / WORD. No setcc / jpt / ja. No domain::.
 */

extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0, stride 0x9C */
extern int *g_GfSequenceContextCandidateA; /* 0x1D96AAC */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; this site reads low BYTE */
extern int __cdecl sub_501190(void); /* 0x501190: mov eax, dword_1D96DB8; retn */

int __cdecl BattleActionSequence_WaitBusy(void)
{
    unsigned char *cur; /* eax; unk_1D97328 = actors+0x68 */
    int eax;

    cur = g_BattlePresentationActors + 0x68;
    do {
        if ((cur[-0x68] & 2) != 0) { /* BYTE 84, cl=2 */
            if (*(unsigned int *)(cur - 4) != *(unsigned int *)cur)
                return 1; /* loc_50AEBF */
        }
        cur += 0x9C; /* 05 9C000000 */
    } while ((int)cur < (int)0x1D9776C); /* offset dword_1D9776C; jl 7C */

    if (g_GfSequenceContextCandidateA)
        return 1;
    if ((unsigned char)g_BattleCameraFlags)
        return 1; /* A0 low BYTE, not DWORD */
    eax = sub_501190();
    if (eax)
        return 1;
    return eax; /* idle: leftover 0 */
}
```
````

## Conservation byte-exacte du C — erratum de sérialisation Git

Le premier fence C est un **rendu**, normalisé LF dans Git par les attributs existants `text:auto/eol:lf` ; il ne constitue pas le carrier byte-exact. Le carrier Base64 ci-dessous est la source canonique exacte, incluant CRLF et fin de fichier, et supersède les mentions antérieures de byte-exactitude du fence rendu. Après décodage : **1565 octets**, SHA-256 `73ab4fcd3d9d92c043e8f280f0d27c067b0f590591d0aead78169c2306670917`, identique au C accepté gelé `tools/_tmp_semantic_triple/0x50ae80/native-2026-10-10/parent_reuse_admission/c_reviewed_final.c`. Aucun C, algorithme, confiance ou gate native changé. Cette réparation de publication ne compte pas comme une nouvelle clôture et ne requiert pas de nouveau push IDB.

```base64
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0KICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICANCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgIA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICANCiAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
IA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgIA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0KICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgDQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0K
ICAgDQoNCmV4dGVybiB1bnNpZ25lZCBjaGFyIGdfMDFEOTcyQzBbXTsgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgIA0KZXh0ZXJuIGludCAqZ18wMUQ5NkFBQzsgICAgICAgICAgICAgICAgDQpl
eHRlcm4gdW5zaWduZWQgaW50IGdfMDFEOTc3MTg7ICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgDQpleHRlcm4gaW50IF9fY2RlY2wgc3ViXzUwMTE5MCh2b2lkKTsgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICANCg0KaW50IF9fY2RlY2wg
c3ViXzUwQUU4MCh2b2lkKQ0Kew0KICAgIHVuc2lnbmVkIGNoYXIgKnYwOyAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICANCiAgICBpbnQgdjE7DQoNCiAgICB2MCA9IGdfMDFEOTcy
QzAgKyAweDY4Ow0KICAgIGRvIHsNCiAgICAgICAgaWYgKCh2MFstMHg2OF0gJiAyKSAhPSAwKSB7
ICAgICAgICAgICAgICAgICAgICANCiAgICAgICAgICAgIGlmICgqKHVuc2lnbmVkIGludCAqKSh2
MCAtIDQpICE9ICoodW5zaWduZWQgaW50ICopdjApDQogICAgICAgICAgICAgICAgcmV0dXJuIDE7
ICAgICAgICAgICAgICAgICANCiAgICAgICAgfQ0KICAgICAgICB2MCArPSAweDlDOyAgICAgICAg
ICAgICAgICAgIA0KICAgIH0gd2hpbGUgKChpbnQpdjAgPCAoaW50KTB4MUQ5Nzc2Qyk7ICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0KDQogICAgaWYgKGdfMDFEOTZBQUMpDQogICAg
ICAgIHJldHVybiAxOw0KICAgIGlmICgodW5zaWduZWQgY2hhcilnXzAxRDk3NzE4KQ0KICAgICAg
ICByZXR1cm4gMTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0KICAgIHYxID0gc3ViXzUw
MTE5MCgpOw0KICAgIGlmICh2MSkNCiAgICAgICAgcmV0dXJuIDE7DQogICAgcmV0dXJuIHYxOyAg
ICAgICAgICAgICAgICAgICAgICAgDQp9DQo=
```
