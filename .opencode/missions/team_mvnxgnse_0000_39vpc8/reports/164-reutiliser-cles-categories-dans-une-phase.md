# M2 — 164 : réutiliser les clés des catégories dans une seule phase

## Décision fondée sur le code et les mesures

Le trajet162 reste FAIL15s à91s. La préparationRO163 identifie un calcul distinct du mémo153 : assertFinalOwn461 recalcule canonical(documentcomplet) avant chaque lookup de son cache de décodage. Parent recoupe459–491 : plusieurs accès au même document acquis/deepfrozen dans la même phase, puis contexte déjà renouvelé avant Q/terminal. Nominalement40calculs de clés pour27documents par phases ; ni leur coût ni leur part des44761ms noncouverts ne sont mesurés.

Autoriser un petit delta source **dans src/graph-final-inventory.ts seulement**, après préservation des quatorze sources158/manifeste. Ne pas rouvrir le mémo153, les tests acceptés, codec/collecteur ou l'autorité. Aucun nouveau module, API, record, formatpersisté ou framework.

## Invariants

Dans la même fermeture locale, un index paresseux catégorie→chaînecanonique complète déjà calculée peut éviter sa reconstruction. Le cache de décodage garde sa clé sur le DOCUMENTCOMPLET exact (utf8/ref/touschamps), pas une preuve acceptée par nom/refseuls. L'index de noms n'est valide que pour les catégories de ce snapshot réellement acquis/owned/deepfrozen ; jamais pour un port/ROW/source mutable. Vérifier cette chaîne d'ownership avant édition.

Création après verifyFinalHost et finalOwnRows. Calcul paresseux au même point initial, ordre d'erreurs/lectures inchangé. Reset simultané des deux index **avant** collectTerminalHistory et purge avant events/journal ; nouveau contexte à chaque invocation, phase pré/postappend et transaction. Pas de paramètre caller/mapexportée ni cache global/intertransaction. Aucun résultatLIVE/existence/metadataSQL/permission n'est réutilisé.

Tous SELECT/énumérations/joins et invariants de catégories restent exécutés contre les métadonnées actuelles. Gardes HOST/current/Q/epoch/TTL/controller/fullhead/fences/journaux pré/postappend inchangées. Documents/frames/snapshots entiers conservés ; ne pas rafraîchir le final ou réduire ses preuves. Résultats immuables et règles de retour existantes inchangés.

Le worker livre hash/diff restaurable, preuve ownership/clé/scope/reset et absence d'autre effet. Références utiles bornées selon politique, pas d'oraclesQA. Aucun nouveau compteur indispensable n'est identifié ; pas d'instrumentation ou campagne de mesure ajoutée. Le gain net reste inconnu,40→27clés n'implique pas91→15s.

## Vérification et permissions

Même reviewer ciblé sur cette seule réutilisation de calcul et son impact ; preuves produit154/oracle156/types159 et mutations161 horsimpact réutilisées. Après gel/revue : compilation neuve et contrôles inventory/head/current/révocation/Q/postappend affectés, puis diagnostic existant sur ressources neuves. Pas de catalogue66/131rejoué automatiquement ou nouveaupipeline.

Source seulement : aucun import évalué/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Autres treize sources158, inputs122,308base+overlay et artefacts intacts. Seuil15s/300s inchangé, HOLD125 intégral ; aucune architecture de stockage/cacheautorité nouvelle autorisée. S2/M2/remplacement non acceptés et commandes consolidées non lancées.
