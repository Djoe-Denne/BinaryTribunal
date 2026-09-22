# MagFx_EmitStream_Code3A_Gte_Ot @ 0x6A5DB0

- Instr (live): 119 (472 o, 0x6A5DB0-0x6A5EE3)
- Palier: 2+1
- Verdict: LIKELY - sous-builder Maelstrom (caller unique sub_6A5700 @0x6a5932, ignore le retour @0x6a58f3-F8) : lit le count dword via [a1+0x10] @0x6A5DB7, records stride 0x18, 4 index WORD (rec+4/6/8/A), copie 4 vertices 12 o depuis [a1+4] + 4*wordIdx (offset source = 4*idx, PAS 12 ; lea ecx,[eax+edx*4] @0x6A5DE3/01/1D/39) vers le scratch a1+0x18/24/30/3C ; 4 passes GTE par record (StorePtr sur rec+0/0xC/0x10/0x14 -> sub_45F270 -> GetToPtr vers pkt+4/0xC/0x14/0x1C) @0x6A5E67-75 ; tag pkt[0]=0x08000000 @0x6A5EBF / byte +7=0x3A @0x6A5EC5 ; link OtNode24_PoolAllocLink_Code1(ot=[a1+14h] push @0x6A5ECD, pkt push @0x6A5ECC) @0x6A5ECE, cleanup add esp,28h @0x6A5ED7 (10 pushes) ; curseurs pkt+=24h @0x6A5EDA, rec+=18h @0x6A5EDD, dec @0x6A5EE0 ; store curseur global dword_2517A24 @0x6A5EEF ; retour EAX = 0 si boucle executee, 0xFFFFFFFF si count==0 ; PAS de sub_808080 @+4 (conforme aux jumeaux 0x6A5950/0x6A5AD0 ; pkt+4 = sortie GetToPtr)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A5DB0\nTYPE ; proposition: MagFx_EmitStream_Code3A_Gte_Ot
- Notes parent: checks 5.6 OK : mov ecx,[ebp+10h] (0x6A5DB7), lea ecx,[eax+edx*4] 4*idx (0x6A5DE3), lea ecx,[esi+4] (0x6A5E71) + GetToPtr (0x6A5E75) = 4 o, tag 0x08000000h (0x6A5EBF), 0x3Ah (0x6A5EC5), push esi pkt puis push edx ot (0x6A5ECC-CD), add esi,24h (0x6A5EDA), add edi,18h (0x6A5EDD), dec eax (0x6A5EE0), dword_2517A24 (0x6A5EEF), caller sub_6A5700 @0x6a5932 (callers.txt) ; R : 3 dwords copies mais seul le milieu atteint le packet @0x6a5e4f ; word[+14]=1 par annotation callee E3b (CERTAIN)

## C reconcilie

