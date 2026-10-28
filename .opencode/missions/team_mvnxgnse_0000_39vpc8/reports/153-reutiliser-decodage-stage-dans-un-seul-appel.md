# M2 — 153 : réutiliser le décodage exact du stage dans un seul appel

## Objectif et preuve utile

La mesure151 montre185appels au lecteur de stage, dont153retours portant en moyenne7360414octets de stage par occurrence. L'auteur recoupe les lecteurs replacement61–80/165–171 : énumération puis relecture immédiate rehashent et décodent plusieurs fois le même wrapper et son document. Les temps séparés de ces sous-opérations ne sont pas mesurés ; aucun retrait des contrôles LIVE distincts ni garantie107→15s n'en découle.

Retenir le plus petit delta proposé : un décodage/fingerprint pur réutilisé entre l'énumération et la relecture du même appel replacementStage120. Les185appels ne sont pas supprimés, les47s noncouverts restent inconnus. Pas d'optimisation du seul bind ou nouvelle mesure spéculative.

## Ownership et autorisation source

Préserver les quatorze sources148 et manifeste avant dégel. Allowlist **deux fichiers existants au maximum** : src/graph-generation-replacement.ts et test/s2-author/replacement.test.ts. Le second sert uniquement aux variantes de mutation nécessaires ; signaler s'il reste inchangé. Aucun nouveau module, export/APIpublique, format persisté, preuve réduite, framework ou configuration. Les autres douze sources148, codec/collecteur instrumentés, inputs122,308base+overlay et artefacts demeurent gelés.

## Contrat de la réutilisation pure

- Une seule entrée maximum, contexte construit INTERNE au préambule d'un appel synchrone replacementStage120, jamais paramètre exporté/store/RPC ou map caller. Ne pas modifier les signatures exportées pour permettre l'injection du contexte. Helpers privés factorisés possibles dans ce seul fichier.
- Clé : chaîne SQLdocument complète exacte, comprenant wrapper/ref/utf8 et tous ses champs ; pas ref/hash/identité mutable seuls. Valeurs : fingerprint pur et décodage exact déjà possédé profondément immuable. Ni verdict d'existence, permission, statut LIVE, SQLcourant ou résultatstage final dans le cache.
- Les SELECT et énumérations restent aux mêmes endroits. Ref/kind/revision/revoked/digest courants sont réellement relus et comparés, checks expectedref/version/kind/modehistoriqueouLIVE à chaque lecture, même en hit. Digest courant doit être confronté au fingerprint de contenu, pas à un booléen validé dans le passé. Orphelins/ambiguïtés/exhaustivité restent opposables.
- Bytes modifiés avec même ref=>miss/revalidation ; digest modifié=>refus ; révocation/revisionincohérente LIVE=>refus. Pas partage mutable d'un résultat avec le caller : conserver ownership/immutabilité et enveloppes de retour compatibles ; aucune modification d'une valeur cachée par un consommateur.
- Contexte détruit après la relecture du stage, **avant** bind/sourcecurrent/proofs, neuf à l'appel suivant ; aucun partage entre appels, append, mutationOWN, lectureHOST/current/Q/epoch/TTL ou phase. Les joins/fullhead/fences/frameconsommée et validations pré/postappend restent inchangés. L'instrumentation compte les mêmes sites et ne doit pas être optimisée pour afficher un gain.

Si les coûts de copies restantes annulent le bénéfice, le signaler après mesure ; ne pas étendre le cache ou réduire les preuves en secret. Une normalisation de snapshots ou changementpersistedcontract/stockage exige un arbitrage distinct et n'est pas établi indispensable ici.

## Variantes de sûreté et livraison

Conserver les61cas et leurs assertions ; ajouter seulement les variantes de mutation nécessaires pour ce nouveau hit : contenu sous même ref, digest ou révocation/métadonnée changés entre énumération et relecture. Un spy local de requête dans la fixturefutureOWN peut simuler ce point, sans nouveau hook produit/runner. Établir le hit et le point de mutation atteint sans utiliser le succès du code comme oracle ; les refus doivent être spécifiques, avec aucune charge/controlmutation légitime supplémentaire. Préserver l'état attendu hors corruption volontaire ou utiliser un rollback fixture explicite. Aucun fauxprovider ni cache d'autorité pour construire la preuve.

Livrer hashes/diff, privatefactor et clé/valeurs/durée de vie, SQL/métadonnées vraiment relus, ownershipretour, cas préservés/ajoutés et limites. Références/consommateurs utiles avecSerena, pas d'oraclesQA. Même reviewer sur la réutilisation pure et son impact, preuves149/147/139/137 hors impact réutilisées ; pas réaudit61/131 ou scientifique450+9.

Source seulement : aucun importévalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Après gel/revue, parent fermera compilation et gate diagnostic ciblé nouveauOWN réutilisant les métriques151, pas maintenant. Délais15s/test et300s/process nonrelevés. HOLD125 intégral ; S2/M2/remplacement/S1concret global/contention non acceptés, troiscommandesconsolidées nonlancées.
