# BattleActionSequence_Tick_DefaultParamAFFFF @ 0x50BC20 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `7b651d08f5f8022f19afc76ba972bf95df1fad26fa716345bc095d3fe39ac958`, 66 EA / 206 octets ; [sémantique](../semantic/0x50BC20__BattleActionSequence_Tick_DefaultParamAFFFF.md).
- C exact SHA-256 `e27d1051670a2a016bb1036d2d8a36f0083ceb5ca46bb64897084f1813d2dbb8` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 2119 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
 












int sub_50A750(void);  
int __cdecl sub_50AF20(int magicID, int (__cdecl **out_cb)(int));  
unsigned char *sub_50AFC0(void);  
int __cdecl sub_50AE80(void);  
int *sub_50AED0(void);  

extern unsigned char *ptr_1D99A50;  
extern int (__cdecl *fnptr_21DFEC0)(int);  
extern int dword_1D999C8;  
extern unsigned char byte_1D96A90;  
extern unsigned int dword_1D97718;  
extern unsigned char byte_1D99A78;  
extern unsigned int dword_1D97728;  
extern int *ptr_1D96AAC;  
extern unsigned int dword_1D96A9C;  
extern unsigned int dword_1D99A64;  

int __cdecl sub_50BC20(int arg_0)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned char cl;
    unsigned char al;
    unsigned int eax;

    esi = (unsigned char *)arg_0;
    cl = esi[0x0D];  
    edi = *(unsigned char **)(esi + 0x10);  
    eax = cl;  
    if (eax > 3u)  
        goto def_50BC38;

    switch (eax) {
    case 0:  
        sub_50A750();
        sub_50AF20(
            *(unsigned short *)(ptr_1D99A50 + 6),  
            &fnptr_21DFEC0);
        al = esi[0x0D];  
        ++al;  
        esi[0x0D] = al;  
        goto def_50BC38;  

    case 1:  
        if ((int)dword_1D999C8 < 0)  
            goto def_50BC38;
        ++cl;  
        esi[0x0D] = cl;  
        return 0;  

    case 2:  
        if (byte_1D96A90 > 0u)  
            goto def_50BC38;
        if (*(unsigned char *)&dword_1D97718 != 0)  
            goto def_50BC38;
        sub_50AFC0();  
        *(unsigned short *)&dword_1D97728 = 0xFFFFu;  
        eax = (unsigned int)fnptr_21DFEC0((int)&byte_1D99A78);  
        ptr_1D96AAC = (int *)eax;  
        al = esi[0x0D];  
        ++al;
        esi[0x0D] = al;
        return 0;  

    case 3:  
        if (sub_50AE80() != 0)
            goto def_50BC38;
        sub_50AED0();
        eax = dword_1D96A9C;
        edi[1] = 0xFFu;  
        eax = (eax & 0xFFFFFF00u) | ((unsigned char)eax & 0xEFu);  
        dword_1D96A9C = eax;  
        dword_1D99A64 = 0;  
        return 2;  
    }

