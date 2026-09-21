# MagFx_StreamEmitBatch_OtNode24_Code1 @ 0x6A5950

- Instr (live): 135 (384 o, 0x6A5950-0x6A5ACF)
- Palier: 2+1
- Verdict: LIKELY - sous-builder Maelstrom (caller unique sub_6A5700 @0x6a592c) : lit le count pointé par *(a1+0x10) (curseur avancé +4 @0x6A595C AVANT test/jle ; 0xFFFFFFFF si nul via dec @0x6A5961), records stride 0x14, 3 indices u16 (rec+4/6/8) dans table *(a1+4) stride 4, copie 3x3 dwords vers a1+0x18/0x24/0x30 ; gate : emit si b[20h] & (b[2Ch] & b[38h]) == 0 (jnz skip @0x6A59FC) ; node OT stride 0x20 dans pool dword_2517A24 (magic 0x7000000 @+0 @0x6A5A75-zone, code ptr sub_808080 @+4 @0x6A5A75, tag 0x26 @+7, flags WORD @+16 sar 6/or 40h/shl 2/sar 4, masque couleur movsx(b[1Ch]).lo8 & C0 soustrait R/G/B 8 bits), avance emit seule @0x6A5A95 ; OtNode24_PoolAllocLink_Code1(pool=*(a1+14h), node) @0x6A5A8D add esp,8 ; retour EAX = 0 en sortie de boucle (dec @0x6A5AA3), 0xFFFFFFFF si count nul, proto int __cdecl menteur
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A5950\nTYPE ; proposition: MagFx_StreamEmitBatch_OtNode24_Code1
- Notes parent: checks 5.6 OK : dec @0x6a5961 avant test (0xFFFFFFFF si nul), gate b[20h]&(b[2Ch]&b[38h])==0 + jnz (0x6A59E9-FC), code ptr sub_808080 @+4 (0x6A5A75), PoolAllocLink_Code1 (0x6A5A8D), avance emit @0x6A5A95, eax=var_4 (0x6A5A9C), dec final (0x6A5AA3), meta SIZE=384 (pas 1316 — erreur du paquet), caller sub_6A5700 @0x6a592c (callers.txt) ; B inversait pool/node (ASM gagne)

## C reconcilie

