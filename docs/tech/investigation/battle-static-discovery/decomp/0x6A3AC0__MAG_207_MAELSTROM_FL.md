# MAG_207_MAELSTROM_FL @ 0x6A3AC0

- Instr (live): 5 (19 o, 0x6A3AC0-0x6A3AD2)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - stub FL de l'effet 207 : charge mag206.tim via IO_GetFile_MAGIC (0x6A3AC5) dans l'arene magie partagee, stocke le pointeur dans dword_25102C4 (0x6A3ACD) ; reference depuis MagicList_TextureLoad (xref data 0xC81DB8) et BattleGF_LoadCallbackByMagicID (0x50AF93 code), meme pattern que les jumeaux fermes 0x69EAD0 (mag212.tim->2510174) et 0x6A0D30 (mag211.tim->25101F8)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: MAG_207_MAELSTROM_FL\nTYPE ; proposition: MAG_207_MAELSTROM_FL
- Notes parent: checks 5.6 OK (role P) : 5 instr integrales lues au sol (0x6A3AC0-D2), add esp,4 (0x6A3ACA), store plein dword, callers code+data verifieurs ; CERTAIN pose par la voix relancee (premiere tentative morte a 15 min, relance opencode) ; incident journalise

## C reconcilie

```c
/* c_a.c — rôle voix A (reconstruction C depuis l'ASM live)
 * EA      : 0x6A3AC0  MAG_207_MAELSTROM_FL
 * Mode    : stub MAG_207_FL (1+P) — famille mag FX battle
 * Ground truth : asm.asm (5 instr live). hexrays.c = vérificateur SEULEMENT.
 * Taille  : 0x13 (19 octets) — stub complet, rien d'autre.
 *
 * Rôle : chargeur unique d'asset pour le sort MAG_207 (MAELSTROM).
 *        Poussée cdecl d'un seul arg (pointeur string "mag206.tim"),
 *        appel IO_GetFile_MAGIC, stockage du handle de retour dans le
 *        global dword_25102C4 (slot mag 207), puis retn.
 *
 * Convergence jumeaux fermés :
 *   - 0x69EAD0 MAG_213_FL -> IO_GetFile_MAGIC("mag212.tim") -> dword_2510174
 *   - 0x6A0D30 MAG_212_FL -> IO_GetFile_MAGIC("mag211.tim") -> dword_25101F8
 *   - Ici : mag206.tim -> dword_25102C4 (offsets slots contigus, cohérent).
 *
 * Divergence Hex-Rays : Hex-Rays déclare le retour `unsigned __int8 *`
 * et une fonction retournant ce pointeur ; l'ASM n'a aucun post-traitement
 * de EAX avant `retn` (EAX traverse le retour tel quel). Le prototype IDA
 * meta.json dit 'int()'. On garde le retour EAX tel quel (largeur 32 bits),
 * sans préjuger du type pointé réel de la ressource.
 *
 * Le call de 0xc81db8 (xref data) suggère que MAG_207_MAELSTROM_FL est
 * aussi référencé par une table (pattern identique aux jumeaux).
 */

/* ---- externes ---- */
/* IO_GetFile_MAGIC(const char *name) : retourne un handle/pointeur 32 bits
 * (largeur exacte non prouvée ici, EAX seul utilisé). */
extern unsigned int IO_GetFile_MAGIC(const char *name);

extern unsigned int dword_25102C4; /* slot handle mag 207 (0x25102C4) */

/* ---- fonction reconstruite ---- */
unsigned int MAG_207_MAELSTROM_FL(void)
{
    dword_25102C4 = IO_GetFile_MAGIC("mag206.tim");
    return dword_25102C4; /* EAX = valeur stockée, traversée telle quelle */
}

/* UNCERTAIN 0x6A3AC0 : largeur/type exact du retour de IO_GetFile_MAGIC
 * (Hex-Rays dit 'unsigned __int8 *', ASM ne montre que EAX 32 bits non
 * requalifié) — type de pointeur de la ressource mag206.tim non prouvé.
 * UNCERTAIN 0x6A3AC0 : rôle exact de dword_25102C4 (handle opaque, non
 * déréférencé dans ce stub).
 */
```

## Analyse semantique

# Sémantique MAG_207_MAELSTROM_FL @ 0x6A3AC0 (analyse A, mode B aveugle)

- Rôle (1 phrase) : stub de chargement de texture battle pour la magie MAG 207 (Maelstrom, nommé "FL" = FX load) — charge `mag206.tim` via `IO_GetFile_MAGIC` et stocke le pointeur/offset retourné (EAX) dans le slot global `dword_25102C4`.
- Confiance : CERTAIN
- Nom catalogue : confirme (le suffixe `MAELSTROM`/FL suit exactement le pattern des jumeaux fermés MAG_213_FL et MAG_212_FL — même formation `IO_GetFile_MAGIC("<nom>.tim")` + stockage global à une adresse distincte ; nom aligné avec la famille mag FX battle).

