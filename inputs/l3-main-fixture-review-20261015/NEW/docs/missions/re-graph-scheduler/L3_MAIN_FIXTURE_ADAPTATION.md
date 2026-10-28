# L3 — adaptation des deux tests au L2 accepté

2026-10-15. Gate main L2+L3 initial : typecheck PASS, focused 292 PASS / 3 SKIP /
3 FAIL. **Pas intégration acquise.** Un échec vient du manifeste original absent
de main ; ses 98 fichiers existaient déjà tous avec les SHA originaux. Parent a
copié le seul manifeste original `79790bef…`, sans réextraire ni changer les gels.

Les deux autres échecs sont des hypothèses de fixtures devenues obsolètes devant
les guards L2 acceptés après le gel L3NUM :

1. `cluster.test.ts:107` supposait que des shards aux métadonnées contradictoires
   passaient `validateGraphSnapshot`. Le nouveau L2 rejette déjà ces contradictions.
   L'assertion adaptée vérifie séparément le vrai schéma JSON (shape valide), puis
   le rejet cross-field L2. **Tous** les checks de rejet L3, permutations et
   immutabilité restent. Aucune suppression de test ni attente devenue permissive.
2. Le variant synthétique 64/65/129 sites ajoutait 129 instructions dans le caller
   de 16 octets de la fixture L1. Avant construction des sites, le clone mémoire
   de cette fixture déclare désormais le span réellement nécessaire et sa taille
   connue correspondante ; fingerprint recalculé et base validée. Les sites sont
   toujours distincts, sharding limité à 64, relation unique et invariance conservés.
   Le fichier fixture L1 n'est pas modifié ; ce n'est pas une preuve de vrais bytes.

Décision parent : **adaptation d'intégration test-only**, pas correction de maths
Leiden/PPR, changement de production, nouvel arbitrage de domaine ou relâchement
des guards L2. Les anciens gels restent inchangés. Les deux tests adaptés passent
74 assertions ; cela ne remplace ni revue indépendante ciblée ni gates complètes.

Une nouvelle session indépendante Sol Max vérifie le delta des deux tests, son
absence de perte de couverture et les spans/identités/citations du variant. Aucun
ancien auteur/reviewer n'est réveillé. Pas réouverture des revues numériques ou L2.
L4/L5, L7/L8 ne sont pas annoncés intégrés sur ce seul résultat.
