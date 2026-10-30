# 2. Terminer l’orchestrator sans dupliquer Ensemble ni encombrer les sources

## Objectif et état

Achever le pipeline statique RMS en réutilisant au maximum Ensemble existant,
avec du code maintenable et une vérification solide mais non excessive.
La mission reste en préparation : **vos corrections ne sont pas un lancement**.

## Corrections inscrites dans le brouillon

- OpenAI exclusivement : catalogue inchangé, Luna low/medium et Sol
  medium/high/xhigh. Aucun autre fournisseur ou repli ajouté.
- `autonomy.mode: long_run`, avec cinq priorités : réutiliser Ensemble,
  maintenir un code lisible à l’échelle humaine, éviter la suringénierie de QA,
  isoler les essais temporaires et réflexions dans un worktree dédié, décider
  et poursuivre les travaux courants dans les autorisations convenues.
- Deux critères de vérification explicitent la maintenabilité et l’isolation
  des essais. Un worktree devra contenir le candidat et ses overlays nécessaires,
  et non être supposé équivalent parce qu’il part du dernier commit.

L’autonomie est distincte de la classification, qui n’a pas été modifiée.
Le mode long run proposé remplace le mode supervisé mentionné dans le plan
initial uniquement après approbation de cette nouvelle présentation.

## QA proposée et limites conservées

Je recommande de conserver **reinforced**, le niveau renforcé demandé par
l’ordre : preuves explicites et revue indépendante des risques obligatoires,
sans pipeline fixe ni infrastructure supplémentaire gratuite. Les niveaux
light et proportionate réduiraient la formalisation ; ils ne remplacent pas
ici l’exigence renforcée sans changement explicite du mandat.

Les trois commandes consolidées sont inchangées et restent non exécutées.
La réutilisation des preuves et les contrôles selon l’impact restent la règle.
Long run ne lève ni le gel des tests ni l’interdiction des trois chemins avec
threads, et ne modifie pas la limite des origines. Le premier lancement reste
limité aux quatre études documentaires, avant ratification précise des
modifications et exécutions nécessaires. Aucune nouvelle question n’est prévue
pour les choix techniques ordinaires déjà couverts par le contrat.

## Vérification effectuée

Relecture du JSON : syntaxe valide, fournisseur et cinq couples modèle/variante
OpenAI conservés, mode long run et cinq priorités présents, seize critères
d’acceptation, trois commandes conservées, périmètre initial inchangé.
Ce contrôle documentaire ne remplace pas la validation native par `config`.

Aucun worker, classifier, test ou worktree n’a été lancé. Aucun code produit,
réglage global, fichier M2 ou tâche native n’a été modifié. Seuls le brouillon
de cette mission et ce compte rendu de supervision ont été écrits.

## Décision attendue

Vous pouvez encore corriger ces priorités, ou garder la mission en pause sans
effet sur le produit. Je recommande cette révision, qui reprend vos consignes
sans relâcher les garanties existantes. Aucun coût ou délai nouveau n’est estimé.

Lancer **`/ensemble-mission config`** pour présenter exactement le brouillon
corrigé, puis **`/ensemble-mission start`** si cette présentation vous convient.
La présentation précédente ne suffit plus à approuver cette révision.

Références : [brouillon corrigé](../model-policy.json) et
[rapport de préparation initial](001-politique-et-plan-bornes-avant-lancement.md).
Localisation / impact / limites : correction locale du contrat de mission,
sans analyse symbolique ou changement de source ; aucune preuve du produit
requalifiée, aucune autorisation d’exécution déduite des corrections.