```c
// ============================================================================
// c_reconciled.c — sub_6A5950 (fragments mag FX / Maelstrom builder sous-bloc)
// Cellule : tools/_tmp_semantic_triple/0x6a5950/
// ============================================================================
// Métadonnées :
//   Instr (live)  : 135 (asm.asm, GROUND TRUTH), 1316 octets ? NON —
//                   384 octets (0x6A5950..0x6A5ACF), meta.json SIZE 384.
//                   (Le prompt « 1316 o » est une erreur de paquet ; ASM gagne.)
//   Palier        : triple 2+1 (c_a aveugle + voix B = semantic_b.md, pas de
//                   c_b.c dans le pack)
//   Prototype IDA : int __cdecl sub_6A5950(int)
//   Sauvegardes de registres : push ecx @6a5950 (slot réutilisé comme local
//                   `cur` @6a596d/6a5986), push esi @6a5951, push edi @6a5956 ;
//                   ebx/ebp poussés dans la branche boucle (@6a5977/6a5979).
//   Caller unique : sub_6A5700 via 0x6a592c (callers.txt).
//   Callee unique : OtNode24_PoolAllocLink_Code1 @6a5a8d, add esp,8 @6a5a92
//                   → cdecl, 2 args. Aucun autre call.
//   Globale       : dword_2517A24 (curseur d'écriture pool OT : lue @6a5965,
//                   réécrite @6a5ab8 / 6a5ac6).
//
// Préambule fidélité : ground truth = live ASM (asm.asm) + bytes, PAS Hex-Rays.
// Convention Intel + labels IDA. Retour : EAX 32 bits.
//   Chemin count==0     : EAX = 0xFFFFFFFF (dec eax @6a5961 précede test/jz).
//   Sortie de boucle    : EAX = 0 (dernier dec eax @6a5aa3 → 0, jnz non pris).
// Divergences tranchées contre ASM : voir reconcile_notes.md.
// ============================================================================

extern unsigned int *dword_2517A24;   // base curseur pool OT (globale, 0x2517A24)

// E3b : même pool OT / cap 0x60000 / +0x18 que OtNode24_PoolAllocLink ;
// word[+14]=1 ; pas de copie RGB. Retour EAX ignoré ici. 2 args, cdecl.
extern void OtNode24_PoolAllocLink_Code1(unsigned int *pool, unsigned int *node);

int __cdecl sub_6A5950(int a1)
{
    unsigned char *st  = (unsigned char *)a1;
    unsigned char *cur;        // curseur enregistrements (slot arg en ASM)
    unsigned int   count;
    unsigned int   remaining;  // [esp+14h+var_4]
    unsigned char *node;       // edi — node OT courante, stride 0x20

    // ---- bloc prologue 0x6a5950..0x6a5976 ----
    cur   = *(unsigned char **)(st + 0x10);               // 6a5957
    count = *(unsigned int *)cur;                          // 6a595a
    cur  += 4;                                             // 6a595c add ecx,4
    *(unsigned char **)(st + 0x10) = cur;                  // 6a5962 (rescrît @6a5ab5/6a5ac3)
    node = (unsigned char *)dword_2517A24;                 // 6a5965
    // 6a5961 dec eax AVANT test edx @6a596b → EAX = count-1 dès ici.
    if (count == 0)                                        // 6a596b / 6a596d jz
    {
        *(unsigned char **)(st + 0x10) = cur;              // 6a5ac3 (noté : valeur déjà stockée @6a5962)
        dword_2517A24 = (unsigned int *)node;              // 6a5ac6
        return -1;                                         // EAX = 0xFFFFFFFF (count-1)
    }
    remaining = count;                                     // 6a5978 inc eax (annule dec prologue)

    // ---- boucle 0x6a5986..0x6a5ab1, un node OT par enregistrement ----------
    do
    {
        unsigned int   tbl = *(unsigned int *)(st + 0x04); // base table, stride 4
        unsigned char *src1, *src2, *src3;
        unsigned char  mask;

        // ---- copie 1 : index u16 @ rec+0x04 (zext, 6a598d/6a598f) ----
        src1 = (unsigned char *)(tbl + (unsigned int)(*(unsigned short *)(cur + 4)) * 4);
        *(unsigned int *)(st + 0x18) = *(unsigned int *)(src1 + 0);   // 6a5998..9a
        *(unsigned int *)(st + 0x1C) = *(unsigned int *)(src1 + 4);   // 6a599c..9f
        *(unsigned int *)(st + 0x20) = *(unsigned int *)(src1 + 8);   // 6a59a6..a9

        // ---- copie 2 : index u16 @ rec+0x06 (0x6a59ac..cb) ----
        src2 = (unsigned char *)(tbl + (unsigned int)(*(unsigned short *)(cur + 6)) * 4);
        *(unsigned int *)(st + 0x24) = *(unsigned int *)(src2 + 0);   // 6a59ba..bc
        *(unsigned int *)(st + 0x28) = *(unsigned int *)(src2 + 4);   // 6a59be..c1
        *(unsigned int *)(st + 0x2C) = *(unsigned int *)(src2 + 8);   // 6a59c8..cb

        // ---- copie 3 : index u16 @ rec+0x08 (0x6a59ce..ef) ----
        src3 = (unsigned char *)(tbl + (unsigned int)(*(unsigned short *)(cur + 8)) * 4);
        *(unsigned int *)(st + 0x30) = *(unsigned int *)(src3 + 0);   // 6a59df..e1
        *(unsigned int *)(st + 0x34) = *(unsigned int *)(src3 + 4);   // 6a59e3..e6
        *(unsigned int *)(st + 0x38) = *(unsigned int *)(src3 + 8);   // 6a59ec..ef

        // ---- gate 0x6a59e9..0x6a59fc : émettre si et seulement si ----
        // b[0x20] & (b[0x2C] & b[0x38]) == 0.  jnz @6a5a9c → skip : la node
        // n'est PAS allouée ni avancée (add edi,0x20 @6a5a95 est dans la
        // branche emit seule). 0x2C/0x38 = octets bas des 3e dwords copiés.
        if ((st[0x20] & (st[0x2C] & st[0x38])) == 0)
        {
            // 6a5a3a movsx eax, word[esi+1Ch] — seul AL est consommé ensuite
            // (and al,0xC0). Soustractions DL-AL : wrap 8 bits (unsigned char).
            mask = (unsigned char)(st[0x1C] & 0xC0);           // 6a5a3e/6a5a40

            // ---- mot de flags node @+0x16 (WORD, 0x6a5a02..0x6a5a33) ----
            {
                unsigned int bits;
                // 6a5a02 mov cx,[esi+1Ch] (zext) ; 6a5a06 edx=[esi+8] ;
                // 6a5a0c add edx,ecx ; 6a5a1c sar edx,6 (ARITHMÉTIQUE) ;
                // 6a5a22 and edx,0Fh.
                // Les bits 16+ parasites d'ECX (bits hauts du 3e dword copié,
                // via mov ecx,[ecx+8] @6a59ec) sont neutralisés par & 0x0F :
                // lecture u16 propre, résultat bit à bit identique.
                bits  = ((*(int *)(st + 0x08)
                          + (int)(unsigned int)*(unsigned short *)(st + 0x1C)) >> 6) & 0x0Fu;
                // 6a5a09 eax=[esi+0Ch] ; 6a5a13 and ecx,200h ; 6a5a1f or ecx,40h
                // ; 6a5a25 shl ecx,2 (logique)
                bits |= ((*(unsigned int *)(st + 0x0C) & 0x200u) | 0x40u) << 2;
                // 6a5a28 sar eax,4 (ARITHMÉTIQUE, dword signé) ; 6a5a2d and 10h
                bits |= (unsigned int)((*(int *)(st + 0x0C) >> 4) & 0x10);
                *(unsigned short *)(node + 0x16) = (unsigned short)bits;   // 6a5a33
            }

            // ---- octets node (soustractions modulo 8 bits, masque 0xC0) ----
            *(unsigned char *)(node + 0x0C) = (unsigned char)(st[0x1C] - mask); // 6a5a37..42
            *(unsigned char *)(node + 0x0D) = st[0x1E];                          // 6a5a45..48
            *(unsigned char *)(node + 0x14) = (unsigned char)(st[0x28] - mask); // 6a5a4b..50
            *(unsigned char *)(node + 0x15) = st[0x2A];                          // 6a5a53..56
            *(unsigned char *)(node + 0x1C) = (unsigned char)(st[0x34] - mask); // 6a5a59..5e
            *(unsigned char *)(node + 0x1D) = st[0x36];                          // 6a5a61..64

            // ---- dwords node depuis les dwords 0 des 3 copies (ebp/ebx/eax) ----
            *(unsigned int *)(node + 0x08) = *(unsigned int *)(st + 0x18);  // 6a5a67..6a
            *(unsigned int *)(node + 0x10) = *(unsigned int *)(st + 0x24);  // 6a5a6d..6f
            *(unsigned int *)(node + 0x18) = *(unsigned int *)(st + 0x30);  // 6a5a72 / 6a5a7c

            *(unsigned int *)(node + 0x04) = 0x00808080u;  // 6a5a75 — offset sub_808080 :
                                                           // ptr de code stocké en DATA,
                                                           // PAS un call.
            *(unsigned int *)(node + 0x00) = 0x07000000u;  // 6a5a7f
            *(unsigned char *)(node + 0x07) = 0x26;        // 6a5a85

            // 6a5a32 push edi (arg2 node) ; 6a5a8c push ecx (arg1 pool) ;
            // ordre droite→gauche → arg1 = *(int*)(a1+0x14), arg2 = node.
            // add esp,8 @6a5a92 → cdecl. Stride node 0x20 (6a5a95), emit seul.
            OtNode24_PoolAllocLink_Code1(
                (unsigned int *)*(unsigned int *)(st + 0x14),
                (unsigned int *)node);
            node += 0x20;                                  // 6a5a95
        }

        cur += 0x14;                                       // 6a5aa0 — stride enregistrement 0x14
        // NB : *(a1+0x10) n'est PAS rescrît à chaque itération
        // (uniquement @6a5ab5 après la boucle). Slot pile arg_0/v4_confondus.
    } while (--remaining);                                 // 6a5aa3 dec / 6a5aac jnz loc_6A5986

    // ---- épilogue boucle 0x6a5ab2..0x6a5ac2 -------------------------------
    *(unsigned char **)(st + 0x10) = cur;                  // 6a5ab5 (edx=ecx @6a5ab2)
    dword_2517A24 = (unsigned int *)node;                  // 6a5ab8
    return 0;                                              // EAX = 0 (dernier dec eax @6a5aa3)
}

// ============================================================================
// UNCERTAIN restants :
//  1. UNCERTAIN 0x6A5A75 offset sub_808080 : ptr de code stocké en donnée
//     [node+4] — rôle exact du pointé (callback draw vs convertisseur tag),
//     hors périmètre de cette voix (pas d'accès IDA).
//  2. UNCERTAIN 0x6A5A8D sémantique 3×3 dwords des copies (points de quad vs
//     composantes couleur) — contenu non déductible de l'opcode.
//  3. UNCERTAIN 0x6A5AC3 signification fonctionnelle du retour 0xFFFFFFFF vs
//     les « retours 0/2 » évoqués dans le contexte famille — le caller
//     sub_6A5700 (test de valeur retour ?) est hors périmètre ; ASM montre
//     seulement EAX=0/-1 sur ces deux chemins.
// Divergences Hex-Rays : quasi nulle ici (comportement fidèle), détails de
// rendu traités dans reconcile_notes.md.
// ============================================================================
```

