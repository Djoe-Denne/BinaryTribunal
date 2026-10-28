# M2 — 147 : mesures RAM livrées, revue de l'équivalence et de l'innocuité

## Livraison vérifiée

Cinq fichiers146 livrés, tailles/hashes recalculés conformes par le parent. Neuf autres pins138, inputs122 et308lignesbase sont intacts ; COMPOSITION_RECEIPT et le codec qualifié d'origine sont inchangés. Le codec **isolé** est un overlay déclaré, non309base inchangés. Les quatorze sources courantes sont readonly. [Manifeste146](../evidence/s2-replacement-source-146.json) ; snapshot exact138+codec sous snapshots/s2-replacement-145.

Parent lit le collecteur6207B/92lignes : module sans imports, agrégats fermés, pile bornée, inactivité initiale et purge àfinish sont présents. Ceci n'est pas une preuve de toutes ses propriétés : revue indépendante requise sur les shells et leur impact. **Aucune compilation, mesure ou exécution nouvelle.**61cas annoncés conservés, aucun nouveau PASS.

## Revue ciblée

Reprendre le reviewer retenu, décision146 et corps138 comme oracle de préservation. Vérifier uniquement les cinq deltas et leurs risques ; réutiliser preuves139/137/antérieures hors impact, pas d'audit scientifique450+9 ou catalogue métier61/131.

1. Équivalence inactive : trois corps instrumentés restaurables byte-exacts, mêmes expressions/ordre/lecture de propriété une seule fois/returns/SQL/throws. L'import du collecteur ne lance rien. Inactif, aucune horloge/scanbytes/tokenallocation ; la branche inertielle et finally sont un coût reconnu, pas une promesse de zérocoût. CodecResultok:false, stagenull et throws restent distingués sans altérer le résultat. Mêmeexception, pas nouveau garde/catch qui masque la validation.
2. Diagnostic sans autorité : aucun paramètre/résultat métier/publictype/record/frame modifié ; aucune garde ne lit les statistiques. Modulefeuille sans dépendance, APIs nonréexportées/RPC/envflag/callback ; activation dans le seul cas ciblé, pas àl'import. Défaillance de collecteur/nestedsession/token/overflow/horloge produit incomplete et arrêt des mesures, pas un résultat produit ou une exception qui remplace l'originale. État borné21agrégats/32pile/1millionentrées, pas de strings/objets métier retenus.
3. Sens des métriques : bytesUTF8 réels des chaînes déjà disponibles, pas réf déclarée ou secondelecture getter ; unavailable avant validation signalé. Inclusions/résiduel instrumenté/rootunion et phases entrées/nonentrées sont cohérents ; pas doublecomptage causal ou volumemétierunique. Horloge prise avant scanbytes implique overhead noncorrigé, ne pas interpréter le résiduel en temps propre absolu ni attribuer GC/SQLite/S1internes inconnus.
4. Test et nettoyage : même ordre d'actions et sept assertions,61titres/délais inchangés ; phases lexicales horsTX. Finallycouvre construction et close, priorité des erreurs SUT/assertion/close préservée. Finishdésactive/purge même si snapshotéchoue ; unique logJSONborné aprèsclose démontré/horsTX sans objet métier. Absence de readout en cas de construction/close/kill reste mesuremanquante, jamais extrapolation. Aucune modification ou levée des trois cas thread.

Le delta codec affecte de nombreux consommateurs production ; vérifier les callsites utiles et l'équivalence inactive de façon proportionnée. Ne pas traiter l'ancien pin comme courant dans une future gate, et ne pas modifier le reçu de composition. Les preuves historiques restent versionnées ; les trois commandesconsolidées demeurent non exécutées.

## Retour et permissions

Retour source prêt pour compilation/diagnostic ou défaut bloquant précis contrat/source/scénario et risque ; suggestions différables à part. Aucun chiffre de performance ou PASS anticipé. Si le collecteur semble inefficace, distinguer coût inconnu d'un défaut de sûreté/équivalence, sans étendre à un framework général.

StrictRO : lectures/hash/AST/refs bornées, aucun write/importévalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA S1/L7/claimtâcheglobale. Aucun diagnostic runtime autorisé ici. Parent fermera compilation et une gate diagnostic neuve après verdict, mêmes15s et plafondfini. HOLD125 intégral et S2/M2/remplacement/S1concret global/contention non acceptés.