```c
/* ============================================================================
 * c_reconciled.c — sub_6A5DB0 (0x6A5DB0, taille 342 o, 119 instr live)
 * Rôle C-R (réconciliation triple). Ground truth = live ASM (asm.asm).
 * c_b.c ABSENT du pack : réconciliation faite vs c_a.c + hexrays.c (vérif.)
 * Type IDA   : int __cdecl(int)
 * Caller     : 1 seul — sub_6A5700 @ 0x6a58f3
 * Sauvegardes: esi, edi, ebx poussés (0x6a5db5/6a5db6/0x6a5dd4).
 *              ebp NON sauvé : écrasé avec a1 @0x6a5db1 (`mov ebp,[esp+4+arg_0]`)
 *              et sert de base [ebp+off] pour tous les accès au struct a1.
 * Pile       : callees cdecl (ne nettoient pas). 10 pushes d'args accumulés
 *              (8 GTE + 2 OtNode24) nettoyés en un seul `add esp, 0x28` @0x6a5ed7.
 *              Nb : le 1er arg GTE (edi = rec) est poussé TÔT, @0x6a5de2,
 *              AVANT les copies de vertices — c'est le 1er des 10 pushes.
 * Retour     : EAX = 0 si la boucle a tourné (dernier dec @0x6a5ee0 → 0),
 *              0xFFFFFFFF si count==0 (eax = count-1 = -1 @0x6a5dc1, branché
 *              @0x6a5dcd de façon à ignorer le `inc` @0x6a5dd3).
 * ==========================================================================*/

/* ---- Callees (seulement celles vues dans asm.asm / callees.txt) ---------- */
extern void GteState_StorePtr_1CA8A28(void *ptr);   /* E3a: dword_1CA8A28 = arg */
extern void GteState_GetToPtr_1CA8A68(void *out);   /* E3a: *arg = dword_1CA8A68 */
extern void sub_45F270(void);                       /* exec GTE (pas d'arg)     */
extern void OtNode24_PoolAllocLink_Code1(void *ot, void *node); /* E3b, cdecl */

extern unsigned int *dword_2517A24;   /* 0x2517A24 : curseur global packets OT */

/* NB : dword_1CA8A28 / dword_1CA8A68 ne sont accédées que VIA les accesseurs
 *      StorePtr/GetToPtr — aucune référence directe dans l'ASM. */

/* ---- Struct a1 (base ebp) ------------------------------------------------
 *   +0x04 : base table de sommets (byte*) — offset d'un sommet = 4*wordIdx
 *   +0x10 : curseur de stream (dword*) : *cur = count, cur += 4 après lecture
 *   +0x14 : OT cible passée à OtNode24_PoolAllocLink_Code1
 *   +0x18 / +0x24 / +0x30 / +0x3C : scratch 4 vertices de 12 o
 *   Record (curseur edi, stride 0x18 = 24 o) :
 *     +0x00..03 : dwords jamais lus (transparent pour ce sous)
 *     +0x04/+06/+08/+0A : 4 index WORD (unités dword dans la table de sommets)
 *     +0x0C/+0x10/+0x14 : buffers StorePtr des passes GTE 2/3/4
 *     (+0x00 sert aussi de buffer StorePtr de la passe 1)
 *   Packet OT (curseur esi, stride 0x24) : slots de 8 o ;
 *     +0 : tag 0x08000000, +7 : 0x3A, +4/0xC/0x14/0x1C : GetToPtr,
 *     +8/0x10/0x18/0x20 : pré-remplis de scratch 2e dword de chaque vertex. */

int __cdecl sub_6A5DB0(int a1)
{
  unsigned int  count;    /* *cursor                              */
  unsigned int  i;        /* compteur de boucle ([esp+arg_0])     */
  unsigned int  vtxBase;  /* [a1+4]                               */
  unsigned int  idx;      /* index WORD du record                 */
  unsigned int *src;      /* edx : aaTable[4*idx]                 */
  unsigned int *dstv;     /* ecx : scratch dans a1                */
  unsigned int *rec;      /* edi : curseur record, stride 0x18    */
  unsigned int *pkt;      /* esi : packet OT, stride 0x24         */
  unsigned int **cursor;  /* [a1+0x10]                            */

  cursor = *(unsigned int ***)(a1 + 0x10);
  count  = *cursor;                                     /* 6a5dba */
  rec    = cursor + 1;                                  /* 6a5dbc lea edi,[ecx+4] */
  *(unsigned int ***)(a1 + 0x10) = rec;                 /* 6a5dc2 */

  pkt = dword_2517A24;                                  /* 6a5dc5 */

  if (count == 0)                                       /* 6a5dcd jz loc_6A5EF9 */
  {
    *(unsigned int ***)(a1 + 0x10) = rec;               /* 6a5ef9 */
    dword_2517A24 = pkt;                                /* 6a5efc */
    return (int)count - 1;             /* eax = 0xFFFFFFFF : pas de boucle */
  }

  i = count;                                           /* 6a5dd3 inc eax / dd5 */
  do
  {
    vtxBase = *(unsigned int *)(a1 + 4);               /* 6a5dd9 */

    /* -- Copie 4 vertices de 12 o (3 dwords) depuis [a1+4] + 4*wordIdx ------
     * offset source = 4*wordIdx (PAS 12*wordIdx) — cf hexrays.c l.27 `4 *`,
     * confirmé ASM @0x6a5de3 lea ecx,[eax+edx*4]. */
    idx = *(unsigned short *)((char *)rec + 4);        /* 6a5dde mov dx,[edi+4] */
    src = (unsigned int *)(vtxBase + idx * 4);         /* 6a5de3 */
    dstv = (unsigned int *)(a1 + 0x18);                /* 6a5de8 lea ecx,[ebp+18h] */
    dstv[0] = src[0];                                  /* 6a5deb/6a5ded */
    dstv[1] = src[1];                                  /* 6a5def/6a5df2 */
    dstv[2] = src[2];                                  /* 6a5df5/6a5df8 */

    idx = *(unsigned short *)((char *)rec + 6);        /* 6a5dfd mov cx,[edi+6] */
    src = (unsigned int *)(vtxBase + idx * 4);         /* 6a5e01 */
    dstv = (unsigned int *)(a1 + 0x24);                /* 6a5e04 */
    dstv[0] = src[0];                                  /* 6a5e07.. */
    dstv[1] = src[1];
    dstv[2] = src[2];

    idx = *(unsigned short *)((char *)rec + 8);        /* 6a5e19 mov cx,[edi+8] */
    src = (unsigned int *)(vtxBase + idx * 4);         /* 6a5e1d */
    dstv = (unsigned int *)(a1 + 0x30);                /* 6a5e20 */
    dstv[0] = src[0];
    dstv[1] = src[1];
    dstv[2] = src[2];

    idx = *(unsigned short *)((char *)rec + 0xA);      /* 6a5e35 mov cx,[edi+0Ah] */
    src = (unsigned int *)(vtxBase + idx * 4);         /* 6a5e39 */
    dstv = (unsigned int *)(a1 + 0x3C);                /* 6a5e3c lea eax,[ebp+3Ch] */
    dstv[0] = src[0];                                  /* 6a5e3f.. */
    dstv[1] = src[1];
    dstv[2] = src[2];                                  /* 6a5e49/6a5e4c */

    /* -- Pré-remplit pkt[+8/0x10/0x18/0x20] avec le 2e dword de chaque vertex
     *    scratch (a1+0x1C / 0x28 / 0x34 / 0x40) ---- */
    *(unsigned int *)((char *)pkt + 0x08) = *(unsigned int *)(a1 + 0x1C); /* 6a5e4f/52 */
    *(unsigned int *)((char *)pkt + 0x10) = *(unsigned int *)(a1 + 0x28); /* 6a5e55/58 */
    *(unsigned int *)((char *)pkt + 0x18) = *(unsigned int *)(a1 + 0x34); /* 6a5e5b/5e */
    *(unsigned int *)((char *)pkt + 0x20) = *(unsigned int *)(a1 + 0x40); /* 6a5e61/64 */

    /* -- 4 passes GTE ----
     * StorePtr sur rec+0x00 / rec+0x0C / rec+0x10 / rec+0x14 ;
     * exec = sub_45F270 ; GetToPtr vers pkt+0x04 / 0x0C / 0x14 / 0x1C. */
    GteState_StorePtr_1CA8A28(rec);                    /* 6a5e67 (arg poussé tôt @6a5de2) */
    sub_45F270();                                      /* 6a5e6c */
    GteState_GetToPtr_1CA8A68((char *)pkt + 0x04);     /* 6a5e74 (6a5e71 lea ecx,[esi+4]) */

    GteState_StorePtr_1CA8A28((char *)rec + 0x0C);     /* 6a5e7d push edx (edi+0Ch) */
    sub_45F270();                                      /* 6a5e83 */
    GteState_GetToPtr_1CA8A68((char *)pkt + 0x0C);     /* 6a5e8b (esi+0Ch) */

    GteState_StorePtr_1CA8A28((char *)rec + 0x10);     /* 6a5e94 (edi+10h) */
    sub_45F270();                                      /* 6a5e9a */
    GteState_GetToPtr_1CA8A68((char *)pkt + 0x14);     /* 6a5ea2 (esi+14h) */

    GteState_StorePtr_1CA8A28((char *)rec + 0x14);     /* 6a5eab (edi+14h) */
    sub_45F270();                                      /* 6a5eb1 */
    GteState_GetToPtr_1CA8A68((char *)pkt + 0x1C);     /* 6a5eb9 (esi+1Ch) */

    /* -- Tag ---- */
    *(unsigned int *)pkt = 0x08000000;                          /* 6a5ebf */
    *((unsigned char *)pkt + 7) = 0x3A;                         /* 6a5ec5 (58 en hexrays) */

    /* -- Link OT : args cdecl poussés droite->gauche : pkt @0x6a5ecc (2e arg),
     *    ot=[a1+0x14] @0x6a5ecd (1er arg) ==> appel (ot, pkt). */
    OtNode24_PoolAllocLink_Code1(*(void **)(a1 + 0x14), pkt);          /* 6a5ece */
    /* add esp, 0x28 @0x6a5ed7 : nettoyage en bloc des 10 pushes d'args */

    /* -- Curseurs ---- */
    pkt = (unsigned int *)((char *)pkt + 0x24);        /* 6a5eda add esi,24h */
    rec = (unsigned int *)((char *)rec + 0x18);        /* 6a5edd add edi,18h */
    i = i - 1;                                         /* 6a5ee0 dec eax */
  } while (i != 0);                                    /* 6a5ee5 jnz loc_6A5DD9 */

  *(unsigned int ***)(a1 + 0x10) = rec;                /* 6a5eeb */
  dword_2517A24 = pkt;                                 /* 6a5eee */
  return 0;                                            /* eax = 0 (dec finale) */
}

/* ============================================================================
 * UNCERTAIN 0x6a5de3 : offset sommet = 4*wordIdx au lieu de 12*wordIdx
 *   — index pré-multiplié (dwords) ou table chevauchante. Confirmé par ASM
 *   ET Hex-Rays (l.27), mais la raison sémantique reste à trancher.
 * UNCERTAIN 0x6a5ec5 : sens exact du tag byte 0x3A (jumeaux 0x6A5C90=0x32,
 *   0x6A5AD0=0x2E — famille de packets liés au même pool d'OT).
 * UNCERTAIN 0x6a5dd9 : le dword rec+0x00 au début de chaque record reste
 *   non lu dans la boucle (rôle inconnu — padding ? identifiant ?).
 * UNCERTAIN 0x6a5e67 : sémantique précise de la triple
 *   GteState_StorePtr_1CA8A28 / sub_45F270 / GteState_GetToPtr_1CA8A68
 *   (transformation GTE ?) — hors périmètre C-R, à traiter sémantiquement.
 * ==========================================================================*/
```

