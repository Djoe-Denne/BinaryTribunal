# M2 — 37 : source DATA manquante pour les auteurs historiques

## Défaut établi pendant l'implémentation

Le worker a arrêté les mutations/tests après avoir identifié une impossibilité contractuelle : le contrat02/06 exige `nativeAuthor.requestDigest` et profil/modèle joints à l'admission historique, mais ResultProvenance/Retained/StoredResult/WorkUnit ne transportent pas cette admission. Un authorDigest auto-cohérent ne ferme pas cette relation. Il ne faut ni lire une DB ni reconstruire la commande depuis le candidat courant.

Le parent a relu `P/upstream-qualified/graph-store.ts:600–610,630–638,817–827,875–885` : le digest historique est `fingerprint(body)` de l'admission complète ; l'outbox conserve mission/unit/execution/subIntent/token/body/digest. Les contrôles d'auteur utilisent précisément `admission.digest` et `JSON.parse(admission.body).command.profile/model`. La vue `admission()` à655 expose digest/receipt mais pas body/command : elle ne fournit pas à elle seule tous les témoins manquants.

C'est un manque concret de source du contrat ratifié, pas un échec de permissions, une demande de GO de détail ou une preuve de bug scientifique. Les validations ne seront pas assouplies pour compléter le code.

## Proposition minimale à revoir, non encore ratifiée

Ajouter à ResultProvenance une vue DATA historique bornée fournie avec les sources knowledge, sans nouvel appel API ou méthode GraphStore :

`HistoricalAdmissionDataV1={version:'l8-historical-admission-data-v1',missionId:string,unitId:string,executionId:string,subIntentId:string,familyToken:I,requestDigest:H,command:{profile:string,model:ModelRef}}` ; `historicalAdmission:BD<HistoricalAdmissionDataV1>|null`.

Chaque champ est une projection explicite de la même ligne outbox historique : mission/unit/execution/sub_intent/token/digest et profil/modèle de son body.command. Le document est fermé, byte-bound avec kind propre. Ce n'est pas la sérialisation tronquée d'une Admission dont on recalculerait le digest : **requestDigest garde le fingerprint upstream du body COMPLET historique, pas SHA raw/D/fingerprint de la vue**.

Quand nativeAuthor est consommé (a fortiori une attestation consomme authorDigests), vue obligatoire et joins exacts vers unité/résultat/exécution/subIntent/token et nativeAuthor.requestDigest/profile/model ; missing/mismatch refuse. Fixture niveau1 sans auteur consommé garde null permis. La source historique doit venir des données productrices retenues, jamais être synthétisée dans bind depuis l'auteur ou la génération courante. Le bind S1 prouve seulement la cohérence des sources fournies, pas leur authenticité native, un état DB actuel ou une admission acquise S2.

L'avis indépendant doit déterminer si cette projection DATA suffit à la garantie ratifiée de comparaison avec l'admission fournie ou si les bytes du body complet et une dérivation vérifiable sont indispensables. Dans ce dernier cas, proposer la fermeture minimale exacte (le type upstream Admission est ouvert à125–129), sans nouveau payload libre/public API, schéma arbitraire ou grand harnais. Ne pas appeler « preuve du body complet » une simple vue auto-déclarée.

## Décision de supervision

Reprendre le même reviewer contractuel, sur cette lacune/source proposée et impacts seulement. Pas réaudit des clauses fermées, numeric/planner ou nouveau pipeline. Auteur conserve l'arrêt de code/tests sur ce point jusqu'à décision explicite ; ses sources partielles restent non qualifiables. Ne pas épuiser le budget sur un contrat incomplet.

Après avis : le parent ratifiera l'amendement précis et les négatifs adaptés, ou signalera un blocage nécessitant arbitrage si une nouvelle exigence/infrastructure importante apparaît. Aucun nouveau test/DB/API native/Git/configuration autorisé par ce rapport.

## Résultats connus et limites

Auteur annonce 1 test de primitives vert (3PASS/22assertions), deux typings FAIL conservés, budget6347ms ; le second reçu n'est pas encore relu par le parent à ce checkpoint. Aucun PASS sur les nouveaux joins, schémas/fixtures et contextes encore incomplets. Les trois checks consolidés restent NON EXÉCUTÉS, numeric450+9 accepté inchangé. Rapport36 et logs D/evidence conservent les premiers contrôles.
