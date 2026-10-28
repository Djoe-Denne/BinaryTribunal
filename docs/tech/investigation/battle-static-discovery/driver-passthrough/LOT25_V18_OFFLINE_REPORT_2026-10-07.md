# Lot 25 v18 — prototype OFFLINE NO_HOT_UNLOAD

## Verdict

**Prototype compilé, gates stage0 A–I passées hors jeu ; LIVE GLOBAL BLOQUÉ.**
Le changement corrige le défaut de résidence stage0 reproduit en v17 dans les
contextes synthétiques testés. Il ne qualifie pas la durée de vie du driver
complet et n'attribue pas le crash WER antérieur à ce mécanisme.

Aucun déploiement, lancement FF8, armement de capture jeu, commit ou push.
Les hôtes natifs n'ont chargé que des copies dans `Temp/opencode`. Les
fixtures writer utilisent un ring synthétique et un faux backend, pas le jeu.

## Identité et compilation effective

Fork : [`lot25/v18/`](lot25/v18/README.md), build **`0x5646`**. Recherche exacte
dans le corpus commun `retro-eng` avant réservation : aucun build `0x5646`
ni `22086` ; `0x5645` était déjà un négatif de test, conservé comme tel.

- DLL : `d36f7366d16961adcf5ec670f840907d715fa28d687e3f67812cbc8cc7633265`
- Source C : `133a54701f6b5938b59806e4d86226ea0608dc9cdfcc2c3e127b14df25e2a5fa`
- Header : `313b6a0248ea1e7261816bea5269e65f71b3114f18d2e0c813c3fd0ec30bfef5`
- MAP : `5956898cec5548be9d89859ccb3cbefd71d3004e3a391de546bb2a5d2dc42687`

Build MSVC 2022 x86 `/W3 /Ox /MT /LD /Zi /INCREMENTAL:NO`, **exit 0**, aucun
warning dans stdout/stderr capturés. Script reproductible :
`tools/af3dn_state/build_lot25_v18.py` ; source, DLL/MAP/PDB, script CMD et reçu
dans `lot25/v18/build-20261007T143848Z-wnl6o82r/`. Le harnais lifecycle compilé
séparément `/W4` a seulement le warning C4325 sur la zone `.text` synthétique,
**exit 0** ; son placement réel est ensuite vérifié avant toute écriture.

Le parent a relu le code, les changements des sous-agents, les logs et reçus,
recalculé les hashes et exécuté lui-même toutes les gates natives finales.
Voir `parent_review_notes.md`, `asm_review.json`, `stub_abi_disasm.json` et
`unchanged_bodies.json` dans `lot25/v18/`.

## Changement prouvé

L'attach ne fait qu'enregistrer l'opt-in stage0. Le marqueur est persistant ;
sa présence commande l'opt-in, indépendamment de son contenu. Sans Present,
l'activation différée n'a pas été exercée : cela ne qualifie pas le fichier
de « vide ».

Le vrai détour Present existant et l'export explicite rejoignent un helper
unique. Ce dernier confirme le self-PIN **avant la première écriture E8**,
honore `nohook`, et ne tente l'activation qu'une fois par module. Les refus
sont terminaux ; la restauration annule également une activation en attente.
Les retries de restauration restent possibles. Le succès restaure six octets
par site et vérifie chaque fenêtre de 14 octets : **RESTORED_RETAINED**.

Le désassemblage confirme le PIN flags `5` à RVA `0x21E0`, le test de son
retour et du handle propre, puis l'appel installateur à `0x2210`. Le stub
appelle toujours `[eax+0x98]` et termine par `C2 0C 00` (`ret 12`).

## Gates natives A–H — réellement exécutées

Contrôleur : `tools/af3dn_state/gate_lot25_v18_lifecycle.py`, **exit 0**.
Harnais : `tools/af3dn_state/harness_lot25_v18_lifecycle.c`.
Workspace original : `C:\Users\djden\AppData\Local\Temp\opencode\lot25-v18-cgn8xd6f`.
Archive complète hash-vérifiée : [`lot25/v18/lifecycle-artifacts/`](lot25/v18/lifecycle-artifacts/receipt.json).
Huit processus indépendants, **860 checks, zéro échec** :

- **A — attach opt-in puis FreeLibrary, sans wrapper** : 50 checks, exit 0.
  Aucun PIN ni patch stage0 ; originaux 6/14 exacts, module absent, hôte vivant.
  LC18 distingue le detach dynamique (`reserved=0`).
- **B — activation explicite hors DllMain** : 126 checks, exit 0. Sans marqueur,
  deux Present restent inertes ; deux appels export donnent une seule activation.
  L'observateur IAT appelle le vrai PIN Windows et constate les fenêtres encore
  originales avant/après l'API. Après libération de l'unique référence obtenue
  par LoadLibrary, DLL toujours `MEM_IMAGE/MEM_COMMIT`. Aucun refcount artificiel
  conservé par le harnais. Absence de LC18 attendue sans opt-in à attach.
- **C — vrai chemin Present** : 121 checks, exit 0. Deux appels au **naked
  `GFXPT_PresentDetour` de production**, zéro appel export Install, un seul PIN,
  deux écritures E8 au total ; frame pulse et retour observés. La seule seam
  est la destination finale `g_pdTrampoline` vers une continuation synthétique,
  avec moteur non nul et backend nul. Ce cas valide le détour et son helper,
  pas la pose/lifetime du E9 Present dans le jeu.
- **D — restauration** : 130 checks, exit 0. Six octets exacts aux deux sites,
  readback indépendant des 14 octets/site (4+6+4), ownership libérée et module
  toujours retenu après FreeLibrary. Export et Present ne réinstallent pas.
