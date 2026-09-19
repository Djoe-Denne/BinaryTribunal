# MagFx_RenderComposedFK_Alloc4C @ 0x6A79B0

- File demandée: `0x6A7A20` (catalogue) ; correction parent/R: tête réelle de la fonction = `0x6A79B0` (`0x6A7A20` et `0x6A7A1C` sont des EA médianes — chunk/inst 26).
- Instr: 53 (fenêtre `0x6A79B0`–`0x6A7A44`, size `0x95`).
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN — A=UNCERTAIN puis B=LIKELY sur fenêtres tronquées, R=CERTAIN sur fonction complète — nom `Alloc4C` confirmé, alloc `bs_modulo(0x4C)` réelle @`0x6A79B3`-B5
- Callers: 7 near-calls GF (Diablo `0x6552D9`/`0x65537E`, Carbuncle `0x6816CF`, Quezacotl `0x6C3B8F`, `sub_6A6750`/`sub_6EC0F0`/`sub_6FA780`) tous `add esp,10h` + `mov g_BattlePacketCursor,eax`
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, 8 divergences A/B tranchées, EA catalogue à corriger `0x6A7A20` → `0x6A79B0`

## C réconcilié

```c
// ============================================================================
// c_reconciled.c — C réconcilié COMPLET — 0x6A79B0 MagFx_RenderComposedFK_Alloc4C
// FF8_EN.exe, base 0x400000 — domaine : mag FX GF (rendu géométrie composée + FK)
// ============================================================================
//
// Métadonnées
//   Instr (live) : 53 — fenêtre COMPLÈTE 0x6A79B0..0x6A7A44 (size IDA 149 = 0x95),
//                  retn final @0x6A7A44 (C3). Tête réelle confirmée (verdict
//                  sémantique CERTAIN, clos) : 0x6A7A1C n'est que l'instruction 26.
//   Palier       : E3c (« lu complet ; 6/6 callees NOMMÉS ») + annotations E3a
//                  live : bs_modulo = bump-alloc arena (misnomer) ;
//                  BattleScratch_Unwind = bump dword_1D999C4, inverse de
//                  bs_modulo 0x5082B0 (lecture « frame-memory allocation »
//                  à la Cerberus = FAUSSE).
//   Notes parent : retour = NOUVEAU CURSEUR PACKET — 7/7 callers GF (Diablo,
//                  Carbuncle, Quezacotl + 4 subs) font `mov g_BattlePacketCursor,
//                  eax` après `add esp,10h`. WalkStride30 (stride 0x30) sur la
//                  liste [arg_0+0x60]. Résolution 320×216 en octets WORD.
//                  Slot pile 5 (+0x14 « packet ») lu mais JAMAIS fourni par les
//                  callers ; arg_8 (+0xC) fourni mais JAMAIS lu (relique ABI).
//   Type IDA     : `int __cdecl(int, int, void *packet, int)` — 4 params DÉCLARÉS ;
//                  le frame IDA porte 5 slots (arg_0/arg_4/arg_8/arg_C/packet à
//                  +4/+8/+0xC/+0x10/+0x14). Appel cdecl STANDARD cette fois
//                  (7 near-calls type 17), contrairement au tail-seul 0x6A7A1C
//                  qui était une continuation. retn C3, sans immédiat.
//   Sauvegardes de registres : push ebx/esi/edi @0x6A79B0-B2 ↔ pop edi/esi/ebx
//                  @0x6A7A41-43 — auto-contenues (preuve 1 du semantic_r).
//   Correction add esp : une seule, @0x6A7A3C (add esp,34h) — AUCUN add esp
//                  intermédiaire entre les 6 calls → les 6 callees sont __cdecl,
//                  cleanup MSVC différée et batchée (13 dwords, voir bloc budget).
//
//   GROUND TRUTH = live ASM (asm.asm, 53 instr) + ida_dump_bytes, NOT Hex-Rays.
//   hexrays.c = vérificateur seulement (noms de callees, valeurs, ordre des
//   stores — tous conformes). Divergences listées en fin de fichier.
// ============================================================================

