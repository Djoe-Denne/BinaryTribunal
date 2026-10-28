# Contrat implémenté — source-derived-reviewed-dispatch-v1

Autorité : ratification parent `inputs/PARENT_DISPATCH_CONTRACT.md`, même reviewer OUI conditionné avant implémentation. Cette page décrit un amendement de provenance, jamais un oracle scientifique assoupli.

## Domaine exact

IDs `numeric/poison/<membre>/groups` pour les23 membres littéraux, dans cet ordre :

`arc`, `id`, `out`, `incoming`, `outDegree`, `inDegree`, `totalWeight`, `negativeZeroCache`, `summandWeight`, `summandEndpoint`, `summandZero`, `summandNegativeZero`, `summandInfinity`, `summandNaN`, `summandOrder`, `rawCount`, `sourceBudget`, `sourceVersion`, `binding`, `missingSource`, `missingPolicy`, `convention`, `rehashedStaleCaches`.

Pas de wildcard. Pour membre n : index208+9n, config propre `{poison:membre,consumer:"groups",seed:"numeric-context-qualification-v1"}`, expected exact `{kind:"refusal",code:"unsupported-numeric"}`, oracle `cluster.test.ts:594-613`, specHash du véritable observer de config. Autres IDs gardent les anciennes règles, sans nouvelle autorité dispatch.

## Types privés

- `DispatchSource` : version/fichier/hash/outil/révision, source dispatch et points factory/target, digest de factory/itération, imports BG/CG et23IDs. Dérivation root AST depuis bytes réels approuvés, puis bytes source liés au catalogue/binding same-run.
- `DispatchAuthority` : runId, digests binding/catalogue réels, double pin source same-run, `DispatchSource`.
- `DispatchCapture` : frames/stack/run + record error-proof complet et artifact réellement admis/relu. `observe(data)===text`, frames/stack/run cohérents.
- `DispatchPair` : version et deux tokens à identité privée WeakMap, pas un JSON de preuve auto-déclaré.

FactorySHA immuable `458ec5a8291258b9d91a6b5c980eeb2041e827db66703237ec777f666ca86b24`. Le pin de révision source entière fermé et l'AST du flux lexical excluent les autres factories/actions, substitutions et écritures non revues ; les références runtime contrôlent encore case/make/work.action et snapshots effectifs à l'admission et à l'usage.

## Relation et refus

La relation native déjà existante et la branche direct-call sont conservées. L'insertion prepare exige encore file/hash/ligne/colonnes/longueur/bornes exacts, row/callee, paire précédente source alignée et caller suivant strictement aligné. La nouvelle alternative demande en plus le témoin source et les grants propriétaires de la même itération, pas un simple texte `work.action()`.

Toute altération des frames depuis le record RAW admis est refusée **avant** la boucle, y compris retrait de l'unique wrapper qui laisserait sinon seulement des alignements. Chaque indice est consommé dans l'ordre exactement une fois. RAW208 : B0/C0, B1/C1, B2/C2, insertionC3, B3/C4. Aucun frame648 créé, aucune suppression C3, aucune explication JIT imposée.

Inconnu/manque d'autorité/reférence incohérente ⇒ refus de provenance et gate ORIGIN, pas substitution par refusal scientifique. Les erreurs MAKE/ACTION et les attentes restent telles quelles. Aucune normalisation technique avant la preuve d'origine entière.

## Frontière de confiance

Le catalogue root est consommé seulement après le protocole existant de binding indépendant/SEAL/hash/source réelle, versionsv3. JSON arbitraire n'est pas une authentification. L'AST/source witness root est une preuve source, pas une observation d'un frame runtime absent. La copie des JSON historiques et les tokens factices offline ne sont pas une nouvelle exécution ou une réémission native ; le nouveau candidat est un source différent, encore sans run scientifique.

Schémas explicitement versionnés : binding-v3, catalog-v3 avec `dispatchSource`, source-derived-reviewed-dispatch-v1, owned-dispatch-pair-v1, full-origin-pair-source-dispatch-v1. Native producer-v2/SEAL-v1 et input inventory-v1 inchangés. Closure enfant13/root37 conservée.