def_50BC38:
    return 0;  
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `ccc76154f82d22850e43243630b30ef7c805db5b16779f6876da4c5169764a22` ; copie gelée `tools/_tmp_semantic_triple/0x50bc20/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
# BattleActionSequence_Tick_DefaultParamAFFFF @ 0x50BC20

- Instr (live): 66
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=9
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=9
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_DefaultParamAFFFF(int)
- Notes parent: ja unsigned phase>3, jpt 4 cases 0..3 @ 0x50BCF0. Case0 fallthrough def (pas case1). jl SIGNED FILE_RESULT. ja UNSIGNED byte_1D96A90. Camera flags BYTE A0. WORD 66 SharedB+6 et CameraID=FFFF. AND AL,0EFh. Case3 return 2, phase non incremente. Callback slot C0 push offset byte_1D99A78 add esp,4. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. SetupContext 0 arg. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_DefaultParamAFFFF @ 0x50BC20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_50BC38, not Hex-Rays.
 * 66 instr, size 0xCE, end 0x50BCEE. cdecl, 1 arg. Saved ESI+EDI. retn C3.
 * BYTE [node+0Dh] phase, DWORD [node+10h] task. cmp eax,3 / ja UNSIGNED.
 * jpt_50BC38 @ 0x50BCF0: 50BC3F,50BC6B,50BC7E,50BCBE (cases 0..3).
 * Case0 fallthrough def_50BC38 (not case1). jl SIGNED FILE_RESULT.
 * ja UNSIGNED byte_1D96A90. jnz camera flags BYTE. WORD 66 SharedB+6 / CameraID=FFFF.
 * AND AL,0EFh (24 EF) low byte only. Case3 return 2, phase not incremented.
 * Callback slot C0 (0x21DFEC0), push offset byte_1D99A78, add esp,4.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No setcc. No domain::.
 */

int sub_50A750(void); /* 0x50A750; 0 args */
int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **out_cb)(int)); /* 0x50AF20; add esp,8 */
unsigned char *BattleActionSequence_SetupContext(void); /* 0x50AFC0; 0 stack args */
int __cdecl BattleActionSequence_WaitBusy(void); /* 0x50AE80 */
int *BattleActionSequence_ReleaseCamera(void); /* 0x50AED0 */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */
extern int (__cdecl *g_BattleActionCallbackPtr_C0)(int); /* 0x21DFEC0 */
extern int BATTLE_PRESENTATION_FILE_RESULT; /* 0x1D999C8 */
extern unsigned char byte_1D96A90; /* 0x1D96A90 */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; this site reads BYTE */
extern unsigned char byte_1D99A78; /* 0x1D99A78; ctx blob start */
extern unsigned int CameraID_Maybe; /* 0x1D97728; this site stores WORD */
extern int *g_GfSequenceContextCandidateA; /* 0x1D96AAC */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */
extern unsigned int dword_1D99A64; /* 0x1D99A64 */

int __cdecl BattleActionSequence_Tick_DefaultParamAFFFF(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned char cl;
    unsigned char al;
    unsigned int eax;

    esi = (unsigned char *)node;
    cl = esi[0x0D]; /* 8A 4E 0D */
    edi = *(unsigned char **)(esi + 0x10); /* 8B 7E 10 */
    eax = cl; /* 8B C1; 25 FF000000 */
    if (eax > 3u) /* 83 F8 03 / 77 ja UNSIGNED */
        goto def_50BC38;

    switch (eax) {
    case 0: /* loc_50BC3F */
        sub_50A750();
        BattleGF_LoadCallbackByMagicID(
            *(unsigned short *)(g_GfSequenceContextSharedB + 6), /* 33 C0; 66 8B 41 06 */
            &g_BattleActionCallbackPtr_C0);
        al = esi[0x0D]; /* 8A 46 0D reload after call; add esp,8 */
        ++al; /* FE C0 */
        esi[0x0D] = al; /* 88 46 0D */
        goto def_50BC38; /* fall through 5F 33 C0 */

    case 1: /* loc_50BC6B */
        if ((int)BATTLE_PRESENTATION_FILE_RESULT < 0) /* A1; 85 C0 / 7C jl SIGNED */
            goto def_50BC38;
        ++cl; /* FE C1 cached CL, not a memory reload */
        esi[0x0D] = cl; /* 88 4E 0D */
        return 0; /* own epilogue 33 C0 */

    case 2: /* loc_50BC7E */
        if (byte_1D96A90 > 0u) /* A0; 84 C0 / 77 ja UNSIGNED */
            goto def_50BC38;
        if (*(unsigned char *)&g_BattleCameraFlags != 0) /* A0 1D97718; 84 C0 / 75 jnz */
            goto def_50BC38;
        BattleActionSequence_SetupContext(); /* bare call; 0 stack args */
        *(unsigned short *)&CameraID_Maybe = 0xFFFFu; /* 66 C7 WORD */
        eax = (unsigned int)g_BattleActionCallbackPtr_C0((int)&byte_1D99A78); /* push offset; FF15 C0 */
        g_GfSequenceContextCandidateA = (int *)eax; /* A3 DWORD */
        al = esi[0x0D]; /* 8A 46 0D reload; add esp,4 */
        ++al;
        esi[0x0D] = al;
        return 0; /* own epilogue 33 C0 5F 5E C3 */

    case 3: /* loc_50BCBE */
        if (BattleActionSequence_WaitBusy() != 0)
            goto def_50BC38;
        BattleActionSequence_ReleaseCamera();
        eax = battle_to_update_flags_dword_1D96A9C;
        edi[1] = 0xFFu; /* C6 BYTE [edi+1] */
        eax = (eax & 0xFFFFFF00u) | ((unsigned char)eax & 0xEFu); /* 24 EF AL only */
        battle_to_update_flags_dword_1D96A9C = eax; /* A3 DWORD */
        dword_1D99A64 = 0; /* C7 DWORD */
        return 2; /* B8 02; phase not incremented */
    }

def_50BC38:
    return 0; /* 5F 33 C0 5E C3 */
}
```
````
