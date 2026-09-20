# MagFX_Stepper_RenderScaledLayers_ToOT44 @ 0x6A2760

- Instr (live): 147 (466 o, 0x6A2760-0x6A2931)
- Palier: 2+1
- Verdict: LIKELY - stepper de rendu mag FX a couches scalelees (caller ticker MAG_212_Timeline_Tick 0x6A1660 xref 0x6A2073) : scratch 0x74, struct GTE (0x24=1D98B3C, 0x30=0x140, 0x32=0xD8, 0x38=[a1+7Ch], 0x6C=a2), boucle externe avec echelle GTE x1.5 (sar+add 0x6A27CD-D4) puis -0x400/iteration (0x6A28F5), boucle interne p[4] entrees stride 0x20 transformees par 3x GteState_SetWord3Stride6_1CA8A34 + thunks MVMVA (0x49E012/0x480012), idx sommets p+0x88+0x200*(bit) stocke [esi+70h], soumet a l'OT g_BattleOTBase+0x44 via sub_6A2940 4 args (0x6A28CB-E3) ; p[1]-- si p[0]==0, p[0]=0 inconditionnel, retour AL
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: LIKELY
- Nom IDA: sub_6A2760\nTYPE ; proposition: MagFX_Stepper_RenderScaledLayers_ToOT44
- Notes parent: checks 5.6 OK : stores 24h/38h/6Ch (0x6A277C/9D/AC), Set scale (0x6A27CD-D4), mov cl,[ebp+3] (0x6A27F8), [esi+70h] (0x6A280F), SetWord3Stride6 x3 (0x6A282D/4F/71), add edi,20h (0x6A28BC), g_BattleOTBase + call sub_6A2940 (0x6A28CB-E3), sub edi,400h (0x6A28F5), jl 6A27C9 (0x6A2905), [ebp+1] dec (0x6A2912-25), [ebp+0]=0 (0x6A2929), retn AL (0x6A2931), caller data xref sub_6A1660 @0x6A2073

## C reconcilie

