# PROMPT — Drop test AF3DN.P (lot 12-ter, LIVE)

> Nouveau chat. Mission unique : faire charger **notre** driver par FF8 via le mécanisme natif
> AF3DN.P, et produire les premières captures de draw lists (Mode A observer).
> Tout est prêt : passthrough `48150a2`, ABI nommée par le crosswalk Aali/FFNx, P0 fermé live.

## 0. Établi (ne pas refaire)

- **Activation prouvée live** : le loader embarqué DotEmu charge `AF3DN.P` (renderer D3D9) ;
  factory `new_dll_graphics_driver` stockée `engine+0xBD0` ; present = slot 4 ; alternance du
  pointeur driver = argument du dispatch (normale, pas un bug).
- **ABI** : `driver-abi-spec.md` + `external-gfx-driver-sources.md` (struct `ff8_gfx_driver`
  d'Aali nomme les slots) + `ffnx-ea-crosswalk.md` (193 EAs, hash-bound 161/161,
  `VERSION_FF8_12_US_NV`).
- **Code** : `driver-passthrough/` — export `new_dll_graphics_driver` non décoré, 38 wrappers
  log+forward, capture/replay dry-run, build MSVC x86 documenté.

## 1. Préparation (jeu éteint)

1. **Doc** : aligner `driver-abi-spec.md` sur les noms de slots du crosswalk (commit doc).
2. **Build** : `gfx_driver_passthrough.dll` x86 Release ; `dumpbin /exports` →
   `new_dll_graphics_driver` non décoré.
3. **Copie de test dédiée, SANS FFNx** — la copie opérateur en a un (requalification P0) :
   vérifier absence de `ddraw.dll`/`opengl32.dll`/`d3d9.dll` locaux et d'un `AF3DN.P` résiduel.
   **Ne jamais toucher à la copie hash-bound des campagnes d'évidence (`064d466b…`).**
4. **Déploiement** : notre DLL renommée `AF3DN.P` à l'emplacement exact attendu par le loader
   (racine du jeu — confirmer depuis les findings P0/FFNx avant le premier boot).

## 2. Run de test (une seule session live à la fois)

Séquence : boot → menu (2 min) → field → 1 bataille → 1 sort → sortie propre.
Critères PASS, dans l'ordre :
1. Le jeu boote et les logs montrent factory appelée **une fois**, objet driver alloué.
2. Slots Init/BeginScene/SelectTarget/LeaveScene/Present loggés à la cadence attendue.
3. Draw lists capturées (CSV/JSON non vides) au menu ET en bataille.
4. 5 min de bataille sans crash ; rendu et HUD normaux (le forward est transparent — le rendu
   **natif continue**, on ne remplace rien).
5. **Aller-retour** : DLL retirée → reboot vanilla sans résidu.

## 3. Échecs attendus → réponses

- **Pas de chargement** : ordre de vérif — nom/emplacement AF3DN.P ; export non décoré ;
  signature `void* __cdecl f(engine)` ; config 36 B (`reserved[6]`, pas 9).
- **Crash au boot** : dernier slot loggé = suspect ; comparer à l'ordre de boot natif
  (CheckRegistry `0x401890` → `0x40942E` @`0x401905`) ; réduire aux wrappers passifs.
- **Alternance pointeur driver** : connue du P0, ne pas la traiter comme un bug.
- **Interdits** : patch de l'exe ; deuxième session live en parallèle ; debugger attaché
  pendant les runs ; modifier la copie hash-bound.

## 4. Livrables

- Rapport PASS/FAIL par critère + hashes (exe copie test + DLL) + extraits de logs + CSV.
- `driver-abi-spec.md` §activation mis à jour (chemin réel constaté) ;
  `driver-provenance.md` §P0 complété si résidu.
- Commit : code + docs ; logs volumineux hors git (`tools/_tmp_*`), extraits dans le rapport.
