# v18 OFFLINE — NO_HOT_UNLOAD (`0x5646`)

Prototype stage0 uniquement. **Live global bloqué ; aucun déploiement autorisé.**
La synthèse des résultats effectifs et reçus est dans
`../../LOT25_V18_OFFLINE_REPORT_2026-10-07.md`.

## Contrat du changement

- L'attach mémorise la présence du marqueur persistant
  `gfx_passthrough.stage0` et de `gfx_passthrough.nohook`. Il n'installe aucun
  E8 stage0. Le contenu du marqueur stage0 n'est ni interprété ni consommé.
- Le chemin existant `GFXPT_PresentDetour → GFXPT_PresentWrapC` appelle
  `GFXPT_Stage0Activate(1)` avant le fast-path du proxy. Sans Present,
  l'opt-in reste non exercé. L'export Install appelle le même helper avec
  source 2 et constitue un opt-in explicite, même sans marqueur.
- `nohook` observé à l'attach reste un veto ; un fichier ajouté avant
  l'activation est également un veto. Un `nohook` ajouté après les patches
  n'est pas une commande de restauration.
- Une seule tentative d'activation par module. Le PIN
  `GetModuleHandleExA(FROM_ADDRESS | PIN, Stage0Stub)` doit réussir et
  retourner exactement `g_hinstDLL` avant la première écriture stage0.
  Refus PIN : aucune écriture. Pas de nouvelle tentative implicite par frame.
- Le PIN Windows reste en vigueur jusqu'à la terminaison du processus.
  `FreeLibrary` ne constitue donc plus un déchargement après activation.
  Restore écrit six octets/site et vérifie **les 14 octets** contre la fenêtre
  sauvegardée avant installation. Succès : **RESTORED_RETAINED**. Un échec
  garde les cibles et ret-VA possédées ; le module est déjà retenu.
- Le wrapper slot 1 conserve son appel restore. Il n'est plus le seul
  mécanisme garantissant la résidence stage0 et ne tente jamais un PIN tardif.

## Contextes maîtrisés et loader-lock

Le harnais appelle l'export depuis `main`, après retour de `LoadLibrary` ; il
appelle le vrai détour Present depuis la même classe de contexte normal.
Le contrat de ces entrées exige une référence module valide pendant l'appel,
aucun unload concurrent et une exécution **hors de tous les callbacks loader**.
`g_stage0InDllMain` protège seulement nos propres callbacks : il ne détecte
pas le DllMain d'une autre DLL et n'est pas un détecteur de loader-lock.

Le nouveau témoin LC18 est un bloc de 16 DWORD (64 octets), écrit à attach
et detach par `WriteFile` sur un handle préouvert. Aucun formateur CRT,
allocation, résolution de symbole, PIN, restauration ni lecture des sites
dans ce nouveau chemin detach. Il contient magic/size, PID/TID, création du
processus, base module, raison DllMain, `reserved != NULL`, opt-in/nohook,
état, PIN, ownership, armed et frame. Un IO absent/tronqué n'est jamais une
observation valide ; le contrôleur doit vérifier la trace et la sortie du
sous-processus. Terminaison (`reserved != NULL`) ne signifie pas restauration.
Le diagnostic texte détaillé est émis hors de notre DllMain seulement.

LC18 `state` (DWORD 11) : 0 = pas d'opt-in enregistré, 1 = opt-in en attente,
2 = PIN refusé, 3 = ARMED_RETAINED, 4 = REFUSED_RETAINED (installation),
5 = RESTORED_RETAINED, 6 = échec de restauration avec ownership retenue,
7 = veto nohook. `0` après annulation d'une activation jamais tentée n'est
pas une restauration. Une identité de création du processus nulle affaiblit
la trace et doit être rejetée par la gate, jamais traitée comme preuve pleine.

## Inventaire des durées de vie non résolues

- **Boot (nom historique)** : `Passthrough_InstallBootHook` installe en fait
  les détours PresentDispatch (`0x41DF0C`) et ODS (`0x403D99`), pas
  CheckRegistry. Son invocation attach peut précéder tout PIN stage0.
  Les globals `g_boot*` et leur ancien commentaire ne prouvent pas un hook
  CheckRegistry actif.
- **Present et ODS** : E9 vers le DLL et trampolines `VirtualAlloc`, installés
  par le helper générique inchangé. Aucun protocole restore/ownership/rundown
  global. Sans opt-in, avant le premier Present ou si PIN échoue, leur durée
  de vie n'est pas sécurisée par ce prototype. Le calcul de retour absolu du
  trampoline historique nécessite aussi son propre audit de relocalisation.
- **Proxy et wrappers** : les pointeurs de fonctions dans le proxy stocké en
  `engine+0xA74`, les forwards natifs et le replay ont leurs propres durées de
  vie. `g_nativeAlive=0` ne retire pas tous les pointeurs côté hôte. Aucun
  protocole de retrait/quiescence du proxy n'est ajouté ici.
- **Concurrence** : le CAS non bloquant ne sérialise que les opérations
  d'activation/restauration stage0. Les six octets de code ne sont pas un
  patch atomique ; stubs en vol, writers/ring, wrappers, autres callbacks et
  destruction du device natif ne sont pas drainés. Le PIN empêche le code
  stage0 d'être démappé, pas l'accès à un objet natif détruit.
- **Loader-lock hérité** : ouverture CSV/CRT et installation des anciens
  détours restent dans l'attach historique. Le journal LC18 borné ne vaut
  pas audit complet de ce DllMain ni de ses appelants.

Ces lacunes maintiennent le blocage live global même si toutes les gates
stage0 synthétiques passent. Aucun résultat n'attribue le crash WER v17.

## Reproductibilité

`python tools/af3dn_state/build_lot25_v18.py` compile x86 avec MSVC dans un
répertoire exclusif `Temp/opencode`. Chaque tentative conserve sources,
DLL/MAP/PDB, script, log et reçu ; les artefacts canoniques existants ne sont
pas écrasés. Les harnais chargent exclusivement des copies temporaires.
Les oracles et reproducer rouge v17 sont conservés, hashes dans
`initial_state.json`. `unchanged_bodies.json` compare dix corps de fonctions
au source v17 (writer, stub et détours génériques notamment).

L'état d'activation, les compteurs et RVAs lus par les harnais sont des seams
offline dérivés du MAP du candidat, pas une nouvelle ABI publique.