```c
// ============================================================================
// c_reconciled.c — sub_6A2760 — réconciliation C (pipeline triple 2+1, voix R)
// ============================================================================
// EA          : 0x6A2760 (.text)
// Instr (live): 147 — taille 466 octets (0x6A2760..0x6A2931)
// Palier      : E3a/E3b/E3c (pack 0x6a2760, campagne mag FX battle)
// Type IDA    : char __cdecl(int, char *)
// Notes parent: latch sur p[0]/p[1] (épilogue), thunks MVMVA 0x49E012/0x480012,
//               stride entrées 0x20, octets WORD à 0x2C..0x32,
//               g_BattleOTBase+0x44 en OCTETS (pas "+17" dwords Hex-Rays),
//               sub_45E9D0 sans arg stack visible.
// ============================================================================
// Préambule : Ground truth = live ASM (asm.asm) + ida_dump_bytes, PAS Hex-Rays
// (hexrays.c = vérificateur uniquement). Toute adresse citée en commentaire
// est une adresse live du listing Intel.
// Sauvegardes : push ecx (scratch, pas callee-saved), ebx, ebp, esi, edi ;
//               pop edi, esi, ebp, ebx, ecx en miroir (6a2928-6a2931).
//               Pas de cadre ebp : ebp = copie de a2 (registre).
//               Cadre esp-based ; arg_4 ([esp+0x1C]) est RÉUTILISÉ comme
//               compteur de boucle externe v11 (6a27af, 6a28fd) — le pointeur
//               a2 y est écrasé, il est conservé dans ebp.
// Cleanup     : cdecl différé/batché — add esp,10h @6a27a9 (push 74h bs_modulo
//               + 3 args Mat), add esp,0Ch @6a27fb (3 args GteState 1-arg),
//               add esp,28h @6a28b5 (10 pushes de l'itération interne),
//               add esp,10h @6a28f1 (4 args sub_6A2940), add esp,4 @6a2915.
// Retour      : AL only (char) — bits hauts d'EAX non définis au retn 6a2931.
// ============================================================================

typedef unsigned char  u8;
typedef unsigned short u16;

// ---- Externes : UNIQUEMENT les callees présents dans asm.asm/callees.txt ----

// Paire alloc/libère du scratch battle : bs_modulo(0x5082B0) alloue,
// BattleScratch_Unwind bump dword_1D999C4 (inverse de bs_modulo).
extern int  bs_modulo(int nbytes);            // 6a2767 ; 116 octets demandés (push 74h)
extern void BattleScratch_Unwind(int nbytes); // 6a290d

// Mat_ComposeTwoThenCopy8 @0x6A27A0 : callee-pack note
// "call 0x56C090 + call 0x56C600(edi+0x14) + add [esi+14/18/1C] + rep movsd
//  8 dwords to arg8 (38 insns)". 3 args prouvés (3 pushes + add esp,10h).
// Dernier arg (arg8 du rep movsd) = destination = scratch.
extern void Mat_ComposeTwoThenCopy8(void *src0, void *src1, void *dst);

// État GTE miroir, zone 0x1CA8A10..0x1CA8A7C.
extern void GteState_Set_1CA8A30(int v);                 // 6a27d4 : dword_1CA8A30 = arg
extern void GteState_SetByte3_1CA8A34(void *src);        // 6a27dd : écrit 3 octets
extern void GteState_GetByte3_1CA8A34(void *dst);        // 6a27eb : miroir du Set
extern void GteState_SetWord3Stride6_1CA8A34(void *src); // 6a282d... : ne pas inverser vs Get
extern void GteState_GetWord3Stride6_1CA8A34(void *dst); // 6a2842... : ne pas inverser vs Set
extern void GteState_PackS16x3_1CA8A10(void *dst);       // 6a2899 : s16 -> 1CA8A10/14
extern void GteState_Get_1CA8A74(void *dst);             // 6a28ae : copie 3 dwords

extern void sub_45E9D0(void);                     // 6a27e2 : pas d'arg stack visible
extern void Field_readCa(void *st);               // 6a2820 : arg = scratch (push esi)
extern void Camera_ReadVariables_Space(void *st); // 6a288c : arg = scratch (push esi)
extern void Thunk_460860_49E012(void);  // push 0x49E012 ; call sub_460860 (0x28e, MVMVA-like 0x12) ; pop ecx ; ret
extern void Thunk_460860_480012(void);  // push 0x480012 ; idem ; canonique du couple 830/840
extern void sub_6A2940(int a, void *b, void *c, int d); // 6a28e3 : 4 args (add esp,10h)

// ---- Globales (globals.txt) ----
extern int  dword_1D98B3C;   // copié tel quel dans scratch+0x24 (6a277c)
extern int  dword_1D97778;   // base passée par adresse à Mat_ComposeTwoThenCopy8 (6a2798)
extern char *g_BattleOTBase; // +0x44 = offset en OCTETS (add ecx,44h @6a28d5)
                             // — Hex-Rays écrit "+17" via un type dword* supposé.

// ============================================================================

char __cdecl sub_6A2760(int a1, char *a2)
{
  char *scratch; // esi : bs_modulo(0x74), struct scratch 116 octets
  char *p;       // ebp : copie de a2, jamais réaffectée (6a27a5 -> épilogue)
  int   v11;     // compteur boucle externe — slot d'arg arg_4 réutilisé
  int   v10;     // var_4 ([esp+0x10]) : sauvegarde de l'échelle à travers la boucle interne
  int   scale;   // edi : échelle GTE (0x800 initial, -0x400 par itération externe)
  int   k;       // ebx : compteur boucle interne (0..p[4])
  int   off;     // edi : offset enregistrement, stride 0x20, dans la boucle interne
  int   idx;     // base des sommets du côté actif, stockée [esi+70h]
  u8    n;       // borne de boucle (octet zero-étendu)
  char  result;  // AL

  scratch = (char *)bs_modulo(0x74);                 // 6a2765 push 74h ; 6a2767 call

  // --- init struct scratch (stores exacts) ---
  *(int  *)(scratch + 0x24) = dword_1D98B3C;         // 6a2772 eax ; 6a277c
  *(u16  *)(scratch + 0x2C) = 0;                     // 6a277f (mov [esi+2Ch], di)
  *(u16  *)(scratch + 0x2E) = 0;                     // 6a2783 (mov [esi+2Eh], di)
  *(u16  *)(scratch + 0x30) = 0x140;                 // 6a2787 : 320
  *(u16  *)(scratch + 0x32) = 0xD8;                  // 6a278d : 216

  // 6a2796-6a27a0 : pushes droite->gauche (offset 1D97778, a1+0x40, scratch).
  // NB : [scratch+0x38] est stocké ENTRE les pushes et le call (6a279d).
  *(int *)(scratch + 0x38) = *(int *)(a1 + 0x7C);    // 6a2793 ecx ; 6a279d
  Mat_ComposeTwoThenCopy8(&dword_1D97778, (char *)a1 + 0x40, scratch); // 6a27a0

  p = a2;                                            // 6a27a5 mov ebp,[esp+24h+arg_4]
  *(int *)(scratch + 0x6C) = (int)p;                 // 6a27ac — APRÈS le retour de Mat

  v11 = 0;                                           // 6a27af mov [esp+14h+arg_4],edi (edi=0)
  if (p[1] == 0)                                     // 6a27b3 mov al,[ebp+1] ; test ; jbe 6a290b (octet, unsigned)
    goto epilog;

  scale = 0x800;                                     // 6a27be mov edi,800h (2048)
  v10   = scale;                                     // 6a27c3 mov [esp+14h+var_4],edi

  do
  {
    // 6a27c9 : rechargement a1 dans ebx — artefact d'allocation de registre
    // (ebx sert de compteur k dans la boucle interne). a1 ne change jamais.
    // 6a27cd-6a27d3 : sar 1 (ARITHMÉTIQUE) + add => échelle ×1.5.
    // Ne PAS remplacer sar par shr : scale devient négatif au-delà de 2 itérations.
    GteState_Set_1CA8A30(scale + (scale >> 1));      // 6a27d4
    GteState_SetByte3_1CA8A34((char *)a1 + 0x28);    // 6a27d9 lea eax,[ebx+28h] ; 6a27dd
    sub_45E9D0();                                    // 6a27e2 — sans arg stack
    GteState_GetByte3_1CA8A34(scratch + 0x34);       // 6a27e7 lea eax,[esi+34h] ; 6a27eb (3 octets : 0x34..0x36)
    *(char *)(scratch + 0x37) = 0;                   // 6a27f4

    // 6a27f0 : eax = v11 (rechargé du slot arg_4).
    // 6a27f8-6a2805 : mov cl,[ebp+3] (chargement 8 bits, ECX partiellement écrit
    // — résidu de [a1+7Ch] dans les bits hauts, MAIS sub 32 bits puis and 1
    // ne laissent survivre que le bit 0, donc sémantique exacte :
    // (p[3] - v11) & 1). shl 9 (logique) sur le bit => ×512.
    idx = (int)(p + 0x88) + ((((u8)p[3] - v11) & 1) << 9); // 6a27fe..6a2808 lea edx,[ecx+ebp+88h]
    *(int *)(scratch + 0x70) = idx;                  // 6a280f

    if (p[4] != 0)                                   // 6a2812 mov al,[ebp+4] ; test ; jbe 6a28cb (octet, unsigned)
    {
      off = 0;                                       // 6a281d xor edi,edi
      k   = 0;                                       // 6a2800 xor ebx,ebx
      do
      {
        // Ordre live exact (6a281f-6a28ae) — triple Set/GetWord3Stride6 +
        // thunks MVMVA, puis paire Camera/PackS16x3/Thunk480012/Get_1CA8A74.
        Field_readCa(scratch);                              // 6a2820 (push esi)

        GteState_SetWord3Stride6_1CA8A34((void *)(idx + off));        // 6a282d : src = rec+0
        Thunk_460860_49E012();                                        // 6a2832
        GteState_GetWord3Stride6_1CA8A34((void *)(idx + off + 0x100)); // 6a2842 : dst = +256

        GteState_SetWord3Stride6_1CA8A34((void *)(idx + off + 2));    // 6a284f
        Thunk_460860_49E012();                                        // 6a2854
        GteState_GetWord3Stride6_1CA8A34((void *)(idx + off + 0x102)); // 6a2864 : dst = +258

        GteState_SetWord3Stride6_1CA8A34((void *)(idx + off + 4));    // 6a2871
        Thunk_460860_49E012();                                        // 6a2876
        GteState_GetWord3Stride6_1CA8A34((void *)(idx + off + 0x104)); // 6a2886 : dst = +260

        Camera_ReadVariables_Space(scratch);                          // 6a288c (push esi)
        GteState_PackS16x3_1CA8A10((void *)(idx + off + 0x14));       // 6a2899 : dst = +20
        Thunk_460860_480012();                                        // 6a289e
        GteState_Get_1CA8A74((void *)(idx + off + 0x114));            // 6a28ae : dst = +276, 3 dwords
        // 6a28b5 add esp,28h : cleanup batché des 10 pushes cdecl ci-dessus.

        ++k;                                           // 6a28bb inc ebx
        off += 0x20;                                   // 6a28bc add edi,20h — stride entrée = 0x20
        n = (u8)p[4];                                  // 6a28b3 xor eax,eax ; 6a28b8 mov al,[ebp+4] (zero-extend)
      } while (k < (int)n);                            // 6a28bf cmp ebx,eax ; 6a28c1 jl — signé en ASM,
                                                       // équivalent unsigned : borne zero-étendue >= 0

      scale = v10;                                   // 6a28c7 mov edi,[esp+14h+var_4] — restaure l'échelle
    }

    // 6a28cb-6a28e3 : 4 args poussés droite->gauche :
    // push 0 (6a28d8) ; push g_BattleOTBase+44h (6a28da, add ecx,44h @6a28d5
    // = offset en OCTETS) ; push scratch+0x20 (6a28e1) ; push [a1+0x64] (6a28e2).
    sub_6A2940(*(int *)(a1 + 0x64),                  // 6a28db mov ecx,[eax+64h]
               scratch + 0x20,                       // 6a28de lea edx,[esi+20h]
               g_BattleOTBase + 0x44,                // 6a28cb/6a28d5
               0);                                   // 6a28e3 call ; add esp,10h @6a28f1

    // --- fin d'itération externe ---
    v11 = v11 + 1;                                   // 6a28e8 mov eax,[esp+24h+arg_4] ; 6a28f4 inc eax
    scale = scale - 0x400;                           // 6a28f5 sub edi,400h
    n = (u8)p[1];                                    // 6a28ec xor edx,edx ; 6a28ee mov dl,[ebp+1]
    v11 = v11;                                       // 6a28fd mov [esp+14h+arg_4],eax — re-stocke dans le slot d'arg
    v10 = scale;                                     // 6a2901 mov [esp+14h+var_4],edi
  } while (v11 < (int)n);                            // 6a2905 cmp eax,edx ; 6a2905 jl -> 6a27c9
                                                     // signé en ASM ; borne zero-étendue >= 0

epilog:
  BattleScratch_Unwind(0x74);                        // 6a290b push 74h ; 6a290d call ; add esp,4 @6a2915

  // --- épilogue : latch p[0]/p[1], retour AL only ---
  result = p[0];                                     // 6a2912 mov al,[ebp+0]
  if (result == 0)                                   // 6a2918 test al,al ; 6a291a jnz 6a2928
  {
    result = p[1];                                   // 6a291c mov al,[ebp+1]
    if (result != 0)                                 // 6a291f test ; 6a2921 jbe 6a2928 (octet, unsigned)
    {
      --result;                                      // 6a2923 dec al
      p[1] = result;                                 // 6a2925 mov [ebp+1],al
    }
  }
  // 6a2928 : pop edi ; PUIS le store — exécuté sur TOUS les chemins :
  p[0] = 0;                                          // 6a2929 mov byte ptr [ebp+0],0
  return result;                                     // 6a2931 retn — AL only, bits hauts d'EAX indéfinis
}

// ============================================================================
// NOTES / DIVERGENCES vs Hex-Rays (hexrays.c = vérificateur seulement)
// ----------------------------------------------------------------------------
// 1. g_BattleOTBase + 0x44 : Hex-Rays "(int)(g_BattleOTBase + 17)" suppose un
//    type dword* ; l'ASM live est add ecx,44h @6a28d5 = +68 OCTETS. Forme
//    octets adoptée.
// 2. Boucles : Hex-Rays caste en (unsigned __int8) ; l'ASM compare en signé
//    (jl) sur 32 bits avec bornes zero-étendues (xor eax,eax+mov al / xor
//    edx,edx+mov dl) => >= 0, les deux formes sont équivalentes. La forme
//    signée 32 bits est celle du live.
// 3. sar eax,1 @6a27cf : shift ARITHMÉTIQUE (scale négatif au-delà de 2
//    itérations externes) — ne pas remplacer par shr.
// 4. Hex-Rays "(_BYTE)v11" @ligne 36 : artefact ; l'ASM fait un sub ECX,EAX
//    32 bits puis and 1 — le chargement 8 bits mov cl,[ebp+3] @6a27f8 n'a
//    pas d'effet (seul le bit 0 survit au and).
// 5. Cleanup cdecl batché (0x10/0xC/0x28/0x10/4) masqué par Hex-Rays.
// 6. Slot d'argument arg_4 réutilisé comme compteur v11 : Hex-Rays le
//    modélise en local sans signaler l'écrasement du pointeur a2 (sauvé
//    dans ebp).
// 7. [scratch+0x38] stocké entre les pushes d'args et le call Mat (6a279d) ;
//    [scratch+0x6C] APRÈS le retour de Mat (6a27ac). Ordre respecté ici.
// ============================================================================
// UNCERTAIN 0x6a27e2 : sub_45E9D0 — d'éventuels args par registres (ecx/edx)
//                      non prouvables depuis ce seul call site (pas de setup
//                      visible juste avant).
// UNCERTAIN 0x6a2832/0x6a289e : effet exact des thunks sub_460860 (MVMVA-like
//                      0x12) — seuls les codes poussés (0x49E012/0x480012)
//                      sont certains depuis ce listing.
// UNCERTAIN 0x6a27b3/0x6a2812 : signification métier de p[1] (compteur
//                      d'itérations ?), p[3] (sélecteur de banque ?), p[4]
//                      (nombre d'entrées de 0x20 octets ?) — bornes prouvées
//                      par l'ASM, sémantique non.
// UNCERTAIN 0x6a2772 : contenu de dword_1D98B3C et de [a1+0x7C] inconnu
//                      (copiés tels quels dans la struct scratch).
// ============================================================================
```

