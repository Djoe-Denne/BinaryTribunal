# Lot 23 — dossier stage0/depth, offline et sans installation

**NOT AUTHORIZED / BLOCKED.** Ce dossier n'est ni un installer, ni une carte
exécutable. Aucun hook, patch de vtable, nouveau writer ou mutation IDB.
Les modèles sur buffers ne constituent pas une preuve de sécurité runtime.

## 1. Identités et correction d'adresses

Preuve native IDA en lecture seule : `lot23/stage0_static_evidence.json`.
Les 62 octets de la fonction dans l'IDB sont identiques au fichier EXE disque.

- EXE SHA-256 : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- ImageBase de l'image analysée : **`0x400000`**.
- Entrée IDA/VA préférée : **`0x41EF3C`** ; RVA : **`0x1EF3C`**.
- Site bind : VA `0x41EF5D`, RVA `0x1EF5D` ; site unbind : VA `0x41EF72`,
  RVA `0x1EF72`. Un futur VA runtime serait `module_base + RVA`, jamais
  `module_base + 0x41EF3C`.
- Le file offset `0x1EF3C` coïncide ici avec le RVA ; cette égalité constatée
  dans ce PE ne doit pas être généralisée.
- **Erratum du rapport Lot 22 §5** : « RVA EXE `0x41EF3C` » désignait une
  adresse IDA/VA. La présente normalisation remplace cette mention pour toute
  étude future ; les preuves historiques ne sont pas réécrites.

Préimage complète de la fonction `[0x41EF3C, 0x41EF7A)` :

```text
55 8B EC 83 7D 0C 00 74 33 83 7D 08 00 74 1A
8B 45 08 8B 48 0C 51 6A 00 8B 55 0C 8B 02
8B 4D 0C 51 FF 90 98 00 00 00 EB 13 6A 00
6A 00 8B 55 0C 8B 02 8B 4D 0C 51 FF 90 98
00 00 00 5D C3
```

Le préfixe de 15 octets a les longueurs **1, 2, 4, 2, 4, 2**. Le JZ
`0x41EF43` vise `0x41EF78` ; celui de `0x41EF49` vise `0x41EF65`.
Les deux cibles sont externes au préfixe `[0x41EF3C, 0x41EF4B)`.
Une copie brute de ces 15 octets est donc **interdite**.

## 2. ABI et chemins, sans succès device inventé

- Deux arguments de pile, ordre cdecl : `texobj`, `device`. Les trois calls
  directs (`0x41ED8B`, `0x41EF0E`, `0x41EF20`, dans `sub_41ED69`) poussent
  device puis texobj, puis font `add esp,8`. L'entrée sauve EBP, la sortie
  restaure EBP et fait `C3`, pas `ret 8`.
- `device == 0` : sortie précoce à `0x41EF78`, **aucun appel device**. Ce
  chemin ne signifie pas unbind et ne fournit pas un HRESULT valide.
- `device != 0 && texobj != 0` : lecture native `[texobj+0x0C]`, puis pushes
  texture, stage `0`, device ; call `[deviceVT+0x98]` à `0x41EF5D`.
- `device != 0 && texobj == 0` : texture `0`, stage `0`, device ; **second
  call** au même offset à `0x41EF72`. Observer uniquement `0x41EF5D` perdrait
  les unbinds.
- Les callers immédiats ne testent pas EAX ; `sub_41ED69` peut le propager
  vers ses callers. Ne pas supposer qu'une instrumentation peut le détruire.
  Le résultat EAX du call device doit être préservé, ainsi que l'état pile,
  registres, flags et tout état FPU/SIMD touché par l'observateur.
- Le layout du SDK `IDirect3DDevice3` est compatible avec SetRenderState
  `+0x58` et SetTexture `+0x98` (`lot23/depth_static_mapping.json`). L'ABI
  COM exige de préserver les trois arguments et leur nettoyage ; les seuls
  buffers de relogement ne démontrent pas cette transparence sur CPU.

Un bind demandé, une gate observée après forward et un HRESULT d'un autre
appel ne sont pas un bind appliqué. Le candidat `0x5641` ne capture pas ce
HRESULT ni le token stage0 à T_draw : **applied et stage0 restent unavailable**.

## 3. Comparaison de deux ancrages passifs possibles

**A — entrée, préfixe 15 octets.** Couvre bind, unbind et retour sans device,
mais nécessite un relocator correct pour les deux JZ rel8 externes, et un
témoin du chemin/retour effectif. L'infrastructure E8-rel32-only décrite au
Lot 22 est insuffisante. Un logger d'entrée seul ne prouve pas applied.

