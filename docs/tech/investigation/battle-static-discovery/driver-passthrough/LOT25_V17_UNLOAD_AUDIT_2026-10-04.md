# Lot 25 v17 — test d'unload réellement exécuté, résultat bloquant

## Rectification de l'attente

Le harnais B annoncé en arrière-plan n'avait produit ni source ni reçu.
La tâche initiale a remonté `EUNKNOWN: unknown error, uv_spawn`. L'annonce
répétée d'une validation « en cours » sans traitement actif vérifié était une
erreur d'orchestration. Le déploiement et l'instruction de lancer FF8 avant
la clôture de cette gate étaient prématurés. Aucun dump n'a été armé.

À la relance de l'opérateur, un test ciblé a été créé puis **compilé et
exécuté au premier plan**, sur des copies en répertoire temporaire. Ce test
n'est pas la suite B complète initialement annoncée.

## Périmètre et contrôle

Source nouvelle : `tools/af3dn_state/harness_lot25b_unload.c`.
Host des deux sites : le propre EXE synthétique, fenêtres de 14 octets
explicitement vérifiées dans sa zone réservée `.text`. Aucun accès au
processus FF8, aucun appel des sites ou du stub, aucune exécution de code
déchargé. Les copies du candidat v17 et l'ancien harnais restent inchangés.

Candidat testé : SHA-256
`0c446a5a5accb00f90684f3379b5a2297e24d56cba33d8b1ab0192ad097c6bcc`.
Wrapper fourni au contrôle : RVA `0xBE10`, appartenant à ce seul candidat.

Le parent a corrigé le nouveau harnais avant exécution : FreeLibrary effectif
dans le contrôle, protection contre double FreeLibrary, échec de cleanup
propagé au code de sortie, fermeture du fichier marker et bornage des chemins.

La première commande de build a échoué sur le quoting de `vcvarsall.bat`,
avant compilation. Son log et son reçu sont préservés. Reprise via un script
CMD explicite : compilation x86 exit 0, seul avertissement C4325 connu sur
les attributs de `.text`. Le placement réel des fenêtres a passé les checks.

## Résultats

- **Contrôle, wrapper puis FreeLibrary** : 16 checks, zéro échec
  d'infrastructure, exit 0. Fenêtres originales exactes, DLL absent après
  FreeLibrary, hôte toujours vivant. Diagnostic `restore_verified`, detach
  `armed=0`.
- **FreeLibrary sans wrapper** : 12 checks, zéro échec d'infrastructure,
  **exit 3 volontaire : `FAIL_DANGLING_E8_REPRODUCED`**. Les deux fenêtres
  restent identiques aux patches installés et pointent vers le stub du DLL
  désormais absent ; le processus synthétique continue. Diagnostic sans
  restore, detach `armed=1`. Ce n'est ni un crash du test ni une gate verte.

Après observation, le harnais remet ses propres fenêtres en état et retire
son seul marker. Il ne répare ni ne modifie le jeu ou le candidat.

Evidence : `lot25/v17/unload-audit-20261004T155604Z-10423954/` :
`receipt.json` (premier build refusé), `receipt-retry1.json`, logs compilation,
`control.log`, `unload.log` et diagnostics stage0 séparés. Les hashes du
source, candidat, copies et logs ont été re-vérifiés par le parent.

## Décision et limites

**Capture v17 bloquée.** Le garde situé dans le wrapper ne couvre pas le
déchargement dynamique qui le contourne. Le reproducer démontre ce mécanisme
sur le candidat exact ; il ne démontre pas que FF8 emprunte ce chemin ni que
ce mécanisme a causé le crash WER antérieur.

La suite complète ExitProcess et injections d'échecs restore/PIN n'a pas été
exécutée. Aucun résultat positif n'est inventé pour ces cas. Le motif des
detach live et la cause du crash DotEmu restent non établis.

L'installation mémoire de la reprise 2 avait été vérifiée en lecture seule,
sans debugger ; elle ne lève pas ce blocage. Après confirmation « fermé »,
jeu et launcher absents (CIM et Get-Process), puis archive et rollback vérifiés.
Aucun fichier dump ni sidecar dump : aucune capture n'a été armée.

