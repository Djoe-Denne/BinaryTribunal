# M2 — 101 : vérification T2 avec assets réels isolés

## Préalables et décision

La courte revue100 est **PRÊT_FIXTURE** : deux substitutionsTYPE exactes, readonlyS1 préservé, usages en lecture seule. Les preuves logiques99 et A/C97 sont réutilisées ; aucun nouveau bloquant statique. Source gelée4b84f373… ; aucun typing, test ou asset encore exécuté.

Parent accepte la gate source et autorise le paquet ciblé suivant. Ceci n'est pas une clôtureT2/S2/M2 ni une preuvequota3/crossEpochSPENT anticipée.

## Commandes finies

1. Une invocation typing ciblé,60s maximum, modulesT2/T1/ressources et quatre fichiers de tests atomic/resource/T1/T2 avec imports transitifs.
2. Seulement si vert : une invocation Bun sur les quatre fichiers,180s maximum, concurrence1,15s/test.

Deux invocations maximum/240s cumulées,0retry et sources/configs identiques. Budget propre matérialisé101, pas réutilisation d'un ancien240s proposé. Les87cas91 sont affectés par store/authority/transition/histoire ; leur rejeu est justifié par le delta. Les29nouveauxT2 seront comptés d'après exécution ;116cas annoncés ne sont pas des PASS. SKIP/TODO ne satisfait pas les cas requis.

Typing rouge bloque DB/assets ; timeout/signal/rouge runtime ferme le paquet sans boucle implicite. PréconditionS1/Windows/non atteinte empêche de créditer les assertions derrière elle. Anciennes preuves/échecs et ledgers restent distincts et clos.

## OWN et assets : effet autorisé au runtime seulement

Répertoire neuf evidence/s2-t2-100. Réserver avant runtime :

- owned-databases, namespace s2-author-1..256.db et compagnons SQLite ;
- owned-assets, namespace case-1..128, chacun synthetic/activation.json et éventuel diagnostic negative-readback.json de son seul cas ;
- manifest parent ff8-t2-parent-asset-leases-v1 avec owner, chemin réel de l'assetroot, identité dev:ino BigInt exact en chaîne et les128assignments/leaseIds. Root possédé et créé par parent ; sous-répertoirescase absents avant tests, pas précréés ou adoptés.

Contrôleur vérifie absence/collisions et symlinks, conserve le manifest et sa SHA puis transmet FF8_S2_FIXTURE_DIRECTORY, FF8_S2_T2_ASSET_DIRECTORY et FF8_S2_T2_ASSET_MANIFEST. Le helper de test n'a aucun fallback. Source final-host-fixture:57–67/115–139 lue par parent : cases conformes au manifest, créationexclusive, fermeture et vrai readback/statBigInt/hash, négatifs sur leur proprecase. Ces appels ne sont admis que par cette invocation, pas en préflight du contrôleur.

Policy normale149bytes/SHA57f51b72…, casaltéré150bytes avecLF, absence ENOENT ou diagnostic d'autrepath doivent rester distingués. Les assets volontairement altérés et tous leurs dossiers/traces sont conservés ; aucune restauration d'input partagé ou cleanup. Le chemin partagé91synthetic reste interdit/noncréé.

Après runtime, inventorier récursivement sans suivre symlink : fichiers/dossiers, identités, tailles et hashes pour fichiers réguliers possédés ; refuser tout chemin hors namespaces. Inventaire DB+assets et manifest conservés même rouge, réservations non créées distinctes des ressources réelles. Aucune réouvertureSQL supplémentaire, service ou provider natif par le contrôleur.

## Sources, environnement et reçus

Mécanisme fini adapté des gates existants : source100/manifeste, autres pins91/ressources non couverts,309base, six entréesT1/ressources/T2, helper/body65/S1 et contrôles vérifiés avant/après. Même sourceSet entre typing/runtime ; manifest d'assets généré est un input runtime séparé enregistré dans son reçu. Contrôleur ne charge jamais le produit/fixture.

Bun/TS pinnés, no-env/configBunvide, HOME/config/temp dédiés, aucune option/secrets hérités. Aucun oracleQA S1/L7. Reçu d'acceptation des revues100/99/97 exigé avant runtime. Identités précisesWindows restent à observer, pas inférées de cette préparation.

## Acceptation et limites

Parent vérifiera logs, causes des négatifs A/B/C/B-SCOPE, nominalS1rebinding et assets/readbacks, compteurs/états et le vrai chemin3origines/quatrième refus au plafond. Un autre refus ne prouve pas le quota ; les deux activations doivent effectivement réussir sur mêmeOWN/root/octroi avant l'essai supplémentaire.

CrossEpoch avec droits effectivementSPENT/BURNED/encumbered reste une preuve distincte requise/non obtenue par le seul cheminvide. Même paquet vert ne ferme pas automatiquement000b/S2global/M2, remplacement/succession/S3/public/native/S4 ou QA indépendante/L9/L10. Trois commandes consolidées toujours à exécuter au stade applicable. Aucun Git/canonique/v6/client/configglobal/C#/jeu/live/IDA/cleanup ou nouvelle infrastructure.
