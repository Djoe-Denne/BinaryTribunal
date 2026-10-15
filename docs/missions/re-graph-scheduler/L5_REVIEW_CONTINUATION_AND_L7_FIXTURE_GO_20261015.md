# L5 review non aveugle et L7 full — précisions bornées

2026-10-15. Continuité des mêmes tâches/sessions, pas de nouveau reviewer, rerun
implicite, modèle/provider/harness changé ou intégration automatique.

## L5 : recevabilité et texte complet

Review `task_mv9ntc9a_001m_ahmspg`, session
`ses_ebff13ea5ffeqgqh2NPnl1FL6i`, fresh Sol max : **indépendante, non aveugle**.
L'unique inbox initial ne contenait que son assignment/HOLD. Un fragment distinct
du message parent sur receipt1/fixture +receipt2/fixture était également injecté
dans les instructions initiales du harness. Le reviewer l'a spontanément déclaré
et a STOP avant verdict. Conserver ces deux faits ; ne pas dire zéro exposition.

Ce fragment est le contre-exemple volontaire du parent, pas un verdict ou analyse
d'un autre reviewer/auteur. Sa présence n'invalide donc pas cette review non aveugle.
Pas de restart ni répétition des143 tests/106 probes/8 contrôles déjà exécutés sur
les mêmes bytes. Aucun nouvel inbox autorisé. Le reviewer qualifiera indépendamment
le cas et toutes limites : aucun ACCEPT/BLOCK global imposé par la clarification.

Le texte parent complet `L5_SIM_RECEIPT_LEVEL_COHERENCE_20261015.md` et un cas
reproductible avec snapshot/groupes/policy/requirement/receipt sont maintenant
projetés dans **un paquet additionnel séparé et piné**. Ancien gel474 fichiers/
10 470 218B et receipt4c243003 inchangés. Les cas sont des fixtures purement offline,
pas des receipts scientifiques ni un droit de publier. Le reviewer vérifie les
hashes, lit/ACK, puis attend le GO de reprise ; un prepare receipt seul n'approuve
ni accès ni réception ni le verdict. Pas de modification de la source L5/L6.

Rappel : OLD377 et candidat985 renvoient true pour requirement niveau1/fixture-only
+receipt niveau2/fixture-only, hashes/readback/effect exacts. Planning legacy pareil,
donc pas une régression budgétaire. CONTRAT§4 impose validation parent réelle au
niveau2. SIM doit refuser le receipt incohérent avant satisfaction. La limite L5
upstream reste OPEN ; L8/proofs et disposition L9/L10 restent requis séparément.

## L7 : troisième namespace de fixture vérifié

AstraSim `task_mv9m9894_0015_cjacy0`, session
`ses_ec0192753ffeWKOqq53yPbjVoL` : STOP full avant lancement conforme au contrat.
Le source accepté `test/simulator/graph-interop-durability.test.ts:32` crée une
racine mkdtemp littérale **graph-interop-** sous Temp/opencode, indépendante de
TEMP/TMP child. Parent compare ROOT auteur au main : SHA256 exact
`979fa24c00001e56b087c07c789ec701521cecc4d87128dac8fcd8137e96838f`.

Parent lit réellement afterEach17–25 : ferme les handles, lit/hache les DB et
sidecars restants et **les conserve**. Ce n'est pas une troisième permission de
cleanup. Autorisation seulement pour les racines fraîches retournées par mkdtemp
dans **CE full**, sous `C:/Users/djden/AppData/Local/Temp/opencode/graph-interop-*`.
Pas glob ou reprise d'une DB existante ; pas de suppression de ces racines/artefacts.
Livraison : chemins/tailles/SHA256 de leurs fichiers effectivement conservés.

Les exceptions antérieures ff8-re-policy-/ff8-runtime-test- restent limitées à
leurs hooks préexistants sur leurs propres fixtures fraîches ; tous les autres
tests conservent TEMP/TMP child isolés/opencode préparé, LOCALAPPDATA inchangé.
Autre échappement → STOP, pas correction des sources QA/L6/config pour faire vert.

Full borné420s seulement après typecheck et54 anciens+nouveaux verts, logs neufs/
comptes réels, aucun second full concurrent. Les17 nouveaux PASS/1225 assertions
signalés sont du progrès auteur, pas une livraison ou acceptation. Aucun runtime
FF8/Ensemble réel, publication scientifique/native ou IDB autorisé. ACK avant reprise.
