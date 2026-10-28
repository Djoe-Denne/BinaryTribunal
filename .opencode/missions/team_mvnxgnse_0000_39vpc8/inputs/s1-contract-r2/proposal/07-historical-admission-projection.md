# Amendement S1 ratifié — admission historique et identités de receipt

Statut : RATIFIÉ par le parent après l'avis indépendant ciblé de `s1-contract-review-r2` (rapport39). Complète 02/06 pour fournir les témoins manquants ; 01–06 restent historiques intacts. Aucun ajout de méthode publique, store, ledger, DB ou appel natif.

## 1. Types fermés et emplacement

Notations BR/BD/H/I/ModelRef de 01. Identités non vides/exactes ; objets récursivement fermés, contraintes habituelles bytes/UTF8/kind/doublons/valeurs inchangées.

```ts
type HistoricalAdmissionDataV1 = {
  version: 'l8-historical-admission-data-v1';
  missionId: string;
  unitId: string;
  executionId: string;
  subIntentId: string;
  familyToken: I;
  requestDigest: H;
  command: { profile: string; model: ModelRef };
  receiptIdentity: {
    executionId: string;
    requestDigest: H;
    nativeSessionId?: string;
    authorId?: string;
  };
};
```

Ajouter le champ **requis**, éventuellement null :
`ResultProvenanceV1.historicalAdmission: BD<HistoricalAdmissionDataV1> | null`.
Kind de son ByteRef = `l8-historical-admission-data-v1`, encoding `utf8-json-v1`. La vue est fournie dans la provenance knowledge ; elle ne remplace ni stored/retained ni nativeAuthor. Pas de payload Record libre, schéma de commande native ou body tronqué se faisant passer pour l'admission complète.

## 2. Source productrice et autorité

Le fournisseur retient indépendamment la projection d'une **même** ligne outbox historique : mission/unit/execution/sub_intent/token/digest et profile/model de son body.command. `receiptIdentity` vient du receipt effectivement retenu de cette même ligne, pas de StoredResult, NativeAuthor ou configuration courante.

Cette vue est une entrée DATA indépendante de référence fournie avec les sources knowledge. Au bind, comparer le document candidat **intégralement** à la vue retenue dans `IndependentlyLoadedSourcesV1.knowledgeSource` (références, bytes et contenu), selon les règles de binding existantes. Une copie auto-construite depuis l'auteur, le candidat ou la génération courante, un selfhash seul ou une reconstruction dans bind ne satisfait pas l'obligation de fourniture indépendante.

La provenance correcte de cette projection reste une obligation de son fournisseur ; son propre ByteRef/JSON ne démontre pas l'authenticité de sa source. Les fixtures offline fournissent des données synthétiques explicitement identifiées comme telles ; jamais une preuve native simulée.

## 3. Joins exigés lors de consommation

Quand un nativeAuthor est consommé, et nécessairement lorsqu'une attestation consomme son authorDigest :

- `historicalAdmission` non null et tous ses champs requis présents, y compris receiptIdentity. Historique/source nécessaire absent ou inconnu → refus du bind consommateur.
- missionId/unitId = producteur historique ; executionId = stored/retained/nativeAuthor ; subIntentId = celui de la bijection exacte unité-résultats ; familyToken = retained/wholeUnitValidation et attestation lorsqu'elle existe. Aucun join inventé à la génération courante.
- `nativeAuthor.requestDigest = historicalAdmission.requestDigest` ; `nativeAuthor.profile = historicalAdmission.command.profile` ; modèles exacts, y compris providerID/id/variant. Les joins vers StoredResult/document et les règles d'indépendance 06 restent requis.
- `receiptIdentity.executionId = historicalAdmission.executionId` et `receiptIdentity.requestDigest = historicalAdmission.requestDigest`.
- Si nativeSessionId est présent : égalité avec nativeAuthor.sessionId. Si authorId est présent : égalité avec nativeAuthor.authorId. Présent null, vide ou type invalide → refus, jamais suppression/normalisation en absence.

Les clés optionnelles ne sont omises **que si réellement absentes du receipt source inspecté**. Receipt non lu/inconnu n'est jamais « absence connue des champs ». receiptIdentity vide/absent ne satisfait pas les deux champs requis. Si le receipt manque, ne pas fabriquer une vue partielle prétendue complète : conserver l'état inconnu explicitement permis, puis refuser sa consommation.

Le niveau1 sans auteur/authorDigest consommé garde les nullable permis (`nativeAuthor:null`, `historicalAdmission:null`) ; ne pas rendre les auteurs natifs obligatoires pour cette fixture. Si une vue non null est fournie, ses validations structurelles et ses joins d'identité applicables restent requis ; elle n'acquiert pas d'autorité par sa seule présence.

## 4. Domaines de digests et limite explicite retenue

`requestDigest` est **exactement le row.digest historique reçu**, c'est-à-dire l'identité upstream `fingerprint(body)` calculée sur le body COMPLET historique. Il reste opaque dans cette vue. Ce n'est ni SHA raw du document, ni D(view), ni fingerprint(view), ni un digest de publication pending. Toute substitution est détectée par comparaison à la source historique indépendante reçue, pas par la forme H seule.

S1 ne reçoit pas le body complet et ne prétend donc **pas** recalculer sa préimage, dériver lui-même les champs de commande, authentifier un auteur, vérifier une admission durable ou réexécuter `hasScientificCompletion`. Un fournisseur cofabriquant une projection incohérente en interne (digest du body X avec profil du body Y) n'est pas détectable sans autre source : ne pas présenter la cohérence de cette vue comme preuve de l'absence d'une telle erreur. Authenticité, acquisition, event log et complétion native restent aux frontières S2–S4 déjà distinctes ; aucune garantie de ce type n'est supprimée ou prétendue satisfaite par S1.

Le verdict/inspection décrit « comparaison DATA à une projection historique fournie », jamais `body-hash-verified`/`durable-admission-verified` ou équivalent.

## 5. Négatifs et positifs API ciblés

Refus : auteur consommé sans historique ; digest de vue/pending substitué au digest indépendant ; profil/modèle historiques contradictoires malgré un contexte courant compatible ; mission/unité/exécution/subIntent/token étrangers ; source indépendante remplacée après préparation ; receipt execution/digest étrangers ; nativeSessionId/authorId présents contradictoires ; absence inconnue maquillée en absence connue ; null/type invalide élidé ; champs inconnus ou mauvais kind/domaine.

Positifs : vue historique exacte, contexte courant différent mais non consommé ; receipt avec les deux identités exactes ou réellement absentes ; niveau1 sans auteur consommé avec les deux vues null. Garder la comparaison exhaustive des sources indépendantes et les règles B1/02 de toute-unité, pas membership global.

Sources upstream vérifiées : `P/upstream-qualified/graph-store.ts:125–129,600–610,630–638,644–652,744–758,817–839,875–888`. Les contrôles produit sont à exécuter dans le budget auteur restant, puis QA API indépendante ; cet amendement est documentaire et n'a exécuté aucun test.
