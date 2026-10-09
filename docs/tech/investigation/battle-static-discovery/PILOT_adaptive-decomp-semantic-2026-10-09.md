# Pilote local — C relu contre ASM et sémantique adaptative (2026-10-09)

Statut : **autorisé pour test, pas adopté globalement**. SETUP seulement ; aucun worker lancé ni push IDB ici.
Autorisation utilisateur : « Du coup, tu n'as pas repris les décompilations ? Et tu peux mettre en place la nouvelle stratégie que tu proposes, pour tester ».
Base effective inspectée : `beac4ea2b7a1b1f1c5f0b7a2f1deef60944ebb33` ; audit indépendant gelé sur `a2791cd`.
Registre machine-readable : [PILOT_adaptive-decomp-semantic-2026-10-09.registry.json](PILOT_adaptive-decomp-semantic-2026-10-09.registry.json).
Suivi : [plan](PLAN_gfx-battleloop-campaign-2026-10-08.md), [journal](CAMPAIGN_LOG_gfx-battleloop-2026-10-08.md).

## 1. Décision bornée et divergences explicites au canon

Le HANDOFF §5.2 impose >200 instructions → 2+1 ; le PLAN du 8 octobre prescrit dual-gen C systématique ; PROMPT §127–165 conserve les anciens moteurs/packs. **Dans les SIX EA ci-dessous uniquement**, la taille >200 n'est plus un déclencheur suffisant : C = génération + review ASM indépendante ; sémantique = **1+V**, avec escalade sur preuves. Pas de 1+P dans cette cohorte, même pour les petits. Les récupérations/corrections historiques restent hors expérimentation et hors exception de taille. Hors cohorte, conserver le canon ; ne pas étendre automatiquement le pilote à toute la file.

Cette autorisation explicite remplace localement les anciens modèles Grok/GLM-Max/Astra et la dual-gen obligatoire. Elle ne modifie aucun default/frontmatter global. Tous les appels workers ont un **override modèle explicite** :

- Pack et génération C primaire : `zai-coding-plan/glm-5.3-flash#high`.
- Review C exhaustive, sémantique A, reviewer V : `openai/gpt-6.1-sol#high`, **trois rôles/sessions distincts**.
- C-B et sémantique B de contrôle/escalade : Sol high permis, deux rôles/sessions distincts ; R Sol high ou adjudication parent contre ASM, jamais vote majoritaire.
- Catalogue modèles reconfirmé au SETUP : les deux références sont active, variante high disponible. Disponibilité catalogue ≠ succès futur du provider. Aucun Astra/Luna/autre provider, aucun fallback silencieux.

Le PLAN ancien mentionne SetType ; l'interdit HANDOFF/PROMPT et la mission actuelle gagnent : **pas de SetType, rename, patch, debugger, runtime ni service/DB mutation**. §5.6 reste impératif, en IDA natif statique (le mot « live » signifie lecture de l'IDB ouvert, pas observation du jeu).
Conserver tous les chunks, CFG, tables/switch et retours ; **>600 instructions = régions + matrice de couverture totale**, pas une dispense. Plusieurs chunks demandent couverture prouvée ; couverture manquante → escalade, jamais acceptation par taille.

## 2. Cohorte pré-spécifiée, avant résultats

Inventaire case-insensitive `decomp/<EA>__*.md` et `semantic/<EA>__*.md` : **aucun artefact pour ces six**, y compris non suivis, à la base inspectée. EAs tirés du PLAN réel, débuts de fonction confirmés dans IDA. Nombre = instructions CODE sur tous les chunks (pas les estimations du PLAN).

- **P1** `0x509B30`, D4, `BattleGeom_SetCurrentBoneMatrix`, **9**, ≤80, un chunk `[0x509B30,0x509B46)`. Famille setter matrice courante ; contrôle simple attendu ; **contrôle B préassigné**.
- **P2** `0x48F020`, G19, `domain::Battle_GetRandomInt`, **10**, ≤80, `[0x48F020,0x48F049)`. Famille tirage RNG ; piège potentiel largeur AL, pas une conclusion acquise.
- **P3** `0x464BD0`, C13, `World_loadTextureVRAM_updateAnim`, **155**, 81–200, `[0x464BD0,0x464DA1)`. Famille animation VRAM ; nom/périmètre à vérifier ; **contrôle B préassigné**.
- **P4** `0x486A10`, G16, `domain::BattleMagic_MutateStock`, **116**, 81–200, `[0x486A10,0x486B34)`. Famille mutation stock magie ; contrôle domaine/arithmétique.
- **P5** `0x4653B0`, C14, `isUpdateVRAMOrSomething`, **268**, >200, `[0x4653B0,0x465720)`. Famille file de transfert texture/backend ; ambiguïté attendue ; **contrôle B préassigné**.
- **P6** `0x4847F0`, G10, `domain::BattlePendingAction_TransferToExecQueue`, **285**, >200, `[0x4847F0,0x484C00)`. Famille transfert pending→exec ; invariants occupancy à vérifier.

