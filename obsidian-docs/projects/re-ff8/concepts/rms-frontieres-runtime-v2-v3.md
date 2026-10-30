---
title: RMS — frontières runtime v2, préparation v3 et observations publiques
category: concept
tags: [reverse-engineering, testing, concept]
summary: Le moteur fixture v2, la préparation administrative v3 et le transport public ne forment pas encore une preuve de parcours natif intégré.
sources:
  - docs/missions/re-graph-scheduler/rms-static-documentation-20261028/02-parcours-et-frontieres.md
  - docs/missions/re-graph-scheduler/rms-static-documentation-20261028/04-contrat-public-et-observations.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-28
updated: 2026-10-28
---

# Trois frontières, pas un raccordement déjà qualifié

> État historique du dossier du 28 octobre. La réalisation ultérieure est [[projects/re-ff8/references/rms-implementation-cloture-partielle-20261030|clôturée partiellement le 30 octobre]]. Le contrat de reprise exige [[projects/re-ff8/concepts/rms-plugin-hote-opencode-v2|un plugin dans l'hôte OpenCode V2]], pas un contrôleur d'instance séparée. Les propriétés statiques acquises ensuite ne valent pas preuve du parcours natif complet.

Dans la version lue par le dossier documentaire, `runtimeRun` de `graph-engine.ts` exige `l8-graph-run-v2`. La préparation candidate construit un run v3 ; `prepareAdmissionV3` traite une commande administrative DATA, non un dossier agent envoyé à OpenCode. Leur présence simultanée ne prouve pas qu'un runtime public v3 les consomme.

`connectPublic` utilise le RPC `ensemble.execution.v1`. Des consommateurs de code existent ; le chemin GraphEngine consomme toutefois un `FixtureExecutionPort` dont l'observateur doit fournir les preuves requises. Renommer ce port, enlever le garde de version ou caster un type ne fournit pas les garanties manquantes.

Références de code localisées dans les sources : `graph-engine.ts:31,327–360`, `graph-adapter.ts:22–31`, candidat `graph-execution-prepare.ts:14–37`, `graph-generation-store.ts:868–898`, client `client.ts:182–195`. Les lectures sont statiques ; aucun appel natif de démonstration n'en découle.

## Identité du body et admission ambiguë

Le digest client d'une image canonique du payload est distinct du digest upstream du **body historique complet**. Une projection S1 DATA peut comparer des entrées fournies, pas authentifier l'admission native. Le mapping admission → body durable → entrée RPC réellement émise doit rester explicite, avec `actualBodyUTF8 ≤ CunitCourant ≤ CrootAcquired`.

Le client persiste avant l'envoi et rapproche un retry ; une réponse perdue ne permet pas une nouvelle identité ou origine. Dans le store graphe, l'absence instantanée après envoi ne libère pas l'admission. Refus définitif, panne de transport, quota et verdict scientifique sont différents.

## Terminalité et autorité

L'observation doit joindre admission, executionId, digest, session, `Model.Ref` effectif, résultat attribuable et preuve de quiescence. Bail expiré, stop demandé, panne fournisseur ou notification absente ne prouvent pas la fin native. Les droits réellement exercés par le worker ne se déduisent pas des droits du contrôleur.

Le handler déployé, ses versions et les événements précis n'ont pas été vérifiés dans le dossier : un accès source externe a été refusé, sans contournement ; une recherche locale vide ne prouve pas l'absence globale de handler. La lacune est une preuve future indispensable, non une permission d'inventer une sémantique plus faible.

RMS contrôle les projections et joins ; OpenCode possède les sessions/outils/permissions ; Ensemble coordonne et restitue ; le parent accepte et publie. Pas de second récupérateur ou ordonnanceur RMS pour masquer un incident de transmission.

Voir [[projects/re-ff8/references/rms-documentation-cloture-20261028|le dossier accepté]], [[projects/re-ff8/concepts/rms-publication-et-contexte-suivant|publication et contexte suivant]] et [[projects/re-ff8/skills/recuperer-un-resultat-opencode-manquant|récupération sans acceptation automatique]].
