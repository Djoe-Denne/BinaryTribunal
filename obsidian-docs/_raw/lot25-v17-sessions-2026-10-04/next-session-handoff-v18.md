# Prompt de reprise — session suivante (implémentation prototype v18 offline)

Rédigé par le parent le 2026-10-04, remis à l'opérateur pour ouverture d'une
nouvelle session (conservé ici comme record ; la session de reprise recopiera
ses propres décisions). Texte intégral tel que remis :

---

Reprends le projet re-ff8 et implémente le prototype v18 OFFLINE destiné à corriger le problème de durée de vie des hooks stage0. La décision d'architecture est prise : ne recommence pas une campagne live ni une discussion générale.

Dépôt :
C:\Users\djden\source\repos\retro-eng\re-ff8

OBJECTIF ET AUTORISATION

Je t'autorise à concevoir, coder, compiler et tester ce prototype hors jeu, jusqu'à un rapport vérifiable. N'attends pas une confirmation supplémentaire pour le travail offline.

Aucun déploiement dans le jeu, aucun lancement FF8, aucun armement de capture. Le prototype ne constitue pas une autorisation live.

Respecte les instructions du dépôt et fais superviser le cadrage et la validation par l'agent orchestrator. Tu peux déléguer des travaux bornés, mais reste responsable de vérifier les fichiers, les résultats et les codes de sortie.

ÉTAT À REVALIDER AU DÉPART

- Dernier HEAD connu : 31b9f00.
- Working tree très chargé, avec changements de cette campagne et changements sans rapport. Ne rien réinitialiser, nettoyer ou écraser. Pas de commit/push demandé.
- Les deux reprises live v17 sont closes. Aucun dump v17 n'a été armé.
- Dernier état vérifié : FF8 et launcher arrêtés ; DLL sauvegardée restaurée byte-exact ; sidecars stage0/dump retirés.
- DLL restaurée :
  3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19
- Candidat v17 FIGÉ, build 0x5644 :
  docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v17/gfx_driver_passthrough.dll
  SHA-256 :
  0c446a5a5accb00f90684f3379b5a2297e24d56cba33d8b1ab0192ad097c6bcc
- Source C v17 :
  07dacab2d43486a939c6f864e33c230c294433995706d40464901def514a7fc2
- Aucun résultat de sous-agent n'est encore attendu : la revue d'architecture est terminée. Le précédent « harnais B en cours » avait échoué avec uv_spawn et n'avait produit aucun livrable.

SOURCES À LIRE EN PRIORITÉ

Sous docs/tech/investigation/battle-static-discovery/driver-passthrough/ :
1. LOT25_V17_UNLOAD_AUDIT_2026-10-04.md
   Inclut la décision d'architecture v18.
2. LOT25_V17_CLOSE_DIAGNOSIS_2026-10-04.md
   Contient les corrections d'interprétation du crash et des detach.
3. LIVE_CARD_lot25pass2bis_2026-10-04.md
4. lot25/v17/unload-audit-20261004T155604Z-10423954/receipt-retry1.json
   et les logs control.log / unload.log.

Code :
- tools/af3dn_state/harness_lot25b_unload.c
- tools/af3dn_state/harness_lot25_lifecycle.c
- tools/af3dn_state/gate_writer_lot25.py
- tools/af3dn_state/lot24_contract.py
- lot25/v17/gfx_driver_passthrough.c/.h, dans le dossier documentaire ci-dessus.

CONSTAT PROUVÉ

Le test ciblé a réellement été compilé et exécuté sur des copies du candidat :
- Wrapper de fermeture puis FreeLibrary :
  16 checks, zéro échec, exit 0 ; octets restaurés, module absent, hôte vivant.
- FreeLibrary SANS wrapper :
  12 checks, zéro échec d'infrastructure, exit 3 intentionnel :
  FAIL_DANGLING_E8_REPRODUCED.
  Les deux E8 restent dans l'hôte alors que leur DLL cible est déchargé.

Dans v17 :
- GFXPT_Stage0BeforeUnload est appelé uniquement par Proxy_UninitAndCloseLog, wrapper du slot 1.
- DllMain DETACH ne fait qu'un snapshot et ignore lpvReserved.
- Le harnais lifecycle historique appelait explicitement le wrapper : son PASS ne couvrait pas le bypass.

Ce mécanisme synthétique ne prouve PAS la cause du crash live. WER localise une faute c0000005 dans dotemu_orig.DLL +0xDF52, sans établir sa cause. Les autres crashs historiques n'innocentent pas v17.

DIRECTION RETENUE : PROTOTYPE v18 « NO_HOT_UNLOAD »

1. Fork dans un nouveau dossier lot25/v18/ ; conserver v17 et tous ses reçus.
2. Choisir un nouveau build-id après vérification de disponibilité. Ne pas supposer 0x5645 libre.
3. À l'attach, stage0 enregistre seulement l'opt-in : aucun E8 stage0 installé.
4. Différer l'activation via le chemin Present existant, sans nouveau hook ni adresse hôte inventée.
5. L'export explicite rejoint le même chemin d'activation.
6. Respecter nohook. Confirmer un self-PIN hors DllMain/loader-lock AVANT toute écriture stage0. Échec PIN = zéro écriture stage0.
7. Un indicateur « dans notre DllMain » ne détecte pas le DllMain d'une autre DLL : documenter les contextes appelants réellement maîtrisés, sans inventer une détection universelle du loader-lock.
8. Conserver la restauration vérifiée et l'ownership en cas d'échec. Après restauration, le module épinglé reste chargé :
   RESTORED_RETAINED, jamais « Detached green ».