Un représentant par famille opérationnelle, sans clones connus sélectionnés. Les helpers communs n'établissent pas l'indépendance statistique ; si le pack révèle une famille clone, enregistrer le chevauchement et ne pas compter deux familles. Deux EA/bin donnent une comparaison de faisabilité minimale ; trois contrôles (un/bin) cherchent les erreurs manquées sans doubler systématiquement la production. **Ni puissance statistique, ni preuve universelle**. Le contrôle coûte plus et est compté séparément. D3 `0x500EA0` a 62 instructions natives, contrairement à ~110 dans le PLAN : exclu du bin intermédiaire, pas d'estimation inventée.
Pas de remplacement opportuniste selon résultats ; indisponibilité/non-nouveauté → case manquante explicite et arbitrage enregistré. Aucun élargissement automatique au-delà des six.

## 3. Packs neutres et indépendance réellement vérifiable

Créer un nouveau sous-dossier versionné localement `tools/_tmp_semantic_triple/<ea>/pilot-2026-10-09/` ; ne pas écraser les sources historiques. Flash rassemble §5.1 depuis ASM IDA natif, chunks/CFG complets, pile, arguments/cleanups, xrefs CODE/DATA et snippets numériques callers/callees. Hash source octets/chunks et hash de CHAQUE fichier avec manifest de lecture autorisée, version/digest agrégé. Si source change : nouvelle génération gelée, pas comparaison silencieuse de versions.

Séparer `neutral/` de `context/`. Pack neutre sans noms métiers, commentaires IDA/prototypes sémantiques, verdicts anciens, wiki, hints, Hex-Rays ni C historique ; labels Intel numériques `loc_`/`sub_` et offsets/largeurs factuels seulement. Métadonnées neutres : EA numérique, chunks, ABI constatée, hash, compteur, graphes numériques, aucune hypothèse de rôle. Les sources §5.1 GrepAI et QMD CLI sont collectées/citées dans `context/`, **pas autorisées aux générations/blind B**. Pas de MCP QMD, pas de `qmd update/embed` ; pas de reconfiguration Serena/GrepAI communs `retro-eng`.

Contrôler le contenu et les lectures effectives (messages/tools exposés, chemins et digests), pas seulement la promesse du prompt. Une lecture native IDA affichant nom/commentaire métier est également contamination : pour blind, décoder sous forme numérique sans commentaire. Traçabilité insuffisante/troncature → blind `unverified`, jamais « prouvé indépendant ». Un rôle reviewer connaissant A est indépendant par **session/rôle**, mais **pas aveugle**. Ne jamais fusionner auteurs/review sous ce label.

Sémantique A reçoit pack neutre + **C corrigé après review**, sans verdict/notes reviewer. V reçoit A + ASM neutre/arbre, pas seulement les conclusions C. Les conclusions descriptives aveugles sont gelées avant comparaison au nom catalogue ; parent peut ensuite fournir le nom/context pertinent dans une phase explicitement non aveugle, avec provenance, sans remplacer le gelé. CERTAIN requiert ancrages callers/callees et contexte corroboré conformément au canon ; ne pas inventer alignement wiki absent.

## 4. Pipeline effectif et escalade

Ordre par EA : pack gelé → Flash C-A gelé → Sol review C → fix ciblé → re-review de la version corrigée → C prêt → Sol A → Sol V → gel A/V et candidat pré-escalade → contrôles éventuels/escalade → parent §5.6 + propagation finale → IDB/save/readback → commit ciblé.

Review C exhaustive : matrice instruction/région→C couvrant tous blocs/edges/switch, calls/stack cleanup groupé, arguments cdecl droite→gauche, ABI, AL/AX/EAX, signedness (`ja/jb` vs `jg/jl`), strides développés, adresse vs contenu, x87, wrap/shifts masqués x86 et limites du modèle C, reloads après helpers, alias et ordre mémoire. Aucun call de bibliothèque inventé. Rapport `ACCEPTE | CORRIGE | ESCALADE`, 3–8 ancrages au moins, matrice exhaustive sur disque. **Fix accepté dans des notes ≠ fix propagé au C final**.

