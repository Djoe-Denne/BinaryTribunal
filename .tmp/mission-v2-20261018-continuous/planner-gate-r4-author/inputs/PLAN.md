# Gatefix proposé R2 : résoudre les types SDK manquants, pas masquer le rouge

R1 receipt72fa246c5c1e39b41c6116254f160682b9e0300ec39d59848120589de532ed21
conservé avec lease/release/logs/scratch. TSC a échoué uniquement TS2307 sur
@opencode/client et @opencode/client/service (src/client et scripts/prepare-transfer).
Les tests/différentiel n'ont PAS été lancés. Aucune source produit corrigée pour cela.

Proposition R2 : même snapshot complet269guards+4candidate, même corpus, même
TSC strict/noEmit/include/types/skipLibCheck, même trace. Seul montage des types :
config dérivée sibling garde tous champs et ajoute exactement DEUX paths absolus
vers types de package.json exports réel @opencode/client v2.0.26 (promise/index.d.ts
et promise/service.d.ts). Types runtime jamais importés/exécutés par cette gate.
TypeRoots read-only original déjà utilisé. Pin toutes déclarations .d.ts/.d.mts/
.d.cts et package.json sous node_modules avant/après afin d'ancrer la résolution
transitive au même corpus local ; aucun symlink/module/config global créé.

Config dérivée et outils/SDK manifest doivent figurer dans les receipts. Garder
R1 rouge distinct et hash explicite ; nouveau stem R2, une seule tentative APRÈS
freshVplan/source acceptable. Ne pas exclure client/scripts ni réduire include,
ni changer moduleResolution/strict/errors. Nouveau rouge bloquant, pas de retry.

La gate demeure isolation/fixturesplanner, ni qualification numeric R1 (CORRIGE)
ni mainintegration/S1repin/native/full44. Traces FULL et tests restent requises.
