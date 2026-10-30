# 99. QA native hors ligne : échecs de préparation et corrections de revue

## Objectif et état

Le raccord doit être vérifié de bout en bout avant réception. Le checkpoint r4 compile et ses16empreintes sont conformes. Les six sélections de tests prévues ont été exécutées :11cas réussis,13échecs,53assertions. Le candidat reste non recevable et non intégré. La continuation est autorisée dans la même tâche, sans nouveau GO utilisateur.

## Échec préalable des scénarios positifs

Les13échecs client se produisent tous avant la création de la cible et l'admission : la fixture relit le domain.ts de travail, modifié pour l'ancrage natif, alors que le contrat v3 historique exige le module qualifié15444octets/SHA3f49… . Aucun de ces13cas n'a donc exercé le parcours positif annoncé. Les autres réussites ne remplacent pas cette preuve.

Le superviseur a corroboré le contrôle fermé dans graph-execution-envelope1091–1129, puis vérifié que le blob domain.ts de la base9c1b6aa correspond exactement aux octets qualifiés. Il est interdit de changer la liste des empreintes qualifiées, d'assouplir le validateur, de supprimer/skip les tests ou de promouvoir le nouveau module comme déjà qualifié.

### Extension de fixture autorisée

Une copie byte-exacte du module historique est fournie comme **donnée non exécutable**, avec provenance de commit et empreinte vérifiées. Deux chemins de test supplémentaires sont autorisés :

- `test/s2-author/s1-source-fixtures.ts`, uniquement la résolution de domainModule vers cet asset et un contrôle indépendant de taille/hash ;
- `test/fixtures/qualified-upstream/domain-3f49fa05a228549ed626b4f269818385fd23f32d7cc600eda84a1cd9cb42dbe7.ts.txt`.

Les chemins logiques, types de références et autres pins restent inchangés. L'asset doit être committé et manifesté pour que le test reste portable sans Git, dossier temporaire ou chemin canonique au runtime. Il ne qualifie pas le module natif de travail. Cette adaptation préserve la frontière gelée, sans nouveau harnais ou étude des acquis.

L'auteur a depuis livré un pin r5 de cette seule adaptation, conservé comme checkpoint ; il n'a pas été exécuté avant la continuation des corrections de production demandées ci-dessous.

## Quatre bloquants de revue corroborés

La revue indépendante du pin r4 a identifié quatre défauts statiques. Le superviseur a relu les points sensibles ; ces contre-exemples ne sont pas présentés comme déjà exécutés.

1. **Copies de travail gelées.** immutableCopy gèle récursivement, mais les drafts de préparation, débit et notification mutent ces objets. Corriger uniquement les copies de travail internes mutables ; préserver les captures immuables aux frontières.
2. **Contournement par le transport historique.** Le client et GraphStore ne classifient pas toutes les opérations natives avant le chemin legacy. Refuser le downgrade durablement lié à une opération native avant token/transport et après les attentes asynchrones, sans se fier à un flag appelant.
3. **Permis courant insuffisamment rapproché.** Le permis retenu n'est pas opposé aux changements de plafond, origine ou slot à l'envoi. Conserver les droits stables et confronter le plafond courant au body et aux bornes retenues ; distinguer renouvellement légitime de preuve et substitution de grant ou de réserve.
4. **Intégrité journal/projections incomplète.** L'ouverture ne vérifie pas le digest complet de certains événements préparatoires, et les claims/révisions peuvent diverger sans détection suffisante. Contrôler les jointures, événements complets et transitions privées avant reprise/effet, sans recréer une autorité depuis un événement public.

Les nouveaux négatifs doivent couvrir notamment le downgrade legacy, le permis réduit/changé et la corruption de payload/claim/révision avant effet. Aucun changement global d'immutabilité, remboursement, suppression d'histoire ou nouvelle infrastructure n'est autorisé.

## Contrat et preuve native

Les règles approuvées de budget courant, plafond d'unité, tous les bodies REST, slot et histoire restent distinctes ; ni hausse de cap ni changement d'oracle pour faire passer. L'observation d'un modèle divergent peut rester une donnée attribuable, mais ne prouve pas la conformité au modèle/profil demandé. La qualification réelle devra l'établir explicitement avant de l'utiliser comme preuve.

Toutes les exécutions de cette étape sont hors ligne et bornées, sans Worker/contender, nouvelle origine native, test global ou expérience gelée. Aucun dépassement de dix minutes. La revue reprend ensuite seulement sur les bloquants et l'impact des corrections ; aucune promotion du candidat ou clôture de mission.

## Traçabilité

- [Reçus QA r4](../evidence/native-runtime-r4-targeted-parent.json).
- Revue : `result_mvu1ltlk_000t_l9ehjt`, finale `msg_1898300de001cI71fkjY3wy3J3`, pin `7a41a16930031103b85e07efe09db803100c0d1d`.
- Checkpoint fixture r5 : `cd1b15909e027910e481a31b57beb4cca5dd68c3`, non qualifié par ce rapport.
- Localisation : eventlog15–20 ; graph-store419–429,546–550,635–638,698–717,1027–1037 ; client109–110 ; guards de dispatch cités dans la revue.