## Analyse semantique

# Sémantique sub_6A5DB0 @ 0x6A5DB0 (réconciliation R)

- Rôle (1 phrase) : builder du pipeline magic FX (famille des 4 émetteurs jumeaux appelés par `sub_6A5700`) qui transforme un flux de records 0x18 en nodes OT de 0x24 octets — 4 copies de sommets projetés + 4 passes GTE par record — puis les lie à l'OT via `OtNode24_PoolAllocLink_Code1`, avec le tag discriminant `byte[+7] = 0x3A`.
- Verdict : **LIKELY consolidé** (c_b absent du pack — duel portant sur le nom uniquement ; convergence A/Hex-Rays/ASM totale, caller + callees + jumeaux + catalogue alignés, mais aucune entrée wiki directe pour 0x6A5DB0).
- Confiance : LIKELY
- Nom catalogue : `sub_6A5DB0` (non nommé) — trop pauvre. Proposition (markdown seul, pas de rename) : **`MagFx_EmitStream_Code3A_Gte_Ot`** — calqué sur le nom wiki du jumeau structurellement identique `0x6A5C90 = MagFx_EmitStream_Code32_Gte_Ot` (decomp-function-catalog.md l.33), le suffixe Code3A portant le tag `0x3A`.

## In / Out / Effets

