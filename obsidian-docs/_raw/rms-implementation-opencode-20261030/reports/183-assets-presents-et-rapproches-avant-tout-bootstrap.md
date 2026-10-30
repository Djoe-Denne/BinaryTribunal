# 183. Assets présents et rapprochés avant tout bootstrap

## Objectif et avancement

Préparer un hôte RMS isolé capable de conserver son journal, sans modifier le serveur desktop partagé. L'audit des fichiers acquis est reçu : aucun des quinze assets ciblés ne manque. Le parent a rapproché leurs empreintes et celles de trente-neuf fichiers source avec le manifeste des fichiers installés, puis recalculé les formats des quinze assets.

Résultat : **54 références concordantes**, quatre fichiers WASM version1, dix binaires PE x64 et un PE ia32. Ce dernier est installé conformément aux métadonnées de plateforme mais n'est pas sélectionné par la branche x64 examinée. Les chemins alternatifs Node ne sont pas assimilés aux chemins Bun.

## Décision et limites

Cette vérification ferme la présence et les formats statiques ciblés, **pas le chargement ou la compatibilité Bun1.4.2**. Les imports WASM du code JavaScript publié, les chargements précoces de bibliothèques natives et leurs dépendances système restent non exécutés. Aucun script d'installation ou build de secours ne sera lancé.

La revue indépendante des loaders et de la provenance est engagée. En parallèle, le constructeur prépare seulement le plan minimal de bootstrap : environnement réduit, base et chemins propres, accès loopback authentifié, provenance exacte, effets précoces, reprise/scheduling et arrêt du processus possédé. Ce plan doit fermer les prérequis avant réalisation ; il n'autorise ni fichier de bootstrap exécutable, ni import, listener, session ou modèle.

Les preuves de versions et d'archives182 restent réutilisées. La provenance du desktop158 ne sera pas transférée à cet hôte npm. L'origine RMS déjà engagée reste comptée ; ni les droits expirés170 ni l'ACK de qualification ne sont transformés en autorité ou résultat scientifique.

## Preuves techniques

- Audit gelé : `C:/Users/djden/AppData/Local/Temp/opencode/rms-owned-http-host-180/asset-audit-182.json`, 44878 octets, SHA256 `724c78504f8e6db3f7b7fde23194fa62c5f060dc1a23e14ec6a25d331f100c0a` ; empreinte relue par le parent.
- Parent : comparaison des 54 pins avec les octets présents et `provenance/installed-files.json` ; zéro écart. Lecture des en-têtes WASM et PE, machines AMD64 `0x8664` et I386 `0x014c`.
- Finding `ASSET_AUDIT182_WRITTEN_EXCLUSIVELY_STATIC_CHECKS_ONLY_RUNTIME_NOT_QUALIFIED` ; auteur limité à un fichier d'audit, sans import ou chargement revendiqué.
- Inconnues explicites : comportement des imports WASM, ABI et dépendances DLL, conditions Bun effectives, variables de redirection des assets et effets du bootstrap. Aucune inconnue comptée PASS.
- Aucun test acquis rejoué, aucune nouvelle acquisition, session, origine ou requête fournisseur. Publication, scénario D5 et acceptation M2 restent ouverts.

## Prérequis du plan précisés dans le code publié

Le parent a relu `@opencode/server/dist/process.js:92–142` : les démarrages explicites de continuité des sessions et du scheduler sont conditionnés à la présence du deuxième argument lifecycle. L'omettre est une garde source concrète ; une base vide seule n'est pas assimilée à un interrupteur. Cela ne démontre pas encore l'absence d'autres effets d'initialisation.

La même lecture, lignes176–184, confirme des exceptions d'authentification pour le pairing et les tickets PTY/MCP. Le mot de passe seul ne constitue donc pas la fermeture complète annoncée. Le troisième argument public transform permet d'envelopper dispatch : une liste restrictive de lectures pourrait borner la qualification pré-modèle, mais son contrat exact et les refus restent à ratifier. Elle ne vaut pas encore contrôle d'accès pour une future opération autorisant des sessions.

Le constructeur signale aussi une découverte de configuration via ProgramData : les chemins HOME, USERPROFILE, XDG et ProgramData devront être isolés avant les imports, pas après. Le plan des effets d'initialisation et des accès réseau reste attendu. Aucun bootstrap n'est créé ou exécuté sur la base de ces constats intermédiaires.

## Revue indépendante reçue

L'avis `result_mvv1z9fm_004z_oqtvic` confirme l'audit et ses39pins source, les distinctions Bun/Node, le choix x64 et les chemins npm présents pour FFF et PTY persistant. Aucun défaut d'asset bloquant n'est démontré dans cette portée. Le parent reçoit cette conclusion statique, pas une qualification d'exécution ou une permission de bootstrap.

La revue relève une limite importante pour l'oracle futur : `bun-pty/src/terminal.ts:113–144` journalise un échec de dlopen sans nécessairement faire échouer l'import ; l'initialisation native OpenTUI absorbe également une exception dans le chemin cité. **Un import terminé sans exception ne prouvera donc pas tous les chargements natifs réussis.** Le plan doit conserver les sorties attribuables et distinguer les propriétés réellement vérifiées des chargements toujours non qualifiés. Il ne doit ni masquer ces erreurs ni ajouter par défaut une campagne PTY ou une validation globale des ABI.

Identité et architecture Bun, conditions sans workerd, mode non compilé, cwd et environnement sans overrides restent à fermer avant tout import. Les imports WASM sans attributes sont non qualifiés, pas déclarés défectueux. La revue n'a effectué aucun import, chargement, test, appel réseau ou changement. L9 et M2 restent ouverts.
