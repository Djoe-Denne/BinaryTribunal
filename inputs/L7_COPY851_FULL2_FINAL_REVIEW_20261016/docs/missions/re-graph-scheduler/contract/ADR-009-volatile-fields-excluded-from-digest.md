# ADR-009 — Les champs volatils sont hors du contenu hashé

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

Le digest reproductible est `hash(canonical(content))`, avec `canonical` et `hash` de `tools/ff8-harness/src/validation.ts`. Ce n'est pas le hash des octets pretty-printés.

Chaque fixture sépare `content.json`, `volatile.json` et `manifest.json`. Les clés volatiles v1 sont `observedAtUtc`, `writer`, `note`. Elles n'apparaissent pas dans le contenu. Les réordonner ne change pas le digest ; `reordered.json` doit canonicaliser à l'identique.

Champs digest inclus dans le contenu seulement après calcul, et exclus de leur propre entrée : `normalizedFingerprint`, `fingerprint`, `deltaId`, `commitId`. `contentId` d'une communauté hash un sous-ensemble nommé, pas le document entier.

Un temps d'aging est un événement rejouable dans le contenu (`expiresAtEvent`). Une horloge murale est volatile. L'ordre des tableaux est significatif et doit être l'ordre canonique du contrat avant hash.

## Conséquences

L2–L7 réutilisent `canonical`/`hash`. Ils ne hachent pas un JSON indenté. Ils ne mélangent pas l'audit murale au snapshot. Le test `graph-contract.test.ts` recalcule chaque digest.