**In** (1 arg cdecl ; type IDA `int __cdecl(int)` approximatif — l'arg est un pointeur de contexte `a1`, base `ebp` @0x6a5db1) :
- `a1+0x04` : base de la table de sommets projetés (`dword_25102C8+0xEE0` côté caller, stride 0xC/vertex, cf. preuve 8) ; adressée à `base + 4*wordIdx` (offset en unités de dwords), 12 octets (3 dwords) copiés par index.
- `a1+0x10` : pointeur de flux, IN/OUT. Layout : `[dword count][N records de 0x18]`. Record : dword `+0x00` jamais lu ; words `+4/+6/+8/+0xA` = 4 index table ; dwords `+0xC/+0x10/+0x14` = buffers d'entrée des passes GTE 2–4 (le buffer de la passe 1 = record+0x00 lui-même).
- `a1+0x14` : tête d'OT (`g_BattleOTBase + arg*4` côté caller @0x6a5899–0x6a58a1), 1er arg de `OtNode24_PoolAllocLink_Code1`.
- `a1+0x18/0x24/0x30/0x3C` : scratch, 4 quads de 12 octets (3 dwords) remplis depuis la table.
- Global `dword_2517A24` (`_DWORD *`, 0x2517A24) : curseur bump-allocator du pool de packets, IN/OUT — le caller l'avance aussi de 8 de part et d'autre (@0x6a58a4, @0x6a58f8) pour des packets terminateurs `OtNode24_PoolAllocLink`.

**Out** :
- Retour 32 bits (EAX seul) : `0` si ≥1 node émis (dernier `dec eax` @0x6a5ee0 → 0), `0xFFFFFFFF` si count nul (`dec eax` @0x6a5dc1 sur EAX=0, `jz` @0x6a5dcd pris, EAX intact jusqu'au `retn` @0x6a5f05). **Jamais testé par l'unique caller** (0x6a58f3 → 0x6a58f8 enchaîne sans lecture d'EAX).

**Effets** — par record :
1. Copie de 4 sommets de 12 o depuis `[a1+4] + 4*idx` vers le scratch `a1+0x18/0x24/0x30/0x3C` (0x6a5dde–0x6a5e4c) ; seul le dword du milieu de chaque triplet (a1+0x1C/0x28/0x34/0x40) est ensuite transféré au packet.
2. Pré-écriture de 4 dwords du node : `pkt+8/0x10/0x18/0x20` (dwords d'indice +2/+4/+6/+8) depuis a1+0x1C/0x28/0x34/0x40 (0x6a5e4f–0x6a5e64).
3. 4 passes GTE strictement séquentielles : `GteState_StorePtr_1CA8A28(rec+0x00/0x0C/0x10/0x14)` → `sub_45F270()` → `GteState_GetToPtr_1CA8A68(pkt+0x04/0x0C/0x14/0x1C)` (0x6a5e67–0x6a5eba) — sources = dwords 0/3/4/5 du record, sorties = dwords 1/3/5/7 du node.
4. Tag : `dword[pkt+0] = 0x08000000` @0x6a5ebf, `byte[pkt+7] = 0x3A` @0x6a5ec5. **Aucun code ptr `sub_808080` écrit @+4** (contrairement aux jumeaux 0x6A5950 @0x6a5a75 et 0x6A5AD0 @0x6a5c31) — `pkt+4` porte ici la sortie GTE 1.
5. `OtNode24_PoolAllocLink_Code1(ot=[a1+0x14], pkt)` @0x6a5ece (pushes droite→gauche : esi @0x6a5ecc, [ebp+14h]→edx @0x6a5ecd) ; callee CERTAIN (catalogue l.547 `0x45C8E0 OtNode24_PoolAllocLink_Code1 … CERTAIN`) ; pose `word[node+0x14]=1` (annotation E3b callees.txt).
6. Curseurs : `pkt += 0x24` @0x6a5eda, `rec += 0x18` @0x6a5edd, `dec`/`jnz` @0x6a5ee0/0x6a5ee5. En sortie (2 chemins) : `[a1+0x10] = rec` (@0x6a5eeb / @0x6a5ef9) et `dword_2517A24 = pkt` (@0x6a5eef / @0x6a5efc).
7. Cleanup pile : `add esp, 0x28` @0x6a5ed7 = 10 pushes d'args cdecl accumulés (8 GTE + 2 OT) ; le 1er arg GTE (edi=rec) est poussé TÔT @0x6a5de2.

## Divergences A/ASM tranchées (A vs ASM, tranché + preuve adresée)

1. **EA du store curseur global chemin boucle** — A citait « @6a5ef0 » ; tranché **ASM** : l'instruction est `6a5eef mov dword_2517A24, esi` (0x6a5eee = `pop ebx`). Sémantique inchangée.
2. **Ordre des pushes OT** — A (preuve 6) écrivait « 6a5ecc push [ebp+14h]; 6a5ecd push esi » ; tranché **ASM** : `6a5ec9 mov edx,[ebp+14h]` / `6a5ecc push esi` / `6a5ecd push edx`. Ordre réel = pkt puis ot, args cdecl `(ot, pkt)` — conclusion A correcte, EAs permutés.
3. **« Valeurs lues sur 12 octets, dword du milieu consommé »** (section In de A) — tranché **ASM** : les 3 dwords sont copiés vers le scratch (@0x6a5deb–0x6a5df8 etc.), seul le dword du milieu atteint le packet (@0x6a5e4f `mov eax,[ebp+1Ch]` → `[esi+8]`). Formulation A imprécise, sémantique finale identique dans sa section Effets.
4. **Template brief « code ptr sub_808080 @+4 »** — tranché **ASM contre le template** : aucun `mov dword ptr [esi+4], offset sub_808080` dans 0x6A5DB0 ; `pkt+4` est la destination `GteState_GetToPtr_1CA8A68` @0x6a5e71–0x6a5e75. `sub_808080` @+4 n'existe que chez les jumeaux 0x6A5950 (@0x6a5a75) et 0x6A5AD0 (@0x6a5c31).
5. **Offset sommet 4*wordIdx** — confirmé (non divergent) : `6a5de3 lea ecx,[eax+edx*4]` avec base `[ebp+4]` @0x6a5dd9, corroboré Hex-Rays l.27 (`4 *`). Interprétation retenue : index en unités de dwords (sommets projetés stride 0xC = 3 dwords, cf. preuve 8) — alignement vertex ⇒ idx multiple de 3 ; laissé en question ouverte faute de producteur du flux dans le périmètre.
6. **Retour 0 / 0xFFFFFFFF** — confirmé ASM : `6a5dc1 dec eax` + `6a5dcd jz` (chemin -1), `6a5ee0 dec` final → 0 (chemin 0) ; nouvel élément : non-testé par le caller (0x6a58f3→0x6a58f8).
7. **word[+0x14]=1 par l'allocateur** — non visible dans cet ASM (fait callee) ; tranché **callee** : annotation E3b callees.txt + wiki catalogue (0x45C8E0 CERTAIN).

Aucune divergence sémantique A/ASM subsistante ; Hex-Rays (vérificateur) confirme les 7 points de reconcile_notes.md sans écart.

## Preuves (ASM cité)

1. **Boucle sur count du flux** : `6a5db7 mov ecx,[ebp+10h]` / `6a5dba mov eax,[ecx]` (count) / `6a5dcd jz loc_6A5EF9` / `6a5edd add edi,18h` (stride record 0x18) / `6a5ee0 dec eax` + `6a5ee5 jnz loc_6A5DD9`.
2. **Tag discriminant 0x3A** : `6a5ebf mov dword ptr [esi],8000000h` + `6a5ec5 mov byte ptr [esi+7],3Ah` — vs jumeaux 0x32 (`6a5d6c`, dword `6000000h` @0x6a5d66), 0x2E (`6a5c41`, dword `9000000h` @0x6a5c3b), 0x26 (`6a5a85`, dword `7000000h` @0x6a5a7f) : couple (header, tag) unique du variant.
3. **4 passes GTE** : `6a5de2 push edi` (arg StorePtr#1 différé) puis `6a5e7a/6a5e91/6a5ea8` (`lea` edi+0Ch/10h/14h + push) → `call sub_45F270` ×4 (0x6a5e6c/0x6a5e83/0x6a5e9a/0x6a5eb1) → `GteState_GetToPtr_1CA8A68` vers `esi+4/0Ch/14h/1Ch` (0x6a5e71/0x6a5e88/0x6a5e9f/0x6a5eb6) ; cleanup bloc `6a5ed7 add esp,28h` (10 pushes cdecl).
4. **Résolution table par index dword-granulaire** : `6a5dd9 mov eax,[ebp+4]` (base) ; `6a5dde mov dx,[edi+4]`, `6a5dfd mov cx,[edi+6]`, `6a5e19 mov cx,[edi+8]`, `6a5e35 mov cx,[edi+0Ah]` ; `6a5de3 lea ecx,[eax+edx*4]` (offset 4*idx) ; copies 3 dwords vers `ebp+18h/24h/30h/3Ch` (0x6a5de8/0x6a5e04/0x6a5e20/0x6a5e3c).
5. **Pré-écriture dwords node +8/0x10/0x18/0x20** : `6a5e4f mov eax,[ebp+1Ch]; 6a5e52 mov [esi+8],eax` … `6a5e61 mov eax,[ebp+40h]; 6a5e64 mov [esi+20h],eax` — dword du milieu de chaque quad scratch.
6. **Link OT** : `6a5ec9 mov edx,[ebp+14h]` / `6a5ecc push esi` / `6a5ecd push edx` / `6a5ece call OtNode24_PoolAllocLink_Code1` — callee CERTAIN (catalogue l.547) ; curseur pool `6a5dc5 mov esi,dword_2517A24` / `6a5eda add esi,24h` / `6a5eef mov dword_2517A24,esi`.
7. **Caller unique + séquence famille** : callers.txt (seul xref 0x6a58f3, `sub_6A5700` size 0x249) ; live IDA : `6a58ed call sub_6A5C90` → `6a58f3 call sub_6A5DB0` → `6a592c call sub_6A5950` → `6a5932 call sub_6A5AD0`, encadrés par packets terminateurs (`6a58bc mov dword ptr [eax+4],0E1000220h`, `6a5910 …0E1000240h`, via `OtNode24_PoolAllocLink`) ; retour de 0x6A5DB0 non testé (0x6a58f8 enchaîne sur `mov ecx,dword_2517A24`).
8. **Table = sommets projetés stride 0xC** : caller `6a5882 add ecx,0EE0h` / `6a588f mov [esi+4],ecx` (base = `dword_25102C8+0xEE0`) ; boucle de projection `6a5746–6a585d` écrit words `[esi]/[esi+2]/[esi+4]/[esi+6]` + byte flags `[esi+8]`, `6a5852 add esi,0Ch` — 12 o/vertex, cohérent avec une copie de 12 o à `base+4*idx`.

## Checks §5.6

- Callees cités (`GteState_StorePtr_1CA8A28`, `sub_45F270`, `GteState_GetToPtr_1CA8A68`, `OtNode24_PoolAllocLink_Code1`) : tous présents dans callees.txt ✓
- Caller `sub_6A5700 @ 0x6a58f3` : présent dans callers.txt ✓
- Strides en nombres : record `0x18`, node `0x24`, table `4*idx`, dwords node `+8/+0x10/+0x18/+0x20`, cleanup `0x28` ✓
- Polarités : aucune branche signée dans 0x6A5DB0 (`jz`/`jnz` + `dec` uniquement) ; `sub_45F270` contient des `jge/jle` signés internes mais hors périmètre ✓
- Largeur retour : EAX 32 bits seul, valeurs `0`/`0xFFFFFFFF` ✓ ; non testé par l'unique caller (preuve 7) ✓
- Nom ≥2 preuves ASM indépendantes adresées : tag `0x3A` @0x6a5ec5 (+ header `0x08000000` @0x6a5ebf, uniques dans la famille) et 4 passes GTE → OT @0x6a5e67–0x6a5ece ✓ ; convention alignée sur le jumeau catalogué `MagFx_EmitStream_Code32_Gte_Ot` (0x6A5C90) ✓
- VIT_0_STATUS_MASK leurre : imm32 `0x01000000` écrit @0x6a58b6/@0x6a5909 par le CALLER dans ses packets terminateurs — aucun rapport avec ce builder ; non utilisé ici ✓
- Anomalie notée (non bloquante) : `6a5db1 mov ebp,[esp+4+arg_0]` écrase ebp sans sauvegarde (ebp non callee-saved ici) — reproduit tel quel dans c_reconciled.c, masqué par Hex-Rays ✓

## Questions ouvertes (non bloquantes)

- Producteur du flux `[a1+0x10]` : le caller ne pose que le curseur (`6a58e6 lea edx,[eax+ecx+10h]` où eax=[esi]) ; l'écrivain des records 0x18 est hors périmètre — à identifier pour clore l'UNCERTAIN 4*idx (idx ≡ 0 mod 3 si alignement vertex).
- Sens exact du tag `0x3A` et du header `0x08000000` : dispatch render (le walker `460d3f cmp eax, offset sub_808080` compare des code ptr de nodes, mais ce variant n'en porte pas @+4) — chemin de rendu consommateur à identifier.
- Sémantique fine de `sub_45F270` (0x247 instr, FPU + clamp 0x7FFF/0x8000 sur 3 composantes + `dword_1CA92F8` flags clip) : transformation GTE de projection, hors périmètre R.
- Rôle du dword `rec+0x00` (buffer StorePtr passe 1 ET dword jamais relu) et des dwords non consommés des triplets table.

## IDBCOMMENT

Builder de packets OT magic FX, unique caller sub_6A5700 (sequence 6A5C90/6A5DB0/6A5950/6A5AD0). Lit le flux [a1+10h] = [dword count][records 18h], copie 4 sommets de 12 o depuis la table [a1+4] a base+idx*4, execute 4 passes GTE (StorePtr_1CA8A28 / sub_45F270 / GetToPtr_1CA8A68) puis ecrit un node de 24h octets (dword 08000000h, byte +7 = 3Ah) lie par OtNode24_PoolAllocLink_Code1 sur l'OT [a1+14h]. Curseur dword_2517A24 avance de 24h par node, curseur flux de 18h par record, retour EAX = 0 si emis, 0FFFFFFFFh si count nul, jamais teste par le caller. Tag 3Ah distingue ce variant des jumeaux 0x6A5C90 (32h), 0x6A5AD0 (2Eh) et 0x6A5950 (26h). [semantic-triple 2026-09-22]

## Notes C-R

# reconcile_notes.md — 0x6A5DB0

Ground truth = live ASM (asm.asm, 119 instr, taille 342 o). Hex-Rays = vérificateur.
**c_b.c ABSENT du pack** : la réconciliation oppose c_a.c à Hex-Rays, tranchées contre l'ASM.

## Verdict global
c_a.c est structuralement conforme à l'ASM sur les 7 points à trancher. Hex-Rays confirme toutes les décisions sans divergence sémantique. Aucune correction de fond nécessaire sur c_a ; c_reconciled.c = c_a réécrit avec mentions d'adresses exactes et annotations renforcées.

## Points tranchés (1 ligne chacun)

1. **Count / index WORD** — Tranché A (=Hex-Rays) : count dword lu à `[a1+0x10]` @0x6a5db7/0x6a5dba (`mov ecx,[ebp+10h]; mov eax,[ecx]`), curseur avancé de 4 (`lea edi,[ecx+4]` @0x6a5dbc, stocké @0x6a5dc2). Indexes WORD à rec+4/6/8/0xA : `mov dx,[edi+4]` @0x6a5dde, `mov cx,[edi+6]` @0x6a5dfd, `mov cx,[edi+8]` @0x6a5e19, `mov cx,[edi+0Ah]` @0x6a5e35 (lecture 16 bits, zéro-extension par la constante en haut de registre 32 bits).
2. **Copie vertices** — Tranché A : offset source = `4 * wordIdx` — `lea ecx,[eax+edx*4]` @0x6a5de3/0x6a5e01/0x6a5e1d/0x6a5e39 où eax=`[a1+4]` @0x6a5dd9 (rechargé à CHAQUE itération, pas hoisté hors boucle). Destinations exactes : `lea ecx,[ebp+18h]` @0x6a5de8, `lea ecx,[ebp+24h]` @0x6a5e04, `lea ecx,[ebp+30h]` @0x6a5e20, `lea eax,[ebp+3Ch]` @0x6a5e3c. Copie 3 dwords par vertex (12 o).
3. **4 passes GTE** — Tranché A : StorePtr sur rec+0x00 (arg poussé TÔT @0x6a5de2 bien avant l'appel @0x6a5e67 — signature de la fenêtre cdecl accumulée), rec+0x0C (@0x6a5e7a/0x6a5e7d), rec+0x10 (@0x6a5e91/0x6a5e94), rec+0x14 (@0x6a5ea8/0x6a5eab) ; chaque StorePtr → `call sub_45F270` (@0x6a5e6c/0x6a5e83/0x6a5e9a/0x6a5eb1) → GetToPtr vers pkt+0x04 (@0x6a5e71/0x6a5e74, esi+4), pkt+0x0C (@0x6a5e88/0x6a5e8b), pkt+0x14 (@0x6a5e9f/0x6a5ea2), pkt+0x1C (@0x6a5eb6/0x6a5eb9). Ordre strict StorePtr→exec→GetToPtr, 4 fois, sans entrelacement.
4. **Tag** — Tranché A : `mov dword ptr [esi], 8000000h` @0x6a5ebf (0x08000000), `mov byte ptr [esi+7], 3Ah` @0x6a5ec5. Hex-Rays `*((_BYTE*)v6+7) = 58` = même octet 0x3A.
5. **Link OT** — Tranché A : `mov edx,[ebp+14h]` @0x6a5ec9 (ot = [a1+0x14]), `push esi` @0x6a5ecc (pkt, 2e arg), `push edx` @0x6a5ecd (ot, 1er arg) → `call OtNode24_PoolAllocLink_Code1` @0x6a5ece. Pushes droite→gauche = `(ot, pkt)`. Cleanup `add esp, 0x28h` @0x6a5ed7 couvre les 10 pushes d'args (8 GTE + 2 OT) — les 4 premiers StorePtr/GetToPtr args et les 2 OT sont accumulés, pas nettoyés call par call.
6. **Curseurs** — Tranché A : `add esi,24h` @0x6a5eda (pkt += 0x24), `add edi,18h` @0x6a5edd (rec += 0x18), puis `dec eax` @0x6a5ee0 et `mov [esp+10h+arg_0],eax` @0x6a5ee1 avant `jnz loc_6A5DD9` @0x6a5ee5. Ordre pkt/rec/dec sans importance sémantique mais séquence ASM = pkt → rec → dec.
7. **Retour** — Tranché A : EAX=0 si boucle exécutée (le compteur i finit à 0 via `dec` @0x6a5ee0, eax porte cette valeur en sortie), 0xFFFFFFFF si count==0 (eax = `dec` de 0 = -1 @0x6a5dc1, branche @0x6a5dcd court avant le `inc eax` @0x6a5dd3). Note : `[a1+0x10]` est ré-stocker à rec dans les DEUX chemins de sortie (@0x6a5eeb boucle, @0x6a5ef9 count==0) ; dword_2517A24 ré-écrit avec la valeur finale du curseur pkt (@0x6a5eee / @0x6a5efc).

## Divergences vs Hex-Rays

Aucune divergence sémantique. Points de représentation seulement :
- Hex-Rays masque le détail des pushes GTE précoces (arg StorePtr#1 poussé @0x6a5de2, avant la boucle de copies) et le cleanup bloc `add esp,28h` — rendu explicitement dans c_reconciled.
- Hex-Rays `v6 += 9` / `v3 += 6` = pkt +0x24 / rec +0x18 : équivalent aligné dword, noté.
- Hex-Rays hoiste implicitement `v7 = *(_DWORD*)(a1+4)` DANS la boucle (l.26) — conforme à l'ASM (@0x6a5dd9 rechargé chaque itération).
- Condition de sortie : Hex-Rays `result = --v12` en fin d'itération ; ASM fait dec @0x6a5ee0 + jnz @0x6a5ee5 de façon équivalente.
-ebp écrasé avec a1 sans sauvegarde (@0x6a5db1) — anormal pour un callee cdecl, copié tel quel, commenté.

## UNCERTAIN restants

- UNCERTAIN 0x6a5de3 — offset sommet = 4*wordIdx (et non 12*wordIdx) : confirmé par l'ASM et Hex-Rays, mais la sémantique (index pré-multiplié en dwords ? table chevauchante ?) reste à trancher.
- UNCERTAIN 0x6a5ec5 — sens exact du tag octet 0x3A ; jumeaux connus 0x6A5C90 utilise 0x32, 0x6A5AD0 utilise 0x2E (famille de packets OT).
- UNCERTAIN 0x6a5dd9 — dword rec+0x00..0x03 jamais lu dans la boucle (rôle inconnu).
- UNCERTAIN 0x6a5e67 — sémantique fine de la double GteState_StorePtr_1CA8A28/sub_45F270/GteState_GetToPtr_1CA8A68 (transformation GTE appliquée : rotation ? perspective ?) hors périmètre C-R.
- UNCERTAIN c_b.c — deuxième voix absente : toute convergence A/B reste inférée de Hex-Rays seul.
