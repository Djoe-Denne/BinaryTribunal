# 208. Arrêt avant enfant ; lancement sans préchargement

## Résultat réel de l'essai207

L'acte de contrôleur réussit en202ms : fence2 acquis, schémas et toutes les données logiques inchangés hors bail, identité du fichier OWN conservée. Aucun grant ou crédit n'est créé.

L'invocation de qualification termine ensuite sortie1 en97,1ms. Le FINALOUTCOME extérieur reste **HOLD** : aucun PID enfant, aucune réponse HTTP et aucun outputRoot dans la candidate. Le reçu de lancement, les octets stdout/stderr et les snapshots sont conservés dans `owned-direct-206` et `evidence/owned-direct-207-*.json`. Cet essai n'est pas réussi et ne sera pas relancé automatiquement.

## Cause de refus identifiée sans rejouer l'application

Une sonde stdlib seule montre que le lancement depuis Context Mode ajoute `--preload` et un hook local à process.execArgv. Cette propriété suffit à faire refuser la garde stricte du candidat, qui exige zéro argument de préchargement. La candidate masque volontairement les exceptions internes : on ne prétend pas qu'aucune autre garde pourrait échouer ensuite.

Le hook existant a été lu : il enveloppe child_process, ajoute son préchargement aux enfants Bun et affecte NODE_OPTIONS. Aucune modification de ce hook ou configuration globale n'est effectuée, et aucune allowlist n'est élargie. Les faits parent/event, les pins plan/runtime et les types BigInt ont été contrôlés en lecture seule ; ils correspondent aux prérequis examinés.

## Alternative technique bornée

Le parent a vérifié une autre voie de lancement native : ProcessStartInfo Windows, environnement construit explicitement sans héritage, vers le même Bun épinglé. La même sonde stdlib termine sortie0 en30ms avec execArgv vide. Aucun produit, base ou serveur n'est ouvert par cette sonde.

Il ne s'agit pas de contourner un refus d'outil ou une permission native : les outils n'ont pas été refusés. Le premier lancement présentait une image d'exécution incompatible avec le contrat du produit. La proposition conserve au contraire toutes les gardes et utilise une invocation native propre, avec le même propriétaire et le même contrôle externe. Sa conformité au contrat est soumise à la revue bornée existante avant un nouvel essai explicite et versionné.

La tentative207 reste immuable et HOLD. Un prochain essai, s'il est retenu, aura son propre namespace, une nouvelle invocation et un acte parent distinct ; il ne réemploiera pas le reçu provisoire précédent et ne créera pas d'origine RMS. Aucun nouveau lancement applicatif n'est engagé par cette analyse.

## Preuves et limites

- `evidence/direct-bun-runtime-facts-207.json` : lancement instrumenté, sortie0/35ms ; préchargement observé, pas d'application.
- `evidence/direct-bun-runtime-facts-native-207.json` : lancement Windows natif à environnement fermé, sortie0/30ms ; execArgv vide, pas d'application.
- `owned-direct-206/FINALOUTCOME.json` : HOLD,97,1ms, sortie1 ; stderr vide, candidate sans PID.
- Les propriétés natives non exercées, les droits B/R, la tranche B, D5 et M2 restent ouverts.