## Analyse semantique

# Sémantique sub_6A5950 @ 0x6A5950 (réconciliation R, triple 2+1)

- **Rôle (1 phrase)** : sous-émetteur du pack mag FX battle (caller unique sub_6A5700 @0x6a592c) qui parcourt un flux d'enregistrements packés pointé par `[obj+0x10]` (entête count dword, puis records stride 0x14, mots index u16 @+0x04/+0x06/+0x08), recharge pour chaque record 3 triplets de 12 octets dans obj+0x18/+0x24/+0x30 depuis une table à `[obj+0x04]` (stride 4), puis — si la gate d'occupation `(b[+0x20] & (b[+0x2C] & b[+0x38])) == 0` passe — construit un descripteur node OT de 0x20 octets dans la pool globable `dword_2517A24` (flags word @+0x16, triplets @+0x08/+0x10/+0x18, code ptr 0x00808080 @+0x04, magic 0x07000000 @+0x00, tag byte 0x26 @+0x07, teintes `b - (b[+0x1C] & 0xC0)` @+0x0C/+0x14/+0x1C) et le link via `OtNode24_PoolAllocLink_Code1([obj+0x14], node)`.
- **Verdict** : LIKELY consolidé (caller + callee + opcodes alignés ; wiki.md indisponible → CERTAIN inaccessible).
- **Confiance** : LIKELY
- **Nom catalogue** : `sub_6A5950` anonyme. Proposition markdown : **`MagFX_StreamEmitQuadDrawNodes`** — synthèse de A (`MagFx_StreamEmitBatch_OtNode24`) et B (`MagFX_MaelstromSubBuilder_EmitQuadDrawNodes`), retenue car le nom doit décrire la fonction elle-même, pas le caller : 1. émission de nodes OT 0x20 avec magic `0x7000000` @6a5a7f + `byte[edi+7]=0x26` @6a5a85 puis `add edi,20h` @6a5a95 (pattern émission paquet draw-list) ; 2. consommation effective d'un **stream** : curseur `[esi+10h]` lu @6a5957, head dword `[ecx]` @6a595a, `add ecx,4` @6a595c, records `add ecx,14h` @6a5aa0, réécritures @6a5962/6a5ab5/6a5ac3 — un "batch emitter", pas un builder de structure.

