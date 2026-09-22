# MagFx_BuildQuadNodes_Tag2E @ 0x6A5AD0

- Instr (live): 156 (492 o, 0x6A5AD0-0x6A5C8B)
- Palier: 2+1
- Verdict: LIKELY - builder d'effet Maelstrom (caller unique sub_6A5700 @0x6a5932) : lit le count dword de la file *(a1+10h) (0xFFFFFFFF si nul via dec @0x6A5AE1, re-store [esi+10h] @0x6A5AE2/7F), par record stride 0x18 copie 4 entrees 12 octets (index WORD zero-extend a cur+4/6/8/0xA, tbl=*(a1+4)) vers a1+0x18/24/30/3C ; gate : skip si AND des 4 bytes != 0 (test al,dl jnz @0x6A5BA2-BA4) ; sinon node OT 0x28 dans pool dword_2517A24 (magic 0x09000000 @+0 @0x6A5C3B, code ptr sub_808080 @+4, tag 0x2E @+7 @0x6A5C41, 4 dwords sommets @+8/10/18/20, mot flags 16 bits @+16, couleurs = soustraction masque (byte & C0) sub @0x6A5BE8-C12), avance emit seule @0x6A5C51 ; OtNode24_PoolAllocLink_Code1(pool=*(a1+14h), node) @0x6A5C49 add esp,8 ; retour EAX = curseur flux final (0x6A5C6E voie boucle), FFFFFFFF voie count==0, proto int __cdecl menteur
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A5AD0\nTYPE ; proposition: MagFx_BuildQuadNodes_Tag2E
- Notes parent: checks 5.6 OK : test edx avant dec gate count==0 (0x6A5ADF-AF1), gate test al,dl jnz skip (0x6A5BA2-BA4), magic 0x09000000h @+0 (0x6A5C3B), tag 0x2Eh @+7 (0x6A5C41), PoolAllocLink_Code1 (0x6A5C49), avance emit +28h (0x6A5C51), eax=ecx (0x6A5C6E), re-store [esi+10h] x2 voies (0x6A5AE2/C71/C7F), caller sub_6A5700 @0x6a5932 (callers.txt) ; C-R : c_a corrigé sur 4 erreurs (D2 retour -1 pas 0, D3 gate count==0 pas count-1, D14 compteur, D9 couleurs = sub pas and 3F) ; R : jumeaux 0x6A5950 tag 0x26 / 0x6A5AD0 tag 0x2E

## C reconcilie

