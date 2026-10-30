# 202. Tests offline réussis ; deux blocages de code restants

## Résultats réellement exécutés

Sur les cinq pins courants201, vérifiés avant et après chaque commande :

- Typecheck corrigé : sortie0,4091ms ; échec initial4440ms préservé.
- Primitives convenues :55cas,125assertions, zéro échec ;84ms invocation parent,47ms Bun.
- Sélection client :3cas,37assertions, zéro échec ;149ms parent,128ms Bun.114cas filtrés non exécutés.
- Sélection binding :3cas,25assertions, zéro échec ;60ms parent,40ms Bun.6cas filtrés non exécutés.

Les six cas sélectionnés correspondent exactement aux oracles fermés201. **Aucun hôte, session ou modèle n'a été demandé.** Aucun cas filtré ne compte comme PASS et aucune suite globale n'a été lancée. Les reçus, argv complets, pins et logs sont sous `qa-owned-runtime-200`.

## Verdict de revue : lancement encore bloqué

L'avis `result_mvv5fz8j_0008_9urxf4`, message `msg_18d817daa001mLoeWFHSzcO5X5`, rapproche les pins avec ses lectures et ne relève pas d'autre défaut dans le mint privé, les faux caps, le port GET et les contrôles de révocation examinés. Il conserve deux défauts bloquants, corroborés par le parent :

1. La deadline est désarmée avant les écritures des logs et du reçu. Aucun contrôle final ne refuse actuellement un succès dont cette finalisation finit après120secondes (`client.ts:661–678`).
2. Les identités dev/ino des pins et bases sont comparées comme nombres JavaScript potentiellement arrondis. Elles ne satisfont pas le claim d'identité de fichier/DB exigé par198 (`client.ts:447–507,626–630`).

Le typecheck et les tests offline ne ferment pas ces propriétés. **La qualification Bun→Bun reste interdite.** Les preuves Node193 ne les remplacent pas.

## Correction locale autorisée

Le parent autorise seulement les corrections nécessaires dans les cinq fichiers déjà ouverts : stats BigInt de bout en bout avec identifiants durables en chaînes décimales, et contrôle final monotone du budget couvrant logs et reçu. Une sortie hors borne doit rester HOLD même si les deux GET et la fermeture ont réussi. Un reçu préécrit favorable ne doit pas devenir une preuve adoptable si l'E/S termine trop tard : la distinction provisoire/finale doit être explicite, sans écrasement ou retry.

Les tests existants peuvent recevoir des oracles négatifs ciblés pour identifiants supérieurs à2^53 et coût de finalisation dépassant la borne. Pas de nouveau harnais important, watchdog global, processus ou store. Le constructeur ne lance aucun contrôle ; le parent fermera le nouveau gel et rejouera les seuls contrôles affectés, puis demandera au même reviewer de revoir les deux blocages et leur impact.

## Conservation et limites

Le parent a copié les cinq sources courantes dans `qa-owned-runtime-200/baseline-201` avant correction, sans base ou autorité. Les pins et résultats ci-dessus restent rattachés à cette version, pas au futur correctif.

Les erreurs de syntaxe de rédaction d'un message Code Mode au constructeur ont été corrigées avant livraison ; elles n'ont exécuté aucun produit ou test. Aucun refus natif n'a été contourné.

Les droits et l'origine170 restent inchangés. Aucun POST, effet métier, D5 ou M2 accepté par ces succès offline.
