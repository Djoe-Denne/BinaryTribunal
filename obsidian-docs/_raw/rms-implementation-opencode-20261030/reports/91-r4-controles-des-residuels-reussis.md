# 91. Correction r4 : contrôles des défauts résiduels réussis

## Objectif et résultat

La correction de mission et de sélection du graphe est livrée. Les sept empreintes et le pin r4 sont conformes ; seuls quatre fichiers produit/tests changent depuis r3. La compilation réussit en3640 ms.

Les contrôles affectés exécutés sur r4 réussissent :26 cas,168 assertions, aucun échec. Cela comprend les20 cas d'obsolescence et6 régressions de migration/version future. Les primitives inchangées conservent leur preuve55cas/125assertions ; elles n'ont pas été rejouées.

## Risques vérifiés sur r4

- Une mission déclarée différente de la mission durable est refusée avant tout appel transport ; les contradictions unité/tâche restent refusées.
- Une décision réellement créée puis corrompue est refusée avant transport : le risque du négatif perdu est rétabli dans un cas distinct.
- Une commande legacy légitime sans outbox conserve son chemin positif.
- Le graphe de test contient une dépendance obligatoire vérifiée et un travail indépendant : le producteur obsolète et son consommateur ne sont pas émis, l'indépendant est réellement committé après reprise, le plan et le lease du producteur restent conservés.
- Les autres fenêtres exigées de rollback, perte d'autorité, quota, rapprochement de commande, résultat tardif, publication ambiguë et lecture de contexte ont été rejouées selon l'impact des gardes modifiées.

Les nouveaux corps et imports ont été inspectés avant exécution. Les fixtures sont hors ligne ; aucun helper Worker/contender, nouvelle origine native, test gelé ou suite globale n'est atteint par les sélections. Les tests filtrés ne comptent pas PASS.

## Bornes et réception

Les sélections sont sérielles, avec dix minutes par test. Le cas le plus long dure28946,35 ms ; aucun dépassement de la borne. Les durées et reçus exacts sont conservés dans l'evidence liée.

La reprise indépendante est en cours, limitée aux deux défauts résiduels, à la restauration du négatif et à leurs impacts. Aucune acceptation de cet incrément ni fusion n'est encore prononcée. Il ne s'agit pas d'une qualification d'ordre ou d'exécution native ; les étapes suivantes restent à réaliser dans leur contrat.

Le précontrôle d'intégration observe la base canonique inchangée, un index vide et aucun chevauchement entre les sept fichiers candidats et les douze chemins suivis actuellement modifiés dans le dépôt principal. Ces modifications doivent être préservées ; leur nombre n'est pas assimilé sans comparaison aux onze modifications utilisateur historiques. Aucun nettoyage ou réinitialisation n'est effectué.

## Preuves

- [Reçus et durées r4](../evidence/obsolescence-r4-targeted-parent.json).
- Pin : `3ec2f5f49b505915b8c126b2357e150e382cca0b`.
- Contrat de correction : [deux défauts résiduels](90-deux-defauts-residuels-correction-bornee.md).
