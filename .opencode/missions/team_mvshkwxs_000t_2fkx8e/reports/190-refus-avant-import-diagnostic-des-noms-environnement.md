# 190. Refus avant import : diagnostic des noms d'environnement

## Résultat réel de l'unique qualification189

Le runner termine avec sortie1 en9338ms ; son reçu indique9277ms. Les32227fichiers de fermeture ont été vérifiés. L'enfant Bun est créé, puis refuse la garde `environment allowlist` **avant le marqueur APPLICATION_IMPORT_BEGIN**. Aucun contrôle HTTP n'est exécuté, aucune adresse ready n'est obtenue.

Le reçu rapporte sortie enfant1, signalnull, forced=false et scopeClosed=false. Ce dernier champ ne constitue pas ici un échec de fermeture d'un scope serveur : le démarrage applicatif n'est pas atteint. L'événement close de l'enfant prouve sa fin de processus, pas une fermeture native RMS ou une libération générale de ressources.

L'échec est conservé ; aucune nouvelle invocation du runner n'est autorisée automatiquement. Aucun résultat HTTP ou chargement natif n'est compté PASS.

## Diagnostic borné décidé par le parent

Le risque d'une variable interne au transport IPC avait été identifié, mais sa cause exacte n'était pas établie. Avant toute correction de l'allowlist, le parent autorise une **sonde stdlib minimale** : même binaire Node, lancement Bun run avec IPC et environnement explicitement réduit ; l'enfant ne rapporte que les noms de variables, argv non secret et faits de runtime, puis termine.

Cette sonde ne charge aucun paquet applicatif, n'ouvre aucune base ou listener, ne reçoit aucun mot de passe et n'appelle aucun modèle. Un petit script de diagnostic local est permis dans native-preparation-136, distinct des trois fichiers candidats gelés. Une invocation bornée à10secondes, sans retry ; résultats attribués et conservés. Les noms de variables suffisent : aucune valeur d'environnement ne sera lue ou publiée par le script.

Ce diagnostic n'est pas une répétition de qualification ou un moyen de contourner un refus d'accès natif. Il vise l'environnement construit par notre propre couple Node/Bun. L'allowlist applicative ne sera modifiée qu'après identification de l'écart pertinent et revue de son impact.

## Preuves

- [Invocation parent](../evidence/host-qualification-invocation-189.json) et [résultat parent](../evidence/host-qualification-result-189.json).
- Reçu : `rms-owned-http-host-180/qualification-661b9aa5-ee6e-47b1-b7c0-93129cc94867/receipt.json`, SHA256 `7dd3fb4e091da6c7d6f1bad86e3d0dc9faf849d77c41c06e673bce95167fdc61`.
- Propriétés du reçu : checks=[], préflight32227, enfant73144/exit1, failure exacte ci-dessus, forced=false. Les logs, sorties et namespace sont préservés.
- Aucun retry, session, prompt ou origine RMS ; origine déjà comptée et droits170 expirés inchangés. D5/M2 restent ouverts.

## Résultat de la sonde et défaut de son wrapper

Le premier wrapper de diagnostic a terminé sortie134 en66ms sans message de l'enfant. Ses chemins Windows imbriqués dans du JavaScript étaient mal échappés ; son résultat est conservé et **n'apporte aucune preuve de l'environnement Bun**. Le wrapper n'a pas conservé stderr, donc aucun diagnostic natif précis de cette sortie n'est revendiqué.

Le parent a corrigé uniquement les chemins du wrapper en utilisant des slashs, puis repris cette sonde stdlib dans un reçu distinct. Ce n'est pas une relance de qualification ou un contournement d'un refus d'accès. Elle réussit en74ms : enfant78376, sortie0 sans arrêt forcé, message IPC reçu avec callback et argv attendu. Les valeurs d'environnement ne sont jamais rapportées.

Les noms ajoutés observés sont HOMEDRIVE, HOMEPATH, LOGONSERVER, SYSTEMDRIVE, USERDOMAIN et USERNAME. Les variables NODE_CHANNEL_FD et NODE_CHANNEL_SERIALIZATION_MODE ne sont pas exposées dans cette vue, contrairement à l'hypothèse initiale. Cela reproduit des ajouts au passage Node/Bun de la sonde ; les noms présents lors de l'échec189 n'ayant pas été capturés, leur identité exacte n'est pas affirmée rétroactivement.

Preuves distinctes : [premier diagnostic non probant](../evidence/owned-ipc-environment-probe-190.json), [sonde aux chemins corrigés](../evidence/owned-ipc-environment-probe-190-corrected-paths.json). La sonde ne prouve ni les imports applicatifs ni l'arrêt d'un serveur.
