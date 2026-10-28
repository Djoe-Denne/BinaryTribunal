# M2 — 75 : entrées reçues, empêcher la duplication des quotas partagés

## Résultat de l'inspection

Les deux artefacts74 sont livrés. Le parent a lu le contrat et les constructions/types/attentes des entrées ; leurs tailles et SHA correspondent à la livraison. Les cinq sources70 sont inchangées. Aucun import, typing, test, SQL ou accès à une base exécuté.

Les exemples distinguent bien maxima déclarés, capacités acquises et restant observé. Après une première allocation, les nombres du worker suffisent encore pour une seconde demande : le refus attendu du même worker isole donc réellement son exclusivité. Deux workers distincts épuisent exactement les quotas du compte. Les branches de libération et BURNED ne prétendent pas recréditer les droits logiques. Ces points sont retenus statiquement, sans présumer que la nouvelle origine sera acceptée par S1.

## Deux corrections bloquant le passage au code produit

### Un inventaire partagé ne peut pas être recréé pour chaque unité

resource-fixtures.ts:85–118 utilise le même ResourceScope74, avec unitId et familyFence, pour acquisition, restant, affectation et projection courante. CONTRACT:44–47 ne ferme pas assez l'unicité du pool lors d'une nouvelle acquisition ou d'un changement de famille. Il serait possible d'implémenter un journal filtré par unité/acquisition et d'ignorer une occupation du même compte sous une autre unité. Ce n'est pas un défaut runtime observé : aucun produit n'existe encore pour cette tranche. C'est une ambiguïté du contrat qui doit être éliminée avant son implémentation.

Décision : séparer le périmètre du pool physique et celui du travail. Le pool a une identité stable fournie par l'hôte fixture privilégié ; unitId, familyFence, generationId, recordId et les révisions ne sont jamais de nouvelles allocations de capacité. Affectations et consommations gardent leurs liens exacts à l'unité, génération et fences. L'inventaire courant/CAS et le set des allocations incluses couvrent **toutes** les occupations actives partageant ce pool dans OWN, pas seulement celles du témoin présenté. Les identités worker/compte sont canoniques dans le namespace de l'hôte, sans alias permettant un second quota.

Une nouvelle référence d'acquisition ne remet pas les compteurs à zéro. La tranche ne gère pas l'augmentation, le remplacement ou le transfert d'acquisition : ces opérations restent HOLD, sauf relecture idempotente de la même acquisition retenue. Un second pool déclaré avec les mêmes workers/comptes ne peut masquer une occupation existante ; faute de preuve de domaines réellement distincts, refuser. Aucun besoin d'ajouter une table ou un backend pour fermer cette règle au niveau du contrat.

Ajouter un exemple négatif fini : une occupation A existe ; présenter une autre référence d'acquisition/unité avec un inventaire prétendu vide ne l'efface pas et ne donne aucun quota neuf. Une ancienne génération non expliquée dans les claims impose HOLD ; cette règle de refus n'est pas une preuve de transition intergénérations réussie.

### Le rôle R doit être représentable sans lui inventer un worker

Assignment74 et Allocation74 limitent role à A/B (source:105/110), alors que les droits logiques comprennent R et que le store existant sait nommer ce rôle. Étendre les formes au domaine A/B/R ; garder les exemples positifs A/B. Les workers actuels ont le profil author, pas reviewer : faute d'affectation et de capacité compatibles pour R, son admission reste HOLD, son droit demeure engagé. Ne pas ajouter silencieusement un worker R ou réutiliser celui d'A/B en ignorant le profil. Ce négatif explicite évite de présenter ces entrées comme une qualification de l'ensemble A/B/R.

## Travail autorisé et validation proportionnée

Corrections seulement dans les deux fichiers74, après conservation de leur version initiale. Livrer les scopes/identités de pool, clés d'unicité/CAS et exemples attendus corrigés ; ne pas refaire le reste du plan. Tout ce qui n'est pas touché par ces deux frontières est réutilisé.

Toujours aucun delta produit, import évalué, typing, test, SQL/DB, Git ou appel public. Le prochain GO produit sera donné sur le contrat ainsi fermé et une allowlist explicite. La proposition de budget240s n'est pas un runner autorisé ; les compteurs antérieurs restent clos.

## Annexe de preuve

- CONTRACT.md : 6619B, SHA256 `2b8ec02a348f869f330012905ce9b871659f46790d45b7133ce34f61f29f295f`.
- resource-fixtures.ts : 19919B, SHA256 `350abe5a88c6c33b43b38cb1c1337841543d8359b78c00372942712fa6957ab1`.
- Emplacement : inputs/s2-resource-complement-r2 de cette mission. Vérification statique parent via Context Mode ; aucune évaluation de ces modules.
- Aucun écart sur les cinq pins source70 ; le bilan73 reste applicable à sa version, pas à ce futur complément.

000b et M2 restent ouverts ; aucun nouveau PASS, aucune qualification publique/native ou consolidation finale revendiqués.