## In / Out / Effets
- In : aucun paramètre (func end ; pas de lecture d'argument). Callee prend 1 argument cdecl poussé immédiatement : `push offset aMag206Tim` avant `call IO_GetFile_MAGIC` puis `add esp, 4` (nettoyage cdecl, 1×4 octets).
- Out : aucune valeur de retour utile (EAX résultant de `IO_GetFile_MAGIC` est recopié dans le global, pas retouné à l'appelant ; pas d'instruction post-stockage).
- Effets : écriture du pointeur vers les octets chargés de `mag206.tim` dans `dword_25102C4` (globals.txt le type comme `unsigned __int8 *` à 0x25102C4). Aucun autre side-effect (pas d'appel secondaire, callees.txt liste une seule entrée).

## Corpus ASM (tout le body, 5 instructions, matching meta length)
```
6a3ac0  push    offset aMag206Tim; "mag206.tim"
6a3ac5  call    IO_GetFile_MAGIC; Call Procedure
6a3aca  add     esp, 4
6a3acd  mov     dword_25102C4, eax
6a3ad2  retn
```

## Preuves (5, adresses exactes — ≥2 ASM requises, fournies)
1. `0x6A3AC0 push offset aMag206Tim` — nom fichier `mag206.tim` : confirme la correspondance MAG_207 → mag206.tim (index 207 → fichier tim 206, même décalage -1 que les jumeaux : 213→mag212.tim, 212→mag211.tim).
2. `0x6A3AC5 call IO_GetFile_MAGIC` — callee unique, présent et seul dans callees.txt (cohérence vérifiée : `CALLS:` puis la ligne `6a3ac5 call IO_GetFile_MAGIC`).
3. `0x6A3ACA add esp, 4` — appel cdecl avec exactement 1 argument de 4 octets (le pointeur vers la chaîne "mag206.tim"), conforme au pattern famille.
4. `0x6A3ACD mov dword_25102C4, eax` — le handle/pointeur de texture est persisté dans un global dédié (0x25102C4), analogue à `dword_2510174` (MAG_213) et `dword_25101F8` (MAG_212).
5. `callers.txt` — caller unique code `0x50AF93` dans `BattleGF_LoadCallbackByMagicID` (0x97 octets) + xref data `0xC81DB8` dans la table `MagicList_TextureLoad` ; c'est exactement le shéma des jumeaux fermés CERTAIN (xref data attendue dans cette table).

## Checks
- Callees : `IO_GetFile_MAGIC` (ligne 6a3ac5) — présent dans callees.txt ✅ ; pas d'appel inventé ✅.
- Largeur retour : EAX = 32 bits, mais non propagé à l'appelant (sur chromosome : mov→global puis retn, pas de mov après, donc retour non exploité) — largeur "aucun" ✅.
- Stats frame / prototype : func end (frame size 0, pad 0), `add esp, 4` seul nettoyage, cohérent avec meta length 0x13 = 19 bytes (0x6A3AD2+2 ferme sur 0x6A3AD4 = 0x6A3AC0+0x14 — aligné à la fin, 19 instructions-bytes) ✅.
- xref data `0xC81DB8` = adresse exacte attendue dans la table `MagicList_TextureLoad` pour ce slot ✅.

## Questions ouvertes
- (aucune bloquante) — le contenu exact de la struttura/tampon derrière `dword_25102C4` (simple data pointer vs struct) est hors scope de cette fonction : elle stocke EAX tel quel.

## IDBCOMMENT (proposition, markdown seul, PAS de rename appliqué)
RDOC pour traiter par l'orchestrateur :
```
IDBCOMMENT: Stub battle mag FX : charge mag206.tim par IO_GetFile_MAGIC et stocke le pointeur resultat dans dword_25102C4 (slot texture MAG 207 Maelstrom). Reference depuis MagicList_TextureLoad (0xC81DB8) et BattleGF_LoadCallbackByMagicID, meme pattern que MAG_212_FL / MAG_213_FL. [semantic-triple 2026-09-21]
```

## Nom proposé (markdown seul, PAS de rename)
`MAG_207_MAELSTROM_FL` — confirmé. Justification ≥2 preuves ASM :
1. `0x6A3AC0 push offset aMag206Tim` (nom fichier mag206.tim, décalage -1 vs 207, pattern famille).
2. `0x6A3ACD mov dword_25102C4, eax` (global unique attribué = slot FL persistant, comme les jumeaux).
Aucun rename nécessaire : le nom actuel est déjà précis (stub de chargement MAG 207).
