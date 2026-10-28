# ADR-011 — WorkUnit au-dessus de Intent.identity

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

`Intent.identity` reste une fonction : `{ sha256, version, ea }`. Une WorkUnit est un agrégat de planification. Son `unitId` n'est ni une EA, ni un id de groupe, ni une valeur glissée dans `Intent.identity`.

Chaque sous-intent porte exactement une fonction possédée, un rôle, et une `harnessIdentity` projetée de cette seule fonction. A et B partagent le bail de famille (`sharesFamilyLease: true`) avec des sorties disjointes. Ils ne sont pas deux réservations ni deux commits. R attend A et B de la même fonction. Une fonction de contexte n'a pas de sous-intent et n'est pas analysée par l'unité qui la consulte.

v1 fige `pipeline: "2+1"`. Une dérogation n'est pas représentable. `COMMITTED` est un état d'unité, après KnowledgeCommit et readback du niveau requis. Une attempt n'a pas d'état `COMMITTED`. La complétion Ensemble n'est pas ce commit. `isGitCommit` n'admet que `false`.

Niveaux admissibles : 1 fixture, 2 connaissance locale. Le niveau 3 IDB est absent de l'enum.

## Conséquences

L5 émet des unités et des sous-intents, pas des intents de groupe. L6 persiste l'unité au-dessus des intents existants. L8 projette chaque sous-intent vers un `Intent` harnais à une fonction, sans changer le cycle scientifique A+B→R de cette unité.
