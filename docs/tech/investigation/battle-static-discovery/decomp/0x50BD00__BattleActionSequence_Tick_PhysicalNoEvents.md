# BattleActionSequence_Tick_PhysicalNoEvents @ 0x50BD00 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `f4a33b347c24fb502248cf9cee28a641b774dfb263c5ccbd270e9c6d923f3cd4`, 48 EA / 127 octets ; [sémantique](../semantic/0x50BD00__BattleActionSequence_Tick_PhysicalNoEvents.md).
- C exact SHA-256 `413b70bc1cad0aef4b41590f7054776d1bf9a59dc78379ca5ef02c8a02624c43` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 1257 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c


int sub_50AE00(void); 
void __cdecl sub_505C00(int v_0, int animId); 

extern int dword_1D99A40; 
extern unsigned char *dword_1D99A50; 

int __cdecl sub_50BD00(int arg_0)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned int eax;
    unsigned int ecx;
    int v_0;
    unsigned char *v_1;

    esi = (unsigned char *)arg_0;
    eax = 0;
    edi = *(unsigned char **)(esi + 0x10);
    eax = esi[0x0D]; 

    if (eax == 0) 
        goto loc_50BD2E;
    eax -= 1; 
    if (eax == 0) 
        goto loc_50BD3A;
    eax -= 1; 
    if (eax != 0) 
        goto loc_50BD7C;

    
    if (sub_50AE00() != 0)
        goto loc_50BD7A;
    edi[1] = 0xFF; 
    return 2; 

loc_50BD2E: 
    if (sub_50AE00() != 0)
        goto loc_50BD7A;
    ++esi[0x0D]; 

loc_50BD3A: 
    v_0 = dword_1D99A40; 
    v_1 = dword_1D99A50; 
    ecx = *(unsigned int *)(v_0 + 8); 
    ecx &= 0xFF7FFFFFu; 
    *(unsigned int *)(v_0 + 8) = ecx; 
    ecx = 0;
    ecx = v_1[2]; 
    sub_505C00(v_0, (int)ecx); 
    v_1 = dword_1D99A50; 
    if (v_1[2] == 0x0A) 
        goto loc_50BD77;
    edi[1] = 0xFF; 
    return 2; 

loc_50BD77:
    ++esi[0x0D]; 
loc_50BD7A:
    eax = 0; 
loc_50BD7C:
    return (int)eax;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `c6a425cd57f61fa9214db6a860226a6488e5151cc9db43dc72236b57e1aa5bf3` ; copie gelée `tools/_tmp_semantic_triple/0x50bd00/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# BattleActionSequence_Tick_PhysicalNoEvents @ 0x50BD00

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=158
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=230
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=550
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_PhysicalNoEvents(int)
- Notes parent: cascade sub/dec/jz phases 0/1/2, pas de jpt. Phase0 fallthrough loc_50BD3A. loc_50BD7C leftover EAX=phase-2 (pas xor). BYTE [edi+1] C6 47 01. BYTE SharedB+2. DWORD [actor+8] AND 0xFF7FFFFF. Anim==0x0A inc+return 0 sinon return 2. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de ja/jg. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_PhysicalNoEvents @ 0x50BD00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 48 instr, size 0x7F, end 0x50BD7F. cdecl, 1 arg. Saved ESI+EDI. retn C3.
 * BYTE [node+0Dh] phase, DWORD [node+10h] task. Cascade sub eax,0 / dec / dec (no jpt).
 * Phase 0 fallthrough into loc_50BD3A after inc. Phase 2 does not fall into phase 1.
 * loc_50BD7C unknown-phase: EAX leftover = phase-2, no xor.
 * BYTE [edi+1]=0xFF; BYTE SharedB+2; DWORD [actor+8] AND 0xFF7FFFFF.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. No setcc. No 66 prefix. No domain::.
 */

int sub_50AE00(void); /* 0x50AE00; 0 args */
void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId); /* 0x505C00; add esp,8 */

extern int dword_1D99A40; /* 0x1D99A40; value used as pointer */
extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */

int __cdecl BattleActionSequence_Tick_PhysicalNoEvents(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned int eax;
    unsigned int ecx;
    int actor;
    unsigned char *sharedB;

    esi = (unsigned char *)node;
    eax = 0;
    edi = *(unsigned char **)(esi + 0x10);
    eax = esi[0x0D]; /* 33 C0; 8A 46 0D */

    if (eax == 0) /* 83 E8 00 / 74 jz loc_50BD2E */
        goto loc_50BD2E;
    eax -= 1; /* 48 */
    if (eax == 0) /* 74 jz loc_50BD3A */
        goto loc_50BD3A;
    eax -= 1; /* 48 */
    if (eax != 0) /* 75 jnz loc_50BD7C; EAX leftover = phase-2 */
        goto loc_50BD7C;

    /* phase == 2 @ 0x50BD19 */
    if (sub_50AE00() != 0)
        goto loc_50BD7A;
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* B8 02; phase not incremented */

loc_50BD2E: /* phase == 0 */
    if (sub_50AE00() != 0)
        goto loc_50BD7A;
    ++esi[0x0D]; /* FE 46 0D; fall through loc_50BD3A */

loc_50BD3A: /* phase == 1, or fallthrough from phase 0 */
    actor = dword_1D99A40; /* A1 */
    sharedB = g_GfSequenceContextSharedB; /* 8B 15 */
    ecx = *(unsigned int *)(actor + 8); /* 8B 48 08 */
    ecx &= 0xFF7FFFFFu; /* 81 E1 FF FF 7F FF; clear bit 0x00800000 */
    *(unsigned int *)(actor + 8) = ecx; /* 89 48 08 */
    ecx = 0;
    ecx = sharedB[2]; /* 33 C9; 8A 4A 02 zero-ext BYTE */
    BattlePresentation_StartActorAnimation(actor, (int)ecx); /* push ecx; push eax; add esp,8 */
    sharedB = g_GfSequenceContextSharedB; /* A1 reload */
    if (sharedB[2] == 0x0A) /* 80 78 02 0A / 74 jz loc_50BD77 */
        goto loc_50BD77;
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* phase not incremented */

loc_50BD77:
    ++esi[0x0D]; /* FE 46 0D */
loc_50BD7A:
    eax = 0; /* 33 C0 */
loc_50BD7C:
    return (int)eax;
}
```
````

