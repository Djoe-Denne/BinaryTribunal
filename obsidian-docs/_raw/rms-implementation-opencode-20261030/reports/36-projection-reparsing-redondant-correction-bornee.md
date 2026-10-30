# 36. Projection : correction bornée du parsing redondant

## Faits et décision

L'analyse statique du développeur et la lecture parent démontrent des répétitions introduites par le delta : les accesseurs de projection/policy relisent le journal puis reparsent intégralement le même run plusieurs fois dans une validation. Ces chemins sont aussi traversés lors de lectures scientifiques répétées du producteur sans overlay. Le parent confirme les appels concernés.

Ce défaut de coût redondant est établi ; **sa contribution au dépassement n'est pas mesurée et sa causalité exclusive n'est pas démontrée**. Aucune récursion infinie n'est prouvée. Le parent autorise une correction locale de ce défaut, sans profilage, instrumentation ou promesse de passage sous quinze secondes.

## Bornes du correctif

Un résolveur d'origine commun peut réutiliser les seuls résultats purs de parseGraphRun et parseNextContextPolicy quand les octets exacts et l'identité de l'origine sont inchangés. Cache dérivé limité à une entrée par instance GraphStore, jamais persistant ni autorisant. Chaque appel relit les origines actuelles et vérifie cardinalité, type, clé, attribution et digest ; absence, duplication ou altération ne peut être masquée par le cache. Une requête ciblée préservant les mêmes vérifications est permise.

Les droits actuels ne sont **jamais** mémorisés : parent, approbation privée, révocation, publication/attestation/éligibilité, leases/fences/epochs, permissions d'inputs et fichiers restent frais à leurs barrières. Aucun retrait de relecture aux frontières ni réutilisation de binding vivant sans contrat de snapshot. Le cache ne doit pas être modifiable par l'alias d'un objet rendu au caller.

De petits négatifs doivent vérifier altération après échauffement, origines incompatibles et absence d'autorité apportée par une valeur rendue modifiée. Réutiliser les scénarios existants s'ils couvrent effectivement ces risques ; pas de nouveau framework.

## Défaut distinct du test d'ambiguïté

Un scénario de test ajoute deux artéfacts pour une fonction, alors que le garde préexistant de manifeste en impose exactement un. Il doit donc refuser **avant publication**, et non prétendre à une publication valable devenue ambiguë au préfiltre. Le cas est conservé avec le bon oracle de refus anticipé et absence de commit/admission/effet ; le cas valide de genre non approuvé reste distinct. Aucun garde de production assoupli pour rendre la fixture admissible.

Ce défaut de fixture n'explique pas le cas central interrompu, qui ne crée qu'un artéfact. Il n'a pas encore été exécuté ; aucun RED n'est inventé.

## Validation prévue et limites

Le même développeur peut modifier seulement graph-store.ts et next-context.test.ts pour ces corrections ; autres pins gelés. Aucun test/CLI produit par lui. Après nouveau commit/pin, le parent relancera typecheck puis le seul cas central avec la borne de quinze secondes, avant d'élargir les sélections autorisées. Pas de replay global ou scientifique, aucune hausse de délai.

## Localisation et preuves

Lectures parent du worktree : graph-store.ts:574–599 et643–654 ; EventLog.read:55–57. Chaîne statique complémentaire fournie par le développeur : scientificResult → assertDurableAdmission/assertAdmissionInputs → assertNextContextInputs → nextContextPolicy ; conditions current=false ne prouvent pas de récursion infinie. Le scénario d'ambiguïté est dans next-context.test.ts:211–229 et le garde de couverture exacte dans graph-store.ts.

Impact : suppression de répétitions pures et correction d'oracle de fixture seulement. Limites : cause temporelle exacte inconnue, performance et comportement non validés ; approbation privée et tous les contrôles32 obligatoires, v3/natif et clôture non prouvés.