// ---- Externes (6/6 calls + 2 données, tous les calls __cdecl) --------------
extern void *bs_modulo(int nbytes);                          // 0x5082B0 — bump-alloc scratch (E3a)
extern void  Mat_ComposeTwoThenCopy8(void *a, void *b, void *dst);       // 0x56C2F0 — 8 dwords → dst
extern void  WalkStride30_MatComposeInPlace(void *list, void *dst);      // 0x5095B0 — n=[list], stride 0x30 depuis list+0x20
extern void *RenderGeometry(void *geom, void *ctx, void *ot_base,
                            int ot_shift, void *packet);     // 0x5099D0 — boundary draw-packet (5 args)
extern void  BattleSkeleton_BuildHierarchicalFK(void *fk_root);          // retour ignoré
extern void  BattleScratch_Unwind(int nbytes);               // 0x5082D0 — inverse de bs_modulo (E3a)

extern unsigned int g_BattleOTBase;                          // 0x1D8E04C — ordre de rendu battle
extern unsigned int dword_1D97778;                           // globale matrice (identité exacte hors périmètre)

// ---- Signature documentaire -------------------------------------------------
// cdecl 4 args fournis par les 7 callers (add esp,10h uniforme). Le 5e slot
// pile (+0x14, nom frame IDA « packet ») est lu @0x6A7A03 mais non fourni.
int MagFx_RenderComposedFK_Alloc4C(
    void *fx_obj,        // arg_0 (+0x04) — objet FX GF : champs +0x28/+0x40/+0x60/+0x7C
    void *tex_base,      // arg_4 (+0x08) — base payload texture (offset propre au GF)
    void *packet_cursor, // arg_8 (+0x0C) — g_BattlePacketCursor : poussé, JAMAIS lu ici
    void *packet_end);   // arg_C (+0x10) — g_BattlePacketEnd