Archive de clôture :
`tools/_tmp_af3dn_drop/captures/lot25-pass2bis-resume2-closed-ea3593dd7e1b4b13a2afb6b841df5d2f/`.

- CSV : 760912957 octets,
  SHA-256 `c340e73c9ac0e296163060886eeef8ee2a8f3eb9211c3b849a81236bb91fc698`.
- Diagnostic : 9099 octets,
  SHA-256 `1a1b2c0738ab36386e01eaabfc702c95cc9e343ab08276a59b3984859f2bb031`.
- Marker stage0 : 111 octets, archivé avant retrait. CSV et diagnostic
  originaux restent en place ; aucune purge. Hachages et copies en streaming.

Les préfixes du diagnostic de la première reprise et du snapshot de pré-armement
sont préservés exactement. Le suffixe de reprise 2 comporte un attach/install
et un detach, seq 40577, `armed=1`, `seen=0`, compteurs req/res nuls,
`cap_end=0`. Aucun témoin de restauration mémoire n'est ajouté par le rollback
disque ; le motif du detach reste non identifié dans le diagnostic v17.

DLL restaurée depuis l'archive fraîche de reprise 2 : 145920 octets,
SHA-256 `3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19`.
Reçus : `lot25/v17/resume2-20261004T151157973518Z-d77eb136/close_rollback.json`
et `close_parent_validation.json`. Processus absents, hashes des trois archives
et des originaux conservés, restauration exacte et sidecars absents ont tous
été re-vérifiés par le parent. Aucun nouveau test ni lancement à cette clôture.

Correction nécessaire dans un futur candidat, après décision de lifecycle
compatible loader-lock ; ne pas déplacer aveuglément le garde/PIN dans
DllMain. v17 et ses reçus restent figés. Aucun nouveau live avant correction
et gates adaptées ; `promotion_satisfied=false`.

## Décision d'architecture v18 (2026-10-04, après revue dédiée)

Option B retenue comme prochain pas minimal — **prototype offline déclaré
`NO_HOT_UNLOAD`** :

1. À l'attach, stage0 enregistre seulement l'opt-in : **aucune écriture E8**.
2. L'installation différée emprunte le **PresentDispatch existant** (aucun
   nouveau hook, aucune adresse hôte inventée) ; l'export explicite rejoint
   le même chemin d'activation.
3. Activation hors DllMain/loader-lock ; **self-PIN confirmé avant toute
   écriture stage0**, échec PIN = zéro écriture ; `nohook` respected.
4. Restauration inchangée (contrôles + ownership en échec) ; même après
   succès, le module reste mappé : état **`RESTORED_RETAINED`**, jamais
   « Detached green ».

Rejets de la revue : restore borné seul (A) insuffisant ; PIN dans le
detach, déplacement du garde dans DllMain, `return FALSE` anti-FreeLibrary
rejetés ; stub externe rundown (C) disproportionné ici.

Hors garantie explicite : détours boot/Present/ODS posés avant PIN, autres
wrappers, appels concurrents — le **blocage live global est maintenu**
jusqu'à audit de leur durée de vie. Sans premier Present, l'activation reste
non exercée ; le sidecar est un marqueur persistant dont la présence commande
l'opt-in, indépendamment de son contenu. Un appel harnais de l'export ne valide que ce
contexte explicite. Gates offline exigées avant tout déploiement : attach
opt-in + FreeLibrary sans E8 ; activation explicite hors DllMain avec PIN
avant écritures et module RETAINED après FreeLibrary ; chemin Present
réellement exercé (installation unique) ; restore 6 octets/site + readback
14 voisins, module retenu ; refus PIN = 0 écriture ; refus VP en restore =
échec déclaré, ownership conservée ; `nohook` inerte ; ExitProcess
(`lpReserved != NULL`) traité comme scénario distinct ; régression contrat
(ST09 40 o, footer ND08 68 o, garde `0x100C80`, RS/blend raw, ret 12,
pas de SetType). À la date de cette décision, l'implémentation v18 n'était pas commencée.

### Suite effective du 2026-10-07

Le prototype v18 `0x5646` a été compilé et les gates offline A–I exécutées.
Voir [le rapport v18](LOT25_V18_OFFLINE_REPORT_2026-10-07.md) et ses reçus.
v17 et son reproducer rouge restent figés ; le blocage live global demeure.
