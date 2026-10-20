# M1_RETRAIT_CSHARP_BILAN — `rms-m1-retrait-csharp-20261020`

Date : 2026-10-20. Statut final : **VERIFIED_NOT_INTEGRATED** — A09 tranché par
l'utilisateur (le RMS = la route statique `@re-ff8/mission-harness` ; 0 des 57
familles BLOCKED n'est requise sur main, V01/V04 renvoyées à M2) ; candidat
vérifié ; gels C# retirés du checkout après préservation ; commits sur main
non effectués (autorisation Git non donnée à ce jour). Autorité :
`ORDRE_MISSION_01_RETRAIT_CSHARP_20261020.md`. Rédigé par le superviseur après
vérification propre de chaque étape ; les statuts « done » des workers n'ont
jamais suffi.

## 1. Périmètre exact

**Fait** : inventaire C# exhaustif (T1), préservation byte-exacte du helper Windows
en branche dédiée (T2), remplacements minimaux portant une tranche Q1 autonome avec
oracles indépendants (T3), review indépendante (CONFORME, zéro défaut), vérification
réelle A/B en espaces neufs (T4 + contrôles superviseur), contrôle zéro C# par
contenu. **Non fait** : aucun retrait de fichier (voir §2), aucun port des 57
familles bloquées, aucun exécutable compilé, aucune intégration Git à main
(aucune autorisation reçue), aucun push/amend/réécriture.

## 2. Décision structurante : le « retrait » est vide sur l'arbre livré

T1 a établi par lecture directe de HEAD/DIRC/packs (sans commande git) : les
**2 673 blobs trackés de `main` ne contiennent aucun `.cs`, aucun PE managé,
aucune commande de build .NET** (7 PE natifs + 7 COFF natifs uniquement ; les
`harness*.obj` racine sont natifs). Les **325 `.cs`** du checkout (34 contenus
distincts, 136 dossiers) étaient tous **hors index**, sous `.tmp/` et `inputs/` —
gels d'evidence, hors du contenu livré de main. Le critère 1 de l'ordre (« zéro
C# dans le contenu livré de main ») était donc **déjà satisfait à HEAD** et
reste satisfait sur le candidat T3. **Aucun `.cs` n'a été supprimé ou déplacé
pendant T1–T3** ; le retrait physique des gels du checkout a ensuite été exécuté
sur autorisation utilisateur dédiée, après préservation byte-exacte (voir §7.2
et `M1_RETRAIT_GELS_20261020.json`) : les preuves vivent désormais dans la
branche `dev/windows-process-supervision`, hashées et retrouvables.

## 3. Remplacements livrés (T3, reviewés)

- `tools/ff8-harness/src/generic-target-primitives.ts` : primitifs purs Q1 —
  constantes/modes/refus (Q01), encodage d'argument/commande Windows (Q03/Q04 :
  bornes **128 arguments / 32 766 unités UTF-16**, pas octets ni points de code),
  comptage d'octets réellement fournis (sous-partie Q09). Aucun OS/fichier/
  processus/horloge/SDK appelé.
- `test/generic-target-primitives.test.ts` + `test/fixtures/generic-target-reference.json` :
  oracles **indépendants** — littéraux de la QA gelée R2/R3 (source `ce19bd43…`,
  QA `a3a910bf…`, `GuardianPredicates.PlainBounded` de `GuardianCore.cs` `7d4d2c66…`),
  autocontrôle SHA/longueur ; jamais les sorties du candidat. Adaptation d'interface
  documentée : `bool + out` → `{ok,value}` / `{ok,totalBytes}` (refus → `value:null`,
  total remis à zéro).
- `package.json` : **une seule ligne** ajoutée (`test:q1-primitives`) — préimage
  pré-T3 reconstruite et vérifiée : `33781202…` exact. Tout autre dirt de ce
  fichier préexiste (travail utilisateur, non touché).
- `README.md` : section d'identification du paquet/portée/limites ; le reste du
  fichier byte-identique à l'archive (vérifié par la review).

## 4. Correspondance de couverture (mapping 112 familles, `M1_REMPLACEMENTS_20261020.json`)

