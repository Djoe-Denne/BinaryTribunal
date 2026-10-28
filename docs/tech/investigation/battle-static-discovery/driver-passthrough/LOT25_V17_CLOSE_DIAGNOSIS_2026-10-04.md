# Lot 25 v17 — clôture sans capture et diagnostic du lifecycle

## Verdict

**STOP maintenu ; aucune promotion.** Les traces attestent l'installation
des deux hooks, mais pas leur restauration avant les detach observés.
Aucun dump n'a été armé, aucun combat demandé, aucun résultat device ou gain
visuel déduit. Cette session ne mesure pas les bindings en combat.

Après la déclaration opérateur « fermé », absence de FF8 et du launcher
vérifiée par CIM et Get-Process. Le parent a re-vérifié indépendamment
l'absence, le rollback, les hashes des archives et la suppression des sidecars.

## Evidence préservée avant cleanup

Répertoire des reçus :
`lot25/v17/resume-20261004T143246Z-f05fa234/`.

Archive brute :
`tools/_tmp_af3dn_drop/captures/lot25-pass2bis-resume-closed-de08918ae55b450bbeb3c02226f01e13/`.

- `gfx_passthrough.csv` : 24590094 octets,
  SHA-256 `503f286b05cf3728bf3b985b54ae38148086585c88a214d44c04377bf63b9fce`.
- `gfx_passthrough_stage0.log` : 6065 octets,
  SHA-256 `b14d14aec9cdb9154cac546a078e3dbe3a35145658a309da6822167b037fe79b`.
- Marker stage0 archivé avant retrait ; manifest avec tailles, hashes source
  et destination et stabilité pendant copie. Le CSV est copié et haché en
  streaming, jamais chargé intégralement en mémoire.
- Les 5606 premiers octets du diagnostic final correspondent exactement au
  snapshot d'ouverture. CSV et diagnostic originaux restent dans le dossier
  du jeu : **aucune purge**.

Rollback utilisé :
`tools/_tmp_af3dn_drop/captures/lot25-pass2bis-resume-pre-54da1edaae9d4a829c48636684ba9b44/AF3DN.P.rollback`.
`AF3DN.P` restauré : 145920 octets,
SHA-256 `3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19`.
Il s'agit des octets archivés, pas d'un rebuild. Ce rollback disque ne prouve
aucune restauration en mémoire.

## Observations et limites d'attribution

Le diagnostic comporte deux attach/install réussis et deux detach avec
`armed=1`, `broken=0`, `seen=0`, aux séquences 36 et 10909. Les deux fenêtres
de 14 octets conservent leurs voisins, avec les patches E8 vers `54E3294B`.
Aucune phase restore ou unload_guard n'est présente. Les compteurs de hits
stage0 restent nuls : cela ne prédit pas le comportement en combat, non testé.

La lecture streaming du CSV (`csv_offline_summary.json`) compte 489213 lignes
numériques, zéro ligne numérique non parsée, zéro entrée slot 1 ; deux blocs
délimités par `#dll_loaded` et deux `#wrapped_at_present`. Aucun commentaire
de fermeture/restauration. Ces blocs ne sont **pas** identifiés à des PID.
L'absence de ligne CSV seule ne prouve pas l'absence d'exécution côté hôte.

Le journal n'enregistre ni PID/identité de lancement ni raison du detach.
Impossible donc d'affirmer que les deux cycles appartiennent au même processus,
ou qu'un DLL a été déchargé alors que son hôte continuait à exécuter les hooks.
La décision d'arrêt repose sur le témoin de sûreté manquant, pas sur un crash
ou des E8 pendants démontrés.

## Explication bornée par le code v17

Source : `lot25/v17/gfx_driver_passthrough.c`, inchangée.

- Lignes 2310–2317 : `Proxy_UninitAndCloseLog` appelle
  `GFXPT_Stage0BeforeUnload` avant le test `g_nativeAlive`.
  Ligne 2351 : ce wrapper est affecté au slot 1.
