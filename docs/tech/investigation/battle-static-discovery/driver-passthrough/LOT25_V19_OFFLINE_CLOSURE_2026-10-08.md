# Lot25 v19 — clôture offline et arrêt avant live

## Verdict

**READY_FOR_CONTROLLED_DIAGNOSTIC_LIVE_ONLY.** Les travaux offline nécessaires
à la prochaine campagne minimale de stabilité sont clôturés. Le jeu n'a pas été
lancé, le candidat n'a pas été déployé. Les captures complètes restent ouvertes.

Candidat : `lot25/v19/gfx_driver_passthrough.dll`, build **0x5648**,
**396800 octets**, SHA-256
`163e962d7f9355f61d1449b695119e94a928e616cdae54538fe0d2fa96d3d791`.

[Contrat et sources](lot25/v19/README.md) ·
[Carte live minimale](LIVE_CARD_lot25_v19_stability_2026-10-08.md) ·
[Audit indépendant](lot25/v19/offline-artifacts/independent_validation.json).

## Ce que les nouveaux tests v18 ont révélé

Neuf processus synthétiques, DLL v18 figée, hôte déplacé à `0x500000`.
Les preuves rouges sont conservées dans
[`v18-extra-1/receipt.json`](lot25/v19/offline-artifacts/v18-extra-1/receipt.json).

- **J rouge** : échec du second `VirtualProtect` lors du restore. Le retry
  prenait RWX pour protection « originale » et laissait la page RWX.
- **N rouge** : un stub bloqué dans le callee natif, puis libéré après restore,
  retournait au sixième octet restauré au lieu de `site+6`.
- **Q rouge** : le trampoline générique calculait le CALL relocalisé et son
  retour depuis l'EA nominal `0x400000`, pas depuis la base hôte réelle.
- **R rouge** : les vrais hooks Present/ODS de l'attach restaient E9 après un
  unload précédant le premier PIN stage0.
- **K/L/M/O/P verts** : échec de flush/retry, témoin LC18 IO refusé rejeté par
  le collector, vrai wrapper slot 1 et forward unique, voisin modifié préservé,
  activation concurrente sérialisée.

Ces résultats étendent la portée des anciennes gates ; ils ne réécrivent pas
leurs reçus. Ils ne démontrent pas la cause du crash historique
`dotemu_orig.DLL+0xDF52 / c0000005`. Relancer v18 instrumentée aurait conservé
des défauts déjà reproductibles hors jeu.

## Corrections et qualification v19

- DllMain passif ; activation post-load explicite et PIN réel avant E9/E8.
- Trampolines relocalisés depuis les VA réels, RX avant publication, conservés.
- Protection initiale mémorisée avant toutes les écritures, restaurable après
  échec de protection ou cache ; ownership conservé pendant les échecs.
- Identités stage0 immuables, retour `site+6` après restore concurrent,
  entrée directe et `ret 12` conservés.
- Transactions avec quiescence des autres threads et refus sur EIP dans la
  fenêtre ; dette `ResumeThread` conservée et récupérable.
- Backend natif direct ; observation par compteurs atomiques. Aucun proxy,
  fenêtre de dump ou replay depuis les chemins jeu/exportés.

Build MSVC x86 `/W3 /Ox /MT /LD /Zi /INCREMENTAL:NO /OPT:NOREF` : exit 0,
aucun warning du candidat. Les harnais héritent du warning MSVC C4325 de leur
pad synthétique `.text` ; ce warning n'est pas celui du candidat.

### Résultats finaux, même hash

- [`v19-native-final`](lot25/v19/offline-artifacts/v19-native-final/receipt.json) :
  **20 processus, 1355 checks, zéro échec**. Couvre notamment vrai E9 Present/ODS,
  relocation à `0x500000`, activation et restore, échecs PIN/protection/flush,
  refus de quiescence, dette de suspension, appels en cours, voisin modifié par
  un thread après la prise de préimage, octet étranger, constructeur natif direct,
  échecs post-write et rollback.
- [`v19-extra-final`](lot25/v19/offline-artifacts/v19-extra-final/receipt.json) :
  **6 processus, 333 checks, zéro échec**. Second VirtualProtect, flush, LC18
  refusé, vrai E8 en cours lors du restore, voisin modifié, activation concurrente.
