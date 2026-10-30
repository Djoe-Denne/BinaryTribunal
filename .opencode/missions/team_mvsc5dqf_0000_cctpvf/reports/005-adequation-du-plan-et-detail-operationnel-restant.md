# 5. Un bon découpage de reprise, encore trop condensé comme guide d’exécution

## Objectif et jugement

La mission vise toute la chaîne statique RMS, pas seulement la correction du
remplacement. Votre remarque sur le manque de détail est justifiée pour le
document de synthèse et sa présentation en discussion.

**Le plan est adéquat pour lancer les études documentaires autorisées, mais
PLAN_PREPARATION.md n’est pas, seul, un guide assez détaillé pour dérouler toute
l’implémentation.** Les onze tâches donnent un ordre cohérent et préservent les
garanties ; une partie du détail technique existe déjà dans le candidat PM
complet, sans être suffisamment rapprochée des fiches durables de cette mission.

Le statut natif `ready` clôt le manque de préparation déclaré et permet sa
réception par le mécanisme d’import. Il ne qualifie pas à lui seul la qualité
de toutes les solutions futures ou l’acceptation du produit. Le rapport précédent
doit se lire dans cette portée, pas comme une validation de l’exécution finale.

## Ce qui est déjà solide

- Acquis M1/M2 préservés, étude du remplacement avant code, récupération des
  livraisons avant réaffectation, et aucune attribution spéculative des coûts.
- Dépendances réelles et file unique de onze tâches, avec études indépendantes
  possibles après le rapprochement des preuves.
- Séparation des responsabilités RMS/OpenCode/Ensemble, ratification avant les
  changements hors autorisation, revue indépendante et validation parent.
- Réutilisation des preuves selon l’impact, quinze secondes par test inchangées,
  threads et origines toujours bloquants là où leur preuve est indispensable.

## Détail à consolider, sans agrandir la mission

1. **Une fiche opérationnelle par tâche existante.** Relier entrées et versions,
   histoire nécessaire, actions bornées, fichiers consultés ou possédés, sortie
   attendue, critères observables, contrôle pertinent et condition d’arrêt.
   Le candidat PM fournit déjà des critères et des sources : les consolider,
   pas refaire son exploration.
2. **Une carte de la chaîne entière.** Pour chaque passage faits → graphe →
   groupes → plan → sessions → revue → publication → prochain travail, indiquer
   composant existant, preuve réutilisable et manque réel. Cela évite de réduire
   de fait la mission au seul remplacement actuellement bloquant.
3. **Un scénario final observable.** Décrire les entrées maîtrisées, effets
   attendus à chaque frontière, reprise après échec, publication unique et
   déblocage du prochain travail. Distinguer fixture, transport contrôlé et
   observation native ; ne pas créer un harnais ou lancer un scénario ici.
4. **Des décisions architecturales localisées.** L’étude B et le contrat public D
   portent les frontières à décider et une alternative rejetée. Pas besoin d’un
   architecte supplémentaire systématique. Chaque implémentation dépend de la
   décision applicable et du seul périmètre autorisé.
5. **Un contrat de vérification précis au bon moment.** Reprendre les tests et
   oracles déjà identifiés, lier risque → preuve/version → contrôle affecté et
   fixer bornes et sélections avant toute exécution. Les paramètres dépendant
   des études restent explicitement à déterminer, pas inventés maintenant.
6. **Une préparation concrète des worktrees.** Documenter transfert des sources
   non intégrées et overlays, propriété des fichiers et isolement des essais.
   Un worktree issu du dernier commit ne suffit pas à représenter le candidat.

Les solutions de performance, garanties anti-orphelin ou route publique non
ratifiées ne peuvent pas être écrites comme des décisions déjà acquises pour
rendre le plan artificiellement plus détaillé. Les bornes d’exécution ultérieures
restent à fermer après les études, conformément au contrat actuel.

## Recommandation

Conserver les onze tâches et densifier leurs dossiers d’entrée à partir du
candidat complet déjà livré. Viser assez de détail pour qu’un auteur sache
quoi lire, quoi produire, comment son résultat sera accepté et où il doit
s’arrêter ; ne pas ajouter de réunions, de workers ou de campagne de QA.

Cette consolidation documentaire peut se préparer sans code, test ou nouvelle
file. Les choix qui changeraient réellement le mandat ou ses garanties exigeraient
toujours leur arbitrage. L’absence de solution encore étudiée n’est pas à
confondre avec une absence de découpage.

## Sources, correction et limites

- `PLAN_PREPARATION.md:6–21` : portée documentaire du premier lancement.
- `PLAN_PREPARATION.md:61–105` avant cette correction : fiches synthétiques des
  onze tâches ; `114–130` : projections ; `148–181` : contrôles futurs.
- Finale PM complète `msg_1836e8b04001qvDbpR5YgmDGTl`, session
  `ses_e7c960e08ffedHMLFaxorVahbm`, déjà examinée dans le rapport de rapprochement.
- [Préparation reçue et portée de sa revue](004-preparation-recue-sans-creation-de-doublons.md).
- [Rapprochement avec le candidat détaillé](003-reutiliser-la-file-native-sans-double-import.md).

Une mention documentaire périmée « mode supervisé » a été corrigée dans le plan
pour refléter la proposition long run déjà inscrite dans la politique. Ce n’est
pas une nouvelle priorité ni un changement de politique. Aucun autre détail
d’implémentation n’est prétendu complété par ce rapport.

Localisation / impact / limites : relecture du plan et réutilisation des preuves
de préparation ; correction de cohérence documentaire et présent compte rendu
uniquement. Aucun changement de tâche, modèle, politique, source ou autorisation ;
aucun test ou auteur lancé. La mission demeure non démarrée.