- Lignes 3303–3322 : le garde restaure ; en échec, il tente le PIN du module
  et émet un verdict rouge. Recherche exacte du symbole : déclaration ligne
  970, unique appel ligne 2316, définition ligne 3303.
- Lignes 3347–3352 et 3407–3411 : `DllMain` ignore `lpvReserved` ; le detach
  ne fait qu'un snapshot. Il ne passe pas par le garde de restauration.
- Lignes 2859–2867 : pas d'identifiant processus dans le format diagnostic.
  Le diagnostic `winerr` existant, lignes 2868–2869, est limité au cas
  `virtualprotect_failed` ; il ne résout pas la cause du detach.
- Ligne 2929 : `saved_match` compare les six octets courants aux originaux.
  Sa valeur zéro tant que les E8 sont posés est normale, **pas** un flag
  d'échec de restauration.

Le harnais `tools/af3dn_state/harness_lot25_lifecycle.c` appelle explicitement
le wrapper avant `FreeLibrary` (lignes 419–440, puis 496–511 en phase nohook).
Ses 32 checks prouvent ce chemin synthétique ; ils ne prouvent pas que le
jeu emprunte ce wrapper avant chaque detach. Les observations sont compatibles
avec un garde non atteint, mais ne distinguent pas sa cause.

## Prochaine étape décidée, non exécutée

Garder v17 et ses preuves figés. Préparer hors jeu un nouveau test de lifecycle
couvrant séparément : wrapper puis FreeLibrary (contrôle), FreeLibrary armé
sans wrapper, terminaison du sous-processus armé, restauration refusée et
PIN réussi/échoué. Ne jamais exécuter une cible de hook déchargée dans le test.

La prochaine instrumentation doit distinguer PID/identité de lancement,
module et `lpvReserved` au detach : NULL correspond au déchargement dynamique,
non-NULL à la terminaison du processus. Observer la survie/fin depuis le
processus contrôleur. Une terminaison identifiée ne remplace pas une preuve
de restauration, et ne lève pas automatiquement le STOP.

Ne pas déplacer aveuglément le garde complet (dont GetModuleHandleEx/PIN) dans
`DllMain` : le loader-lock impose une décision séparée. Aucun déplacement de
l'installation, nouvelle adresse native ou correction spéculative appliqué.
Aucun nouveau déploiement avant validation offline et revue du contrat.

## Témoignage opérateur — correction d'interprétation

Après clôture, l'opérateur rapporte : **premier lancement → message d'erreur,
le jeu s'est quitté ; second lancement sans erreur**, « ouvert » annoncé au
menu. Ce récit fournit une explication cohérente des deux cycles attach/install.
L'association du detach seq=36 au lancement en erreur et du detach seq=10909
à la fermeture normale reste une corrélation, pas une attribution par PID :
le diagnostic ne contient ni PID ni motif du detach.

Les quatre fenêtres `install_site_before` archivées montrent la préimage
`FF9098000000` intacte aux deux installations. Cela prouve ces octets à ces
instants, pas l'identité des processus ni une absence générale de corruption.
Le snapshot d'ouverture
`open-observation-144519Z-efddfbfd/gfx_passthrough_stage0.log` et l'archive
finale ont le même préfixe ; cette lecture est reproductible.

Réinterprétation, sans excès :

- Des terminaisons de processus peuvent expliquer les detach sans restauration.
  Un espace mémoire détruit ne continue pas à exécuter ses E8, mais le journal
  ne distingue pas ce cas d'un déchargement dynamique. Cette explication ne
  constitue donc ni un témoin de restauration ni une dispense du contrat de
  sûreté. Le STOP initial et la validation du lifecycle restent requis.
- Le scenario dangereux (DLL déchargée pendant qu'un hôte vivant exécute les
  E8) n'est ni observé ni écarté : c'est une lacune de couverture du harnais,
  pas une faute constatée. Validation hors jeu lancée (harnais lifecycle B).
