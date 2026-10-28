# Parent GO source harnais R3 uniquement, aucun gate autorisé au worker

R2gate proposé review result_mvf8bnbt_007o_0299fx CORRIGE six lacunes. Parent
retient les six dans un correctif borné, pas une nouvelle architecture produit.
Numeric delta result_mvf8c1vm_007r_jnb90x acceptable statique est indépendant.

Output4fichiers dans sibling outputs : gate.cjs, capture.ts, DESIGN.md, MANIFEST.json.
Partir du before/after R2 fourni, conserver objectif unique plannerR1 seulement :
269guards baseline/candidate+4plannerfiles, typecheck puis deux mêmes tests et
FULL differential. Pas numeric integration, S1, SDK runtime ni main modifications.

Corrections ratifiées :
1. Approbation R3 doit contenir hashes EXACTS des artefacts revus : gate lui-même,
   capture, plan/GO, SDKpackage/types pertinents, upstream acceptance/delivery/
   receipts/outils. Gatecompare AUXHASHESapprouvés, pas rebaselining de ces artefacts.
   Hashcycle évité par parentadjudication externe créée APRÈS freshV. Conserver
   adjudication R3 entière/hash dans receipt, anciens rouges intacts.
2. Inventory guards fermés : sourcecandidate/baseline .tools entiers et résolution
   transitive. Pin inventaire typologies+hashs node_modules utilisé (TOUS fichiers,
   pas seulement d.ts) avant/après, refuser symlinks/ajouts/retraits. TSC --listFiles
   pour ancrer fichiers effectivement compilés : tous dans snapshots ou deps/outils
   pinnés ; horscorpus rejeté. Garder include/strict/noEmit/moduleResolution intacts.
3. Capture fatal hors exceptions produit : ids appels BEGIN→RETURN/THROW exacts,
   méta final séparé issued/completed/fatal, toute panne encode/écriture rend
   gate rouge indépendamment des expect(...).toThrow. Panne instrumentation
   ne doit PAS remplacer erreur produit ni ajouter un throw produit après succès.
   Footer absent/incomplet/dupliqué compte comme rouge. Aucune perte autorisée.
4. Domaine d'encodage fermé/vérifié : JSONdata+undefined/nombres IEEE dont -0,
   Maps/Sets/Error avec cause/propriétés sémantiques et alias/cycles représentés,
   trousarray distincts de null ; champs/prototypes/accessors/symbols/functions/
   Promise non représentés fidèlement => FATALinstrumentation, jamais omission.
   Stack Error explicitement exclue (chemins scratch différents), pas autreschamps.
   Types ordinaires/literals et diagnostics du corpus sont attendus, ne généralise
   pas à arbitraires classes ni payload natif. DOCUMENTER domaine/limites.
5. Env enfant construit par whitelist système minimale ; HOME/USERPROFILE/
   XDG_CONFIG_HOME/APPDATA/TEMP/LOCALAPPDATA/cache pointent aux namespaces possédés.
   Aucun BUN*/NODE*/préload hérité. --config explicite/no-env-file conservés.
   Rejeter TOUT fichier globalbunfig potentiel présent aux anciens homes/XDG et
   namespaces choisis, avant/après (pas regex fragile). Parent a observé les deux
   chemins home/.bunfig.toml et home/.config/bun/bunfig.toml ABSENTS, aucunBUN/NODE
   env. Bun --help vérifié supporte --config/no-env-file ; NEPASinventer flag.
6. Réserver stem lease wx AVANT préparation snapshots ; try/catch/finally garantit
   receipt rouge structuré et release fidèle si erreur de préparation/guards/
   parsing. spawnSync contrôlé termine avant clôture. Si écriture receipt/release
   échoue, remonter explicitement échec infrastructure, pas succès/fauxrelease.

Garder testcorpus/outputs byte-equality/compteurs/au-moins-unrefus, aucun fallback
qui diminue preuve pour faire vert. Ajouter preuves STATIC/contreexemples de chaque
correction dans DESIGN. Env/SDK/listFiles ambiguïté réelle→parent AVANT inventer.

GOsource direct après hash packet ; pas extraACKroutine. Aucun compiler/typecheck/
transpile/test/run/validator/importproduit/Bunexec/OSprobes/DB/git/IDA/live/network/
origins/delegation/teamtools/taskclose. Read/hash/parsing et OWN4outputs seulement.
Final hashes/tailles/bookend/delta/limites, SOURCE_PROPOSED. FreshV puis parent
harnessselfchecks et unique gate ultérieurs ; zéro changement global/config partagé.
