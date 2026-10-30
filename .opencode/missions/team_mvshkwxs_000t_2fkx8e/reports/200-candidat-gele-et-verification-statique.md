# 200. Candidat gelé et vérification statique

## État et décision parent

La tranche A est livrée dans les cinq fichiers autorisés du worktree198. Le parent a recalculé leurs tailles et empreintes : elles correspondent aux pins fournis. Le diff ne contient que ces cinq fichiers ; aucun GraphStore, paquet ou ancien worktree n'est modifié dans cette livraison.

Le parent autorise maintenant le contrôle **`bun run typecheck`**, depuis le harness du candidat épinglé. Le script est exactement `tsc --noEmit` et le tsconfig est sans émission. Cette commande vérifie le code sans appeler l'entrée CLI, créer une base ou lancer un hôte.

La sélection des tests reste à fermer après contrôle de leurs corps et imports. Aucun `bun test` global, entrée native-owned-readonly, spawn du produit, API, session ou modèle n'est autorisé par cette étape. La revue du code et la qualification Bun→Bun restent nécessaires séparément.

## QA prévue et critères fermés

Le contrôle statique doit terminer sortie0, sans émission de fichiers produit ; erreurs et durée seront conservées dans un reçu parent. Borne maximale dix minutes, sans relance automatique. En cas d'échec, correction ciblée puis revalidation de l'impact, pas un contrôle sauté compté PASS.

Les imports du test:q1-primitives existant ont déjà été localisés : fichier de test unique, fixture JSON et module de primitives sans imports de processus ou réseau. Les nouveaux tests client/runtime-binding annoncés sont offline ; le parent doit encore vérifier les imports et les effets de chargement avant leur sélection. Les permissions futures ne sont pas déduites de leur nom.

## Pins de la livraison

Dans `rms-owned-runtime-readonly-198/tools/ff8-harness` :

- client90509octets/SHA `689d5c337428bea46662738db973063086b3917d6ab6bb3a83b8d6c6cd688b3a`.
- transport25629octets/SHA `54d3574750d6d0e0f48a5ea53727acd580f5593d78a3c7a49f09ac6d95a9e4d9`.
- binding18890octets/SHA `d4dc0a20e3bc452bf614aacf107988ff02764341625287d2ddcacbd10b21cee7`.
- tests client111867octets/SHA `704dd142978c55c3100f8ec0e9d31d79530349a26f804b162ce385c7f390899a`.
- tests binding10220octets/SHA `dc1c33734b3e394f17d343bbb6a034ad92b4168fd9336208a56d0e05bb479364`.

Le premier appel d'analyse des pins a rencontré une erreur d'échappement de regex dans le script Context Mode ; elle a été corrigée avant toute vérification produit. Le second appel confirme les cinq pins et le périmètre. Aucun résultat produit n'est attribué à l'appel en erreur.

La distinction de custody199 reste reçue : autorité parent actuelle pour le helperRO, pas grant modèle170 ni création de droits B/R. Tous les POST restent fermés. D5/M2 demeurent ouverts.

## Premier résultat réel : contrôle TypeScript en échec

`bun run typecheck` termine sortie2 en4440ms. Une seule erreur est rapportée, dans `test/client.test.ts:338` : le mock async de fetch n'a pas la propriété statique preconnect exigée par les types Bun. Le parent a relu le test concerné ; le refus réseau et le compteur nul sont les oracles à préserver.

Une correction mécanique du seul mock est autorisée dans ce fichier, en ajoutant une propriété preconnect elle aussi refusante, sans as-any, ts-ignore ou retrait d'assertion. Les quatre autres fichiers restent gelés. Le constructeur ne rejoue aucun contrôle ; le parent revérifiera le pin puis le typecheck affecté.

Les logs et le reçu de cet échec sont conservés sous `qa-owned-runtime-200/typecheck.json`, stdout.log et stderr.log. Aucun main, import applicatif de l'hôte, test produit, base ou processus serveur n'a été lancé par ce contrôle statique. Un échec de typage du mock n'est pas déclaré un défaut de runtime natif, ni transformé en PASS.