```c
/* c_reconciled.c — sub_6A5AD0 (0x6A5AD0..0x6A5C8B, 444 octets = 0x1BC, 156 instr live)
 *
 * Ground truth = live ASM (asm.asm) + ida_dump_bytes, NOT Hex-Rays.
 * Type IDA : unsigned __int16 *__cdecl sub_6A5AD0(int)
 * Sauvegardes de registres : push ecx/esi/edi en tête (6a5ad0/6a5ad1/6a5ad6) ;
 *   push ebx/ebp seulement sur la voie boucle (6a5af7/6a5af9) ; pops symétriques
 *   (6a5c70-6a5c7d voie boucle, 6a5c88-6a5c8b voie count==0).
 * Caller unique : sub_6A5700 (xref code 0x6a5932, builder Maelstrom).
 * Callee unique : OtNode24_PoolAllocLink_Code1 (call 6a5c49, add esp,8 6a5c4e → 2 args cdecl).
 *
 * Layout commande (stride 0x18, lue à cursor) :
 *   +0x00 : dword count (consommé une fois, en tête de file)
 *   +0x04/+0x06/+0x08/+0x0A : 4 index WORD dans la table dword[a1+4] (stride index ×4)
 * Chaque index tire un record de 12 octets (3 dwords) copié vers
 *   a1+0x18 / a1+0x24 / a1+0x30 / a1+0x3C.
 * Champs de record utilisés ensuite (record k à a1+0x18+0xC*k) :
 *   record+0x00 (0x18/0x24/0x30/0x3C) → dword position du node
 *   record+0x04 (0x1C/0x28/0x34/0x40) → octet bas = composante couleur, masquée 0xC0
 *   record+0x06 (0x1E/0x2A/0x36/0x42) → octet compagnon copié tel quel
 *   record+0x08 (0x20/0x2C/0x38/0x44) → byte de cull (gate AND)
 * Gate skip : byte[0x44] & byte[0x2C] & byte[0x20] & byte[0x38] != 0 → node non construit
 *   (test al,dl 6a5ba2 ; jnz 6a5ba4). Si skip, edi ne s'avance PAS (add edi,28h 6a5c51
 *   est sur la voie build uniquement) : dword_2517A24 inchangé si tout skippe.
 * Node OT 0x28 octets à dword_2517A24 : [0]=0x09000000, [4]=sub_808080, [7]=0x2E,
 *   word[+0x16] assemblé 3 champs, couleurs (b&0x3F implicite via sub mask 0xC0).
 * Retour EAX : voie count==0 → eax = count-1 (dec 6a5ae1 non défait = 0xFFFFFFFF) ;
 *   voie boucle → eax = ecx = nouveau cursor (mov eax,ecx 6a5c6e).
 */

extern void OtNode24_PoolAllocLink_Code1(int *pool, void *node); /* 6a5c49 call ; 6a5c4e add esp,8 */
extern void sub_808080(void);          /* constante d'adresse écrite à node+4 @6a5c31, jamais appelée ici */
extern unsigned int *dword_2517A24;    /* 0x2517A24 : curseur d'écriture du stream OT global */

unsigned __int16 *__cdecl sub_6A5AD0(int a1)
{
    unsigned int *cursor;   /* ecx, puis [esp+arg_0] */
    unsigned int count;     /* eax puis edx */
    unsigned int counter;   /* eax / [esp+var_4] */
    unsigned int *node;     /* edi */
    unsigned int *src;
    unsigned int tbl;
    unsigned int idx;

    /* --- lecture tête de file : 6a5ad7-6a5aed --- */
    cursor = *(unsigned int **)(a1 + 0x10);                /* 6a5ad7 mov ecx,[esi+10h] */
    count = *cursor;                                       /* 6a5ada mov eax,[ecx] */
    cursor = cursor + 1;                                   /* 6a5adc add ecx,4 */
    *(unsigned int *)(a1 + 0x10) = (unsigned int)cursor;   /* 6a5ae2 */
    node = dword_2517A24;                                  /* 6a5ae5 mov edi,dword_2517A24 */
    counter = count - 1;                                   /* 6a5ae1 dec eax */
    if (count == 0)                                        /* 6a5adf mov edx,eax (AVANT dec) ; 6a5aeb test edx,edx ; 6a5aed jz */
        goto loc_6A5C7F;                                   /* → count==0 : sortie, edi non avancé */
    counter = count;                                       /* 6a5af8 inc eax — compteur de boucle = count (pas count-1) */

loc_6A5B0A:
    /* --- record 0 : idx WORD @cursor+4 → 12 octets vers a1+0x18 --- */
    tbl = *(unsigned int *)(a1 + 4);                       /* 6a5b0a mov eax,[esi+4] */
    idx = (unsigned int)(unsigned short)*(unsigned short *)((char *)cursor + 4); /* 6a5b0d xor edx,edx ; 6a5b0f mov dx,[ecx+4] — zext */
    src = (unsigned int *)(tbl + (idx << 2));              /* 6a5b15 lea eax,[eax+edx*4] — stride index ×4 (offset dword), PAS 12 */
    *(unsigned int *)(a1 + 0x18) = src[0];                 /* 6a5b1a */
    *(unsigned int *)(a1 + 0x1C) = src[1];                 /* 6a5b1f */
    *(unsigned int *)(a1 + 0x20) = src[2];                 /* 6a5b29 */

    /* --- record 1 : idx WORD @cursor+6 → a1+0x24 --- */
    tbl = *(unsigned int *)(a1 + 4);                       /* 6a5b2c */
    idx = (unsigned int)(unsigned short)*(unsigned short *)((char *)cursor + 6); /* 6a5b2f xor ecx,ecx ; 6a5b31 mov cx,[edx+6] */
    src = (unsigned int *)(tbl + (idx << 2));              /* 6a5b35 */
    *(unsigned int *)(a1 + 0x24) = src[0];                 /* 6a5b3c */
    *(unsigned int *)(a1 + 0x28) = src[1];                 /* 6a5b41 */
    *(unsigned int *)(a1 + 0x2C) = src[2];                 /* 6a5b4b */

    /* --- record 2 : idx WORD @cursor+8 → a1+0x30 --- */
    tbl = *(unsigned int *)(a1 + 4);                       /* 6a5b4e */
    idx = (unsigned int)(unsigned short)*(unsigned short *)((char *)cursor + 8); /* 6a5b51 xor ecx,ecx ; 6a5b53 mov cx,[edx+8] */
    src = (unsigned int *)(tbl + (idx << 2));              /* 6a5b57 */
    *(unsigned int *)(a1 + 0x30) = src[0];                 /* 6a5b61 */
    *(unsigned int *)(a1 + 0x34) = src[1];                 /* 6a5b66 */
    *(unsigned int *)(a1 + 0x38) = src[2];                 /* 6a5b6e */

    /* --- record 3 : idx WORD @cursor+0xA → a1+0x3C --- */
    tbl = *(unsigned int *)(a1 + 4);                       /* 6a5b79 */
    idx = (unsigned int)(unsigned short)*(unsigned short *)((char *)cursor + 0xA); /* 6a5b75 mov dx,[eax+0Ah] — zext implicite via mov dx */
    src = (unsigned int *)(tbl + (idx << 2));              /* 6a5b7c lea ecx,[eax+edx*4] */
    *(unsigned int *)(a1 + 0x3C) = src[0];                 /* 6a5b84 */
    *(unsigned int *)(a1 + 0x40) = src[1];                 /* 6a5b89 */
    *(unsigned int *)(a1 + 0x44) = src[2];                 /* 6a5b8f */

    /* --- gate skip : 6a5b92-6a5ba4 --- */
    /* dl=[0x44]&[0x2C]&[0x20] ; test al([0x38]),dl ; jnz → skip si AND des 4 bytes != 0 */
    if ((*(unsigned char *)(a1 + 0x38) &
         (*(unsigned char *)(a1 + 0x44) &
          *(unsigned char *)(a1 + 0x2C) &
          *(unsigned char *)(a1 + 0x20))) != 0)
        goto loc_6A5C54;                                   /* 6a5ba4 — node non construit, edi n'avance pas */

    /* --- build node OT 0x28 octets à dword_2517A24 (edi) --- */
    {
        unsigned int w;
        unsigned char mask;

        /* 6a5bda push edi — arg2 (node) poussé AVANT l'écriture des champs */
        /* word @node+0x16 : 6a5baa-6a5bdb */
        w  = ((*(int *)(a1 + 8)
             + (int)(unsigned short)*(unsigned short *)(a1 + 0x1C)) >> 6) & 0xF; /* 6a5bae-6a5bd0 : add, sar 6 (arith), and 0Fh → bits 0-3 */
        w |= (((*(int *)(a1 + 0xC) & 0x200) | 0x40) << 2); /* 6a5bbb-6a5bcd : and 200h, or 40h, shl 2 → bit 8 forcé + bit 11 si 0x200 */
        w |= (*(int *)(a1 + 0xC) >> 4) & 0x10;             /* 6a5bd0-6a5bd8 : sar 4 (arith), and 10h → bit 4 */
        *(unsigned short *)((char *)node + 0x16) = (unsigned short)w; /* 6a5bdb mov [edi+16h],dx — WORD */

        /* couleurs : mask = octet bas de word[a1+0x1C] & 0xC0 (6a5be2 movsx word ; 6a5be6 and al,C0h) */
        mask = *(unsigned char *)(a1 + 0x1C) & 0xC0;
        *(unsigned char *)((char *)node + 0x0C) = *(unsigned char *)(a1 + 0x1C) - mask; /* 6a5bdf mov dl,[esi+1Ch] ; 6a5be8 sub dl,al ; 6a5bea */
        *(unsigned char *)((char *)node + 0x0D) = *(unsigned char *)(a1 + 0x1E);        /* 6a5bed-6a5bf0 */
        *(unsigned char *)((char *)node + 0x14) = *(unsigned char *)(a1 + 0x28) - mask; /* 6a5bf3-6a5bf8 */
        *(unsigned char *)((char *)node + 0x15) = *(unsigned char *)(a1 + 0x2A);        /* 6a5bfb-6a5bfe */
        *(unsigned char *)((char *)node + 0x1C) = *(unsigned char *)(a1 + 0x34) - mask; /* 6a5c01-6a5c06 */
        *(unsigned char *)((char *)node + 0x1D) = *(unsigned char *)(a1 + 0x36);        /* 6a5c09-6a5c0c */
        *(unsigned char *)((char *)node + 0x24) = *(unsigned char *)(a1 + 0x40) - mask; /* 6a5c0f-6a5c14 */
        *(unsigned char *)((char *)node + 0x25) = *(unsigned char *)(a1 + 0x42);        /* 6a5c17-6a5c1a */

        /* dwords position = dword0 de chaque record : 6a5c1d-6a5c38 */
        *(unsigned int *)((char *)node + 0x08) = *(unsigned int *)(a1 + 0x18); /* 6a5c1d mov ecx,[ebp+0] */
        *(unsigned int *)((char *)node + 0x10) = *(unsigned int *)(a1 + 0x24); /* 6a5c23 mov edx,[ebx] */
        *(unsigned int *)((char *)node + 0x18) = *(unsigned int *)(a1 + 0x30); /* 6a5c28 */
        *(unsigned int *)((char *)node + 0x20) = *(unsigned int *)(a1 + 0x3C); /* 6a5c2e */
        *(unsigned int *)((char *)node + 0x04) = (unsigned int)&sub_808080;    /* 6a5c31 mov dword ptr [edi+4], offset sub_808080 */
        *(unsigned int *)((char *)node + 0x00) = 0x09000000;                   /* 6a5c3b — magic OT */
        *(unsigned char *)((char *)node + 0x07) = 0x2E;                        /* 6a5c41 — tag 0x2E */
    }

    /* --- lien pool : 6a5c45-6a5c51 --- */
    /* args cdecl droite→gauche : push [esi+14h] @6a5c48 (arg1, dernier poussé),
       push edi @6a5bda (arg2) ; call @6a5c49 ; add esp,8 @6a5c4e */
    OtNode24_PoolAllocLink_Code1(*(int **)(a1 + 0x14), node);
    node = (unsigned int *)((char *)node + 0x28);          /* 6a5c51 add edi,28h — voie build UNIQUEMENT */

loc_6A5C54:
    cursor = (unsigned int *)((char *)cursor + 0x18);      /* 6a5c5c add ecx,18h — stride commande 0x18 */
    counter--;                                             /* 6a5c5f dec eax */
    if (counter != 0)
        goto loc_6A5B0A;                                   /* 6a5c68 jnz */

    /* --- sortie voie boucle : 6a5c6e-6a5c7e --- */
    *(unsigned int *)(a1 + 0x10) = (unsigned int)cursor;   /* 6a5c71 mov [esi+10h],eax */
    dword_2517A24 = node;                                  /* 6a5c74 */
    return (unsigned __int16 *)cursor;                     /* 6a5c6e mov eax,ecx */

loc_6A5C7F:
    /* --- sortie count==0 : 6a5c7f-6a5c8b ---
       cursor = valeur d'entrée +4 (déjà stockée @6a5ae2, restockée identique @6a5c7f) ;
       node = dword_2517A24 d'entrée (edi chargé @6a5ae5, jamais avancé) ;
       eax = count-1 = 0xFFFFFFFF (dec @6a5ae1 jamais défait sur cette voie) */
    *(unsigned int *)(a1 + 0x10) = (unsigned int)cursor;   /* 6a5c7f */
    dword_2517A24 = node;                                  /* 6a5c82 */
    return (unsigned __int16 *)(count - 1);                /* eax = 0xFFFFFFFF si count==0 */
    /* UNCERTAIN 0x6a5c8b usage de la valeur de retour (0xFFFFFFFF) par sub_6A5700 @0x6a5932 —
       la lecture du caller est requise pour dire si eax est consommé ou ignoré sur cette voie */
}
```

