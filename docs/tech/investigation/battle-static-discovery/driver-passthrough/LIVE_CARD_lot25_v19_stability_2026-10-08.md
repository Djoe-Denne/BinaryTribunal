# Carte live — lot25 v19, stabilité minimale

**Préparée offline ; campagne non exécutée.**
Objectif : qualifier le couplage hôte du diagnostic résident et rechercher une
réapparition du crash. **Aucune promotion capture/rendering ou ISO Gxx.**

## Identités obligatoires

- DLL v19 `0x5648`, 396800 octets :
  `163e962d7f9355f61d1449b695119e94a928e616cdae54538fe0d2fa96d3d791`.
- EXE : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
- Rollback conservé :
  `3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19`.
- Un nouveau processus, sans debugger, PID + FILETIME de création enregistrés.
- Aucun mélange de hashes/PID ni réutilisation d'un processus après refus.

## Préparation opérateur/agent, avant le lancement

La campagne nécessite le feu vert live de l'utilisateur. La copie actuellement
installée est encore le rollback historique ; lancer le jeu immédiatement ne
testerait donc pas v19.

1. Jeu fermé, archiver l'état installé, sa configuration backend, les sidecars et
   les logs existants sans écrasement. Utiliser le boot natif DDrawAlt déjà validé.
   Créer un répertoire d'evidence neuf ; conserver le rollback byte-exact.
2. Déployer **uniquement** le DLL sélectionné puis relire son hash installé.
   Archiver les identités EXE, DLL, `dotemu_orig.DLL`, modules et configuration.
3. Créer le sidecar `gfx_passthrough.stage0` pour les deux témoins LC18. Sur v19,
   ce fichier n'arme aucun hook. Le sidecar `dump` doit être absent ; `nohook`
   empêcherait les activations. Le log LC18 de cette session doit partir de zéro
   après archivage de l'ancien, jamais par troncature d'evidence préexistante.
4. Vérifier le build PE32 et les reçus offline du hash sélectionné. La gate writer
   historique ne s'applique pas comme un PASS writer v19 : v19 est un diagnostic
   sans capture. Elle reste obligatoire avant toute future campagne de dumps.

## Séquence minimale — une action utilisateur à la fois

### 1. « Lance FF8, puis reste sur un écran stable. »

L'agent enregistre PID/création/modules, confirme l'absence de debugger et
d'instrumentation concurrente. Premier `query` : aucune écriture de site,
DG19[5..10] = 0, DG19[22..26] = 0, préimages complètes et pages RX.

Le contrôleur s'exécute depuis le dépôt ; `$candidate` désigne le DLL canonique,
`$creation` le FILETIME exact de création et `$run` l'evidence neuve :

```powershell
python tools/af3dn_state/control_lot25_v19.py --live --pid $gamePid --creation $creation --candidate $candidate --action query --out "$run/01-before.json"
python tools/af3dn_state/control_lot25_v19.py --live --pid $gamePid --creation $creation --candidate $candidate --action activate --out "$run/02-activate.json"
python tools/af3dn_state/control_lot25_v19.py --live --pid $gamePid --creation $creation --candidate $candidate --action query --out "$run/03-generic.json"
```

Exiger PIN module = 1, masque générique = 3, compteur Present en progression,
préimages/readbacks complets, destinations E9 dans le `.text` du candidat,
pages RX et zéro proxy/capture. Une absence de progression ne vaut pas PASS.

Puis, hors loader callbacks et avant l'action de combat :

```powershell
python tools/af3dn_state/control_lot25_v19.py --live --pid $gamePid --creation $creation --candidate $candidate --action stage0 --out "$run/04-stage0.json"
```

Exiger les deux E8 vers l'export stub, six octets exacts et voisins inchangés,
module résident, stage0 armed. Tout refus interrompt la carte.

### 2. « Entre dans un combat représentatif et attends l'affichage stable. »