- **E — échec PIN injecté** : 101 checks, exit 0. Le remplacement IAT retourne
  `FALSE/ERROR_ACCESS_DENIED`, sans appel au PIN réel : zéro écriture stage0,
  fenêtres originales, refus terminal, DLL déchargée après FreeLibrary.
- **F — échec VirtualProtect pendant restore** : 151 checks, exit 0. Refus
  injecté de la première transition RWX sur les deux sites : restore retourne
  **0**, diagnostic d'échec, target/ret ownership `3`, E8 conservés, module
  retenu après FreeLibrary. Une reprise sans injection, après cette libération,
  restaure exactement et produit `RESTORED_RETAINED`. La gate verte prouve le
  traitement de l'échec ; elle ne rebaptise pas l'échec initial en restauration.
- **G — nohook** : 92 checks, exit 0. Present et export : zéro PIN, zéro patch,
  fenêtres exactes, DLL déchargée lors de FreeLibrary.
- **H — terminaison** : 89 checks ; **ExitProcess(73), exit enfant 73 réel**,
  attendu par le contrôleur. Aucun restore ni FreeLibrary ; LC18 detach
  `reserved=1`, état armé/pinné, identité PID/création cohérente. **Ce n'est pas
  une restauration.**

Chaque harnais désactive les anciens hooks avec `FF8_PASSTHROUGH_BOOTHOOK=0`.
Le contrôleur conserve commandes, PID, stdout/stderr, vrais codes de sortie,
snapshots, fenêtres et LC18 ; il rejette une création processus nulle ou une
trace absente/tronquée. Vérification indépendante parent :
[`native_parent_validation.json`](lot25/v18/native_parent_validation.json).
Chaque copie et archive a été comparée par SHA-256 en streaming.

## Gate I — writer et lecteur

`gate_writer_lot25_v18.py` : **PIN puis STRICT, exits 0**. À chaque passe :
684 checks writer + 106 checks de refus initial, zéro échec, deux processus
distincts. Aucun reset du lifecycle entre scénarios. Les six fichiers binaires
synthétiques sont reparsés/rejoués explicitement avec le build `0x5646`.

Preuves : `writer_pin_receipt.json`, `writer_strict_receipt.json`, leurs logs
contrôleur et les archives `writer-pin-artifacts/`, `writer-strict-artifacts/`.
Sont vérifiés : 17 exports (8 code + 9 forwards), mode `fopen(...,"ab")`,
build-id dans les records, garde `0x100C80`, sentinelles et pertes/caps,
ST09 **40 octets**, footer ND08 **68 octets**, ABI du stub et équilibre ESP.

`lot24_contract.py` accepte explicitement le nouveau build, conserve le défaut
`BUILD=0x5642`, les anciens formats/comportements et les rejets mixed-build.
Aucun monkeypatch de BUILD. Matrices de tests adaptées et nouveaux tests
`test_lot25_v18_contract.py`. Sweep complet : **303 tests, exit 0, zéro skip**,
trois fixtures historiques liées explicitement et hashes vérifiés. Reçu :
[`python_tests_receipt.json`](lot25/v18/python_tests_receipt.json).

RS `0..25` et blend `0..4` restent bruts ; requested, result-observed et applied
restent distincts. Le backend synthétique et son HRESULT `0x1234` ne prouvent
aucune application device réelle, ni STP/depth/texture de secours/OT global.
Les trois oracles immuables n'ont pas été modifiés.

## Limites et non prouvé

L'inventaire détaillé figure dans [`v18/README.md`](lot25/v18/README.md).

- **Détours pré-PIN** PresentDispatch et ODS, export « BootHook » historique,
  trampolines génériques : aucune nouvelle garantie de restauration/résidence.
  Pas de hook CheckRegistry actif dans ce chemin. Le calcul de retour absolu
  du trampoline hérité a aussi besoin de son audit propre.
- Proxy stocké dans `engine+0xA74`, autres wrappers, forwards natifs et replay :
  retrait des pointeurs hôte, durée de vie des objets et rundown non qualifiés.
- Appels concurrents, patch six octets non atomique, stubs en vol et contention
  des writers non testés. Le petit verrou ne sérialise que Activate/Restore.
- Appels depuis le DllMain d'une autre DLL : **non testés et interdits par le
  contrat appelant**. `g_stage0InDllMain` ne détecte que nos propres callbacks,
  pas universellement le loader-lock. Le Present live et ses contextes appelants
  ne sont pas validés par un hôte synthétique.
- Échec du second VirtualProtect (retour à l'ancienne protection), échec
  FlushInstructionCache, IO LC18 refusé et mutation concurrente des voisins :
  non injectés dans cette campagne. La gate F porte sur le refus RWX initial.
- Le restore via wrapper slot 1 v18 n'a pas de cas dédié ici : D/F passent
  par l'export commun. Le contrôle wrapper v17 reste une preuve historique
  distincte ; les gates v18 n'en déduisent pas une couverture des autres wrappers.

**Le live reste donc bloqué même avec A–I passées.** Ni déploiement ni capture
autorisés par ce prototype ; `promotion_satisfied=false`.

## Préservation et clôture

HEAD de départ `31b9f0035efc3482933074fe483f4ddb2c676fe2` ; arbre chargé conservé.
`initial_state.json` et `initial_git_status.txt` enregistrent le point de départ.
Le reproducer rouge v17 reste inchangé : contrôle exit 0, bypass exit **3**
`FAIL_DANGLING_E8_REPRODUCED`, sans attribution du crash live. Ses sept artefacts
ont été rehashés : `v17_evidence_preserved.json`.

La clôture et les hashes des sources/outils/preuves sont consignés dans
`lot25/v18/final_validation.json` et `lot25/v18/artifact_manifest.json`.
Les tentatives et logs sont conservés ; aucune purge ni réinitialisation.