## In / Out / Effets

- **In** : `a1` (obj, stockedé esi @6a5952) : `+0x00` réservé ; `+0x04` = base table d'indices (stride 4) ; `+0x08` dword état (somme flags) ; `+0x0C` dword état (bits 0x200/0x40 et 0x10) ; `+0x10` = pointeur vers `{count dword ; records[]}` stream (cursor, stride record 0x14) ; `+0x14` = pool/contexte passé arg1 au callee ; `+0x18/+0x24/+0x30` buffers triplets 3×12B ; `+0x1C/+0x1E/+0x28/+0x2A/+0x34/+0x36` octets teinte/couleur ; `+0x20/+0x2C/+0x38` octets de gate (recyclés par les copies 1/2/3 avant le test).
- **Out** : nodes OT 0x20 écrites à `edi` (curseur `dword_2517A24`, lue @6a5965, réécrite @6a5ab8/6a5ac6) ; `[esi+10h]` avancé ; buffers `+0x18..+0x3B` écrasés à chaque itération.
- **Effets / largeur retour** : `retn` @6a5ac2/6a5acf sans `mov eax` — mais EAX est **défini**, pas résiduel : chemin count==0 → `dec eax` @6a5961 avant `test edx,edx` @6a596b/`jz` @6a5971 ⇒ **EAX = 0xFFFFFFFF** ; sortie boucle normale : dernier `dec eax` @6a5aa3 → **0**. Prototype `int __cdecl(int)` correct ; pas de pattern 0/2. Callee unique OtNode24_PoolAllocLink_Code1 (cdecl, `add esp,8` @6a5a92), 2 args droite→gauche : arg1 = `[esi+14h]` (push @6a5a8c), arg2 = node (push @6a5a32).