**B — les deux sites de call device.** Deux plages de six octets
`FF 90 98 00 00 00`, respectivement `[0x41EF5D,0x41EF63)` et
`[0x41EF72,0x41EF78)`. Pas de JZ copié, mais deux surfaces possédées et
une substitution de call indirect qui doit préserver arguments, cleanup,
EAX, exceptions et reentrance. **Le relocator expérimental refuse ces calls
indirects** ; il ne constitue donc pas leur implémentation.

Le scan statique `lot23/anchor_interior_xrefs.json` ne trouve pas de code-xref
externe vers l'intérieur des trois plages. Il ne ferme pas les branches
indirectes ni une preuve de contrôle de flux runtime. Le retour commun de
deux octets `[0x41EF78,0x41EF7A)` n'offre pas une plage de cinq octets : ne pas
déborder sur la fonction suivante.

**Décision : aucun ancrage de production choisi ou installé.** A peut faire
l'objet d'un test de relogement sur bytes ; B requiert un dossier de call-site
distinct. Toute future implémentation exige une autorisation séparée, un
contrat/candidat séparé et un build-id libre vérifié. `0x5642` n'est pas réservé.

## 4. Tokens et invalidations

- `texobj` est le token objet wrapper ; `[texobj+0x0C]` est l'objet texture
  passé au device ; `[texobj+0x98]` est le token données **T** corrélable à TR08.
  Ne pas confondre ces trois identités, ni les traiter comme des EA statiques.
- Toute lecture du lien T doit être gardée et son échec visible. Une future
  observation doit porter contexte/device, provenance, ordinal/offset/epoch,
  chemin réellement atteint et résultat pertinent. Pas de deref pour déduire
  un token absent, pas de texture de fallback pour slot 49.
- Zéro observé, unbind avec device présent, unseen et unavailable sont quatre
  situations distinctes. Une ressource TR08 future, d'un autre contexte ou
  device ne ferme pas la corrélation à T_draw.
- Init/uninit sont observables dans le codec actuel. Changement device,
  reset/perte de surface et device-lost ne sont pas des invalidations stage0
  capturées. Les pertes/ring/cap invalident la confiance de façon persistante.
  Aucun réancrage complet n'est encodé dans `0x5641`.

Les tests `stage0_offline.py` seront des simulations sur tokens fournis et
bytearrays, **pas** un lecteur de processus ni une extension ST09.

## 5. Depth : progrès statique documentaire seulement

ASM natif, tous les bytes de la fonction `0x440FF0` comparés au fichier EXE :
`lot23/rs_static_evidence.json`. Enum et layout SDK, avec hashes des headers :
`lot23/depth_static_mapping.json`.

- Raw type **15** → case `0x44133C` : bool `raw != 0` poussé pour état
  device **7** à `0x441356`, call `0x441361` ; puis valeur **4** et état
  **23** à `0x441364/0x441366`, call `0x441371`.
- Raw type **16** → case `0x441379` : bool `raw != 0` pour état **14** à
  `0x441393`, call `0x44139E`.
- SDK `d3dtypes.h` : 7 = ZENABLE, 14 = ZWRITEENABLE, 23 = ZFUNC ; comparaison
  4 = LESSEQUAL. Cela identifie **ce chemin statique**, pas une valeur effective
  observée à T_draw ni le succès des calls.

Les RS `0..25` et blend `0..4` restent **raw dans le codec et les readers**.
Les aliases depth exploitables restent indisponibles ; aucune politique
depth/blend/alpha n'est activée. Manquent encore association contexte/device,
état effectivement appliqué, Z/plage/convention, clear/cible, descripteurs blend,
alpha-test/stages/facteurs/op/color-write et stage0 exact. La connaissance
partielle de l'enum ne ferme ni le replay depth positif ni la fidélité UI.

## 6. Gates résiduelles

Tests sur buffers : **91 tests, exit 0**, capstone **5.0.6**,
`lot23/stage0_tests.json`. Relogement des deux JZ externes, cibles internes,
refus d'instructions non supportées, rollback partiel et readback sur bytearray,
corrélations guarded T/TR08/lifecycle sur tokens synthétiques. Les fonctions de
copie, rollback et ledger ne touchent jamais de mémoire de processus vivant.
Ces tests ne prouvent ni une exécution CPU du trampoline ni la transparence des
registres/stack/flags/FPU/SIMD. Même verts, ils ne dispensent
jamais de prouver : préimages de toutes les plages possédées, allowlist,
readback après chaque écriture, rollback partiel/restauration byte-exacte,
processus frais sans debugger, hashes EXE/DLL et hash post-copie, processus
vivant/detach, rejet des témoins contradictoires et effet du même frame.
La carte future reste **NOT AUTHORIZED / BLOCKED**.
