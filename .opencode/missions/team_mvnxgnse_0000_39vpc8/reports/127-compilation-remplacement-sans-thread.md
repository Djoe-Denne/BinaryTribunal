# M2 — 127 : compiler le remplacement sans lancer de thread

## Décision et préalables

La revue126 confirme les trois défauts corrigés en source, sans bloquant source résiduel : observation liée positivement au stage ; preuves HOST consommées puis comparées LIVE avant/après append ; attentes du thread bornées sans faux joined. Le parent accepte cette revue de source et réutilise les constats123 hors impact.

La sûreté native du thread reste non obtenue et HOLD125 n'est pas levé. Autoriser **une compilation TypeScript ciblée uniquement**, dans un paquet distinct127. Une invocation,60s maximum, zéro retry. Aucun test, import évalué de source produit, replan, binding, SQLite, asset, thread ou provider. Un rouge/timeout/signal ferme ce paquet et impose un diagnostic avant correction/revue et paquet distinct.

## Entrées et isolation

Source124 gelée, douze pins et quatre pins supplémentaires du baseline113. Vérifier également base309, contrôles de composition, helpers/tests ressources/T1/S1/budget/body et dix entrées de fixture. Le nouveau tsconfig privé étend la compilation cross-epoch et ajoute le module replacement, ses tests et le contendeur au typage, sans les importer à runtime. Aucun changement des configurations historiques.

Adapter le contrôleur fini115 avec namespace neuf `evidence/s2-replacement-124-typing` et `run-environments/s2-replacement-124-typing-typecheck`. Seul argument typecheck accepté ; toute demande resources/test est refusée avant création de fixture. Une invocation60s maximale, environnement isolé et Bun/TypeScript pinnés comme115 ; logs/reçus et empreintes avant/après conservés. Le contrôleur hérité peut conserver ses branches historiques inaccessibles, mais aucun chemin d'admission ne les autorise dans127.

## Résultats attendus et limites

Rapporter le statut et les diagnostics réels, la stabilité des sources et l'absence de bases/assets. Même vert, compilation n'est ni qualification S1 concrète, ni test de remplacement, ni contention. Les trois commandes consolidées M2 ne sont pas remplacées par ce contrôle ciblé.

Une préparation ultérieure de tests sans thread reste possible après ce résultat, avec sélection explicite et absence de faux PASS sur les trois cas thread non lancés. Aucun gate runtime autorisé ici. La preuve de contention reste obligatoire et bloquée ; une infrastructure externe importante demande arbitrage, pas ajout automatique. S2/M2 restent ouvertes.

Résultat réellement observé : exit2/11diagnostics/2160ms,1invocation0retry,sourcesstables,0DB/0asset/thread. Paquet127 clos rouge, contrôleur et preuves conservés ; voir rapport128 pour les raccords et la suite source. Aucun runtime autorisé par ce résultat.