int MagFx_RenderComposedFK_Alloc4C(
    void *fx_obj, void *tex_base, void *packet_cursor, void *packet_end)
{
    unsigned char *blk;      // esi — record scratch 0x4C (bs_modulo), puis ctx, puis rv
    unsigned char *f;        // edi — fx_obj
    unsigned char *fk_list;  // ebx — fx_obj+0x60 (liste FK, n=[ebx], stride 0x30)
    unsigned int   zero;     // eax — zéro (xor) de 6a79dd à 6a7a07, puis recyclé
    unsigned int   rv;       // retour RenderGeometry → valeur de retour finale
    unsigned int   packet_slot14; // slot pile +0x14 « packet » (nom frame IDA) :
                                 //   lu @6a7a03, VALEUR INDETERMINÉE — jamais fourni
                                 //   par les 7 callers (4 args, add esp,10h) ni
                                 //   écrit ici : résidu du frame caller. Ce C ne
                                 //   l'initialise pas, fidèle à la mécanique ASM.

    /* 6a79b0 */ __asm push ebx                  // save (↔ pop ebx 6a7a43)
    /* 6a79b1 */ __asm push esi                  // save (↔ pop esi 6a7a42)
    /* 6a79b2 */ __asm push edi                  // save (↔ pop edi 6a7a41)
    /* 6a79b3 */ /* push 4Ch  */                 // arg1 bs_modulo : nbytes = 0x4C
    /* 6a79b5 */ blk = (unsigned char *)bs_modulo(0x4C);   // bump-alloc arena dword_1D999C4
    /* 6a79ba */ f = (unsigned char *)fx_obj;    // mov edi,[esp+10h+arg_0] — lu APRÈS le call :
                                                 //   junk 0x04 (bs) + saves 0x0C → RA @+0x10 ✓
    /* 6a79be */ /* mov esi,eax */               // esi = bloc scratch (portera rv plus tard)
    /* 6a79c0 */ /* push esi  */                 // arg3 Mat : dst = bloc (+0x00..+0x1C)
    /* 6a79c1 */ /* lea eax,[edi+40h] */         // b = fx_obj+0x40 (matrice objet)
    /* 6a79c4 */ /* lea ebx,[edi+60h] */         // fk_list = fx_obj+0x60
    /* 6a79c7 */ /* push eax  */                 // arg2 Mat
    /* 6a79c8 */ /* push offset dword_1D97778 */ // arg1 Mat — globale matrice
    /* 6a79cd */ Mat_ComposeTwoThenCopy8(&dword_1D97778, f + 0x40, blk);
    //            └─ compose a×b, copie 8 dwords → blk+0x00..+0x1C (annotation E3a)
    /* 6a79d2 */ /* push esi  */                 // arg2 Walk : dst = bloc
    /* 6a79d3 */ /* push ebx  */                 // arg1 Walk : liste FK
    /* 6a79d4 */ WalkStride30_MatComposeInPlace(fk_list, blk);
    //            └─ n=[ebx] entrées, stride 0x30 depuis ebx+0x20 ; compose in-place
    /* 6a79d9 */ /* mov ecx,[esp+24h+arg_4] */   // tex_base — junk alors 0x18 (bs1+Mat3+Walk2)
                                                 //   + saves 0x0C → RA @+0x24 ✓
    /* 6a79dd */ zero = 0;                       // xor eax,eax — sert aux stores 2,3,6,8
    /* 6a79df */ *(unsigned int *)(blk + 0x24) = (unsigned int)tex_base;  // texture payload base
    /* 6a79e2 */ /* mov ecx,[esp+24h+arg_C] */   // packet_end
    /* 6a79e6 */ *(unsigned short *)(blk + 0x34) = (unsigned short)zero;  // WORD 0
    /* 6a79ea */ *(unsigned short *)(blk + 0x36) = (unsigned short)zero;  // WORD 0
    /* 6a79ee */ *(unsigned short *)(blk + 0x38) = 0x140;   // 320 — largeur rendu (WORD imm)
    /* 6a79f4 */ *(unsigned short *)(blk + 0x3A) = 0x0D8;   // 216 — hauteur rendu (WORD imm)
    /* 6a79fa */ /* mov edx,[edi+28h] */         // edx = fx_obj+0x28
    /* 6a79fd */ *(unsigned int *)(blk + 0x48) = zero;      // dword 0 (eax toujours 0 ici)
    /* 6a7a00 */ *(unsigned int *)(blk + 0x3C) = *(unsigned int *)(f + 0x28);
    /* 6a7a03 */ /* mov edx,[esp+24h+packet] */  // edx = slot pile +0x14 « packet » :
                                                 //   au-delà du type 4-param ; JAMAIS fourni
                                                 //   par les 7 callers (résidu frame caller)
    /* 6a7a07 */ *(unsigned short *)(blk + 0x44) = (unsigned short)zero;  // WORD 0 — ax=0
                                                 //   encore intact (eax réécrit à 6a7a0b)
    /* 6a7a0b */ /* mov eax,[edi+7Ch] */         // eax recyclé : fx_obj+0x7C
    /* 6a7a0e */ *(unsigned int *)(blk + 0x40) = *(unsigned int *)(f + 0x7C);
    /* 6a7a11 */ *(unsigned int *)(blk + 0x30) = (unsigned int)packet_end;
    /* 6a7a14 */ /* mov eax, g_BattleOTBase */   // eax recyclé : globale 0x1D8E04C
                                                 //   (provenance DANS la fenêtre, contrairement
                                                 //    au tail-seul 0x6A7A1C où elle était hors vue)
    /* 6a7a19 */ /* mov ecx,[ebx+4] */           // geom = [fx_obj+0x64] — ecx recyclé
                                                 //   (arg_C déjà stocké à +0x30)
    /* 6a7a1c */ /* push edx  */                 // arg5 RG : packet = slot +0x14 (résidu) — 1er push
    /* 6a7a1d */ /* add eax,44h */               // ot_base = g_BattleOTBase + 0x44 octets
                                                 //   (= 17 dwords ; scaling ×4)
    /* 6a7a20 */ /* push 4    */                 // arg4 RG : ot_shift = 4 (2^4 = 16 entrées OT)
    /* 6a7a22 */ /* add esi,20h */               // ctx = blk + 0x20 (descripteur ; esi recyclé)
    /* 6a7a25 */ /* push eax  */                 // arg3 RG : ot_base
    /* 6a7a26 */ /* push esi  */                 // arg2 RG : ctx
    /* 6a7a27 */ /* push ecx  */                 // arg1 RG : geom — dernier push
    /* 6a7a28 */ rv = (unsigned int)RenderGeometry((void *)*(unsigned int *)(fk_list + 4),
                                                   blk + 0x20,
                                                   (void *)(g_BattleOTBase + 0x44),
                                                   4, (void *)packet_slot14);
    //            └─ 5 args __cdecl poussés droite→gauche : edx(slot+0x14) → 4 →
    //              eax(g_BattleOTBase+0x44) → esi(blk+0x20) → ecx([ebx+4]).
    //              Au call, le callee lit arg1@esp+4 … arg5(packet)@esp+14h ✓.
    /* 6a7a2d */ /* push ebx  */                 // arg1 FK : fk_list (fx_obj+0x60)
    /* 6a7a2e */ /* mov esi,eax */               // rv stashé dans esi (ctx déjà poussé par valeur)
    /* 6a7a30 */ BattleSkeleton_BuildHierarchicalFK(fk_list);
    //            └─ retour ignoré : eax écrasé par mov eax,esi @6a7a3f avant toute lecture
    /* 6a7a35 */ /* push 4Ch  */                 // arg1 Unwind : 76 — PAIRING avec bs_modulo(0x4C)
    /* 6a7a37 */ BattleScratch_Unwind(0x4C);     // bump dword_1D999C4 (E3a)
    /* 6a7a3c */ __asm add esp, 34h              // purge 13 dwords d'args cdecl cumulés (bloc budget)
    /* 6a7a3f */ /* mov eax,esi */               // retour = retour RenderGeometry,
                                                 //   LARGEUR 32 BITS PLEINE (pas de cas
                                                 //   Battle_GetRandomInt AL-only)
    /* 6a7a41 */ __asm pop edi                   // restitue les sauvegardes du prologue
    /* 6a7a42 */ __asm pop esi                   //   (auto-contenues cette fois)
    /* 6a7a43 */ __asm pop ebx
    /* 6a7a44 */ return (int)rv;                 // retn → nouveau curseur packet
                                                 //   (7/7 callers : mov g_BattlePacketCursor,eax)
}