Un défaut C fermable par patch ciblé + re-review contre ASM de l'artefact corrigé n'impose pas automatiquement C-B. Fautes typographiques/cosmétiques ne déclenchent pas un second auteur. En revanche **désaccord substantiel persistant, couverture/chunks manquants, ABI/retour/invariants/ordre/reloads non fermés, reviewer analytique en échec ou ambiguïté non tranchée** → C dual-gen + R. R doit aussi chercher erreur commune et fausse alerte du reviewer. Si incertitude demeure, livrer UNCERTAIN sans promotion.

Sémantique 1+V, contrats HANDOFF §5.3–5.5. B blind + R si A trop large/mensonger/UNCERTAIN/CONFLICT, désaccord V sur rôle/nom/confiance, `ESCALADE_2+1`, couverture/contrat non fermé ou **échec §5.6 parent**. Pas seuil taille seul dans la cohorte. Une CORRIGE substantielle de rôle/nom/confiance reste un déclencheur ; ne pas la rebaptiser simple typo pour éviter B. Les corrections C peuvent être fermées séparément sans simuler une divergence sémantique.

Pas de remplacement par analyse parent solo après refus du worker. Refus de mission/outils/provider = **statut technique**, pas erreur analytique ni vote. Refus spawn, funds/quota, OOM, provider inaccessible ou refus de mission : **arrêt checkpoint**, pas boucle retry/fallback solo. Corriger ensuite brief/périmètre sous autorisation, sans prétendre que C11 démontrait OOM/quota. IDA MCP indisponible = arrêt, pas HTTP/curl.

## 5. Sous-échantillon contrôle (P1/P3/P5)

Geler avant B : C-A original, C après review, rapport C-review et candidat pré-escalade, A, V et leurs conclusions/digests/temps. Conserver les versions, même si elles changent ensuite. **Puis**, même si V accepte et aucun trigger ne s'est produit :

1. C-B Sol high, session neuve, ASM/pack neutre seulement, **sans C-A/C corrigé/C-review/A/V/R/context/legacy labels**.
2. Sémantique B Sol high, autre session neuve, ASM/pack neutre seulement ; sans C-B aussi, ni C-A/A/V/R/context/legacy labels. Pas de rôle fusionné.
3. R/parent adjudique chaque divergence contre ASM natif, compare les découvertes B à **V et C-review gelés**, prouve inédit ou déjà trouvé. Ne pas attribuer à B une découverte nouvelle de R.

Si escalade déjà requise, réutiliser le B réellement neutre s'il satisfait exactement ce contrat ; enregistrer contrôle ET trigger sans double comptage de coût. A sémantique voit C corrigé tandis que B ne le voit pas : asymétrie **pré-spécifiée**, pas expérience causalement isolée de modèles. Un B contaminé reste traçable mais exclu du dénominateur blind (pas retry automatique). Le contrôle intervient avant promotion finale, et son coût n'est pas présenté comme coût de production adaptative.

## 6. Priorités continuation (hors métriques primaires)

1. **C6/C10 récupération** : le snapshot demandé `a3abf93` est dépassé. Le journal à `beac4ea` contient les réceptions tardives : C10 V/R et C6 R ont rendu completed ; drafts sur disque, aucun push/promotion. Avant toute duplication, inspecter via API sessions **read-only** les finales et statuts de `ses_ede37c5e5ffeGwPuq4AS9ZCdCT` (C6 R) et `ses_ede34a2c6ffeFD82jLrhgNtMzF` (C10 V/R). Ne pas re-générer deux C inutilement. Parent contrôle §5.6, hash/propagation et drafts ; clôture seulement si vert. C6 historique « fail ret 0 » : preuve de correction append, sans réécrire ancien commentaire. C1/C9 déjà clos (`e1c1247`, `ad5fd19`), **ne pas refaire**.
2. **C11** `0x45BE70` : nouveau pack vraiment neutre ; les générations avec hints restent historiques, jamais comptées blind. Récupération hors six métriques primaires ; ajout à la cohorte nécessiterait un avenant, pas ici. Refus historique `ses_ede33f040ffeHeJqhXpO4KWTBA` à lire dans le journal sous son identifiant exact (ne pas inventer une activité actuelle).
3. **J3** `0x5A6D20` : vérifier ASM natif les recharges phase après Camera `0x5A6F88`, slot `0x5A6FF2/0x5A7058`, patcher le C final et faire review indépendante. **A8/A10** `0x5BD460`/`0x5EF910` : vérifier SAR r32,CL masque cinq bits, fausse alerte R « &31 inventé » ; corriger corps ET explication sur preuve/review. Révisions historiques séparées, anciennes conclusions conservées/citées, pas effacées. Les packs de l'audit sont indices, pas preuve d'équivalence actuelle.
4. Avant toute promotion de nouvelles clôtures pilote, fermer ces réparations historiques ou enregistrer un blocage explicite et checkpoint ; ne pas masquer l'incertitude par six nouvelles promotions. Les pipelines nouveaux peuvent avancer en drafts disjoints, sans promotion anticipée.