## Conservation byte-exacte du C — erratum de sérialisation Git

Le premier fence C est un **rendu**, normalisé LF dans Git par les attributs existants `text:auto/eol:lf` ; il ne constitue pas le carrier byte-exact. Le carrier Base64 ci-dessous est la source canonique exacte, incluant CRLF et fin de fichier, et supersède les mentions antérieures de byte-exactitude du fence rendu. Après décodage : **1257 octets**, SHA-256 `413b70bc1cad0aef4b41590f7054776d1bf9a59dc78379ca5ef02c8a02624c43`, identique au C accepté gelé `tools/_tmp_semantic_triple/0x50bd00/native-2026-10-10/parent_reuse_admission/c_reviewed_final.c`. Aucun C, algorithme, confiance ou gate native changé. Cette réparation de publication ne compte pas comme une nouvelle clôture et ne requiert pas de nouveau push IDB.

```base64
DQoNCmludCBzdWJfNTBBRTAwKHZvaWQpOyANCnZvaWQgX19jZGVjbCBzdWJfNTA1QzAwKGludCB2
XzAsIGludCBhbmltSWQpOyANCg0KZXh0ZXJuIGludCBkd29yZF8xRDk5QTQwOyANCmV4dGVybiB1
bnNpZ25lZCBjaGFyICpkd29yZF8xRDk5QTUwOyANCg0KaW50IF9fY2RlY2wgc3ViXzUwQkQwMChp
bnQgYXJnXzApDQp7DQogICAgdW5zaWduZWQgY2hhciAqZXNpOw0KICAgIHVuc2lnbmVkIGNoYXIg
KmVkaTsNCiAgICB1bnNpZ25lZCBpbnQgZWF4Ow0KICAgIHVuc2lnbmVkIGludCBlY3g7DQogICAg
aW50IHZfMDsNCiAgICB1bnNpZ25lZCBjaGFyICp2XzE7DQoNCiAgICBlc2kgPSAodW5zaWduZWQg
Y2hhciAqKWFyZ18wOw0KICAgIGVheCA9IDA7DQogICAgZWRpID0gKih1bnNpZ25lZCBjaGFyICoq
KShlc2kgKyAweDEwKTsNCiAgICBlYXggPSBlc2lbMHgwRF07IA0KDQogICAgaWYgKGVheCA9PSAw
KSANCiAgICAgICAgZ290byBsb2NfNTBCRDJFOw0KICAgIGVheCAtPSAxOyANCiAgICBpZiAoZWF4
ID09IDApIA0KICAgICAgICBnb3RvIGxvY181MEJEM0E7DQogICAgZWF4IC09IDE7IA0KICAgIGlm
IChlYXggIT0gMCkgDQogICAgICAgIGdvdG8gbG9jXzUwQkQ3QzsNCg0KICAgIA0KICAgIGlmIChz
dWJfNTBBRTAwKCkgIT0gMCkNCiAgICAgICAgZ290byBsb2NfNTBCRDdBOw0KICAgIGVkaVsxXSA9
IDB4RkY7IA0KICAgIHJldHVybiAyOyANCg0KbG9jXzUwQkQyRTogDQogICAgaWYgKHN1Yl81MEFF
MDAoKSAhPSAwKQ0KICAgICAgICBnb3RvIGxvY181MEJEN0E7DQogICAgKytlc2lbMHgwRF07IA0K
DQpsb2NfNTBCRDNBOiANCiAgICB2XzAgPSBkd29yZF8xRDk5QTQwOyANCiAgICB2XzEgPSBkd29y
ZF8xRDk5QTUwOyANCiAgICBlY3ggPSAqKHVuc2lnbmVkIGludCAqKSh2XzAgKyA4KTsgDQogICAg
ZWN4ICY9IDB4RkY3RkZGRkZ1OyANCiAgICAqKHVuc2lnbmVkIGludCAqKSh2XzAgKyA4KSA9IGVj
eDsgDQogICAgZWN4ID0gMDsNCiAgICBlY3ggPSB2XzFbMl07IA0KICAgIHN1Yl81MDVDMDAodl8w
LCAoaW50KWVjeCk7IA0KICAgIHZfMSA9IGR3b3JkXzFEOTlBNTA7IA0KICAgIGlmICh2XzFbMl0g
PT0gMHgwQSkgDQogICAgICAgIGdvdG8gbG9jXzUwQkQ3NzsNCiAgICBlZGlbMV0gPSAweEZGOyAN
CiAgICByZXR1cm4gMjsgDQoNCmxvY181MEJENzc6DQogICAgKytlc2lbMHgwRF07IA0KbG9jXzUw
QkQ3QToNCiAgICBlYXggPSAwOyANCmxvY181MEJEN0M6DQogICAgcmV0dXJuIChpbnQpZWF4Ow0K
fQ0K
```
