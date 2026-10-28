# Driver de mesures L7 — lecture du PROTOCOL gelé, borné 1k/10k, source seule

Fresh auteur, disjoint de l'auteur bench (task_mvc59ue8_001j) et de sa review
(ACCEPTABLE_SOURCE_SCOPED). NONBLIND déclaré. Objet : ÉCRIRE un driver TS qui,
exécuté PLUS TARD par le parent (gate séparée), produira les mesures réelles
1k/10k selon le PROTOCOL gelé (c71928c7/20008B) en important le bench gelé
(sparse-bench.ts 91c127a4/20318B). Tu n'exécutes RIEN — le driver est une SOURCE
que le parent relira, re-pinera et exécutera sous son propre GO (run pure-TS
borné, 100k exclu).

CONTRAINTES MÉTIER (revue admise + PROTOCOL) :

- Tailles N = 1000 et 10000 SEULEMENT. 100k explicitement EXCLU du driver —
  l'absence de allowLarge garantit le refus du générateur ; le driver n'essaie
  jamais de le contourner.
- Seeds explicites CONSTANTES dans le driver (pas de random au runtime), mêmes
  événements/durées/ressources par bras (baseline vs variantes), labels pliés
  SYNTHÉTIQUES déclarés explicitement avec la fuite éventuelle signalée.
- Sorties par bras : N/E/SCC attendus (bornes analytiques gelées 2890/28915)
  recalculés indépendamment, temps mesurés à l'horloge, mémoire process,
  itérations par politique ; DTO métriques source-neutre (pas un format
  produit) ; AUCUNE allégation de gains natifs ; bornes analytiques ne sont
  jamais présentées comme observations.
- Import UNIQUEMENT du bench gelé, par chemin absolu PINNÉ en tête du driver
  (SHA en commentaire) ; pas d'import produit ff8-harness ; pas de réseau ; pas
  d'écriture fichier (le parent capture stdout) ; temps total cible < 90 s pour
  les deux tailles (budget parent) ; aucun flag pouvant étendre à 100k, aucun
  allowLarge.

LIVRABLES (output assigné, EXACTEMENT 2) :
1. measures-driver.ts — le driver source (style TS du pouch, imports pinés en
   tête avec SHAs en commentaires, assertions des compteurs attendus
   indépendants).
2. MANIFEST.json — pins (driver, bench, protocole), budget 90s, tailles, seeds
   déclarés, note anti-100k, provenance scope review.

PHASES : 1 ACK pins puis HOLD ; 2 sur GO distinct = écriture + rapport public
(structure du driver, bras, seeds, assertions) ; puis HOLD. Le parent relira,
re-pinera et exécutera lui-même les mesures (GO séparé).

Modèle imposé : opencode-go/glm-5.3-flash max (complexité 50 ≤ 60, règle
utilisateur), spawn fresh, Model.Ref vérifié.
