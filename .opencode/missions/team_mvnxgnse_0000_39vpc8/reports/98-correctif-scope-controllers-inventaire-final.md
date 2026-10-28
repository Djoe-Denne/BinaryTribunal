# M2 — 98 : fermer le scope des contrôleurs dans l'inventaire final

## Verdict et défaut résiduel confirmé

La reprise97 ferme statiquement T2-A, T2-C et le contre-exemple initial de T2-B. Elle identifie **B-SCOPE**, seul défaut actuel restant : la branche des controllers enregistrés sans événement ne compare que kind/mission/owner, pas leur génération/enveloppe/fence aux origines autorisées du root/lineage.

Parent lit inventory124–139 :134–135 ne charge effectivement que missionId/owner/kind. Comparer la catégorie controllerLeases aux mêmes lignesbrutes ne prouve pas leur provenance. Une collecte fraîche peut inclure honnêtement un contrôleur de génération inconnue ou au fingerprint contradictoire sans être rejetée par ce join. Cela viole l'exhaustivité opposable C20–36 ; ce n'est pas une nouvelle exigence native ou de couverture maximale.

## Correction source autorisée

Après conservation des huit sources97 et manifeste, modifier seulement :

- src/graph-final-inventory.ts ;
- test/s2-author/t2-activation.test.ts.

Joindre chaque controller admis à sa **vraie origine/enveloppe/mission/root/lineage et provenance de fence autorisées**, depuis les sources/records durables et bindings indépendants déjà retenus. Une chaîne truthy, un generationId plausible ou le même owner ne suffit pas. Génération inconnue, fingerprint contradictoire ou fence non expliquée => HOLD.

Conserver l'audit des controllers des origines RETIRED et du candidat pointé ; ne pas exiger uniquement ACTIVE ou confondre anciennes capacités historiques et droits courants. La résolution doit garder l'histoire multi-origines du cheminquota3 explicable. Dériver les fences depuis les bindings d'autorité existants, pas tolérer un numéro libre ou imposer à toute l'histoire le fence actuel sans justification.

Négatifs API finis, collecte fraîche : aprèsT1 enregistrer un controller de mission/owner corrects mais generation inconnue, le journaliser honnêtement avec la ref des vrais bytes et catégories sourceCapabilities/controllerLeases, puis collecter. Attendre le join scope spécifique, pas stale ou TTL. Variante génération connue/fingerprint faux ; fence contradictoire si cette branche est distincte. Aucun SQL de corruption ni nouveau helper/harnais demandé. Garder les positifs candidat pointé/anciennes originesretired et les26scénarios existants. Si l'API/helper nécessaire n'est pas accessible dans ce fichier, signaler avant extension.

## Revue, preuves réutilisées et limites

T2-A/C et les autres constats97 sont réutilisables hors impact. Auteur livre les deux hashes/joins/négatifs, puis même reviewer reprend uniquement B-SCOPE et les effets du delta, pas tout le catalogueT2. Aucun changement de compteur/TTL/policy/sourcepublique/DDL, ni framework/nouveau service.

GO source-only : aucun importévalué/scellement/bind, typing/test/SQL/DB/opener/asset/provider/native/service/Git/délégation. Après livraison/gel aucune retouche sans nouveau GO. Les six autres sources97 restent protégées, ainsi que tous tests91/inputs/gels/DB/configs. Pas réouverture d'ancien runner.

Quota3 et crossEpochSPENT toujours requis/non obtenus ;000bownerlead reste ouverte, S2global/M2 non clos. Aucune compilation, qualificationS1, lecture de vrai asset ou résultat des26tests revendiqué. Futur gate runtime seulement après clôture des défauts et préparationparentOWN/assets/manifest/env/budget.

Préservation effectuée : huit fichiers97 et SOURCE_MANIFEST4b57097a… conservés byte-exacts readonly sous snapshots/s2-t2-source-97 ; seuls les deux fichiers98 sont dégelés. GO98 transmis à l'auteur, reviewer informé d'attendre le prochain manifeste. Aucun produit/SQL/asset exécuté.