## Analyse semantique

# Sémantique sub_6A2760 @ 0x6A2760 (réconciliation R)

- **Rôle (1 phrase)** : stepper de rendu d'effet magique battle — alloue un scratch 0x74 (bs_modulo), rend en un appel `p[1]` couches d'échelle en escalier (facteur GTE ×1.5·(0x800 − i·0x400) : 0xC00, 0x600, 0, −0x600, …) appliqué à `p[4]` blocs de 0x20 octets de la banque `p+0x88+0x200·bit` (matrices 3×3 s16 + translation, 3 passes MVMVA + passe caméra), soumet chaque couche au bucket `g_BattleOTBase+0x44` via `sub_6A2940`, décrémente `p[1]` (dissolution couche par couche), retourne en AL le latch `p[0]` sinon le compteur restant.

- **Verdict : LIKELY consolidé**
- **Confiance : LIKELY** — callers (xref unique 0x6a2073 dans `sub_6A1660`/MAG_212_Timeline_Tick, fermé CERTAIN) + callees + ASM 147 instr alignés et opcodes cités, réconciliation C (7 tranchées) convergente ; pas CERTAIN car wiki.md vide (échec qmd, aucun alignement wiki direct pour cette EA), `sub_45E9D0`, `sub_6A2940` et `dword_1D98B3C` hors pack.