## Preuves ASM (5)

1. **Flux stream** : `mov ecx,[esi+10h]` @6a5957 / `mov eax,[ecx]` @6a595a / `add ecx,4` @6a595c / `mov [esi+10h],ecx` @6a5962 ; head count → boucle count itérations (`inc eax` @6a5978 ré-arme le decrement prologue, `dec eax` @6a5aa3 + `jnz` @6a5aac).
2. **Table + stride 4** : `mov eax,[esi+4] ; mov dx,[ecx+4] ; lea eax,[eax+edx*4]` @6a598a..95, copies 3 dwords vers `[esi+18h]` @6a5998..a9 ; idem indices `[ecx+6]` @6a59b1 → +0x24, `[ecx+8]` @6a59d3 → +0x30.
3. **Gate polarité** : `mov dl,[esi+2Ch]` @6a59e9 / `mov cl,[esi+38h]` @6a59f2 / `mov al,[esi+20h]` @6a59f5 / `and dl,cl` @6a59f8 / `test al,dl` @6a59fa / **`jnz loc_6A5A98`** @6a59fc → émission seulement si produit == 0 ; `add edi,20h` @6a5a95 est dans la branche emit (stride 0x20 emit-seulement).
4. **Header node** : `mov dword ptr [edi],7000000h` @6a5a7f, `mov byte ptr [edi+7],26h` @6a5a85, `mov dword ptr [edi+4],offset sub_808080` @6a5a75 (ptr code stocké en donnée, **pas** un call) ; flags word @6a5a33 : `sar edx,6` @6a5a1c + `and 0Fh` @6a5a22 | `and 200h ; or 40h ; shl 2` @6a5a13/1f/25 | `sar eax,4 ; and 10h` @6a5a28/2b (polarités sar/shl distinguées, 0x40 set inconditionnel).
5. **Allocation link** : `push edi` @6a5a32 + `mov ecx,[esi+14h] ; push ecx` @6a5a89/8c, `call OtNode24_PoolAllocLink_Code1` @6a5a8d, `add esp,8` @6a5a92 — cdecl 2 args, arg1=pool=[a1+0x14], arg2=node ; un seul callee (callees.txt), un seul caller sub_6A5700 @0x6a592c (callers.txt).

## Divergences A/B tranchées