// ============================================================================
// BLOC BUDGET — add esp,34h @0x6A7A3C, vérifié push par push
// ============================================================================
// Pushes de CETTE fonction (16 dwords) :
//   Saves prologue (3, défaits par pop edi/esi/ebx @6a7a41-43) :
//     6a79b0 push ebx   6a79b1 push esi   6a79b2 push edi
//   Args cdecl JAMAIS purgés par les callees (13 dwords = 0x34, purgés ICI) :
//     6a79b3 push 4Ch   arg1 bs_modulo (0x4C)
//     6a79c0 push esi   arg3 Mat_ComposeTwoThenCopy8 (dst bloc)
//     6a79c7 push eax   arg2 Mat (fx_obj+0x40)
//     6a79c8 push off   arg1 Mat (dword_1D97778)
//     6a79d2 push esi   arg2 WalkStride30_MatComposeInPlace (bloc)
//     6a79d3 push ebx   arg1 Walk (fx_obj+0x60)
//     6a7a1c push edx   arg5 RenderGeometry (packet = slot +0x14)
//     6a7a20 push 4     arg4 RenderGeometry (ot_shift)
//     6a7a25 push eax   arg3 RenderGeometry (g_BattleOTBase+0x44)
//     6a7a26 push esi   arg2 RenderGeometry (blk+0x20)
//     6a7a27 push ecx   arg1 RenderGeometry ([fx_obj+0x64])
//     6a7a2d push ebx   arg1 BuildHierarchicalFK (fx_obj+0x60)
//     6a7a35 push 4Ch   arg1 BattleScratch_Unwind (0x4C)
//
// Total : 1 + 3 + 2 + 5 + 1 + 1 = 13 dwords = 0x34 ✓ EXACT.
// Aucun add esp entre les 6 calls → 6/6 callees __cdecl (cleanup batchée).
// Puis pop edi/esi/ebx défont les 3 saves, et retn @6a7a44 consomme le RA.
// Les 4 dwords d'args de CETTE fonction restent empilés au retour → purgés par
// les CALLERS eux-mêmes (add esp,10h, uniforme sur les 7 call sites).
//
// Preuves d'offsets IDA (verrouillent cdecl + junk cumulée) :
//   @6a79ba [esp+10h+arg_0]  : junk 0x04 (bs)  + saves 0x0C → RA @+0x10, arg_0 @+0x14 ✓
//   @6a79d9 [esp+24h+arg_4]  : junk 0x18 (bs1+Mat3+Walk2) + saves 0x0C → RA @+0x24 ✓
//   @6a7a03 [esp+24h+packet] : même junk 0x18 → slot +0x14 lu à RA+0x38 ✓
// ============================================================================

