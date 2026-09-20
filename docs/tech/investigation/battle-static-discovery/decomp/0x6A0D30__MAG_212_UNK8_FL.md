# MAG_212_UNK8_FL @ 0x6A0D30

- Instr (live): 5 (19 o, 0x6A0D30-0x6A0D42)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - loader stub de l'effet 212 (slot 211, offset id-1) : charge mag211.tim via IO_GetFile_MAGIC (0x6A0D35) dans l'arene magie partagee, stocke le pointeur dans dword_25101F8 (0x6A0D3D) et le retourne en EAX ; appele par BattleGF_LoadCallbackByMagicID (0x50AF93) depuis la table MagicList_TextureLoad (xref data 0xC81DB8)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: MAG_212_UNK8_FL\nTYPE ; proposition: MAG_212_UNK8_FL
- Notes parent: checks 5.6 OK (role P) : 5 instr integrales lues au sol (0x6A0D30-42), add esp,4 (0x6A0D3A), store plein dword, callers code+data verifieurs, convergence c_a/sem_a (CERTAIN pose par la voix, nom IDA confirme, regle slot 0-based = id-1 alignee sur 0x69EAD0 mag212.tim)

## C reconcilie

```c
// =============================================================================
// 0x6A0D30 — MAG_212_UNK8_FL (label IDA ; « MAG_212_FL » dans le dispatch parent)
// Stub magie 212, mode 1+P — loader fichier .tim via IO_GetFile_MAGIC.
// =============================================================================
// Ground truth = live ASM (asm.asm) + ida_dump_bytes, NOT Hex-Rays
// (hexrays.c utilisé comme vérificateur seulement ; ici il concorde à 100 %).
//
// Taille live : 19 octets (0x6A0D30..0x6A0D42), 5 instructions. Type IDA déclaré
// 'int()' dans meta.json, mais l'ASM prouve un retour 32 bits plein : EAX
// (retour de IO_GetFile_MAGIC) n'est pas écrasé avant le `retn` → la fonction
// retourne ce pointeur. Hex-Rays le restitue en `unsigned __int8 *`, cohérent
// avec le type IDA du global dword_25101F8 ('unsigned __int8 *').
//
// Séquence live (Intel + labels IDA) :
//   6a0d30  push    offset aMag211Tim      ; "mag211.tim"
//   6a0d35  call    IO_GetFile_MAGIC
//   6a0d3a  add     esp, 4                 ; nettoyage cdecl : 1 arg, 4 octets
//   6a0d3d  mov     dword_25101F8, eax     ; cache global du fichier chargé
//   6a0d42  retn
//
// Contexte dispatch : xref data depuis 0xC81DB8 (table magie base 0xC81AC0 =
// magie 212 ; convention fichiers = id-1, d'où "mag211.tim" et non mag212.tim).
// Appelant code unique : BattleGF_LoadCallbackByMagicID @ 0x50AF93.
// Frère 0x6A0D20 (MAG_212_UNK8) = thunk pur vers sub_6A0D50, autre branche.
// =============================================================================

// --- Externes (rôles prouvés par l'ASM live) ---------------------------------

// Callee directe, cdecl confirmé par `add esp, 4` (1 arg poussé droite→gauche).
// Retour EAX stocké tel quel dans un dword → pointeur/buffer 32 bits.
extern unsigned __int8 *IO_GetFile_MAGIC(const char *filename);

// Littéral référencé par `push offset` (label IDA aMag211Tim).
extern const char aMag211Tim[]; // "mag211.tim"

// Global de sortie @ 0x25101F8, type IDA 'unsigned __int8 *'.
// Homologue : dword_2510174 pour MAG_213_FL @ 0x69EAD0 (fichier mag212.tim).
extern unsigned __int8 *dword_25101F8;

// --- C réconcilié ------------------------------------------------------------

unsigned __int8 *MAG_212_UNK8_FL(void)
{
    // charge "mag211.tim" (magie 212, offset id-1 dans la table 0xC81AC0)
    unsigned __int8 *result = IO_GetFile_MAGIC(aMag211Tim); // 6a0d30..6a0d3a
    dword_25101F8 = result;                                 // 6a0d3d
    return result;                                          // 6a0d42 : EAX vivant au retn
}
```

## Analyse semantique

# Sémantique MAG_212_UNK8_FL @ 0x6A0D30 (analyse A)