| # | Point | A | B | Tranché |
|---|-------|---|---|---------|
| 1 | Espace retour | 0/0xFFFFFFFF (dec eax) | « EAX résiduel, prototype menteur » | **A** : `dec eax` @6a5961 puis test/jz @6a596b/71 fixe EAX=-1 sur count==0 ; dernier `dec eax` @6a5aa3→0 en sortie. V valeur entièrement définie, pas résiduelle. |
| 2 | OtNode24 args | `[obj+0x14]`=2e arg (ambigu) | ctx en « 2e arg », ambigu/prose inversée | **ASM** : ordre pushes @6a5a32 (node) / @6a5a8c (pool) → arg1=pool=`[a1+0x14]`, arg2=node. |
| 3 | Gate `sub_808080` | constant code/couleur « probable » | callback draw/render vs indéterminé | les deux partiellement fausses : c'est un **ptr de code stocké en DATA node+0x04** @6a5a75 (pas un call) ; rôle exact du pointé reste UNCERTAIN. |
| 4 | Champ `[+0x10]` | « stream cursor » avancé/in-place | « pointeur muté vers compteur » | **ASM** : pointeur vers la structure stream (count + records), cible avancée de 4 puis de count×0x14 ; ni compteur en place (B) ni pure valeur (A). |
| 5 | Flags | `[esi+8] sommé` (approx) | « dword[esi] » (faux) | **ASM** : `mov edx,[esi+8]` @6a5a06 + add word[esi+1Ch] @6a5a0c ; `sar edx,6 ; and 0Fh` @6a5a1c/22. |
| 6 | Nom | `MagFx_StreamEmitBatch_OtNode24` | `MagFX_MaelstromSubBuilder_EmitQuadDrawNodes` | synthèse : nom **fonctionnel** (elle émet des draw-nodes depuis un stream) ; point A, mais sans linking au catalogue E3b inférentiel. |

## Checks §5.6

- Callers/callees cités présents ✅ (callers.txt : 1 xref sub_6A5700 ; callees.txt : OtNode24_PoolAllocLink_Code1 @6a5a8d).
- Strides en nombres ✅ : head 4 (`add ecx,4` @6a595c), records `0x14` (@6a5aa0), nodes `0x20` (@6a5a95), table entries ×4 (@6a5995/6a59b5/6a59d7), slots buffers +0x18/+0x24/+0x30 espacés de 0x0C.
- Polarités ✅ : `jnz` @6a59fc = skip (émission sur ==0) ; 0x40 OR inconditionnel @6a5a1f ; `sar` vs `shl` distingués @6a5a1c/6a5a25/6a5a28.
- Largeur retour ✅ : EAX 0/0xFFFFFFFF (défini par dec, pas résiduel).
- Nom ✅ : ≥2 preuves indépendantes (émission nodes OT stride 0x20 @6a5a95, tags 7000000/26/808080 @6a5a7f/85/75 ; stream count+records @6a5957..6a5978).

## Questions ouvertes

1. Rôle fonctionnel du pointé `sub_808080` (callback draw vs convertisseur tag) — l'anchor « code ptr 0x00808080 cf. 0x6A2B80 » suggère un stub partagé ; à trancher par sondage IDA de la cible.
2. Contenu des 3 triplets (3 vertices / composantes / texcoords) — non déductible des opcodes.
3. Compatibilité du retour -1 avec les « retours 0/2 » évoqués côté famille (caller sub_6A5700 hors périmètre du pack).
4. `word[esi+1C] & 0xC0` : mask OT-split vs flag hauts — beneath threshold, à tester sur un run.

## IDBCOMMENT

Consome le stream pointe par obj+0x10 (count dword puis records de 0x14 octets, mots index +4/+6/+8) et recharge trois triplets de 12 octets de la table obj+0x04 (stride 4) vers obj+0x18/0x24/0x30. Si b+0x20 & (b+0x2C & b+0x38) == 0, construit une node OT de 0x20 octets dans dword_2517A24 : magic 0x07000000, tag 0x26, code ptr 0x00808080, flags +0x16 (sar6&0F | (200h|40h)<<2 | sar4&10h), teintes moins (b+0x1C & 0xC0). Lie la node au pool via OtNode24_PoolAllocLink_Code1(obj+0x14, node) et avance le curseur count*0x20. Retour : EAX = 0xFFFFFFFF (count nul) ou 0. Caller unique : sub_6A5700. [semantic-triple 2026-09-21]

## Notes C-R

# reconcile_notes.md — sub_6A5950 (triple 2+1)