Une seule scène suffit. Observer le jeu, les compteurs et les exceptions.
Faire un nouveau `query` vers un fichier neuf : requests/results progressent,
aucun proxy/capture publié. Conserver le screenshot comme observation visuelle,
sans l'assimiler à un effet rendu same-frame des compteurs DG19.

### 3. « Reste sur cet écran pendant la restauration. »

```powershell
python tools/af3dn_state/control_lot25_v19.py --live --pid $gamePid --creation $creation --candidate $candidate --action stop --out "$run/06-stop.json"
python tools/af3dn_state/control_lot25_v19.py --live --pid $gamePid --creation $creation --candidate $candidate --action query --out "$run/07-retained.json"
```

Comparer les **fenêtres complètes** du premier query et du dernier, ainsi que
leurs protections. DG19 : module PIN = 1, masques générique/stage0 = 0, armed = 0,
actif = 0, dette de suspension = 0. Le processus reste vivant et rendu natif actif.
Succès = **RESTORED_RETAINED** ; aucune demande de hot unload/`Detached`.

### 4. « Ferme normalement le jeu. »

Relever l'exit code, les événements d'exception et la paire LC18 attach/detach
exactement 128 octets, même PID/création/module. Archiver tous les fichiers,
hashes et reçus. Une preuve absente/incomplète est **INCONCLUSIVE**, jamais PASS.
Après fermeture seulement, restaurer le rollback et la configuration archivés,
relire leurs hashes, archiver les sidecars de la campagne.

## Stop immédiat

Refus, mismatch de hash/préimage, voisin modifié, page RWX résiduelle, dette de
suspension, timeout du contrôleur, crash ou corruption visuelle : arrêter les
actions. Garder les reçus et produire un dump de crash/hang avec module+offset
et identité du binaire. Un timeout conserve le scratch et son thread éventuel :
ne pas libérer une continuation vivante. Ne pas relancer une activation sur le
même module. Aucune absence de crash de v19 ne clôt la stabilité du futur proxy.

## Registre de nécessité / waivers écrits

**SET-ASIDE-VERIFIED, hash v19 ci-dessus**

- Arithmétique rel32, retour générique et RX des trampolines : profil natif B.
- Retour réel stage0 en cours et `ret 12` : extra N, natif V, audit ASM.
- Second VirtualProtect, flush, retries et rollback : extra J/K ; natif F/G/1/2/Z.
- LC18 IO refusé : extra L (collector le rejette explicitement).
- Voisin concurrent et octet étranger : natif M/U ; extra O.
- PIN refusé, activation concurrente et dette de suspension : natif D/Y/J/K/W,
  extra P. Ces tests ne dispensent pas des observations de sûreté sur le vrai hôte.
- Transport du contrôle externe : sept appels et deux refus d'identité dans
  `lot25/v19/offline-artifacts/v19-remote-final/receipt.json`.

**SET-ASIDE-CERTAIN-UNKNOWN, qualification capture distincte**

- Lifetime du proxy/objets natifs, contention writer, reconstruction textures,
  ordre des draws, profondeur, blend et application GPU. Référence : inventaire
  v18 et rapport de clôture v19. Vérifier live la fermeture effective de ces
  chemins : DG19[22..26] = 0. Ne produire aucune conclusion positive de capture.

**LIVE-REQUIRED, aucune dispense**

- EXE/DLL chargé/configuration/backend réels et processus neuf.
- Couplage loader/threads/APIs de suspension et comportement en combat.
- Allowlist, préimages de toutes les plages, readbacks, protections, voisins.
- Résidence, restauration byte-exact, processus vivant puis fermeture normale.
- Cause/signature éventuelle du crash ; collecteur complet et cohérent.

La carte est un diagnostic AF3DN.P contraint, pas une promotion ISO : elle ne
flippe aucun gate Gxx et ne réinterprète pas la résidence comme un `Detached`.
