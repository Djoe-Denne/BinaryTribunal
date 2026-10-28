# Lot25 v19 — diagnostic résident, 2026-10-08

**OFFLINE PASS — prêt pour une campagne live minimale de stabilité.**
Qualification des captures complètes : **ouverte**.

- Build `0x5648`, DLL x86 de **396800 octets**.
- SHA-256 : `163e962d7f9355f61d1449b695119e94a928e616cdae54538fe0d2fa96d3d791`.
- Build retenu : `build-20261008T130333Z-j24yvmub/`.
- [Rapport](../../LOT25_V19_OFFLINE_CLOSURE_2026-10-08.md).
- [Carte live et registre de nécessité](../../LIVE_CARD_lot25_v19_stability_2026-10-08.md).
- [Validation indépendante](offline-artifacts/independent_validation.json).
- [Contrôle externe sans debugger, testé offline](offline-artifacts/v19-remote-final/receipt.json).
- [Manifest des artefacts](artifact_manifest.json) · [Reçu de clôture](closure.json).

## Contrat effectif

Fork de v18 ; les blocs `#if 0` et l'ancien commentaire d'introduction sont
conservés pour comparaison. Le présent contrat décrit le code compilé v19.

1. `DllMain` mémorise l'opt-in et émet les témoins fixes LC18. Il n'installe
   aucun hook, n'effectue aucun PIN, ne démarre aucun worker et n'ouvre aucun CSV.
2. `new_dll_graphics_driver` transmet l'engine au constructeur natif DDrawAlt
   à `host+0x257D0` et retourne son objet inchangé. Aucun proxy n'est publié.
3. `Passthrough_InstallBootHook(NULL)` est un **appel explicite après chargement**.
   Il confirme `GetModuleHandleExA(FROM_ADDRESS|PIN)` avant toute publication
   de trampoline ou écriture E9. Present/ODS sont des compteurs atomiques.
4. L'activation stage0 reste un export distinct et explicite. Le sidecar
   `gfx_passthrough.stage0` active les diagnostics LC18 ; il n'arme pas les sites.
5. Un essai d'activation par module. `nohook` veto ; refus/restauration terminaux
   pour le réarmement. Une restauration en échec peut être réessayée.
6. Toute transaction de code suspend les autres threads accessibles, vérifie
   leurs EIP et exige une énumération stable. Refus si un EIP est dans la fenêtre,
   si un thread est inaccessible ou si l'énumération ne converge pas. Limite 128
   threads, quatre passes. Vérification des fenêtres et protection sous verrou.
7. La protection originale des **deux** sites stage0 est mémorisée avant les
   écritures. Un retry restaure cette protection, pas le RWX laissé par un échec.
8. Les identités de retour stage0 restent immuables. Une entrée réelle retourne
   vers `site+6`, même si les six octets ont été restaurés pendant le call natif.
   L'entrée directe garde son retour. `ret 12`, arguments COM et HRESULT conservés.
9. Les trampolines génériques relocalisent depuis le **VA hôte effectif**, sont
   passés RW→RX avant publication, et restent alloués après restauration. Un
   appel déjà entré peut finir. Aucune opération de hot unload n'est fournie.
10. `Passthrough_StopDiagnostic()` restaure stage0 et les deux sites génériques.
    Il reprend une éventuelle dette de suspension : un `ResumeThread` raté garde
    son handle pour retry. Les octets étrangers ne sont pas écrasés.

Les exports de contrôle exigent une référence de module possédée et un appel
**hors de tous les callbacks loader**. Le flag de notre DllMain n'est pas un
détecteur universel du loader lock. Le couplage réel des APIs de suspension,
des threads du jeu et du loader reste à observer live. La fermeture des fenêtres
de patch suppose l'absence de créateur de threads/instrumentation extérieur
concurrent ; cette condition doit être vérifiée dans la session contrôlée.

## Surface de capture

Les chemins jeu/exportés v19 ne publient pas `g_proxy`, ne conservent pas d'objet
natif et n'ouvrent pas de fenêtre de capture. Le replay est désactivé. Le binaire
ne lie pas `GFXPT_FillProxy`, `GFXPT_DumpNode`, `GFXPT_DumpOpen`, `GFXPT_DumpArm`.
Le code historique ST09 reste dans le fork ; son armement est inaccessible depuis
ces chemins. Les compteurs runtime sont des observations agrégées, pas des dumps
ni une preuve d'effet rendu same-frame.

**Ce build n'est pas un writer de capture validé.** Les lecteurs rejettent
`0x5648` comme build de dump. Le défaut `BUILD=0x5642`, les builds historiques,
les négatifs `0x5645`/`0x5647`, les formats ST09/ND08, la garde `0x100C80` et les
distinctions requested/result-observed/applied restent conservés dans les
fichiers historiques gelés. Une reprise de capture exige un candidat writer
distinct, son contrat d'ownership et la gate writer complète.

## DG19 : `Passthrough_QueryDiagnostic(out, bytes)`

Buffer appelant d'au moins 128 octets, 32 DWORD little-endian ; retour 128 ou 0.
Les verrous de contrôle protègent l'état de cycle de vie, pas la cohérence de tous
les compteurs au même instant.

- 0–4 : magic `0x39314744`, taille 128, build, PID, base de module.
- 5–10 : module PIN, stage0 PIN, masque générique, masque stage0, stage0 armed,
  diagnostic actif.
- 11–15 : activation générique tentée, dette de suspension, passes de quiescence,
  compteur Present début, compteur ODS.
- 16–21 : requests stage0 sites 0/1/2, results sites 0/1/2.
- 22–26 : proxy, natif, nativeAlive, capEndSeq, dumpWrite ; tous zéro en diagnostic.
- 27–31 : compteur Present fin, état lifecycle stage0, écritures stage0,
  tentatives PIN stage0, activation stage0 tentée.

LC18 reste le format v18 : son champ PIN décrit **stage0**, pas le nouveau PIN
générique. Utiliser DG19[5] pour la résidence générale. Aucun champ `Detached`
n'est inventé : l'état de succès est `RESTORED_RETAINED`.

## Reproduction offline

Depuis la racine du dépôt, le builder crée un nouvel essai isolé et n'écrase rien :

```powershell
python tools/af3dn_state/build_lot25_v19.py
```

Avec `$b` = répertoire de l'essai choisi et `$out` = nouveau dossier sous
`$env:LOCALAPPDATA/Temp/opencode` :

```powershell
python tools/af3dn_state/gate_lot25_v18_extra.py --out "$out/native" --candidate "$b/gfx_driver_passthrough.dll" --map "$b/gfx_driver_passthrough.map" --source "$b/gfx_driver_passthrough.c" --build 0x5648 --profile v19-lifecycle
python tools/af3dn_state/gate_lot25_v18_extra.py --out "$out/extra" --candidate "$b/gfx_driver_passthrough.dll" --map "$b/gfx_driver_passthrough.map" --source "$b/gfx_driver_passthrough.c" --build 0x5648 --cases JKLNOP
python tools/af3dn_state/gate_lot25_v19_remote.py --out "$out/remote" --artifact-dir "$b"
```

Le contrôleur externe est lié au hash retenu. Un nouveau build nécessite une
nouvelle sélection et une requalification explicite, pas une substitution de
`BUILD` dans un reader. Aucun de ces trois contrôleurs ne déploie ni ne lance FF8.