Entrées : c_a.c (voix A aveugle), semantic_b.md (voix B, pas de c_b.c dans le pack), asm.asm
(ground truth, 135 instr, 0x6A5950..0x6A5ACF = 384 o), hexrays.c (vérificateur seulement).

## 1. Points tranchés contre l'ASM

1. **Flux curseur/compteur/indices** — Tranché conforme `c_a` + ASM.
   `mov ecx,[esi+10h]` @6a5957 : *(a1+0x10) est un PTV pointeur, pas un compteur
   en place ; `mov eax,[ecx]` @6a595a lit le count pointé ; `add ecx,4` @6a595c
   avance la cible ; la valeur avancée est stockée @6a5962 puis implicitement
   dans le slot pile arg_0 @6a596d. Table d'indices = `*(a1+4)`, base `mov eax,[esi+4]`
   @6a598a/6a59ac/6a59ce, base+idx*4 @6a5995/6a59b5/6a59d7, indices u16 zext
   `mov dx,[ecx+4]` @6a598f / `mov cx,[edx+6]` @6a59b1 / `mov cx,[edx+8]` @6a59d3 ;
   copies 3 dwords vers a1+0x18/0x24/0x30 @600..ef. Stride enregistrement 0x14
   (add ecx,14h @6a5aa0). La voix B (semantic_b.md §In, champ +0x10) décrit la
   même chose mais confond légèrement le rôle du compteur (« champ +10h
   contient un pointeur muté vers compteur ») — tranché : c'est bien un
   champ pointeur lissé; `[esp+14h+arg_0]` héberge le curseur avancé.

2. **Gate polarité** — Tranché : émission SI `b[0x20] & (b[0x2C] & b[0x38]) == 0`.
   Preuve : `jnz loc_6A5A98` @6a5a9c saute en CAS non-nul (skip). `add vedi,0x20`
   @6a5a95 est dans la branche emit ; l'index du node n'étant PAS poussé pour
   l'entry filtrée. Voix A et B convergent.

3. **Layout node OT** — Tranché conforme c_a :
   - flags WORD @+0x16 (6a5a33) : bits `(([esi+8] + zext_word[esi+1C]) >> 6)&0xF`
     (sar @6a5a1c, and 0Fh @6a5a22) | `((dword[esi+0C] & 0x200) | 0x40) << 2`
     (6a5a13/6a5a1f/6a5a25, shl logique) | `((int)word[esi+0C] >> 4) & 0x10`
     (sar @6a5a28). sar vs shl distingués.
   - couleur : `movsx eax, word[esi+1Ch]` @6a5a3a ; `and al,0xC0` @6a5a3e ;
     soustraction 8 bits `sub dl,al` — node +0x0C (b[0x1C]) @6a5a42,
     +0x14 (b[0x28]) @6a5a50, +0x1C (b[0x34]) @6a5a5e ; défauts copiés
     +0x0D/+0x15/+0x1D (b[0x1E]/b[0x2A]/b[0x36]).
   - header : `[edi+4] = 0x00808080` (offset sub_808080, ptr code en DATA,
     PAS un call — le prompt décrit « offset sub_808080 », tranché tel quel avc la
     cible exacte @6a5a75) ; `[edi+0] = 0x07000000` @6a5a7f ;
     `b[edi+7] = 0x26` @6a5a85.
   - dwords data : `[edi+8]` ← st+0x18 (6a5a67), `[edi+10h]` ← st+0x24 (6a5a6d),
     `[edi+18h]` ← st+0x30 (6a5a72/6a5a7c).

4. **OtNode24_PoolAllocLink_Code1** — Tranché : 2 args, cdecl (`add esp,8`
   @6a5a92), ordre pushes = argument dans le sens droite→gauche :
   push edi @6a5a32 (= node), push ecx @6a5a8c (= pool, `mov ecx,[esi+14h]`
   @6a5a89), call @6a5a8d → donc **arg1 = pool = *(a1+0x14)**, **arg2 = node**.
   La voix B inversait implicitement dans sa prose (« passed en 2e arg ») —
   ASM gagne. Hex-Rays confirme `OtNode24_PoolAllocLink_Code1(*(a1+20), v7)`.