- Nouveau fait live **non attribué** : erreur au premier lancement sous v17,
  vers seq=36, installation pourtant complète et `broken=0`. Cause inconnue
  (jeu, couche dotemu, latence, DLL) ; le texte du message n'a pas été
  journalisé et n'a pas été relevé.
- Fermeture normale du second processus : aucune entrée slot 1 dans le CSV
  (slot1=0), cohérent avec ExitProcess sans passage par le wrapper ; aucune
  FreeLibrary vivante observée.

Verdict : **chronologie mieux expliquée, sûreté d'unload non établie ;
promotion inchangée (`satisfied=false`)**. L'objectif stage0 en combat n'est
pas atteint. Toute
nouvelle session live requiert une autorisation explicite de l'opérateur, avec
consigne : si une erreur apparaît au premier lancement, relever le texte exact
du message et s'arrêter là.

## Rapports Windows Error Reporting — attribution du crash

Le dialogue technique décrit par l'opérateur laisse des traces durables. Le
répertoire `C:\ProgramData\Microsoft\Windows\WER\ReportArchive\` contient
quatre rapports `AppCrash_FF8_EN.exe` (fichiers `Report.wer`, UTF-16) :

| Date (UTC) | Module défaillant | Exception | Décalage |
|---|---|---|---|
| 2026-09-21 16:05 | FF8_EN.exe | c0000005 | +0x1DF34 |
| 2026-09-23 16:39 | **AF3DN.P** | c0000005 | +0x366B |
| 2026-09-25 09:24 | FF8_EN.exe | c0000005 | +0x97814 |
| 2026-10-04 14:43 | **dotemu_orig.DLL** | c0000005 | +0xDF52 |

Le rapport du jour (créé à 14:43:10Z, cinq secondes avant le second processus
18328) correspond au premier lancement en erreur. Son module défaillant est
`dotemu_orig.DLL` — la copie DotEmu 2014 restée inchangée (`539558e4…`), pas
notre `AF3DN.P` et pas les sites patchés de l'EXE. La fenêtre de diagnostic
stage0 montrait à ce moment l'installation complète (`ret=1`, `armed=1`,
`broken=0`), puis le detach seq=36.

Lecture prudente :

- Le PC fautif était dans dotemu, mais un `c0000005` indirect (état corrompu
  par ailleurs, lu plus tard par dotemu) n'est pas exclu par la seule
  attribution de module. Aucun minidump n'est conservé dans ces répertoires
  (un seul fichier `Report.wer` chacun) ; l'analyse s'arrête là.
- Les rapports portent sur des modules/décalages différents et des builds
  non tous identifiés. Le code générique `c0000005` commun ne leur donne pas
  une cause commune. Cet historique ne permet ni d'exclure une régression v17
  ni d'attribuer le crash à l'âge du jeu ou à Windows moderne. Les affirmations
  précédentes dans la conversation allant dans ce sens étaient excessives.
- Fait historique à garder en vue : le crash du 2026-09-23 a pour module
  défaillant `AF3DN.P` lui-même (build de l'époque, non identifié) — les
  builds successifs n'ont pas tous un dossier crash propre ; l'offset ne
  permet pas de rétro-attribuer sans le binaire de ce jour-là.
- `AF3DN.P` figure dans la liste des modules chargés des quatre rapports :
  c'est attendu (il remplace le pilote graphique) et ne constitue pas une
  preuve de culpabilité.

## Mise à jour — test d'unload désormais exécuté

Le test ciblé a effectivement reproduit, hors jeu, le DLL déchargé avec les
deux E8 encore présents si le wrapper est contourné. Le contrôle avec wrapper
restaure correctement. Ce résultat bloque la capture v17 sans attribuer le
crash live à ce mécanisme. Voir `LOT25_V17_UNLOAD_AUDIT_2026-10-04.md`.
L'ancien harnais B annoncé en arrière-plan n'avait produit aucun livrable ;
il ne faut plus le considérer comme un traitement actif ou une gate passée.