9. Ajouter une identification diagnostique bornée des processus et des phases permettant de distinguer les scénarios de terminaison/déchargement. Respecter les contraintes du loader-lock.

Attention : le sidecar est un marqueur persistant dont la présence commande l'opt-in. Sans premier Present, l'activation reste non exercée ; cela ne signifie pas que le fichier serait « vide ».

LIMITATION ARCHITECTURALE OBLIGATOIRE

Les détours boot/Present/ODS déjà posés avant le PIN, les autres wrappers et les appels concurrents ne sont pas automatiquement protégés par cette correction stage0.

Inventorier leur portée et documenter les lacunes. Même si toutes les gates stage0 passent, conserver le blocage live global jusqu'à audit de ces durées de vie. Ne pas élargir silencieusement les patches pour prétendre résoudre tout le driver.

Rejets déjà établis :
- PIN improvisé dans le detach ;
- déplacement du garde complet dans DllMain ;
- return FALSE pour empêcher FreeLibrary ;
- restauration seule sans garantie de résidence en cas d'échec.

GATES OFFLINE À RÉALISER

Utiliser des hôtes synthétiques isolés et des COPIES du DLL dans :
C:\Users\djden\AppData\Local\Temp\opencode

Ne jamais charger l'AF3DN.P installé dans le jeu.

Vérifier séparément :
A. Attach opt-in puis FreeLibrary sans wrapper : aucun E8 stage0 installé.
B. Activation explicite hors DllMain : PIN avant patches ; FreeLibrary laisse le module RETAINED, sans référence supplémentaire artificiellement conservée par le harnais.
C. Activation différée par le véritable chemin Present : effectivement exercée et unique. Un simple appel de l'export ne valide pas ce cas.
D. Restauration : six octets exacts par site et readback de chaque fenêtre de 14 octets = 4 voisins avant + 6 octets du site + 4 voisins après ; module toujours retenu.
E. Échec PIN injecté : aucune écriture stage0.
F. Échec VirtualProtect pendant restauration : échec déclaré, ownership conservée, module retenu.
G. nohook : aucune activation stage0 ni PIN stage0.
H. Terminaison d'un sous-processus : scénario distinct, observé par le contrôleur ; ne pas appeler cela une restauration.
I. Régressions du writer et du lecteur.

Un cas non exécuté reste NON PROUVÉ. Un test qui reproduit un danger n'est pas une gate verte. Conserver les essais échoués et leurs vrais codes de sortie.

INVARIANTS

- Sites stage0 : host+0x1EF5D et host+0x1EF72.
- Préimage FF 90 98 00 00 00 ; patch E8 rel32 + 90 ; stub ret 12.
- ST09 : 40 octets ; footer ND08 : 68 octets.
- Garde de taille : 0x100C80.
- RS 0..25 et blend 0..4 restent bruts.
- requested, result-observed et applied restent distincts.
- Pas d'inférence STP/depth/texture de secours/OT global.
- Oracles immuables :
  tools/af3dn_state/ff8dump.py
  tools/af3dn_state/render_lot17.py
  tools/af3dn_state/render_lot21.py
- Préserver le reproducer rouge v17 ; créer les tests v18 séparément.
- Si le lecteur partagé accepte le nouveau build, conserver ses anciens comportements, le build par défaut et les rejets de builds mélangés. Aucun monkeypatch de BUILD.

OUTILLAGE ET CONNAISSANCES

- Context Mode pour builds, tests et sorties volumineuses ; hashes/copies en streaming.
- GrepAI pour compréhension du code, Serena pour symboles, QMD pour notes.
- Ne pas déduire l'absence d'index GrepAI d'une liste de workspaces vide : vérifier .grepai et le watcher.
- Vérifier la racine active Serena avant toute écriture ; ne pas réactiver un projet sur une connexion partagée.
- Le vault pertinent est re-ff8/obsidian-docs, pas le vault texturetonevariations indiqué par l'ancienne config globale.
- Une mémoire précédente a été écrite dans la racine parente :
  C:\Users\djden\source\repos\retro-eng\.serena\memories\battle_driver_lot25_v17_unload.md
  Ne pas confondre cette racine avec re-ff8.
- Les pages Lot25 et _raw/lot25-v17-sessions-2026-10-04/session-record.md sont des synthèses, pas un export intégral des conversations.
- QMD n'a pas été rafraîchi après cette ingestion ; ne pas supposer ces nouvelles pages retrouvables dans son index.

LIVRABLE FINAL

Un prototype v18 réellement compilé, ses sources et hashes, des gates adaptées avec reçus/logs et codes de sortie, puis un rapport séparant :
- ce qui est corrigé et prouvé ;
- ce qui reste non testé ;
- les limites de durée de vie des autres détours ;
- pourquoi le live reste bloqué, le cas échéant.

Actualiser les documents et connaissances concernés après les résultats effectifs. Ne pas annoncer une tâche « en cours » sans exécution confirmée et ne pas faire attendre l'opérateur pour un travail inexistant.
