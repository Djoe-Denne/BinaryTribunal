# BattleActionSequence_Tick_PhysicalWithEvents @ 0x50BD80 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `da0f110cde2538f1ae831394a32bb852bdcedbdad13f8814e27569c0e0adec91`, 27 EA / 59 octets ; [sémantique](../semantic/0x50BD80__BattleActionSequence_Tick_PhysicalWithEvents.md).
- C exact SHA-256 `e958b22a54e72e7b8a5b273c93e93c79efc2f5cdff6f4c54200aa9eff0734312` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 1556 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
                                                          
                                                                          
                                                                           
                                                                                  
                                                                                                   
                                              
                                                                     
                                                 
   

int sub_50AE20(void);                       
int __cdecl sub_50A670(void);                                  

int __cdecl sub_50BD80(int a0)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned int eax;

    esi = (unsigned char *)a0;
    eax = 0;
    edi = *(unsigned char **)(esi + 0x10);
    eax = esi[0x0D];                      

    if (eax == 0)                                  
        goto loc_50BD99;
    eax -= 1;         
    if (eax == 0)                       
        goto loc_50BDAA;
    return (int)eax;                                         

loc_50BD99:                 
    if (sub_50AE20() != 0)                                                    
        return 0;
    ++esi[0x0D];                                                   

loc_50BDAA:                                              
    sub_50A670();
    edi[1] = 0xFF;                  
    return 2;                                                    
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `4050fdfb333f4c9db71fa2ffe81efd9cf6122a4ef870a1a0affd4340dad25111` ; copie gelée `tools/_tmp_semantic_triple/0x50bd80/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# BattleActionSequence_Tick_PhysicalWithEvents @ 0x50BD80

- Instr (live): 27
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_PhysicalWithEvents(int)
- Notes parent: cascade sub eax,0 / dec, pas de jpt. ja/jg absents. Phase0: sub_50AE20 jnz return 0 sinon inc BYTE [esi+0Dh] fallthrough loc_50BDAA. Phase1: ApplyEventGroup0, BYTE [edi+1]=FF, return 2 (phase non incremente). Unknown: EAX leftover phase-1, pas de xor. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_PhysicalWithEvents @ 0x50BD80
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 27 instr, size 0x3B, end 0x50BDBB. cdecl, 1 arg. Saved ESI+EDI. retn C3.
 * BYTE [node+0Dh] phase, DWORD [node+10h] task. Cascade sub eax,0 / dec (no jpt).
 * Phase 0 fallthrough into loc_50BDAA after inc. Phase !=0 && !=1: leftover EAX = phase-1, no xor.
 * BYTE [edi+1]=0xFF. No add esp in this body.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. No setcc. No 66 prefix. No domain::.
 */

int sub_50AE20(void); /* 0x50AE20; 0 args */
int __cdecl BattleAction_ApplyEventGroup0(void); /* 0x50A670; 0 stack args here */

int __cdecl BattleActionSequence_Tick_PhysicalWithEvents(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned int eax;

    esi = (unsigned char *)node;
    eax = 0;
    edi = *(unsigned char **)(esi + 0x10);
    eax = esi[0x0D]; /* 33 C0; 8A 46 0D */

    if (eax == 0) /* 83 E8 00 / 74 jz loc_50BD99 */
        goto loc_50BD99;
    eax -= 1; /* 48 */
    if (eax == 0) /* 74 jz loc_50BDAA */
        goto loc_50BDAA;
    return (int)eax; /* leftover phase-1; 5F 5E C3; no xor */

loc_50BD99: /* phase == 0 */
    if (sub_50AE20() != 0) /* 85 C0 / 74 jz loc_50BDA7; else 5F 33 C0 5E C3 */
        return 0;
    ++esi[0x0D]; /* FE 46 0D loc_50BDA7; fall through loc_50BDAA */

loc_50BDAA: /* phase == 1, or fallthrough from phase 0 */
    BattleAction_ApplyEventGroup0();
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* B8 02; phase not incremented on phase-1 entry */
}
```
````

## Conservation byte-exacte du C — erratum de sérialisation Git

Le premier fence C est un **rendu**, normalisé LF dans Git par les attributs existants `text:auto/eol:lf` ; il ne constitue pas le carrier byte-exact. Le carrier Base64 ci-dessous est la source canonique exacte, incluant CRLF et fin de fichier, et supersède les mentions antérieures de byte-exactitude du fence rendu. Après décodage : **1556 octets**, SHA-256 `e958b22a54e72e7b8a5b273c93e93c79efc2f5cdff6f4c54200aa9eff0734312`, identique au C accepté gelé `tools/_tmp_semantic_triple/0x50bd80/native-2026-10-10/parent_reuse_admission/c_reviewed_final.c`. Aucun C, algorithme, confiance ou gate native changé. Cette réparation de publication ne compte pas comme une nouvelle clôture et ne requiert pas de nouveau push IDB.

```base64
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
IA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICANCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0KICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgIA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgDQog
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgDQogICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICANCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICANCiAg
IA0KDQppbnQgc3ViXzUwQUUyMCh2b2lkKTsgICAgICAgICAgICAgICAgICAgICAgIA0KaW50IF9f
Y2RlY2wgc3ViXzUwQTY3MCh2b2lkKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
DQoNCmludCBfX2NkZWNsIHN1Yl81MEJEODAoaW50IGEwKQ0Kew0KICAgIHVuc2lnbmVkIGNoYXIg
KmVzaTsNCiAgICB1bnNpZ25lZCBjaGFyICplZGk7DQogICAgdW5zaWduZWQgaW50IGVheDsNCg0K
ICAgIGVzaSA9ICh1bnNpZ25lZCBjaGFyICopYTA7DQogICAgZWF4ID0gMDsNCiAgICBlZGkgPSAq
KHVuc2lnbmVkIGNoYXIgKiopKGVzaSArIDB4MTApOw0KICAgIGVheCA9IGVzaVsweDBEXTsgICAg
ICAgICAgICAgICAgICAgICAgDQoNCiAgICBpZiAoZWF4ID09IDApICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgIA0KICAgICAgICBnb3RvIGxvY181MEJEOTk7DQogICAgZWF4IC09IDE7
ICAgICAgICAgDQogICAgaWYgKGVheCA9PSAwKSAgICAgICAgICAgICAgICAgICAgICAgDQogICAg
ICAgIGdvdG8gbG9jXzUwQkRBQTsNCiAgICByZXR1cm4gKGludCllYXg7ICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICANCg0KbG9jXzUwQkQ5OTogICAgICAgICAgICAgICAg
IA0KICAgIGlmIChzdWJfNTBBRTIwKCkgIT0gMCkgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgDQogICAgICAgIHJldHVybiAwOw0KICAgICsrZXNpWzB4
MERdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA0K
DQpsb2NfNTBCREFBOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICANCiAgICBzdWJfNTBBNjcwKCk7DQogICAgZWRpWzFdID0gMHhGRjsgICAgICAgICAgICAgICAg
ICANCiAgICByZXR1cm4gMjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgDQp9DQo=
```