## Analyse semantique

# Sémantique sub_6A5AD0 @ 0x6A5AD0 (réconciliation R)

- Rôle (1 phrase) : builder enfant du flux magic-FX (caller unique `sub_6A5700` = `BattleFX_Magic_ProjectVertsEmitDualOTPkts`, fermé LIKELY) qui consomme une file de commandes de 0x18 octets pointée par `[ctx+0x10]` (dword count en tête, 4 index WORD @+4/+6/+8/+0Ah par commande), tire 4 sommets de 12 octets dans la table `[ctx+4]` (index ×4), et pour chaque commande dont le AND des 4 octets de gate vaut 0, construit un node OT de 0x28 octets (magic `0x09000000` @+0, code ptr `sub_808080` @+4, tag `0x2E` @+7) à `dword_2517A24` puis le chaîne via `OtNode24_PoolAllocLink_Code1`.
- Verdict : **LIKELY consolidé** (A et B avaient tous deux LIKELY ; aucun des deux n'a dévié sur le tranchage opcode, la consolidation ne monte pas à CERTAIN faute de convergence wiki sur 0x6A5AD0/0x6A5700/sub_808080).
- Confiance : LIKELY
- Nom catalogue : absent (IDA `sub_6A5AD0`, CMT vide, type `unsigned __int16 *__cdecl(int)`). Proposition markdown seul : **`MagFx_BuildQuadNodes_Tag2E`** — synthèse du nom de B recadré sur la convention catalogue `MagFx_*` (0x6A79B0 `MagFx_RenderComposedFK_Alloc4C` CERTAIN, 0x6DA980 `MagFx_IndexPackedNodeTree` LIKELY) ; le token « Maelstrom » de A n'est soutenu par aucune preuve du pack (le caller est `BattleFX_Magic_ProjectVertsEmitDualOTPkts`, pas un builder « Maelstrom »).

## In / Out / Effets

**In** (cdecl, un seul arg ; ctx = arg0 = esi, cf. 0x6a5ad2 `mov esi,[esp+8+arg_0]`, caller `push esi` @0x6a5931) :
- `[ctx+4]` : base de la table de sommets (12 octets = 3 dwords par entrée), indexée par `base + idx*4`
- `[ctx+8]`, `[ctx+0Ch]` : scalaires signés (accès `sar`/`add`) alimentant le word de contrôle node+0x16
- `[ctx+0x10]` : curseur de file. Layout : `[dword count][commandes × 0x18]` ; chaque commande : dword0 (non lu ici) + 4 index WORD @+4/+6/+8/+0Ah
- `[ctx+0x14]` : arg1 (pool OT) passé à l'allocateur
- global `dword_2517A24` : curseur d'écriture du stream OT (edi)

**Out** :
- `[ctx+0x10]` écrit sur **les deux voies** : +4 (dword count consommé) puis +count×0x18 (0x6a5ae2 puis 0x6a5c7f voie vide ; 0x6a5c71 voie boucle)
- `dword_2517A24` = edi final : avancé de 0x28 par node émis, inchangé si tout skipe (bump 0x6a5c51 sur la voie build uniquement)
- retour EAX 32 bits : voie boucle = curseur final (0x6a5c6e `mov eax,ecx`) ; voie count==0 = 0xFFFFFFFF (artefact du `dec` 0x6a5ae1 jamais défait). **Inutilisé par l'unique caller** (0x6a5932 `call` → 0x6a5937 `push 48h`, aucun test de eax).

**Effets par node (0x28 octets)** :
- `+0x00` dword `0x09000000` (0x6a5c3b) ; `+0x04` dword `sub_808080` (0x6a5c31) ; `+0x07` byte `0x2E` (0x6a5c41) — le dword+4 vaut donc `0x2E008080`
- `+0x08/+0x10/+0x18/+0x20` : dword0 des 4 sommets (positions), copies 6a5c1d–6a5c38
- `+0x0C/+0x14/+0x1C/+0x24` : byte sommet − (`byte[ctx+0x1C] & 0xC0`) = 6 bits bas (masque unique calculé une fois sur le sommet 0, appliqué aux 4 : 6a5be6 `and al,0C0h` puis `sub dl,al` ×4) ; `+0x0D/+0x15/+0x1D/+0x25` : bytes compagnons copiés tels quels
- `+0x16` word : bits 0-3 `((d[ctx+8] + zext w[ctx+0x1C]) >> 6) & 0xF` ; bit 4 `(d[ctx+0Ch] >> 4) & 0x10` (sar) ; bit 8 forcé + bit 11 si `d[ctx+0Ch] & 0x200` via `((x & 0x200) | 0x40) << 2` (0x6a5bbb–0x6a5bdb)

**Gate / skip** : 0x6a5b92–0x6a5ba4 — `dl = b[0x44] & b[0x2C] & b[0x20]` ; `test b[0x38], dl` ; `jnz loc_6A5C54` → node non construit et edi n'avance PAS si le AND des 4 octets de gate (dword2 des 4 sommets, records à 0x18/0x24/0x30/0x3C +8) est non nul. 0 ou 1 node par itération (pas 1..N).

## Divergences A/B (tranchées une par une)

1. **Nom** — A : `MagFX_Maelstrom_EmitTexturedQuadPackets` ; B : `MagicFx_BuildQuadNodes_Tag2E`. **Tranché B (recadré) → `MagFx_BuildQuadNodes_Tag2E`** : « Maelstrom » non soutenu (caller = `BattleFX_Magic_ProjectVertsEmitDualOTPkts` @0x6a5932, ancre fermée) ; convention famille `MagFx_*` du catalogue (0x6A79B0, 0x6DA980).
2. **Nature de arg0/esi** — B voyait deux objets (une liste arg0 + un « obj ctx global » esi) ; A un seul ctx. **Tranché A** : 0x6a5ad2 `mov esi,[esp+8+arg_0]` — esi EST arg0 ; le caller pousse un seul arg (`push esi` 0x6a5931). Les words +4..+0xA sont lus dans le curseur issu de `[esi+0x10]`, pas dans arg0 directement.
3. **Polarité du gate** — rôle de B inversé (« si masque AND n'est pas plein, émet ») vs A (skip si AND ≠ 0). **Tranché A** : 0x6a5ba2–0x6a5ba4 `test al,dl; jnz loc_6A5C54` — le saut quitte le bloc build. Les propres preuves de B (son point 4) donnaient la bonne polarité ; seule sa phrase de rôle était fausse.
4. **Retour EAX** — A : « curseur final, pas 0/2 » ; B : « largeur UNCERTAIN, voie jz indéterminée ». **Tranché par ASM + caller** : voie boucle `mov eax,ecx` (0x6a5c6e) = curseur ; voie count==0 eax = 0xFFFFFFFF (dec 0x6a5ae1, inc 0x6a5af8 hors voie) ; et le caller ne lit jamais eax (0x6a5932 `call` → 0x6a5937 `push 48h`) → retour de facto sans contrat.
5. **Effets sur [ctx+0x10]** — B : « ne modifie autre state que noeuds OT + dword_2517A24 » ; A : curseur avancé. **Tranché A (nuancé)** : `[esi+0x10]` est écrit sur LES DEUX voies (0x6a5ae2 puis 0x6a5c7f voie vide = avance +4 même si count==0 ; 0x6a5c71 voie boucle).
6. **Ordre copies/bump** — B : copies « après avoir aligné edi via bump +0x28 » ; **Tranché ASM** : copies 0x6a5c1d–0x6a5c38 AVANT `call` 0x6a5c49 et bump 0x6a5c51.
7. **Nombre de nodes par commande** — B : « émet 1..N noeuds » ; **Tranché ASM** : 0 ou 1 node de 0x28 par itération (un seul bloc build, saut direct 0x6a5ba4 → 0x6a5c54 si gate).
8. **Nature de [esi+0x10]** — B : « compteur/champ CTX décrémenté » ; **Tranché ASM** : pointeur curseur avancé (+4 puis +0x18/itération) ; le décompte de boucle est le var_4 stack (0x6a5b00 init, 0x6a5c5f `dec eax`).

## Preuves (ASM cité, adresses exactes)

1. **0x6a5ad7–0x6a5af1** : `mov ecx,[esi+10h]; mov eax,[ecx]; add ecx,4; mov [esi+10h],ecx; test edx,edx; jz 6A5C7F` — file `[count][commandes]`, avance +4 du curseur même si count==0, sortie sans émission.
2. **0x6a5b0a–0x6a5b8f** : 4 lectures `mov dx/cx/dx, [cur+4/+6/+8/+0Ah]` puis `lea eax,[table + idx*4]` et copies de 3 dwords vers `esi+18h/24h/30h/3Ch` — 4 sommets de 12 octets, stride d'index ×4 (offset dword, pas 12).
3. **0x6a5b92–0x6a5ba4** : `and dl,al; and dl,cl; test al,dl; jnz 6A5C54` — skip si le AND des bytes de gate `+44h/+2Ch/+20h/+38h` est non nul ; polarité jnz = skip.
4. **0x6a5bbb–0x6a5bdb** : `and ecx,200h; or ecx,40h; shl ecx,2` (bit 8 forcé, bit 11 conditionnel), `sar edx,6; and edx,0Fh` (bits 0-3), `sar eax,4; and eax,10h` (bit 4) → word `node+0x16` ; `sar` = champs signés, aucune polarité `ja/jb` en jeu.
5. **0x6a5be6–0x6a5c1a** : `and al,0C0h; sub dl,al` ×4 — 6 bits bas des bytes couleurs vers `node+0Ch/14h/1Ch/24h`, bytes compagnons vers `+0Dh/15h/1Dh/25h` ; masque unique issu de `b[ctx+0x1C]`.
6. **0x6a5c31/0x6a5c3b/0x6a5c41** : `[edi+4]=offset sub_808080`, `[edi]=9000000h`, `[edi+7]=2Eh` — signature constante du node (tag 0x2E dans le byte haut du dword+4 = `0x2E008080`).
7. **0x6a5c45–0x6a5c51 + 0x6a5c6e–0x6a5c74** : args cdecl droite→gauche `push [esi+14h]` (0x6a5c48) puis `push edi` (0x6a5bda) → `OtNode24_PoolAllocLink_Code1(pool, node)`, `add esp,8`, `add edi,28h` (voie build uniquement), `mov dword_2517A24, edi` ; retour voie boucle `mov eax,ecx` (curseur).
8. **Caller (sondage IDA lecture-seule)** : 0x6a5931 `push esi` / 0x6a5932 `call sub_6A5AD0` / 0x6a5937 `push 48h` — un seul arg, EAX retour jamais consommé ; 0x6a58e6–0x6a58ea le caller prépare `[esi+0x10]` = curseur et 0x6a58a1 `[esi+0x14]` = pool.

## Checks §5.6

- Callees cités présents : **oui** — `OtNode24_PoolAllocLink_Code1` (callees.txt ligne 8, call 0x6a5c49, add esp,8 0x6a5c4e ; catalogué 0x45C8E0 **CERTAIN** dans decomp-function-catalog). Aucun autre call dans l'ASM ; `sub_808080` n'est qu'une constante d'adresse écrite à node+4, jamais appelée.
- Caller cité présent : **oui** — xref code unique 0x6a5932 dans `sub_6A5700` (size 0x249, callers.txt), confirmé live par sondage IDA.
- Strides en nombres : commande **0x18** (0x6a5c5c `add ecx,18h`), node **0x28** (0x6a5c51 `add edi,28h`), index table **×4** (0x6a5b15 etc.), copie sommet **12 octets** (3 dwords).
- Polarités : gate `test/jnz` = skip si AND ≠ 0 ; `sar`/`movsx` pour les champs signés de ctx+8/ctx+0Ch ; zext implicite des index WORD ; aucun `ja/jb` unsigned impliqué.
- Largeur retour : EAX 32 bits — voie boucle = pointeur curseur, voie count==0 = 0xFFFFFFFF (artefact) ; inutilisé par l'unique caller (0x6a5937) → pas de contrat 0/2 ni de cast `__int16` justifié.
- Nom ≥2 preuves ASM indépendantes : (a) 0x6a5c3b/0x6a5c41 signature node tag 0x2E ; (b) 0x6a5c49 + 0x6a5c51 chaînage pool et bump 0x28 ; (c) 0x6a5b0a–0x6a5b8f indexation 4 sommets → « BuildQuadNodes_Tag2E ».
- wiki : pack wiki.md vide (échec qmd) ; recoupement QMD ff8-wiki : decomp-function-catalog n'a **pas** d'entrée 0x6A5AD0 ni 0x6A5700 (voisins : 0x6A45E0, 0x6A6360, 0x6A79B0) → pas de convergence wiki documentable → CERTAIN refusé.

## Questions ouvertes (non bloquantes)

- Rôle exact du dword0 de chaque commande 0x18 (non lu ici) : tag, compteur secondaire, ou champ ignoré ?
- Sémantique fine des bits du word node+0x16 (bits 0-3/4/8/11) : blend mode, texture page, code d'animation — à trancher avec le consumer `sub_808080`.
- Signification exacte du bit de gate (AND des dword2 des 4 sommets ≠ 0 → skip) : hors-champ, clippé, ou sommets déjà consumés par un frère (0x6A5950 tag 0x26 / 0x6A2A90 gabarit) ?
- La table `[ctx+4]` est-elle partagée avec les builders frères du même appelant (0x6A5C90, 0x6A5DB0, 0x6A5950 appelés juste avant dans sub_6A5700) ?

## IDBCOMMENT (proposition, FR sans accents)

Builder du flux magic FX (caller sub_6A5700) : consomme une file de commandes de 18h octets pointee par ctx+10h (dword count en tete, 4 index word par commande) et tire 4 sommets de 12 octets dans la table ctx+4h (index *4). Si le AND des 4 octets de gate +20h/+2Ch/+38h/+44h est nul, construit un node OT de 28h octets a dword_2517A24 (magic 09000000h @0, sub_808080 @4, tag 2Eh @7) et le chaine via OtNode24_PoolAllocLink_Code1([ctx+14h], node) avant de bumper le curseur global de 28h. Le curseur ctx+10h avance toujours de 4h + count*18h, meme sans emission ; retour EAX inutilise par l'appelant (0x6a5937). [semantic-triple 2026-09-22]

## Notes C-R

# reconcile_notes.md — sub_6A5AD0 (0x6A5AD0..0x6A5C8B, 156 instr / 444 o live)

Ground truth = ASM live (`asm.asm`). Hex-Rays = vérificateur seulement.
Entrées réelles : `c_a.c` (reconstruction C A) + `semantic_a.md` / `semantic_b.md` (voix sémantiques).
**Anomalie pack** : `c_b.c` absent du répertoire — le dossier ne contient que `c_a.c`,
`semantic_a.md`, `semantic_b.md`, `hexrays.c`, `meta.json`, `callees.txt`, `callers.txt`,
`globals.txt`, `asm.asm`, `wiki.md` (ce dernier vide : « qmd failed [WinError 2] »).
La réconciliation s'est donc faite A contre ASM, avec `semantic_b.md` comme seconde voix.

---

## Divergences tranchées contre l'ASM

### D1 — Gate skip : polarité et ordre des AND (A correct, Hex-Rays pareil)
- **A** (c_a.c:78) : skip si `b[0x38] & (b[0x44] & b[0x2C] & b[0x20]) != 0`.
- **Hex-Rays** (hexrays.c:55) : même polarité, ordre d'association différent (`(b[0x20]&b[0x44]&b[0x68])&b[0x38]`).
- **Tranché** : skip si `b[0x44]&b[0x2C]&b[0x20]&b[0x38] != 0`. Preuve : 6a5b92 `mov dl,[esi+44h]`, 6a5b95 `mov al,[esi+2Ch]`, 6a5b98 `mov cl,[esi+20h]`, 6a5b9b/6a5ba0 `and dl,al/cl`, 6a5ba2 `test al,dl` (al=[0x38]), 6a5ba4 `jnz` → skip. `jnz` = saute l'émission quand l'AND est non nul ; l'émission a lieu si l'AND est **nul**. L'ordre des AND est sans effet au niveau C (associatif).

### D2 — Retour EAX voie count==0 : 0 vs 0xFFFFFFFF (A incorrect, corrigé)
- **A** (c_a.c:15, c_a.c:141) : « retour = 0 si count==1 (dec/jz) » puis `result` non initialisé retourné.
- **ASM** : le gate initial est **`test edx,edx` sur count AVANT dec** (6a5adf `mov edx,eax` précède 6a5ae1 `dec eax` ; 6a5aeb `test edx,edx`; 6a5aed `jz`). Donc la voie de sortie anticipée est prise quand **count == 0**, pas 1. Sur cette voie, eax = count-1 = **0xFFFFFFFF** (le dec n'est jamais défait) et **aucun `mov eax` ne fixe eax ailleurs** (6a5c7f..6a5c8b : stores puis pops/retn seulement).
- **B** (semantic_b.md) : affirmait que la voie jz « ne fixe pas eax de façon déterminée » — faux : eax contient bien count-1 = 0xFFFFFFFF déterministe.
- **Tranché** : `return (count-1)` = 0xFFFFFFFF sur la voie count==0 ; `return cursor` sur la voie boucle (6a5c6e `mov eax,ecx`). Le prototype IDA `unsigned __int16 *` est trompeur ici (0xFFFFFFFF n'est pas un pointeur utile).

### D3 — Count==1 n'est PAS une voie de sortie (A incorrect, corrigé)
- **A** (c_a.c:40-43) : `counter = count-1; if (counter==0) goto sortie;` puis `counter = count` — implique un traitement spécial de count==1.
- **ASM** : `jz` @6a5aed teste edx (= count avant dec), pas le résultat du dec. Avec count==1 : le gate n'est pas pris, `inc eax` @6a5af8 remet le compteur à 1, **une itération s'exécute**, puis le `dec/jnz` de boucle (6a5c5f/6a5c68) sort.
- **Tranché** : le gate est `if (count == 0)` ; le compteur de boucle est `count` (non decremented). Pas de voie spéciale count==1.

### D4 — Le point de sortie initial `jz` : `mov [esi+10h],ecx` identique dans les deux voies
- Hex-Rays (hexrays.c:28, hexrays.c:97) montre bien `*(a1+16) = v4` exécuté AVANT le test — conforme à l'ASM (6a5ae2 store, avant 6a5aed jz). Le restock @6a5c7f est un no-op (même valeur). A le rendait correctement ; rien à trancher, noté pour mémoire.

### D5 — Stride d'index table : ×4 dword-offset, pas ×12 (confirmé, A correct)
- **A** (c_a.c:48) : `src = tbl + (idx << 2)`.
- Preuve : 6a5b15 `lea eax,[eax+edx*4]`, répété à 6a5b35/6a5b57/6a5b7c. Le record copié fait bien 12 octets (3 dwords lus à [eax]/[eax+4]/[eax+8]), mais **l'indexation est ×4** (offset dword dans la table), pas ×12. `semantic_b.md` était d'accord (« stride 4 exact, pas F_CHAR 0x1D0 »).

### D6 — Lecture des index : zero-extend WORD, pas sign-extend (A correct, Hex-Rays équivalent)
- **ASM** : 6a5b0d `xor edx,edx` + 6a5b0f `mov dx,[ecx+4]` (idem 6a5b2f/6a5b31, 6a5b51/6a5b53) = zero-extend. Le 4e index (6a5b75 `mov dx,[eax+0Ah]`) : edx est mis à zéro au 6a5b69 `xor edx,edx` juste avant, puis `mov dx` → zero-extend aussi.
- **Hex-Rays** traite `v4[2]..v4[5]` en `unsigned __int16` → équivalent.
- **Tranché** : `(unsigned int)(unsigned short)` pour les 4 index.

### D7 — Le `add edx,ecx` @6a5bb4 transporte un résidu dans ecx, neutralisé par le masque (A équivalent, Hex-Rays fidèle)
- **ASM** : 6a5baa `mov cx,[esi+1Ch]` ne nettoie que les 16 bits bas de ecx. Les 16 bits hauts viennent de 6a5b8c `mov ecx,[ecx+8]` (= dword2 du record 4, soit `*(uint*)(a1+0x44)`, chargé en entier 32 bits), avec seulement `mov cl,[esi+20h]` @6a5b98 (byte bas) au milieu. Donc `add edx,ecx` @6a5bb4 calcule `[esi+8] + word[+0x1C] + (record4dword2 & 0xFFFF0000)`.
- **Neutralité prouvée** : le résultat n'est utilisé qu'après `sar edx,6` + `and edx,0Fh` (6a5bc4/6a5bca) → seuls les **bits 6-9 de la somme** survivent. Les retenues d'une addition ne propagent que vers les bits hauts ; le résidu occupe les bits 16-31, il ne peut donc pas modifier les bits 6-9. Le C propre de A (`[esi+8] + (unsigned short)word[+0x1C]`) est **mathématiquement équivalent**.
- **Hex-Rays** (hexrays.c:53 + 57 + 62) capture le résidu fidèlement (`v14 = v13[2]` puis `LOWORD(v14) = word[+1C]` — les bits hauts de v14 restent ceux du dword2) mais sans le commenter ; comportement identique.
- Le `movsx eax, word ptr [esi+1Ch]` @6a5be2, lui, sert **uniquement** au masque couleur (`and al,0xC0` @6a5be6) — le movsx est sans effet puisque seul al est utilisé ensuite.
- **Tranché** : C propre restitué ; le résidu ASM documenté ici comme preuve d'équivalence, pas reproduit en C.

### D8 — Node word +0x16 : assemblage 3 champs, ordre et polarité (A/B/Hex-Rays alignés)
- Preuves : 6a5bb1-6a5bb4 `edx = [esi+8] + word[esi+1Ch]` ; 6a5bc4 `sar edx,6` + 6a5bca `and edx,0Fh` → bits 0-3 ; 6a5bbb `and ecx,200h` + 6a5bc7 `or ecx,40h` + 6a5bcd `shl ecx,2` → (bit8 forcé | bit11 si 0x200) décalé de 2 → bits 10/13 **dans le registre** mais l'ASM écrit word[+0x16] @6a5bdb — le champ final après `or edx,ecx` @6a5bd3 conserve bit 11 (0x100<<2 = 0x400 = bit 10) et bit 0x40<<2 = 0x100 = **bit 8 forcé** ; 6a5bd0 `sar eax,4` + 6a5bd5 `and eax,10h` → bit 4 via `or edx,eax` @6a5bd8.
- **Tranché** (restitué fidèlement, sans interprétation de rôle) :
  `w = (((ctx8 + word[+0x1C]) >> 6) & 0xF) | (((ctxC & 0x200) | 0x40) << 2) | ((ctxC >> 4) & 0x10)`.
  Hex-Rays (hexrays.c:60-62) identique. A identique. Le `sar` (arithmétique) est conservé sur les deux champs signés.

### D9 — Couleurs node : soustraction du masque 0xC0, pas AND 0x3F (A correct)
- **A** (c_a.c:100-108) : `g[0x0C] = b[0x1C] - (b[0x1C] & 0xC0)`, idem +0x14/+0x1C/+0x24 ; octets compagnons +0x0D/+0x15/+0x1D/+0x25 copiés sans masque.
- **semantic_a.md:46** disait « masque du byte1 à 6 bits (U) » — formulation AND 0x3F, mais l'ASM fait une **soustraction** (`sub dl,al` 6a5be8/6a5bf6/6a5c04/6a5c12), équivalente à AND 0x3F **uniquement** si le byte ≤ 0xFF (vrai ici, lecture byte) — sémantiquement le résultat est le même pour un byte, mais le C restitué garde le `sub` fidèle.
- **Hex-Rays** (hexrays.c:63-71) : `v15 = *(_WORD*)(a1+28) & 0xC0` (byte bas du word, via `movsx` + `and al,C0`) puis `sub` — conforme.
- **Tranché** : soustraction du masque, restituée en C littéral. Offsets byte exacts : node 0x0C/0x14/0x1C/0x24 ← a1 0x1C/0x28/0x34/0x40 (sub), node 0x0D/0x15/0x1D/0x25 ← a1 0x1E/0x2A/0x36/0x42 (copie directe).

### D10 — Dwords position node : copiés AVANT le magic/tag, ordre des stores (A correct)
- **ASM** : 6a5c1d `node[0x08] = a1[0x18]` ; 6a5c23 `node[0x10] = a1[0x24]` ; 6a5c28 `node[0x18] = a1[0x30]` ; 6a5c2e `node[0x20] = a1[0x3C]` ; puis 6a5c31 `node[+4]=sub_808080`, 6a5c3b `node[0]=0x09000000`, 6a5c41 `node[7]=0x2E`.
- Hex-Rays (hexrays.c:72-79) même ordre. A même. **Tranché** : restitué tel quel ; l'ordre des stores est sans effet C mais documenté car `mov dword ptr [edi+4], offset sub_808080` @6a5c31 et `mov [edi], 9000000h` @6a5c3b écrasent des zones disjointes du node (le tag 0x2E @+7 cohabite avec le dword +4).

### D11 — Args OtNode24_PoolAllocLink_Code1 : ordre des pushes (confirmé 2 args)
- **ASM** : `push edi` @6a5bda (arg2 = node), `mov edx,[esi+14h]` + `push edx` @6a5c45-6a5c48 (arg1 = pool), `call` @6a5c49, `add esp,8` @6a5c4e. Ordre : arg2 poussé en premier (donc arg1 = dernier poussé = [esi+14h]) — cdecl droite→gauche : `f(pool=*(a1+0x14), node)`.
- **A** (c_a.c:120) : `OtNode24_PoolAllocLink_Code1(*(int **)(a1 + 0x14), (void *)g)` — conforme. **Hex-Rays** (hexrays.c:80) idem. **Tranché** : 2 args, (pool, node), add esp,8.

### D12 — Avancement edi conditionnel : le `add edi,28h` est sur la voie build (les 3 sources divergeaient, tranché)
- **ASM** : 6a5c51 `add edi,28h` est entre le `add esp,8` @6a5c4e et le label 6a5c54 — donc sur le chemin **post-call uniquement**. Si le gate skip est pris (`jnz 6a5ba4`), le saut arrive **directement à 6a5c54** sans passer par 6a5c51 : edi inchangé.
- **Conséquence** : si toutes les itérations skippent, `dword_2517A24` est rechargé avec sa valeur d'entrée @6a5c74 — **le global n'avance pas** (point 6 de la consigne confirmé).
- **A** (c_a.c:121) : avait le `add edi,28h` sur la voie build, correct. **Hex-Rays** (hexrays.c:81 `v7 += 10` dans l'if) : correct aussi. **semantic_b.md:5** (« bump de la tête OT globale de 0x28 par noeud émis ») : conforme.
- **Tranché** : restitué avec `node = node + 0x28` uniquement sur la voie build (c_reconciled.c, bloc post-call avant `loc_6A5C54`).

### D13 — Voie count==0 : dword_2517A24 rechargé avec la valeur d'entrée (les 3 sources alignées)
- **ASM** : 6a5ae5 `mov edi,dword_2517A24` avant le gate ; 6a5c82 `mov dword_2517A24,edi` sur la voie jz → store de la valeur d'entrée (no-op observable, mais l'ASM l'exécute). **Tranché** : restitué (`dword_2517A24 = node;` dans les deux voies), conforme ASM.

### D14 — Compteur de boucle : count, pas count-1 (A incorrect, corrigé)
- Voir D3/D5. **ASM** : 6a5af8 `inc eax` rétablit eax=count après le `dec` du gate. Le dec de boucle @6a5c5f opère sur ce compteur : la boucle tourne **count fois**. **A** (c_a.c:43) avait `counter = count` après le gate — correct au final, mais sa description d'en-tête (c_a.c:15) mentionnait à tort « count==1 → retour 0 ». Tranché : gate = count==0, boucle = count itérations.

### D15 — Stride commande 0x18 (confirmé, unanime)
- 6a5c5c `add ecx,18h` à chaque itération (aussi présent à 6a5c5c sur la voie skip via label 6a5c54). Les 4 index WORD sont lus à +4/+6/+8/+0xA de la commande courante. Le dword à +0 de la commande n'est lu **que pour la première** (count en tête de file) ; pour les itérations suivantes, dword0 de la commande n'est jamais relu. **Tranché** : restitué tel quel.

---

## Récapitulatif des corrections vs c_a.c

| # | Point | A (c_a.c) | ASM (tranché) |
|---|-------|-----------|----------------|
| D2 | Retour voie count==0 | « 0 si count==1 » | 0xFFFFFFFF (count==0, dec jamais défait) |
| D3 | Gate initial | `count-1 == 0` | `count == 0` (test AVANT dec) |
| D7 | Résidu ecx hauts bits @6a5bb4 | zext propre (équivalent) | résidu 16-31 neutre via masque bits 6-9 |
| D14 | Compteur boucle | count (mais doc en tête fausse) | count (6a5af8 inc rétablit) |

## Divergences vs Hex-Rays (vérificateur)

1. **hexrays.c:27** : `result = (v3 - 1)` puis retour `result` sur la voie else (hexrays.c:100) → Hex-Rays rend bien `count-1`, conforme à la lecture ASM (D2). A était le seul à se tromper.
2. **hexrays.c:31** : `if (v5)` où `v5 = v3 = count` AVANT dec — conforme (D3). A avait déplacé le test après le dec.
3. **hexrays.c:60-62** : word +0x16 assemblé en une seule expression C avec les mêmes masques (`>>6 & 0xF`, `&0x200 | 0x40` puis `*4`, `>>4 & 0x10`) — conforme à D8. Note : Hex-Rays écrit `*4` (shl 2) et rend le `sar` en `>>` signé sur `int`, ce qui est fidèle.
4. **hexrays.c:63** : `v15 = *(_WORD *)(a1+28) & 0xC0` stocké dans un `char` — Hex-Rays perd le `movsx` (il rend le byte bas masqué, ce qui est équivalent au résultat utilisé, cf. D7).
5. **hexrays.c:83-85** : `v17 = v20 + 12` (en `unsigned __int16*`) = +24 octets = 0x18 — conforme stride (D15).
6. **hexrays.c:84** : `v18 = v19 == (char*)1` — Hex-Rays encode la condition de boucle via le pointeur `v19` (compteur déguisé) ; l'ASM utilise un simple dec eax/jnz. Sans effet sémantique.
7. **hexrays.c:38** : `v10 = *(a1+4) + 4*v4[2]` — index ×4 conforme (D5), mais `v4[2]` (en unités de 2 octets depuis le début du record) = offset +4 de la commande : conforme.

**Aucune divergence Hex-Rays/ASM détectée sur cette fonction** — Hex-Rays est ici un miroir fidèle ; c'est c_a.c (et son en-tête commenté) qui portait les erreurs D2/D3/D7/D14.

## UNCERTAIN restants

- `// UNCERTAIN 0x6a5c8b` : usage de la valeur de retour 0xFFFFFFFF sur la voie count==0 par le caller sub_6A5700 (@0x6a5932) — la lecture du caller est nécessaire pour dire si eax est consommé ou ignoré. Le prototype IDA `unsigned __int16 *` suggère un pointeur, mais 0xFFFFFFFF n'en est pas un exploitable tel quel.
- Sémantique des bits du word node+0x16 (bits 0-3, 4, 8, 10/11) : la structure est prouvée par l'ASM (D8), le rôle fonctionnel (blend mode / texture page / anim code) ne peut être tranché sans le consumer sub_808080 — hors périmètre C-R.
- Rôle du dword0 des commandes d'itération (offsets 0x18, 0x30… du stream) : jamais relu après le count initial — usage éventuel par le consumer inconnu.

## Anomalies du pack

- **`c_b.c` manquant** : le pack ne contient pas ce fichier (listé dans la consigne mais absent du répertoire). Réconciliation faite A-vs-ASM avec `semantic_b.md` en seconde voix.
- **`wiki.md` vide** : « qmd failed: [WinError 2] » — aucune convergence wiki possible, conformément à la note semantic_a.md:58.
- ASM complet (156 instr, 0x1BC octets), non tronqué. Un seul callee, un seul caller — pas de TRUNCATED à signaler.