5. **Retour EAX** — Tranché : `dec eax` @6a5961 precede `test edx,edx` @6a596b /
   `jz` @6a596d → chemin count==0 : EAX = 0xFFFFFFFF. Sortie de boucle :
   dernier `dec eax` @6a5aa3 amène EAX à 0 avant `jnz` non pris → EAX = 0.
   La voix B affirmait « retour EAX résiduel, pas `mov eax`,` pas de retour
   substantiel » : FAUX — la valeur est entièrement définie par le `dec eax`,
   pas résiduelle (provenance ` Test de l'ANALYSE`). `c_a` + prompt déjà bien ;
   Hex-Rays confirme (result = v3-1 = -1 sur ce chemin).

## 2. Divergences voix A vs voix B

| # | Point | A (c_a.c) | B (semantic_b.md) | Tranché (adresse) |
|---|-------|-----------|-------------------|-------------------|
| 1 | Retour EAX | 0 / 0xFFFFFFFF | « résiduel, prototype trompeur » | A — dec eax @6a5961 / 6a5aa3 fixes la valeur ; ASM suffit |
| 2 | OtNode24 args | pool=arg1, node=arg2 | « node donné en 2e arg », ambigu | A — ordre push @6a5a32/6a5a8c |
| 3 | Libellé flags | [esi+8] sommé | « dword[esi] » imprécis | A — `mov edx,[esi+8]` @6a5a06 |
| 4 | Node stride emit-seulement | oui (add edi,0x20 dans branche) | ambigu | A — jnz @6a5a9c bypass l'add @6a5a95 |
| 5 | Ressource `sub_808080` | ptr de code stocké en DATA (PAS un call) | « callback/ptr indéterminé » | A + warrant asm @6a5a75 (métadonnée) ; rôle du pointé reste UNCERTAIN |

## 3. UNCERTAIN restants

- UNCERTAIN <0x6A5A75> rôle fonctionnel du pointé sub_808080 (callback draw vs
  convertisseur) — hors périmètre de cette voix (pas d'accès IDA).
- UNCERTAIN <0x6A5965> sémantique 3×3 dwords des copies (points de quad vs
  composantes) — non déductible du flux d'opcodes, pas Harvard.
- UNCERTAIN <0x6A5AC3> signification fonctionnelle du retour 0xFFFFFFFF vs
  les « retours 0/2 » du contexte famille — pas de caller swl sub_5700 à consulter
  ici (hors périmètre) ; ASM montre seulement EAX=0/0xFFFFFFFF.

## 4. Divergences vs Hex-Rays (hexrays.c)

- Aucune divergence de comportement observable. Hex-Rays est fidèle ici :
  il matérialise le `dec eax` avant test (result = -1 sur chemin count==0),
  l'ordre args, le layout node et la gate.
- Détail de rendu non observable : Hex-Rays voie la somme flags via
  `LOWORD(v14) + *(a1+8)` avec bits hauts de v14 neutralisés par & 0x0F ;
  l'ASM EN porte les bits 16+ dans ECX (@6a5a02, `mov ecx,[ecx+8]` @6a59ec) mais
  le masque &0x0F après sar 6 les annule aussi — reconstruction bit à bit
  identique, voix A documentée en ce sens.
- `*(_WORD *)(a1+28) & 0xC0` (Hex-Rays) vs ASM `movsx(eax).lo8 & 0xC0` :
  même valeur (octet bas du mot), pas de divergence.
- Hex-Rays garde sous variables multiples `v13`/`v15`/`v18` les octets, la voix A
  fait un rendu plus fidèle (sar/shl distingués). Pas de divergence flagrante.
- Détail de taille : le prompt du paquet dit « 1316 o » mais asm.asm + meta.json
  (SIZE 384) pour 0x6A5950..0x6A5ACF → **384 octets**. La valeur « 1316 » est une
  erreur du paquet, ASM/meta gagnent.

## 5. Note d'infrastructure

- `c_b.c` absent du pack ; la voix B arrive sous forme `semantic_b.md` (blind
  analyse sémantique). La réconciliation a pris c_a.c comme C de référence et
  semantic_b.md comme contre-lecture non modifiable, comme instruit.