- Rôle (1 phrase) : loader `_FL` stub du slot 211 — charge le fichier unique `mag211.tim` via `IO_GetFile_MAGIC` dans l'arène magie partagée et stocke le pointeur arena dans le global dédié `dword_25101F8`, retour = pointeur arena (EAX).
- Confiance : CERTAIN
- Nom catalogue : confirme (dans les conventions documentées). IDA `MAG_212_UNK8_FL` avec littéral `mag211.tim` n'est PAS un mensonge : règle wiki « le littéral mag* et le numéro de slot font foi ». Slot 0-based 211 → effect_id 212 = MAG_212. Frère 0x69EAD0 (MAG_213_FL ← mag212.tim, slot 212 → id 213) suit exactement le même décalage systématique. Le suffixe `UNK8` reste vague mais cohérent (poly déchargé à l'entry, pas au loader).
- In / Out / Effets :
  - In : aucun (cdecl `int(void)`), 5 instructions, pas d'args.
  - Out : EAX = pointeur renvoyé par `IO_GetFile_MAGIC` (base 0x571B80 → `davAoyLoadMagicDataPlusBuffer` 0x571900) = base du `mag211.tim` bump-alloué dans l'arène 0x20DFAB8 ; largeur retour 32 bits pleine.
  - Effets de bord : alloue dans l'arène magie (advance `g_MagicArenaOffset` 0x21DFAB8 + alloc table), écrit le global `dword_25101F8` (typed `unsigned __int8 *` dans globals.txt).
- Preuves (ASM cité) :
  1. `6a0d30 push offset aMag211Tim; "mag211.tim"` — littéral fichier unique, cohérent avec le census wiki « 265 single-IO_GetFile_MAGIC loaders ».
  2. `6a0d35 call IO_GetFile_MAGIC` — callee présent dans callees.txt (`CALLS: 6a0d35 call IO_GetFile_MAGIC`) ; signature wiki `IO_GetFile_MAGIC(name)` → pointeur arena.
  3. `6a0d3a add esp, 4` — un seul arg cdecl (4 octets, pointeur chaîne), poussé droite→gauche ; aucune lib call inventée.
  4. `6a0d3d mov dword_25101F8, eax` — le global (dans globals.txt, typed `unsigned __int8 *`) reçoit le pointeur fichier ; gabarit identique au frère fermé 0x69EAD0 (`mag212.tim → dword_2510174`).
  5. `6a0d42 retn` avec `mov *, eax` juste avant — EAX = pointeur arena, retour 32 bits, pas de xor/alération ultérieure ; proto `int()` de meta.json cohérent.
  6. Xref data `0xC81DB8` (callers.txt) = base `MagicList_TextureLoad` documentée pour les loaders `_FL` (wiki, table « Registration: two parallel tables ») — registration comme loader du slot.
  7. Xref code `0x50af93` dans `BattleGF_LoadCallbackByMagicID` (`Magic_GetIDLoad` 0x50AF20, wiki) = le resolver qui invoque les loaders: convergence arbre haut.
- Checks : callee `IO_GetFile_MAGIC` présent dans callees.txt ✓ ; add esp = taille args (4) ✓ ; largeur retour EAX pleine (pointeur) ✓ ; wiki.md du pack vide (échec qmd) mais corroboration QMD `ff8-wiki` « GF Asset Loading And Authoring » alignée (naming rule slot, census single-loaders, xref 0xC81DB8 = MagicList_TextureLoad) ✓.
- Questions ouvertes : le contenu exact de `mag211.tim` (quelle GF/effet effect_id 212 au sens Zweck, le préfixe `MAG_NNN` étant notoirement sujet aux erreurs selon le wiki — ici toutefois aligné) ; le rôle du suffixe `UNK8` reste décoratif, sans incidence sémantique.
- IDBCOMMENT: Chargeur de fichiers pour l'effet 212 (slot 211): charge mag211.tim via IO_GetFile_MAGIC dans l'arena magie partagee et stocke le pointeur dans dword_25101F8. Retourne EAX = pointeur arena, appele par BattleGF_LoadCallbackByMagicID depuis la table MagicList_TextureLoad (xref data 0xC81DB8). Mono-fichier TIM, meme gabarit que le frere 0x69EAD0 (mag212.tim → dword_2510174). [semantic-triple 2026-09-20]