| Disposition | Familles |
|---|---|
| TS inchangées (déjà C#-free, tests existants) | 39 |
| Portées avec équivalent vérifié (Q01/Q03/Q04) | 3 |
| Autocontrôle de référence seulement (Q02) | 1 |
| PARTIAL_BLOCKED (Q09 : 10 sous-cas réels portés, famille incomplète) | 1 |
| **BLOCKED — pas d'équivalent C#-free livré** | **57** |
| Windows archivées (helper préservé, aucune équivalence revendiquée sur main) | 8 |
| Plans jamais qualifiés | 3 |

Les BLOCKED couvrent notamment : environnement/comparaison `OrdinalIgnoreCase`
.NET 4 complet, builder/canonical/politiques/priorité de refus Q1, broker
B01–B18, dual capture D01–D30, budget/capture/ledger/host partagés V01/V04.

## 5. Résultats réellement exécutés (reçus)

- `bun run test:q1-primitives` : **55 PASS / 0 FAIL / 125 expect / exit 0** —
  obtenu 4 fois indépendantes (worker T3, review, superviseur au checkout,
  superviseur sur espace C isolé).
- `bun run typecheck` : **exit 0** — ×4 (Bun 1.4.2, TS 5.9.3).
- **A/B isolant T3** (espaces superviseur à méthode identique, junction
  `node_modules`, suite complète bornée 300 s) :
  - B = baseline `bba8eb9` : 931 tests / 28 fichiers — 923 PASS / 4 SKIP / **4 FAIL** / 76 321 expect
  - C = baseline + delta T3 seul : 986 tests / 29 fichiers — 978 PASS / 4 SKIP / **4 FAIL** / 76 446 expect
  - **Delta = exactement +55 tests tous verts, FAIL et SKIP inchangés → zéro
    régression T3.** Les 4 FAIL (identiques B/C) nommés ci-dessous se sont
    révélés être des **artefacts de données** de MES espaces (gels data-only
    `raw98` absents), pas des échecs de HEAD.
  - `L2-FIX-MAX final QA regressions > NQA07`, `> RV2MAX03`,
    `> NQA07 positive control`, `L7 interop … raw98 PARTIAL/quarantined`.
- **Qualification finale T4 phase 3** (fixture `raw98` — 99 JSON, 1,67 Mo,
  manifest `79790bef…` — injectée et hashée à l'identique dans les trois
  espaces ; JSON complet 1 644 852 B, SHA `133b647a669de9d093556016575fc3bc97f8da2eed84ecea30344eda089da27e`) :
  - HEAD `bba8eb9` : 930 PASS / **0 FAIL** / 1 SKIP (77 454 assertions, 174,7 s, exit 0)
  - C = HEAD + T3 : 985 PASS / **0 FAIL** / 1 SKIP (77 579 assertions, 163,8 s, exit 0)
  - candidat-repo = HEAD + travail utilisateur + T3 : 1 209 PASS / **0 FAIL** / 1 SKIP (79 703 assertions, 213,0 s, exit 0)
  - Comparaison nominative : HEAD→C conserve exactement les 931 identités/statuts
    (930 PASS + 1 SKIP historique cross-project Ensemble — garde intacte, rien
    d'acquis par ce SKIP), seuls +55 Q1 / +125 assertions ; C→candidat conserve
    les 986 identités, +224 PASS du travail utilisateur.
- **Audit zéro C# du candidate-repo ENTIER** (T4) : 3 948 fichiers / 107 232 736 octets
  — 0 `.cs`, 0 source C# embarquée détectée, 8 PE natifs relus (headers/CLR),
  0 PE managé, 0 commande .NET réelle ; 3 faux positifs lexicaux explicités.
- **Contrôle zéro C# candidat** (T4, par contenu) : 3 843 fichiers, 0 `.cs`,
  8 PE natifs relus (headers/CLR), 0 PE managé, 0 commande .NET réelle ; 3 faux
  positifs lexicaux justifiés. Portée : harness + dépendances — le contrôle
  dépôt entier est celui de T1 (HEAD).
- Reçus T4 complets : `M1_VERIFICATION_20261020.json` (603 180 B,
  SHA `5407c193…e639a9`) — le premier A/B de T4 (baseline tronquée à 60 s vs
  candidat non-structuré à 144 ENOENT) est **conservé comme artefact de
  méthode**, non comparable, et n'a servi à aucune conclusion.

## 6. Limites et écarts

- **A09 ouvert** : aucune installation « plugin RMS OpenCode V2 générique »
  identifiée ; le seul paquet produit confirmé est `@re-ff8/mission-harness`
  (Bun/TS, route statique sans C#). Tant que A09 n'est pas tranché, l'entrée
  « requise par le RMS » de la règle §5C ne peut pas être close.
- Pas de qualification **globale** de couverture (l'ordre l'exige explicitement
  de ne pas la prétendre) : la comparabilité complète des trois espaces n'a pas
  été établie (T4 premier A/B non comparable ; l'isolation T3 l'a été par mes
  espaces B/C).
- Orchestration : auto-dispatch initial du harness a lancé T3/T4 prématurément
  (workers `pool-1`/`pool-2` à base divergente `8e44fe0`) — arrêtés par ordre
  direct (shutdown refusé par le harness : « could not preserve », noté) ; aucun
  de leurs worktree n'a été modifié (vérifié propre). T2/T3/T4 ont été refaites
  en sériel contrôlé. Notifications d'équipe bruitées (pings sans contenu).
- Attribution temporelle `package.json` : résolue par reconstruction byte-exacte
  (§3). `README.md` : idem via review.

## 7. Reste à faire et conditions de déblocage

1. **A09 — TRANCHÉ** (utilisateur, 2026-10-20) : le RMS visé est la route
   statique `@re-ff8/mission-harness` ; **0 des 57 familles BLOCKED n'est
   requise sur main** ; V01/V04 (invariants partagés) renvoyées à la
   définition de M2.
2. **Retrait des gels exécuté** (même jour, autorisation utilisateur :
   « elles doivent alors disparaître de la branche main ») : 1 261 fichiers
   non trackés d'origine interne supprimés du checkout — strictement les
   copies du manifest T2, re-vérifiées hash par fichier avant suppression,
   reçu `M1_RETRAIT_GELS_20261020.json` (`f7358599…`) écrit avant toute
   suppression ; **0 `.cs` restant dans le checkout** ; exclus et conservés :
   les 40 docs trackés (§2 : mentions historiques permises) et les livrables
   `M1_INVENTAIRE_*`. Les 43+19 copies d'origine Temp (hors dépôt) ne sont
   pas concernées.
3. **Autorisation Git explicite** pour intégrer le candidat à `main` (delta
   T3 + livrables M1) — attention : `package.json`/`README.md` portent du
   dirt utilisateur préexistant ; intégrer ces fichiers embarquerait ce dirt,
   sauf staging chirurgical par hunk — décision utilisateur.
4. Alors seulement : revérification post-intégration → `ACCEPTED_INTEGRATED` →
   M2. Aucun GO M2 accordé par ce bilan.

## 8. Table des reçus (SHA-256)

| Reçu | SHA-256 |
|---|---|
| `M1_INVENTAIRE_CSHARP_20261020.md` | `43b65aaf000be1f079419c0a0a138f7900ddb61ac7c6861aeca2cc543e955b3c` |
| `M1_INVENTAIRE_CSHARP_20261020.json` | `8909834645cf837ac59e996f2579626a326a4d004c7124b8013d9e2f67972c57` |
| `M1_HELPER_PRESERVATION_20261020.md` | `e15f4a299aa2fc3db3778e375cdad8e4918c93ee3a84d1c41a23e0ff0f252024` |
| `M1_HELPER_PRESERVATION_20261020.json` | `b4493b8b2e0931f831f1b6cfa880620a3a59f19e97aacd2a571d6f2b030fe1b3` |
| `M1_REMPLACEMENTS_20261020.md` | `192f9deb3a72847279f7b609acaad04e76ee850cc7c695610898efcefad84987` |
| `M1_REMPLACEMENTS_20261020.json` | `fdeba708ab491795fd0c671f6d01cf190224a5f0f5ec6a8affebb3e1b7bb2eb7` |
| `M1_REVIEW_T3_20261020.md` | `ce66969b3e7fd3a67b2d396592851c3a4b6e1a3c27355da052200102b2ad5d13` |
| `M1_VERIFICATION_20261020.md` | `387046827607c64def47df43c4b3068ef86257b5fe640961fa25c35d7b3e4996` |
| `M1_VERIFICATION_20261020.json` | `d66d2d4c0dca88626c0e122f2592c879c4d0ccc6a08729c8778708d0cf6978c8` |

Empreintes de contrôle superviseur : diff pré-T3 `tools/ff8-harness`
`8b279da4cf18df555da037480edbfe32418b8d83` (38 entrées, liste gelée
`.tmp/mission-m1-control/baseline-ff8-harness-dirty.txt`, hash liste
`50f6e8945640fad6fb76f74063fce4c7af1af02cf33a8e314ae4d88c3787577d`) ;
préimage pré-T3 `package.json` `33781202f102a3ee570fd1d1a96c6c98fbfa1fa0b69f9fb68f5d6f477f77ea4b`.
