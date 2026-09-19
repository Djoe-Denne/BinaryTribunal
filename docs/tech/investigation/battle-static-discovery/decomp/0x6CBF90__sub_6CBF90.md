# sub_6CBF90 @ 0x6CBF90

Nom proposé (markdown seul, non appliqué à l'IDB) : **`MagicFx_MultiPhase_TickAndApplyResult`** — tick mono-frame d'un effet magique de bataille : stepper de coroutine (`word [esi+0Ch]` jusqu'à 0x98) orchestrant sons, gerbes de sprites, quads plein écran et mouvements de caméra, avec application du résultat de l'action aux frames 0x72/0x77.

- Instr: 1328
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=LIKELY, B=LIKELY, R=CERTAIN)
- Caller: callback `BdLinkTask` enregistré par `sub_6CBCF0` @0x6cbdc2 (push offset sub_6CBF90), chaîne `MagicList_Logic` MAG_112_UNK6 → `sub_50AF20` → `sub_6CBC10`
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, 10 divergences A/B tranchées + 8 Hex-Rays, 0 indécise

## C réconcilié

Carte des blocs canonique R01–R31 (unification A:33 / B:29 → 31 ; les écarts 33↔29 n'étaient que des coupures différentes, aucune divergence de fond) :

| Bloc | Plage | Rôle (voix A / voix B) |
|------|-------|------------------------|
| R01 | 6CBF90-6CC010 | prologue, SE op 2/0x49, table fade, fill records (A B1, B B00+B01) |
| R02 | 6CC011-6CC064 | op 7 : cam avance 950*sin/cos>>12 (A B2, B B02) |
| R03 | 6CC065-6CC0AA | dispatch 1 + op 0x0A preload + pose 0xF1 (A B3+B4, B B03) |
| R04 | 6CC0AF-6CC0FE | trigger 1 rec+0xB4 (tmpl 12DB65C) (A B5, B B04) |
| R05 | 6CC100-6CC198 | dérive cam (AC/400*sin)/160 (A B6, B B05) |
| R06 | 6CC199-6CC1B2 | commun : pose 0xF1 -> p_out (A B7, B B06) |
| R07 | 6CC1B3-6CC29C | 8 tâches tremblement (6CD750/2521930) (A B8, B B07) |
| R08 | 6CC29D-6CC329 | 12 tâches fumée op 0x0A (6CD5C0/2521940) (A B9, B B08) |
| R09 | 6CC32E-6CC4B0 | anneau d'onde + OT (ebx 1..7) (A B10, B B09) |
| R10 | 6CC4B1-6CC5A1 | 2 débris (6CD640/2521920) (ebx 2..7) (A B11, B B10) |
| R11 | 6CC5A2-6CC6D6 | dispatch 2 : op 0x11, triggers 2/3, F4 (A B12-14, B B11) |
| R12 | 6CC6D7-6CC6ED | op 0x22 : au_re(0,1,1,0x60) (A B15, B B12) |
| R13 | 6CC6EE-6CC7F2 | dispatch 3 : op 0x30, pose 0x15, trigger 4 (A B16-17, B B13) |
| R14 | 6CC7F3-6CC80C | op 0x43 : au_re(0,1,6,0xFF) (A B18a, B B14) |
| R15 | 6CC80D-6CC822 | dispatch 4 : t = op-0x45, garde <0x41 (A B18b, B B15) |
| R16 | 6CC823-6CC8EC | t==0x26 : quad + 3 packets OT (A B19, B B15) |
| R17 | 6CC8ED-6CC95F | t==0x27 + générique : 2 F4 (A B20, B B15) |
| R18 | 6CC958-6CCAC0 | t==0 (op 0x45) : init caméra complète (A B21, B B16) |
| R19 | 6CCAC1-6CCB2D | œil + compose + trigger 5 rec+0xD98 (A B22, B B17) |
| R20 | 6CCB2F-6CCB4D | t>=0x29 : trigger 6 rec+0xE78 (slots stale) (A B23, B B17) |
| R21 | 6CCB4E-6CCC23 | diag GTE + trigger 7 rec+0xA18 (A B24, B B18) |
| R22 | 6CCC24-6CCD71 | t==2 (op 0x47) : 16 éclats (6CD640) (A B25, B B19) |
| R23 | 6CCD72-6CCDF5 | t>=0x26 : œil rec+0x5C + trigger 8 rec+0x90C (A B26, B B20) |
| R24 | 6CCDF6-6CCF29 | t 0x29..0x2C : caméra table 12DB748..730 (A B27, B B21) |
| R25 | 6CCF2A-6CCF82 | porte événement final (op 0x72 / 0x77) (A B28, B B22) |
| R26 | 6CCF83-6CD095 | dispatch 5 : op 0x2D..0x31 (A B29, B B23+B24) |
| R27 | 6CD096-6CD11C | dispatch 6 : op 0x89..0x8F blends (A B30, B B25) |
| R28 | 6CD11D-6CD19E | dispatch 7 : op 0x91..0x97 blends (A B31, B B26) |
| R29 | 6CD19F-6CD223 | single-shots 0x8F/0x91/0x98 (+pop ebp/ebx) (A B32, B B27) |
| R30 | 6CD224-6CD251 | op 0x89 : tâche 6CD870/2521920 (A B33a, B B28) |
| R31 | 6CD252-6CD27D | stepper + 2 sorties (A B33b, B B29) |

Le C réconcilié complet (904 lignes : carte + fonction + notes de fidélité) vit dans le pack : `tools/_tmp_semantic_triple/0x6cbf90/c_reconciled.c`. Extrait représentatif :

```c
int __cdecl sub_6CBF90(void *fx_arg)
{
    u8 *fx = (u8 *)fx_arg;                /* esi : record d'effet ; op = W16(fx+0x0C) */
    s32 fade;                             /* edi initial 0xFFFFD8F1 (-9999) */
    /* ... ebx_r/ebp_r/edi_r (poids de registres), p_out, deltas, record 20
       octets var_34 (arg3 de sub_701970), mtx9 var_20, GTE var_C/8/4 ... */

    /* R01 [6CBF90-6CC010] Prologue + SE one-shot + table fade + fill records */
    fade = -9999;                                     /* 6CBF99 edi = FFFFD8F1h */
    if (W16(fx + 0x0C) == 2)                          /* 6CBF9E */
        BdPlaySE(&dword_12DB654, 0, 0x80);            /* 6CBFB1, add esp,0Ch */
    if (W16(fx + 0x0C) == 0x49)                       /* 6CBFB9 */
        BdPlaySE(&dword_12DB658, 0, 0x80);            /* 6CBFCC, add esp,0Ch */
    {
        s16 op0 = W16(fx + 0x0C);                     /* 6CBFD4 mov ax */
        if (op0 >= 4) {                               /* 6CBFD8 jge signé */
            if (op0 <= 0x94) {
                fade = 0x400;                         /* 6CC001 */
            } else {
                fade = (0x98 - op0) << 8;             /* 6CBFF5-FFF, jmp 6CBFE1 */
                if (fade <= -9999) fade = -9999;      /* 6CBFE4/jle garde défaut */
            }
        } else {
            fade = op0 << 8;                          /* 6CBFDE movsx; shl 8 */
            if (fade <= -9999) fade = -9999;          /* jle garde défaut */
        }
    }
    FillWordPairStride2C_1D989B8(fade, 0);            /* 6CC009, add esp,8 */
    /* 4 records [1D989B8,1D98A68) stride 0x2C : [p-0x26]=w(fade), [p]=d(0) */

    /* R03 [6CC065-6CC0AA] Dispatch 1 : ebx = op - 0x0A ; garde UNSIGNED <= 0xF
       push ebx/ebp AVANT le garde (6CC065/66) -> dépilés en R29 sur tout chemin. */
    ebx_r = (s32)W16(fx + 0x0C) - 0x0A;               /* 6CC067 movsx ; sub */
    if ((u32)ebx_r > 0xF)
        goto L_6CC5A2;                                /* 6CC071 ja UNSIGNED */

    if (ebx_r == 0) {                                 /* 6CC077 test ; jnz 6CC0AF */
        sub_7016B0(&unk_12C7420, fx + 0xB4, 0xC0);    /* 6CC08C : 0xC0 octets d'anim */
        /* 6CC0A2 : pushes (cam),0xF1,ebx(=0),fx+4Ch ; add esp,1Ch couvre les
           3 pushes de sub_7016B0 + 4 (12+16=0x1C) */
        BattleGeom_ResolveBoneIndexAndPose(dword_25218E0, 0xF1, ebx_r, (s16 *)(fx + 0x4C));
        goto L_6CC199;                                /* 6CC0AA */
    }

    /* ... R04 (trigger 1) ... R30 (op 0x89 : tâche 6CD870/2521920)
       — voir tools/_tmp_semantic_triple/0x6cbf90/c_reconciled.c ... */

    /* R31 [6CD252-6CD27D] Stepper + 2 sorties */
    if (W16(fx + 0x0C) < 0x98) {                      /* 6CD256-5A jl SIGNÉ */
        W16(fx + 0x0C) = (s16)(W16(fx + 0x0C) + 1);   /* 6CD271 inc eax ; mov [esi+0Ch],ax */
        return 0;                                     /* 6CD277 xor eax,eax */
    }
    U16P(CAM + 0x00) &= 0xEFFF;                       /* 6CD263 clear bit 12 (0x1000) */
    return 2;                                         /* 6CD268 mov eax,2 */
}
```

## Preuves et validation parent

1. **Stepper de coroutine** : 6CD268–6CD277 `cmp ax,98h / jl → inc word [esi+0Ch] / xor eax,eax`, sinon `and word [dword_25218E0],0EFFFh / mov eax,2` — retour **0** (en cours) ou **2** (terminé, cam word[0] &= ~0x1000), durée totale 0x98 = 152 frames.
2. **Callback confirmé par bytes** : sondage IDA @0x6cbdc2 = `68 90 BF 6C 00` (`push offset sub_6CBF90`) puis `push offset dword_2521950` + `call BdLinkTask_Register` dans `sub_6CBCF0` — le xref « data » était un push immédiat mal typé (`dword@0x6cbdc2` = 0x6cbf9068 n'est pas un pointeur).
3. **Chaîne caller complète** : table `MagicList_Logic` @0xC81774 (entrée `MAG_112_UNK6`) → `sub_50AF20` (read_effect) → 0x50AA94 → `sub_6CBC10` (Magic_GetFileArena, dword_25218E0/EC, `BdLinkTask_Register(sub_6CBCF0, unk_2521960)`) → `sub_6CBCF0` (setup) → callback `sub_6CBF90` pumpé par frame.
4. **Application du résultat, frames 0x72/0x77, garde 0xC00** : 6CCF3C–6CCF80 — si `W16(tgt+26h) >= 0xC00` alors frame fenêtre 0x2D (absolue 0x72), sinon 0x32 (absolue 0x77) ; `and word [eax],0FFF7h` (clear bit 3 posé sur la cible à la frame 0x34), lecture `dword_25218EC+4 + [esi+0Eh]*0x14 + 8` puis `call BattleAction_ApplyResultAndSpawnPresentation` @6CCF7B.
5. **`esi+0Eh` = unité cible (stride 0x14)** : le stride 0x14 de la table d'events est la dimension *unité* ; le setup 6CBE02 copie l'octet unité `[edi+0Eh]` (arg de magic) dans `[esi+0Eh]` puis résout `ds:0x1D972C0[+40h×unité]` → `[esi+0B0h]` ; le champ est ensuite écrasé à 0 par `sub_6CD8B0` (6CC5F1, fenêtre frame 0x11) — usage double.
6. **Divisions magiques vérifiées (double transcription)** : /12288 `imul 2AAAAAABh / sar edx,0Bh` (6CCFCF-FDE) ✔ ; /6 `mul 0AAAAAAABh, edi=edx, shr edi,2` = `((op-0x91)<<12)/6` non signé (6CD12F-143) ✔ ; lerp des scrolls `ebx = f<<0Ah` (0x89–0x8C) ou `0x1000` (0x8D–0x8F), `edi = 0x1000−ebx` (6CD0AA-C8) ✔ ; /400, /160 avec corrections d'arrondi `d += (u32)d >> 31` (motif MSVC).
7. **Leurre `VIT_0_STATUS_MASK_` = données primitive GPU** : 6CC885/6CC8CC `mov dword ptr [eax], offset VIT_0_STATUS_MASK?` + `mov dword ptr [eax+4], 0E1000220h` / `0E1000240h` — en-tête de primitive GPU (mot de mode 0xE1xxxxxx = commande GPU/texpage, word se terminant par `CA88` = fin de chaîne « OP » 0x50P4). Zéro rapport avec un masque de statut ; libellé IDA trompeur, à ne pas propager.
8. **Enveloppe d'intensité** : 6CBFD4–6CC009 rampe `phase<<8` (frames 0–3, seuil 0xFFFFD8F1) / plateau 0x400 (4..0x94) / descente `(0x98−phase)<<8` (>0x94) → `FillWordPairStride2C_1D989B8(edi, 0)` sur 4 records stride 0x2C @0x1D989B8.

- Risque: pack `callees.txt` avec section CALLS/PROTOS vide → arité de `sub_701970` tranchée par recompte push par push (D1) ; wiki QMD sans aucun hit pertinent → le verdict CERTAIN repose sur ASM + caller (sondages IDA), pas sur le wiki.

## Divergences

Résumé de `reconcile_notes.md` — 10 divergences A/B tranchées contre l'ASM (jamais moyennées), + 8 divergences Hex-Rays, 0 indécise :

| # | Sujet | Verdict (preuve asm.asm) |
|---|-------|--------------------------|
| D1 | **Arité `sub_701970`** | **4 args cdecl** `(dst_anim, callback, record20*, arg4)`. Les cleanups « incohérents » (0x10/0x18/0x2C/0x1C) sont des cleanups FUSIONNÉS couvrant des pushes cdecl antérieurs non soldés ; les 8 sites font exactement 4 pushes. Les stores var_2C/var_28/var_24 sont les champs +8/+0xC/+0x10 du record 20 octets à var_34, PAS des args 5/6. (6CC0F8/FD, 6CC635/3A, 6CC66F/74, 6CC7B9/BE, 6CCB27/2C, 6CCB46/4B, 6CCC0F/18, 6CCDEA/F3) |
| D2 | arg4 de `sub_701970` | toujours **0** : sites 1–4 poussent le littéral 0 ; sites 5–8 poussent ebx, mis à 0 par `xor ebx,ebx` sur tout chemin atteignant (6CC831/6CC8F9/6CC90D/6CC931) |
| D3 | `OtNode24_PoolAllocLink` / `_Code1` : ordre des args | **(ot, pkt)** — dernier push = arg1 (cdecl) ; Hex-Rays d'accord (6CC884/6CC89B, 6CC8B0/B4, 6CC8CB-E3) |
| D4 | `BdLinkTask_Register` : ordre des args (6 sites) | **(list_head, callback)** — push callback PUIS push list à chaque site (6CC1CB-D5, 6CC2AC-B6, 6CC4D3-DD, 6CCC2C-36, 6CCE60-6A, 6CD22C-36) |
| D5 | **R17 : émission des polys pour t==0x26/0x27 (ops 0x6B/0x6C)** | **les DEUX F4 émises** : `jmp loc_6CC90F` (6CC8EB pour 0x6B, 6CC906 pour 0x6C) atterrit au DÉBUT de la séquence F4(t-0x10,3) 6CC90F..92A, puis F4(t-0x20,3) si t>=0x20. A s'était trompé de cible de goto (aucune F4) et B n'en émettait qu'une ; Hex-Rays (LABEL_72/LABEL_73) confirme l'ASM |
| D6 | **Magie /6 (R28)** | `edi = (u32)(((u64)(u32)ecx * 0xAAAAAAABu) >> 34)` — mul NON signé, edi=edx, UN SEUL `shr edi,2` (= x/6). A comptait le shift deux fois (>>36) ; B utilisait la constante fausse 0xAAAAAAAA. Hex-Rays : `(v73<<12)/6` non signé — d'accord (6CD12F-143) |
| D7 | **Corrections d'arrondi /400, /160, /12288** | **`d += (u32)d >> 31`** (bit de signe du quotient APRÈS sar, motif MSVC). A les omis, B ajoutait `v>>31` (mauvaise source). Helpers `div400_magic` (>>39), `div160_magic` (>>38), `div12288_magic` (>>43) (6CC136-13B, 6CC14A-14F, 6CCFD9-FDE) |
| D8 | R01 : branche op>0x94 du fade | version A/ASM : `sub eax,ecx ; jmp 6CBFE1` → queue commune `shl eax,8 ; cmp 0xFFFFD8F1 ; jle défaut` ; B avait perdu le `<<8` et la garde (6CBFF5-FFF, 6CBFE1-E9) |
| D9 | R10 : lectures var_44/var_40 (débris) | **copies 32 bits littérales** `mov ebx,[var_44]` / `mov ebp,[var_40]` puis stores DWORD ({dz\|mot voignant jamais écrit}) — même famille que 6CC2DB ; ni sign-extend (A) ni zero-extend (B) (6CC4C3, 6CC4C7, 6CC4FF, 6CC502) |
| D10 | R22 : largeur de \|j\| | **32 bits** : store dword + lecture dword (var_44) ; Hex-Rays confirme (6CCC6E, 6CCC7E-82, 6CCC86) |

Confirmations de fond (A et B déjà d'accord, ASM confirme) : matrice diag partielle R21 (m00/m11=0x1000, six mots à 0, **m22 +0x10 jamais écrit**, hérite du compose de R19/R23) ; sens des 2 appels `Thunk_56CBC0` inversé R27 (dst=fx+30/34) vs R28 (dst=byte_2521918) avec poids (w,k) inchangés ; lecture dword à cheval 6CC2DB gardée telle quelle avec commentaire.

Divergences Hex-Rays (vérificateur, tranchées contre l'ASM) : H1 sqrt résultat perdu (artifact, canonical correct) ; H2 shift non signé au lieu de `sar 14h` signé (R22) ; H3 store word +6 (var_1A) perdu en R21 (7/8 stores) ; H4 divisions magiques rendues en identités directes (servent de contre-preuve à D6/D7) ; H5/H6/H7/H8 équivalences confirmées (dont H6 : Hex-Rays correct sur D5, contre A et B).