- **Nom catalogue** : absent (IDA `sub_6A2760`). Proposition (markdown seul, PAS de rename) :
  **`MagFX_Stepper_RenderScaledLayers_ToOT44`** — synthèse A/B : garde « Stepper » + « tick » de A (prouvé), garde l'escalier d'échelle et la destination OT+0x44 de B (prouvés), rejette « FrameAndTick » (sous-estime les p[1] soumissions par appel) et « VertexFan » (non prouvé, voir D1).

- **In / Out / Effets**
  - Prototype `char __cdecl(int a1, char *p)` — retour AL only (`6a2931 retn`, seul `al` écrit dans l'épilogue `6a2912–6a2925`).
  - **a1** : `+0x28` 3 octets → état GTE 0x1CA8A34 (`6a27d9–6a27dd`) puis recalculés via `sub_45E9D0`/GetByte3 vers scratch+0x34..0x36, `+0x37`=0 (`6a27e7–6a27f4`) ; `+0x40` matrice objet composée avec bloc caméra `dword_1D97778` vers scratch+0x00..0x1F (`6a2793–6a27a0`, 8 dwords) ; `+0x64` arg1 de `sub_6A2940` (`6a28db`) ; `+0x7C` → scratch+0x38 (`6a2793/6a279d`).
  - **p (arg1)** : `p[0]` latch one-shot (≠0 → AL=p[0] sans décrément, `6a2912–6a291a`) puis **forcé à 0 sur tous les chemins** (`6a2929 mov byte ptr [ebp+0],0` après le label commun `6a2928`, y compris early-exit `6a290b`) ; `p[1]` compteur de couches (borne boucle externe `6a28fb–6a2905`, décrémenté une fois par appel `6a2923–6a2925` si `p[0]==0 && p[1]!=0`) ; `p[3]` sélecteur de banque (`(p[3] − i) & 1`, `6a27f8–6a2802`) ; `p[4]` nombre de blocs 0x20 (`6a2812–6a2817`, `6a28b8–6a28c1`) ; `p+0x88` deux banques de 0x200.
  - **Sortie sub_6A2940** : 4 args cdecl droite→gauche `([a1+0x64], scratch+0x20, g_BattleOTBase+0x44, 0)` (`6a28cb–6a28e3`, `add esp,10h` `6a28f1`), exécutée **une fois par itération externe** → p[1] soumissions par appel.
  - **État GTE** : `dword_1CA8A30` = échelle (`sar`+`add` ×1.5 `6a27cd–6a27d4`, pas −0x400/itér `6a28f5`, `sar` signé requis pour les couches miroir) ; 0x1CA8A34 Set/GetByte3 + Set/GetWord3Stride6 ; 0x1CA8A10/14 PackS16x3 ; 0x1CA8A74/78/7C Get.
  - **Scratch 0x74 (esi)** : +0x00..0x1F matrice composée ; +0x24 = `dword_1D98B3C` (`6a277c`) ; +0x2C/+0x2E = 0 ; +0x30 = 0x140 (320), +0x32 = 0xD8 (216) — bornes écran battle (`6a2787–6a278d`) ; +0x38 = `[a1+7C]` ; +0x6C = p (`6a27ac`) ; +0x70 = `p + 0x88 + ((p[3]−i)&1)<<9` (`6a2805–6a280f`).
  - **Boucle interne** (stride 0x20, `6a28bc add edi,20h`) : par item, 3× (SetWord3Stride6 → Thunk_460860_49E012 → GetWord3Stride6) sur +0/+2/+4 → dest +0x100/0x102/0x104 (matrice 3×3 s16, mots stride 6) `6a282d–6a2886` ; puis `Camera_ReadVariables_Space` + PackS16x3(item+0x14) + Thunk_460860_480012 + Get_1CA8A74 → item+0x114 `6a288c–6a28ae`.
  - **Scratch libéré** : `BattleScratch_Unwind(0x74)` `6a290b–6a290d`.

- **Divergences A/B tranchées**
  1. **Nom** : A `MagFX_Stepper_RenderFrameAndTick` vs B `MagFx_RenderScaledVertexFan_ToOT44` → **synthèse `MagFX_Stepper_RenderScaledLayers_ToOT44`**. Preuves : « VertexFan » rejeté — les items 0x20 sont des matrices 3×3 s16 + translation, pas des sommets (`6a282d/6a284f/6a2871` SetWord3Stride6 aux offsets +0/+2/+4 avec stride 6 mots = colonnes d'une matrice ; `6a2899` PackS16x3 sur item+0x14 = vecteur) ; « FrameAndTick » rejeté — un appel rend p[1] couches et soumet p[1] fois, pas « une frame/une soumission » (`6a2905 jl 6a27c9` reboucle l'externe qui traverse `6a28cb–6a28e3`) ; escalier prouvé (`6a27be mov edi,800h`, `6a27cf sar`/`6a27d1 add` ×1.5, `6a28f5 sub edi,400h`) ; destination prouvée (`6a28cb mov ecx,g_BattleOTBase` / `6a28d5 add ecx,44h` / `6a28e3 call sub_6A2940`).
  2. **p[1] « compteur de frames » (A) vs « compteur de copies restantes » (B)** → **B**. Preuve : `6a28fb cmp eax,edx` / `6a2905 jl` — p[1] (zero-étendu `6a28ee mov dl,[ebp+1]`) borne la boucle externe (couches par appel) ; `6a2923 dec al` / `6a2925 mov [ebp+1],al` — décrémenté **une fois par appel**, pas par frame rendue. Lecture B (« copies restantes », dissolution couche par couche) fidèle à l'ASM ; « frames » de A était imprécis.
  3. **Soumission OT singulière (A : « la soumet au bucket ») vs une soumission par couche (B implicite)** → **B**. Preuve : flux `6a28c1 jl 6a281f` (interne) → fall-through `6a28c7` → `6a28cb–6a28e3` sub_6A2940 → `6a2905 jl 6a27c9` (externe) — le call `6a28e3` est atteint à CHAQUE itération externe (aussi quand `p[4]==0` via `jbe 6a28cb` `6a2817`) → p[1] soumissions par appel.
  4. **Valeur one-shot p[0]** : A (« flag one-shot, valeur 2 supposée ») vs B (« latched, retourné brut ») → **convergence**, ASM : `6a2912–6a291a jnz` + clear inconditionnel `6a2929`. La valeur (0/2) reste non prouvée dans le pack (voir questions).
  5. **Échelle Q12** : convergence A=B (0xC00 = ×1.5·0x800, pas −0x400, `sar` signé) ; précision B « 0xC00 = 0.75 Q12 » exacte (0xC00/0x1000), confirmée `6a27cf–6a27d1`.
  6. **Strides/struct scratch** : convergence A=B, consolidée avec les 7 tranchées C-R (D1–D7 de reconcile_notes.md : sar ×1.5 @6a27cd–d4 + −0x400 @6a28f5 ; ordre Set/thunk/Get interne ; stores scratch +0x24/+0x2C/+0x2E/+0x30/+0x32/+0x38/+0x6C ; idx `p+0x88+0x200·((p[3]−i)&1)` shl 9 @6a2805 ; sub_6A2940 4 args @6a28d8–6a28e3 ; latch p[0]=0 inconditionnel @6a2929 ; OT+0x44 en octets @6a28d5, pas +17 dwords Hex-Rays).

- **Preuves (ASM cité)** :
  1. `6a27be mov edi,800h` + `6a27cd mov eax,edi` / `6a27cf sar eax,1` (ARITHMÉTIQUE) / `6a27d1 add eax,edi` → ×1.5, `6a27d4 call GteState_Set_1CA8A30` ; `6a28f5 sub edi,400h` par itération externe, `6a2901 mov [esp+14h+var_4],edi` — escalier 0xC00/0x600/0/−0x600, signe préservé (couches miroir).
  2. `6a28cb mov ecx,g_BattleOTBase` / `6a28d5 add ecx,44h` (octets) / `6a28d8 push 0` / `6a28da push ecx` / `6a28db mov ecx,[eax+64h]` / `6a28de lea edx,[esi+20h]` / `6a28e1 push edx` / `6a28e2 push ecx` / `6a28e3 call sub_6A2940` — soumission par couche à OT+0x44, args droite→gauche.
  3. `6a27b3 mov al,[ebp+1]` / `6a27b6 test` / `6a27b8 jbe loc_6A290B` + `6a28fb cmp eax,edx` / `6a2905 jl loc_6A27C9` — p[1] borne la boucle externe ; `6a2921 jbe` / `6a2923 dec al` / `6a2925 mov [ebp+1],al` — tick une fois par appel.
  4. `6a27f8 mov cl,[ebp+3]` / `6a27fe sub ecx,eax` / `6a2802 and ecx,1` / `6a2805 shl ecx,9` / `6a2808 lea edx,[ecx+ebp+88h]` / `6a280f mov [esi+70h],edx` — banque 2×0x200 ping-pong par parité.
  5. `6a282d/6a284f/6a2871 SetWord3Stride6(+0/+2/+4)` → `6a2832/6a2854/6a2876 Thunk_460860_49E012` → `6a2842/6a2864/6a2886 GetWord3Stride6(+0x100/+0x102/+0x104)` — matrice 3×3 s16 par item 0x20, jamais Set/Get inversés ; `6a288c Camera_ReadVariables_Space` + `6a2899 PackS16x3(item+0x14)` + `6a289e Thunk_460860_480012` + `6a28ae Get_1CA8A74(item+0x114)` — passe caméra par item.
  6. `6a2765 push 74h` / `6a2767 call bs_modulo` ↔ `6a290b push 74h` / `6a290d call BattleScratch_Unwind` — scratch 0x74 éphémère par appel.
  7. `6a2912 mov al,[ebp+0]` / `6a291a jnz 6a2928` / `6a291c mov al,[ebp+1]` / `6a2921 jbe 6a2928` / `6a2925 mov [ebp+1],al` / **`6a2929 mov byte ptr [ebp+0],0`** (après label commun, tous chemins) / `6a2931 retn` — latch one-shot + retour AL only.

- **Checks §5.6** :
  - Callees cités tous présents dans callees.txt (bs_modulo, Mat_ComposeTwoThenCopy8, GteState_Set_1CA8A30, SetByte3/GetByte3_1CA8A34, sub_45E9D0, Field_readCa, Set/GetWord3Stride6_1CA8A34, Thunk_460860_49E012 ×3, Camera_ReadVariables_Space, PackS16x3_1CA8A10, Thunk_460860_480012, Get_1CA8A74, sub_6A2940, BattleScratch_Unwind). Aucune library call inventée. ✔
  - Caller : xref unique `0x6a2073` (`sub_6A1660`, size 0x10F9) dans callers.txt, `more:false`. ✔
  - Strides en nombres : items 0x20 (`6a28bc add edi,20h`), banques 0x200 (shl 9 `6a2805`), scratch 0x74, matrice mots stride 6 (offsets +0/+0xC/+0x18 par colonne), pas d'échelle 0x400. ✔
  - Polarités : `jbe` unsigned sur compteurs byte (`6a27b8`, `6a2817`, `6a2921`) ; `jl` signé sur bornes 32 bits zero-étendues (`6a28c1`, `6a2905` — équivalent prouvé) ; `sar` signé requis (`6a27cf`) ; `jnz` latch (`6a291a`). ✔
  - Largeur retour : AL only (`6a2912–6a2931`, `retn` nu). ✔
  - Nom : ≥2 preuves ASM indépendantes adressées (escalier P1, OT+0x44 P2, tick P3, famille MagFX via caller CERTAIN). ✔
  - Cohérence avec c_reconciled.c (7 tranchées D1–D7) : aucune contradiction. ✔

- **Questions ouvertes (non bloquantes)** :
  1. Valeur métier du latch `p[0]` (0/2 supposé d'après la famille stepper 0/2 — non prouvable depuis le pack).
  2. Contrat exact de `sub_6A2940` (émetteur de primitives OT ? champ scratch+0x20 jamais écrit ici, sortie probable du callee) et de `sub_45E9D0` (recalcul des 3 octets de `[a1+0x28]`).
  3. Contenu de `dword_1D98B3C` (→ scratch+0x24) et de `[a1+0x7C]` (→ scratch+0x38) — absents du catalogue lu.
  4. Étiquette `Field_readCa` (`6a2820`, arg=esi) suspecte pour un path battle — libellé IDA non vérifié.
  5. Interprétation visuelle des couches (anneaux/rampes ?) : les matrices 3×3 + translations par item et l'escalier d'échelle le suggèrent, mais rien ne tranche depuis l'ASM seul.

- **IDBCOMMENT** : Stepper d'effet magie battle : rend p[1] couches d'echelle en escalier (1.5 x (0x800 - 0x400*i), sar signe, couches miroir possibles) sur p[4] blocs de 0x20 octets de la banque p+0x88+0x200*bit(p[3]), matrices 3x3 s16 transformees par 3 passes MVMVA plus passe camera, resultat a bloc+0x100/0x114. Chaque couche est soumise par sub_6A2940(a1+0x64, scratch+0x20, g_BattleOTBase+0x44, 0) dans le scratch bs_modulo 0x74 (matrice composee +0, bornes 320x216 +30/+32, deborne +38). p[1] est decremente une fois par appel si p[0]==0 et p[1]!=0, p[0] force a 0 sur tous les chemins, retour AL = latch p[0] sinon compteur restant (0 = termine). [semantic-triple 2026-09-20]

## Notes C-R

# reconcile_notes.md — sub_6A2760 (EA 0x6A2760, voix C-R)

Pack : `tools/_tmp_semantic_triple/0x6a2760/`
Entrées : c_a.c, c_b.c (reconstructions aveugles croisées) ; asm.asm (GROUND
TRUTH, 147 instr, 466 octets 0x6A2760..0x6A2931) ; hexrays.c (vérificateur
seulement) ; meta.json, callees.txt, callers.txt, globals.txt.
Livrable : `c_reconciled.c` (même répertoire).

Constat général : c_a et c_b sont sémantiquement identiques point par point
(les 7 points de tranchage sont tranchés pareillement par les deux voix).
Les divergences notables entre A et B sont de forme, pas de fond :

| # | Point | Voix A | Voix B | Tranché (ASM) |
|---|-------|--------|--------|----------------|
| 1 | Expression idx (P4) | variable dédiée `v6` (interprétée par erreur comme compteur interne dans le commentaire ligne 61, contredit par son propre ligne 122 `++v6`) | `idx` avec détail shl 9 explicite | **B**, voir D4 |
| 2 | Typage externes | `dword_1D97778[]`, `GteState_SetByte3(const void*)` | `dword_1D97778` scalaire, signatures `void*` | **B** (forme), sémantique identique |
| 3 | Présentation boucle externe | `do/while` avec commentaire sur rechargement a1 | `for(;;)+continue` avec label pseudo `eax_get_v11:` | **A** (forme ; le label pseudo de B n'existe pas dans l'ASM) |
| 4 | g_BattleOTBase | `int` + commentaire "+68 octets = 17 dwords" | `char*` + "+0x44 en octets" | **B** (forme la plus fidèle ; tranché D7) |

Aucune divergence sémantique A/B à arbitrer contre l'ASM. Les tranchages
ci-dessous sont donc des confirmations contre Hex-Rays et contre les
imprécisions internes de chaque voix.

---

## Tranchages contre l'ASM (adresses citées)

### D1 — Boucle externe : échelle GTE 0x800 → −0x400/itération, séquence exacte
- A et B d'accord ; Hex-Rays d'accord (`v5=2048`, `v5-=1024`).
- Séquence live exacte :
  - `6a27be mov edi,800h` ; `6a27c3 mov [esp+14h+var_4],edi` (sauvegarde v10)
  - tête `6a27c9 mov ebx,[esp+14h+arg_0]` (rechargement a1, artefact de
    registre — ebx sert de compteur interne)
  - `6a27cd mov eax,edi` ; **`6a27cf sar eax,1`** (ARITHMÉTIQUE, pas shr) ;
    `6a27d1 add eax,edi` → ×1.5 ; `6a27d3 push eax` ; `6a27d4 call GteState_Set_1CA8A30`
  - fin d'itération : `6a28f4 inc eax` (v11) ; **`6a28f5 sub edi,400h`** ;
    `6a2901 mov [esp+14h+var_4],edi` (re-sauvegarde) ; `6a2905 jl loc_6A27C9`
- Conclusion : échelle = 0x800, puis −0x400 par itération, la valeur passée à
  `GteState_Set_1CA8A30` à chaque itération est `scale + (scale sar 1)`.
  Non-moyenné : le `sar` (et non `shr`) est conservé — `scale` devient négatif
  au-delà de 2 itérations et le signe doit être préservé.

### D2 — Boucle interne : ordre exact des triples Set/Get + thunks
- A et B d'accord ; ordre live (stride p[4] entrées × 0x20, `add edi,20h @6a28bc`) :
  1. `6a2820 Field_readCa(scratch)`
  2. `6a282d GteState_SetWord3Stride6_1CA8A34(rec+0)` ; `6a2832 Thunk_460860_49E012` ; `6a2842 GteState_GetWord3Stride6_1CA8A34(rec+0x100)`
  3. `6a284f Set(rec+2)` ; `6a2854 Thunk_49E012` ; `6a2864 Get(rec+0x102)`
  4. `6a2871 Set(rec+4)` ; `6a2876 Thunk_49E012` ; `6a2886 Get(rec+0x104)`
  5. `6a288c Camera_ReadVariables_Space(scratch)` ; `6a2899 GteState_PackS16x3_1CA8A10(rec+0x14)` ; `6a289e Thunk_460860_480012` ; `6a28ae GteState_Get_1CA8A74(rec+0x114)`
  6. `6a28b5 add esp,28h` (cleanup batché des 10 pushes) ; `6a28bb inc ebx` ; `6a28bc add edi,20h` ; `6a28bf cmp` / `6a28c1 jl 6a281f`
- Confirmé : Set→thunk 0x49E012→Get, jamais inversé (le pack note
  explicitement « Do not invert vs Get/Set »). Aucune moyenne A/B nécessaire.

### D3 — Struct GTE init : stores exacts
- Live : `6a277c [esi+24h]=dword_1D98B3C` (via `6a2772 mov eax,dword_1D98B3C`) ;
  `6a277f mov [esi+2Ch],di` (WORD=0) ; `6a2783 mov [esi+2Eh],di` (WORD=0) ;
  `6a2787 mov word ptr [esi+30h],140h` (320) ; `6a278d mov word ptr [esi+32h],0D8h` (216) ;
  `6a2793 mov ecx,[ebx+7Ch]` puis `6a279d mov [esi+38h],ecx` — store effectué
  ENTRE les pushes d'args de Mat (6a2796-6a2798) et le call (6a27a0) ;
  `6a27ac mov [esi+6Ch],ebp` — APRÈS le retour de Mat.
- A et B reproduisent cet ordre (B le documente explicitement note 7).
  Adopté tel quel dans c_reconciled.c.

### D4 — idx sommets : p + 0x88 + 0x200·((p[3]−v11)&1), stocké [esi+70h]
- Séquence live : `6a27f0 mov eax,[esp+20h+arg_4]` (v11) ; `6a27f8 mov cl,[ebp+3]`
  (chargement 8 bits, ECX partiellement écrit — bits hauts = résidu de
  `[a1+7Ch]`) ; `6a27fe sub ecx,eax` (32 bits) ; `6a2800 xor ebx,ebx` ;
  `6a2802 and ecx,1` ; **`6a2805 shl ecx,9`** ; `6a2808 lea edx,[ecx+ebp+88h]` ;
  `6a280f mov [esi+70h],edx`.
- Le `sub` 32 bits + `and 1` neutralisent le chargement 8 bits de `cl` :
  sémantique exacte = `(p[3] - v11) & 1`, puis `<< 9` (=×512).
- Divergence interne A : le commentaire de c_a ligne 61 appelle `v6`
  « compteur interne », alors que c_a lui-même incrémente `v6` en compteur de
  boucle (ligne 122) et note le `shl 9` à la ligne 97. Forme B (`idx` distinct
  du compteur) retenue : moins ambiguë. Hex-Rays ligne 36 `(_BYTE)v11` est un
  artefact (l'ASM fait le sub en 32 bits).

### D5 — sub_6A2940 : 4 args, ordre des pushes
- Live : `6a28cb mov ecx,g_BattleOTBase` ; `6a28d5 add ecx,44h` ;
  `6a28d8 push 0` ; `6a28da push ecx` (g_BattleOTBase+0x44) ; `6a28db mov ecx,[eax+64h]` ;
  `6a28de lea edx,[esi+20h]` ; `6a28e1 push edx` (scratch+0x20) ; `6a28e2 push ecx` ([a1+0x64]) ;
  `6a28e3 call sub_6A2940` ; `6a28f1 add esp,10h` → **4 args cdecl**.
- Ordre droite→gauche : `sub_6A2940([a1+0x64], scratch+0x20,
  g_BattleOTBase+0x44, 0)`. A et B d'accord ; Hex-Rays d'accord sauf le
  point D7 (+17). Adopté.

### D6 — Épilogue : latch p[0]/p[1], p[0]=0 inconditionnel, retour AL only
- Live : `6a2912 mov al,[ebp+0]` ; `6a2918 test` ; `6a291a jnz 6a2928` ;
  `6a291c mov al,[ebp+1]` ; `6a291f test` ; `6a2921 jbe 6a2928` ;
  `6a2923 dec al` ; `6a2925 mov [ebp+1],al` ; **`6a2928 pop edi` PUIS
  `6a2929 mov byte ptr [ebp+0],0`** — le store p[0]=0 est APRÈS le label
  commun, donc exécuté sur TOUS les chemins (y compris early-exit 6a290b et
  les deux sauts du latch). `6a2931 retn` avec AL seul (bits hauts d'EAX
  indéfinis).
- A et B d'accord (B note « TOUJOURS exécuté »). Adopté : c'est un latch —
  p[0]=0 inconditionnel ; p[1] décrémenté seulement si p[0]==0 && p[1]!=0.

### D7 — g_BattleOTBase+0x44 : octets, pas +17 dwords
- Live : `6a28cb mov ecx,g_BattleOTBase` ; **`6a28d5 add ecx,44h`** → +0x44 = +68
  **octets**. Hex-Rays écrit `(int)(g_BattleOTBase + 17)` car il suppose un
  type d'élément dword (17×4=68). Forme octets retenue (A le dit en
  commentaire, B le type `char*`). Aucun doute : l'ASM additionne 0x44 à un
  pointeur non typé.

---

## Divergences vs Hex-Rays (récapitulatif)
1. `g_BattleOTBase + 17` (dwords) vs live `add ecx,44h` (octets) — ASM gagne (D7).
2. Casts `(unsigned __int8)` sur les bornes de boucle vs live `jl` signé 32
   bits sur bornes zero-étendues (`xor eax,eax`+`mov al` / `xor edx,edx`+`mov dl`)
   — équivalent prouvé, forme signée 32 bits documentée.
3. `(_BYTE)v11` dans l'expression idx — artefact ; sub 32 bits dans l'ASM (D4).
4. Cleanups cdecl batchés (`add esp,10h/0Ch/28h/10h/4h`) invisibles dans
   Hex-Rays — documentés dans c_reconciled.c.
5. Réutilisation du slot d'argument `arg_4` comme compteur v11 (écrasement du
   pointeur a2, sauvé dans ebp) — non signalée par Hex-Rays, visible dans
   l'ASM (6a27af, 6a28fd).

## UNCERTAIN restants
- `UNCERTAIN 0x6a27e2` : sub_45E9D0 — args par registres éventuels non
  prouvables depuis ce seul call site (aucun setup ecx/edx visible avant).
- `UNCERTAIN 0x6a2832/0x6a289e` : effet exact des thunks sub_460860
  (MVMVA-like 0x12) — seuls les codes poussés (0x49E012 / 0x480012) sont
  certains.
- `UNCERTAIN 0x6a27b3/0x6a2812` : signification métier de p[1] (compteur
  d'itérations), p[3] (sélecteur de banque), p[4] (nombre d'entrées de 0x20
  octets) — bornes prouvées par l'ASM, sémantique non (rôle A/V/R).
- `UNCERTAIN 0x6a2772` : contenu de dword_1D98B3C et de [a1+0x7C] inconnu.
- `UNCERTAIN 0x6a2820/0x6a288c` : type exact du récepteur de Field_readCa /
  Camera_ReadVariables_Space (int* vs struct scratch*) — hypothèse de
  lisibilité, 1 arg prouvé par le batching `add esp,28h`.