Préimages/tags historiques restent append-only : un tag existant implique skip de push ordinaire ; une correction autorisée requiert **avenant daté distinct**, pas suppression/remplacement du commentaire ni duplicate du tag. §5.6/save/readback obligatoires pour tout append. Aucun changement IDB au SETUP.

## 7. Registre, mesures et validation finale

Le JSON contient six records, leur source SHA/chunks, familles/bins/control et un template **copié dans chaque record avant exécution**. null = non observé/pending, jamais zéro. Les événements horodatés append-only conservent protocol **ACTUAL**, rôles/model override/sessionIDs, sources/générations/digests/manifest, lecture réelle et contamination, gels avant B, temps et usage observés input/output/cache/reasoning/cost si exposé. Aucun tarif inventé, zéro enregistré ≠ gratuit, reasoning/output pas supposés disjoints.

Chaque défaut : preuve ASM (EA/opcode + fichier/lignes/version), auteur/étape, adjudication parent, classe **matériel faux**, **conditionnel sans invariant établi**, **prose cosmétique**, **hors domaine/UB** ; noter erreur commune, faux positif R, rectification V et correctif B **inédit versus version V/C-review gelée**. Séparer erreurs de C et de sémantique, observations runtime absentes, infra/reprises/contamination des erreurs analytiques. Conserver remaining_uncertain, pas « clos » par simple prose worker.

Avant tout push : parent exécute **lui-même** §5.6 en ASM IDA natif (callee+argc/cleanup ; callers CODE/DATA ; strides chiffrés ; polarités ; largeur retour ; ≥2 preuves nom), et lit le **fichier final réellement destiné à git**. Check propagation : corrections toutes présentes dans bloc C/commentaires/résumé/provenance, couverture instructions/chunks/CFG, cleanups, strides, widths, shifts, reloads, ordre mémoire. Digests candidats et final ; modèle/backend non testé et absence de runtime explicités. Échec bloquant → escalade ou UNCERTAIN, aucun push prétendu conforme.

Append via `set_func_cmt`, tag daté non dupliqué ; `idc.save_database(idc.get_idb_path())` après CHAQUE push ; résultat true et readback exact + digest/tag count. Les workers n'écrivent ni IDB ni git. Push/§5.6/commit sérialisés. Au plus cinq workers indépendants, un EA/rôle par instance, aucun sous-spawn. Commit par clôture `semantic(battle): <EA> <nom-court>` PowerShell here-string, fichiers semantic/decomp exacts (+ ledger seulement classe changée). Mises à jour protocole/registre/journal autorisées explicitement par ce pilote, commits suivi séparés. Jamais `add .`, amend, reset, no-verify, push remote ni autres M utilisateur/configs/tmp/vault.

Rapports : fractions séparées **par EA ET par famille**, par bin et statut production/control/recovered ; coverage complet/pending/exclu ; dénominateurs non ambigus. Au premier checkpoint, plusieurs pipelines complets si possible ; **pas nécessaire six clos**. Donner bénéfice marginal B, erreurs communes/alertes fausses, incertitudes et coût observé du contrôle séparément. Audit : ≥12/22 ensembles C avec au moins un auteur faux ≠ taux des C finaux/modèles ; V≥2/8 rectifie ; B après V 0/3 inédit et Sol 0/2 divergence algorithmique **ne prouvent pas absence d'erreurs**. Corpus 33 EA, 94 sessions/2180 messages publics, 32 tronqués et origines septembre partielles ; aucune équivalence/compilation/runtime générale validée.

## 8. Handoff SETUP → CONTINUATION

Session superviseur `ses_ede295648ffe946nUdUdHFevqT`. SETUP : six sources/métadonnées lues statiquement, registre/avenants seulement, aucun worker/API ancienne session/IDB write. La continuation inspecte d'abord l'état read-only C6/C10, puis suit §6. Aucun diagnostic infra large. Si arrêt technique, conserver checkpoint drafts/usage/statuts exacts et retourner au parent ; ne pas changer de stratégie silencieusement.