- Total des deux profils natifs : **1688 checks**, 26 processus.
- [`v19-remote-final`](lot25/v19/offline-artifacts/v19-remote-final/receipt.json) :
  route de contrôle externe réelle dans un 27e hôte synthétique : **7 appels**
  query/activate/query/stage0/query/stop/query ; Present et ODS exécutés ;
  fenêtres finales identiques aux initiales, protections RX, références temporaires
  et allocations scratch libérées. **Deux refus d'identité** sans écriture.
  Les **35 checks de l'hôte** et sa paire LC18 ont aussi été revérifiés dans
  [`remote_independent_validation.json`](lot25/v19/offline-artifacts/remote_independent_validation.json).
- [`python_tests_receipt.json`](lot25/v19/offline-artifacts/python_tests_receipt.json) :
  **303 tests, zéro skip, exit 0**, fixtures historiques vérifiées par hash.

Le contrôleur `tools/af3dn_state/control_lot25_v19.py` exige PID+création,
hash du DLL chargé, PE32, image cible et absence de debugger. Il vérifie le
`.text` chargé avec correction des relocations, limite ses propres écritures
aux allocations scratch, conserve celles-ci si son thread est encore actif,
et appelle les exports cdecl sous une référence temporaire de module. Aucun
chargement de DLL, lancement du jeu ou appel manuel de constructeur natif.

### Audit indépendant

Vérification des logs natifs bruts, compteurs, exit codes, identités PID/build/hash,
copies chargées, sources liées au build et exports historiques (+ deux exports
DG19/stop). Désassemblage du candidat :

- un seul `ret 0xC` et un seul call natif `[eax+0x98]` dans le stub ;
- quatre références aux identités stables, aucune aux retours effacés ;
- incrément du retour connu avant `popad`, maintien du HRESULT ;
- DllMain ne rejoint ni PIN, ni installer, ni writer/proxy ;
- helpers de capture/proxy absents du linkage de ce candidat.

Le listing complet des fonctions propres au candidat est archivé dans
`offline-artifacts/final_candidate.asm.txt`. Le graphe produit reste une aide
d'audit des appels directs/IAT, pas un détecteur universel de loader lock.

Les tentatives intermédiaires restent archivées : première assertion E du
harnais trop stricte face à sa propre préimage volontairement corrompue,
déclaration dllexport incohérente avant passage aux pragmas existants, et deux
échecs du script d'audit (symbole de header PE puis HEAD concurrent). Aucun de
ces essais n'est substitué à une preuve verte du candidat final.

## Préservation et limites de clôture

Les **185 fichiers gelés** vérifiés incluent v18 et ses archives, les éléments
v17 désignés, `ff8dump.py`, `render_lot17.py`, `render_lot21.py` et les harnais
historiques. Le rollback installé reste
`3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19` ; aucun sidecar
stage0/dump du jeu n'a été armé. Le crash historique reste sans cause démontrée.

HEAD a avancé par une campagne sémantique concurrente de
`31b9f0035efc3482933074fe483f4ddb2c676fe2` vers
`a2f80267173594d0838cc927353905905ca00c2a` lors de l'audit : 25 chemins documentaires,
aucun dans les fichiers de cette tâche. La disparition de la ligne dirty du
ledger est expliquée par ces commits. Cette tâche n'a effectué ni commit ni push,
et ne prétend pas avoir gelé le contenu de ces travaux concurrents.
Ces commits ont continué pendant l'archivage ; le dernier relevé d'environnement
est conservé dans
[`final_environment.json`](lot25/v19/offline-artifacts/final_environment.json).

L'archive de travail contient **864 fichiers, 86531107 octets**, comparés un à un
à leurs sources temporaires. Elle conserve les essais rouges et intermédiaires.
Le [manifest final](lot25/v19/artifact_manifest.json) lie aussi les builds,
scripts courants, DLL canonique et documents de clôture ; son empreinte est
consignée dans le [reçu de clôture](lot25/v19/closure.json).

**Reste live** : couplage threads/loader/APIs de suspension du vrai jeu, backend
effectivement choisi, comportement en combat, preimages/readbacks/protections
réels, fermeture et stabilité après restore. **Reste ouvert pour les captures** :
ownership du proxy et objets natifs, accès concurrents aux writers et preuve
same-frame. Ces points ne sont pas promus par la désactivation des chemins de
capture dans v19. La prochaine action est la carte live liée ci-dessus.