// ============================================================================
// DIVERGENCES HEX-RAYS vs ASM ( ASM gagne )
// ============================================================================
// H1 — Prototype 4-param vs 5e slot lu : le type IDA déclare 4 params, dont
//      `void *packet` en 3e position (slot +0xC). Or l'ASM transmet à
//      RenderGeometry le dword lu @6a7a03 = [esp+24h+packet] = slot pile +0x14
//      (frame var IDA custom), AU-DELÀ du type 4-param. Le pseudo-code transmet
//      « packet » sans révéler que ce slot n'est pas le paramètre déclaré :
//      le slot +0xC (arg_8) n'est JAMAIS lu dans la fonction, et le slot +0x14
//      n'est JAMAIS fourni par les 7 callers (add esp,10h) → résidu du frame
//      caller. Hex-Rays masque entièrement ce quirk ; la ground truth ASM
//      tranche : arg5 RG = [RA+0x14], valeur indéterminée côté callers.
// H2 — « g_BattleOTBase + 17 » (hexrays) vs `add eax,44h` @6a7a1d : 17×4 = 0x44
//      octets — divergence d'AFFICHAGE (scaling dword*), pas de fond. Ici, à la
//      différence du tail-seul 0x6A7A1C, le chargement `mov eax, g_BattleOTBase`
//      @6a7a14 est DANS la fenêtre : le fait est désormais prouvé localement.
// H3 — Absences hexrays (non représentées, documentées ici) : budget pile
//      add esp,34h (13 dwords), __cdecl des 6 callees, sauvegardes
//      ebx/esi/edi, recyclage eax/ecx/edx (zéro → [edi+7Ch] → g_BattleOTBase ;
//      arg_C → [ebx+4]), largeur 32 bits du retour via esi.
// H4 — Conformité : ordre et valeurs des 10 stores du descripteur (blk+0x24,
//      +0x30..+0x48 ; WORD +0x34/+0x36/+0x38=0x140/+0x3A=0x0D8/+0x44), les 6
//      cibles de call, l'ordre des 5 args RenderGeometry et le retour
//      RenderGeometry→retour final : pseudo-code CONFORME à l'ASM. Aucune
//      divergence de fond sur ces points.
// ============================================================================
```

## Preuves et validation parent

1. **Tête réelle** : `push ebx/esi/edi` @ `0x6A79B0`-B2 ↔ `pop edi/esi/ebx` @ `0x6A7A41`-43 appariés ; `idautils.Functions(0x6A7900,0x6A7A20)` → `0x6a79b0 MagFx_RenderComposedFK_Alloc4C`, size `0x95` (`0x6A79B0`+0x95 = `0x6A7A45`).
2. **Alloc** : `push 4Ch` @ `0x6A79B3` ; `call bs_modulo` @ `0x6A79B5` → **0x5082B0** (wiki battle-address-catalog : « bump-alloc », misnomer E3a) ; `mov esi,eax` @ `0x6A79BE` = bloc.
3. **Compose** : `call Mat_ComposeTwoThenCopy8` @ `0x6A79CD` → 0x56C2F0 (`dword_1D97778`, `edi+0x40`, `esi`) ; `call WalkStride30_MatComposeInPlace` @ `0x6A79D4` → 0x5095B0 (`ebx=edi+0x60`, `esi`).
4. **Un seul frame tête+queue** : `add esp,34h` @ `0x6A7A3C` = 13 dwords de junk = bs(1)+Mat(3)+Walk(2)+RenderGeometry(5)+FKH(1)+Unwind(1) — exact uniquement si tête et queue partagent le frame ; offsets args IDA `[esp+10h+arg_0]` @ `0x6A79BA` (Δ0x10 = 3 saves + 1 junk bs) et `[esp+24h+arg_4]` @ `0x6A79D9` (Δ0x24 = 3 saves + 6 junk) confirment.
5. **Tail — 5 args RenderGeometry** : `push edx` @ `0x6A7A1C` = arg5 packet (instruction absente des fenêtres A/B) ; `mov eax, g_BattleOTBase` @ `0x6A7A14` (→ 0x1D8E04C) puis `add eax,44h` @ `0x6A7A1D` = ot_base ; `add esi,20h` @ `0x6A7A22` = ctx = bloc+0x20 ; `mov ecx,[ebx+4]` @ `0x6A7A19` = geom ; `push 4` @ `0x6A7A20` = ot_shift ; `call RenderGeometry` @ `0x6A7A28` → **0x5099D0**.
6. **Unwind** : `push 4Ch` @ `0x6A7A35` ; `call BattleScratch_Unwind` @ `0x6A7A37` → **0x5082D0** (wiki ✓) — libération, miroir de la preuve 2.
7. **Callers** : 7 xrefs type 17 (near call) vers `0x6A79B0` : `0x6552D9`, `0x65537E` (`GF_Diablo_SummonScript_FrameTick`), `0x6816CF` (`GF_277Carbuncle_SequenceTaskDriver`), `0x6A6C58` (`sub_6A6750`), `0x6C3B8F` (`GF_116Quezacotl_ChargeTimelineTask`), `0x6EC673` (`sub_6EC0F0`), `0x6FB158` (`sub_6FA780`) — tous : 4 pushes, `add esp,10h`, `mov g_BattlePacketCursor,eax`.
8. **Aucun call externe vers le tail** : `XrefsTo(0x6A7A1C)` = {`0x6A7A19`, type 21 = fl_F fall-through} ; `XrefsTo(0x6A7A19)` = {`0x6A7A14`, type 21} — flux interne uniquement.
- Risque: slot pile 5 (`+0x14`, « packet ») lu @`0x6A7A03` et forwardé à `RenderGeometry` @`0x6A7A1C`, mais 7/7 callers ne poussent que 4 args — valeur = résidu du frame caller ; déterminer si `RenderGeometry` (0x5099D0) tolère/ignore arg5.

## Divergences Hex-Rays

- **H1 — Prototype 4-param vs 5e slot lu (quirk)** : le type IDA déclare 4 params, dont `void *packet` en 3e position (slot `+0xC`). L'ASM transmet à `RenderGeometry` le dword lu @`0x6A7A03` = `[esp+24h+packet]` = slot pile `+0x14` (frame var IDA custom), AU-DELÀ du type 4-param. Le pseudo-code transmet « packet » sans révéler que ce slot n'est pas le paramètre déclaré : le slot `+0xC` (arg_8) n'est JAMAIS lu dans la fonction, et le slot `+0x14` n'est JAMAIS fourni par les 7 callers (`add esp,10h`) → résidu du frame caller. Hex-Rays masque entièrement ce quirk ; la ground truth ASM tranche : arg5 RG = `[RA+0x14]`, valeur indéterminée côté callers.
- **H2 — Scaling 17 dwords = `0x44`** : « g_BattleOTBase + 17 » (hexrays) vs `add eax,44h` @`0x6A7A1D` : 17×4 = `0x44` octets — divergence d'AFFICHAGE (scaling dword*), pas de fond. À la différence du tail-seul `0x6A7A1C`, le chargement `mov eax, g_BattleOTBase` @`0x6A7A14` est DANS la fenêtre : le fait est désormais prouvé localement.
- **H3 — Absences hexrays** (non représentées, documentées dans le C) : budget pile `add esp,34h` (13 dwords), `__cdecl` des 6 callees, sauvegardes ebx/esi/edi, recyclage eax/ecx/edx (zéro → `[edi+7Ch]` → `g_BattleOTBase` ; arg_C → `[ebx+4]`), largeur 32 bits du retour via esi.
