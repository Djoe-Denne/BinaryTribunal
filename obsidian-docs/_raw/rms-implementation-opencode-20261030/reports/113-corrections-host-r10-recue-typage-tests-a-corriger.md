# 113. Corrections host r10 reçues : typage des tests à corriger

## Objectif et état

L'auteur a livré les trois corrections demandées : échéance de l'acquisition opposable, conservation des observations avant rafraîchissement du témoin et unicité atomique du scope de permis. Dix cas hors ligne ont été ajoutés. Le superviseur confirme le pin et les 18 empreintes ; ces corrections ne sont pas encore réputées comportementalement validées.

La compilation retourne six diagnostics, tous dans le nouveau rig client : modèle et profil de type unknown utilisés sans garde, puis observation attendue pouvant être indéfinie. Aucun test r10 n'a été exécuté.

## Correction minimale et vérification

Autoriser uniquement des gardes de type explicites dans le test : vérifier l'objet modèle, ses trois chaînes et le profil, puis refuser une observation attendue absente avant l'égalité. Aucun modèle par défaut, cast masquant l'inconnu, assertion retirée ou changement de production pour accommoder le test.

La revue indépendante reprend sur les trois corrections et leurs impacts dans les octets produit r10, qui restent immuables pendant le correctif de tests. Le prochain pin de typage devra être rapproché sans recommencer les preuves valides de production. Les six diagnostics ne sont ni un PASS ni une preuve que les trois risques ont disparu.

## Preuves et limites

- Pin r10 : `f0a74bd3fd2ef1f5eab7f5e616e6aff20c1af45c` ; manifeste18/18 conformes.
- `bun run typecheck` : code2 en 3 654 ms, six diagnostics dans client.test225–242 et411.
- [Reçu parent détaillé](../evidence/native-runtime-r10-typecheck-parent.json).
- Aucun test, appel service, octroi, programme direct ou effet natif exécuté. Pas d'intégration ni de qualification native.
- [Défauts à fermer](112-trois-defauts-host-corrections-ciblees.md).
