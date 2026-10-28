# Audit empirique — décompilation C et sémantique FF8

**Date : 2026-10-09. Corpus gelé : `a2791cd`. READ-ONLY hors ces deux rapports.**

## Conclusion courte

- **La vérification ASM indépendante est indispensable.** Dans 22 ensembles de générations C inspectables, au moins **12/22 EA**, soit **9/17 familles**, présentent une erreur substantielle prouvée dans au moins une génération. Il s'agit essentiellement d'anciens triples GLM, pas d'un test GLM contre Sol.
- **La deuxième génération C peut fournir une bonne correction, mais aussi se tromper autrement ou partager la même erreur.** Les deux vrais couples C Sol frais, B7/C3, ont **0/2 divergence algorithmique** ; R y améliore surtout représentation, types, preuves et limites. Cela ne démontre pas un bénéfice universel de dual-gen+R.
- **V sémantique apporte des corrections importantes.** Huit V frais : **5 ACCEPTE, 3 ESCALADE_2+1**. Au moins **2/8** corrigent ou donnent de quoi corriger une assertion substantielle d'A ; les V corrigent aussi les anciens résumés/R. Dans les trois escalades réellement comparables après V, **B strict apporte 0/3 correctif substantiel inédit** par rapport à ce que V avait déjà signalé.
- **Ne pas supprimer 2+1 sur ces petits effectifs sélectionnés.** Une politique adaptative est une hypothèse raisonnable à piloter, pas une modification validée du protocole. L'ASM du parent doit pouvoir remplacer la redondance, mais son efficacité marginale n'a pas été mesurée par bras contrôle.

## 1. Couverture effectivement récupérée

API OpenCode **V2**, documentation `https://opencode.ai/v2/docs/api` chargée avant les endpoints. Contrat du serveur lu via `opencode-cli.exe api get /openapi.json`. GET paginés par petits lots ; analyse Context Mode ; aucune lecture SQL/copie DB, aucune écriture API, aucun restart.

| Arbre demandé | Enfants directs | Messages parent | Période UTC parent |
|---|---:|---:|---|
| `ses_ee497818fffeeHam9wevo2lI4W` — solo | 0 | 166 | 08 octobre 12:06:35–12:53:45 |
| `ses_ee4699c7fffeVWy4KvAedBcv1s` — funds | 5 | 12 | 12:56:43–13:18:49 |
| `ses_ee45245f0ffeX45KIJ4sGN7JRv` — multi/Sol | 86 | 144 | 13:22:12–16:52:56 |

Les **91 enfants** ont aussi été paginés jusqu'à `cursor.next=null` : **1 858 messages**. Vérification individuelle de leurs descendants : **91/91**, aucun petit-enfant.

**Total : 94/94 sessions et 2 180/2 180 messages de la projection API disponible, soit 100 % des trois arbres demandés.** **2 190 invocations publiques** analysées ; **32** portent `metadata.truncated=true`. Une compaction parent : `msg_11c6c3094001S7b36Hhziq6saY`. Les bornes globales sont 2026-10-08T12:06:35.493Z–16:52:56.915Z.

Ce n'est **pas** « tout l'historique des 555 décompilations du dépôt ». Les générations C héritées de septembre ont leurs drafts/notes, mais leurs arbres d'origine ne sont pas identifiés dans ces trois arbres d'octobre. Exemple : premiers commits C J1 `0b34a7e` du 13 septembre, J3 `1c95901` du 13 septembre, A7 `824ee65` du 15 septembre, C7/C8 `1a814dd`/`fc1c660` du 15 septembre. Les coûts/provenances exacts de ces anciennes générations ne sont pas récupérés. Couverture des payloads originaux tronqués : **inconnue**, pas 100 %.

Aucun thread actif consulté en messages. Le thread campagne `ses_ede4a0fa3ffexazl5537h7PMZR` n'a reçu aucun message ; aucun pack C1/C6/C9/C10 en mutation n'a été lu. Leurs **sessions historiques archivées** appartiennent à l'arbre demandé et sont seulement incluses dans les comptes de couverture, pas dans les résultats clos. Aucun worker lancé, aucun accès IDA, aucune mutation git/config/campagne.

## 2. Corpus et protocole réellement exécuté

**33 EA, 33 C et 33 semantic committés** à `a2791cd` : A15 + J5 + B10 + C3/C7/C8. `0x41730A` est le call interne ; l'EA B2 est **0x416D82**, jamais un 34e cas. Sources de référence : `CAMPAIGN_LOG_gfx-battleloop-2026-10-08.md` aux lignes 18,24–38,48–52,70–84,90–115, et fichiers git **au checkpoint**, pas à HEAD courant.

La liste détaillée EA/famille/instructions/chunks/artefacts/sessions figure dans `audit.json:cases`. `chunks=null` signifie que la capture consultée ne permet pas de certifier ce compte ; il n'est pas inféré du nombre de fichiers ASM. Segmentation exacte : **18 EA ≤80**, **9 entre 81 et 200**, **6 >200**.

| Groupe | Mode réalisé, non mode annoncé |
|---|---|
| A1 | A/V hérités du 17 septembre, récoltés ; pas une nouvelle paire |
| A2–A13, A15 | Solo ou diff clone parent. « 1+V solo » n'est pas un V indépendant |
| A14 | A hérité + vérification parent 1+P |
| J1/J2/J4/J5 | Quatre « 2+1 solo réduits » : **pas de deux auteurs indépendants ni R séparé** |
| J3 | Vrai A Sol / B Astra / R GLM, réparti entre sessions 2 et 3 |
| B1/B4/B5/B6 | Livrables 1+P déjà committés, conservés ; pas régénérés |
| B2 | A historique puis B strict frais et R réellement post-B ; aucun V frais |
| B3/B9/B10 | V Sol frais, B strict et R frais. Les premiers B exposés à meta/wiki sont exclus |
| B7/B8/C3/C7/C8 | Vraies paires A/V Sol ; C B7/C3 ont aussi deux reconstructions indépendantes en contexte + réconciliation ASM |

**5/6 fonctions >200 ont un vrai 2+1 final** ; A5, 243 instructions, reste solo avec escalade différée. A3 est indiqué 1+P solo malgré 95 instructions ; A9 1+P solo malgré LIKELY. Ces écarts interdisent d'utiliser le lot A comme bras expérimental propre « 1+P versus 1+V ».

Indépendance de **contexte** ≠ diversité de **modèles** : les nouvelles reprises B/C sont Sol High seulement. J3 est historiquement Sol/Astra/GLM. Pour les vieux drafts GLM, leur existence ne certifie ni deux moteurs différents ni un prompt aveugle identique. B9 : A/B/C sont explicitement des **stubs HTTP502** (`tools/_tmp_semantic_triple/0x465930/glm_meta.json`), exclus du dénominateur génération C.

Familles : quatre variantes OT44 identiques/rel32 comptent ensemble, deux OT2C ensemble, deux shadow setters ensemble : **28 familles/33 EA**, **17 familles/22 ensembles C inspectables**. Fusionner OT44 et OT2C comme template paramétré donnerait 27 familles et 16 familles C ; conserver les deux variants évite de nier leurs champs/masques différents.

## 3. Métriques : dénominateurs séparés

Toutes les sommes sont calculées en code ; les assertions reproductibles sont dans `audit.json:derivation_python`. Un défaut est compté par EA, pas par phrase ni génération. Les valeurs « au moins » sont des **bornes observées**, pas une détection exhaustive.

### Reconstruction C

- **20** triples GLM non-stub hérités + **2** couples C Sol frais = **22** ensembles, **17 familles**.
- Au moins un défaut substantiel d'une génération : **12/22 EA, 9/17 familles**. Dans les triples seuls : **12/20**. Les cas et citations sont `C01`–`C12` du JSON.
- R doit corriger **A et B** sur un comportement faux dans au moins **3/22 EA** : A7, J3, C7. Les propositions ne sont pas une moyenne de sorties.
- Deux auteurs partagent la **même** erreur dans au moins **3/22** : A9 A/C base OT ; J3 A/B valeur de head au lieu d'adresse ; C7 B/C destination réinitialisée chaque ligne. Ce n'est pas un consensus unanime des trois ; son compte n'est pas établi.
- B fournit un composant correct là où A se trompe/omet : au moins **6/20 triples**. Mais B introduit aussi un comportement faux là où A est conforme : au moins **2/20**, J2 et B10. Aucun de ces comptes ne mesure le bénéfice marginal **par rapport à un reviewer ASM**.
- Couples C Sol réellement indépendants B7/C3 : **0/2 divergence algorithmique** (`reconcile_notes_sol.md` B7 L18 et C3 L12). Les choix types/frame/volatile et réserves de linkage ne deviennent pas des erreurs ASM.
- Après la réconciliation C historique, une relecture ultérieure corrige réellement le C B2/B9 et l'ordre alias C8 ; B10/C7 ont surtout des corrections de commentaires, et des limites C hors invariants séparées. Ne pas appeler toutes ces corrections « code faux ».
- Résidu au checkpoint : C J3 conserve un cache `actor`/`phase_s` malgré R demandant les reloads. Discrepancy **conditionnelle**, pas bug runtime observé ; voir §4.2.

### Sémantique

- **8 V frais** : **5 ACCEPTE**, **3 ESCALADE_2+1**, zéro CORRIGE simple. Une acceptation sémantique peut néanmoins demander une correction du C d'index/alias : C8 en est la preuve.
- Assertions substantielles d'A corrigées ou re-dérivées correctement par V : **au moins 2/8**. B3 A L6 donne un ordre impropre ; V fournit l'ordre exact, même s'il écrit « aucune divergence ». B9 valide trop largement un C qui fige le count. **Ce ne sont pas deux nouveaux bugs C écrits par A sémantique.**
- Trois comparaisons appariées V → B strict → R : **0/3 correctif substantiel inédit de B**. Ordre B3, count/gates/rejeu B9, garde/retours/sorties B10 sont déjà dans V. Les confirmations et le nom neutre de B restent utiles, mais pas une correction nouvelle.
- Anciens R sémantiques comportant des claims substantiels que V frais réfute : **2/3** dans ce sous-groupe, B9/B10. R n'est donc pas un oracle.
- Faux positif **V** confirmé : **0/8 trouvé**. En revanche, un faux positif de **réconciliation C** est identifié dans une famille, deux EA : retrait d'un `&31` correct, §4.6. Ne pas fusionner les deux rôles.
- R final corrige les deux A/B strict sur la même assertion ASM fausse : **0/5 établi**. Contrat de retour découvert hors fonction, changement de nom ou nuance « restauration » ne constituent pas cette métrique.
- Conflit de rôle/opcode non tranché après les cinq R finaux : **0/5** ; invariants mémoire/métier non fermés : **5/5**. L'accord n'établit pas la sûreté et la livraison C peut rester incomplètement corrigée.
- Les trois escalades après V sont toutes déclenchées par >200. « Aucun correctif inédit B » **ne démontre pas** qu'elles étaient inutiles, et « seuil obligatoire » **ne démontre pas** leur nécessité scientifique. Aucun bras contrôle ne sépare effet B, recherches R et checks ASM parent.

## 4. Six exemples déterminants

### 4.1 J1 — B sauve un stride réel, pas une préférence documentaire

`glm_c_a.c:15` définit `((i+2*i)*4*16)`, soit **192=0xC0**, malgré son commentaire 0xD0. B utilise bien `slot*0xD0` (`glm_c_b.c:36-37`). C emploie aussi un mauvais stride maxHP (`glm_c_c.c:42`). R retient les calculs ASM ; `glm_reconcile_notes.md:9-11`. Classe **1**, avec effet sur la mémoire lue. La formule Type15 de C change aussi l'arrondi signé.

Chemin des quatre sources : `tools/_tmp_semantic_triple/0x493450/`. Origine : génération ancienne, premier C git `0b34a7e` du 13 septembre ; **messageID d'origine non récupéré**, ne pas l'inventer.

### 4.2 J3 — A et B partagent une erreur ; R trouve un contrat ; sa correction n'est pas entièrement propagée

Dans les générations **C** anciennes, A L73 et B L68 passent `dword_2258A80`, tandis que l'ASM pousse **son adresse** ; C L73 a `&dword_2258A80`. `glm_reconcile_notes.md:7-9` tranche aussi le pointeur acteur+0x28 cassé d'A. Une majorité A/B aurait été fausse.

Dans le pipeline **sémantique**, A et B réservaient tous deux la signification de retour2. R lit la pompe : **`test al,2 @0x50843A` → unlink** (`semantic_r.md:20,25`). Ce bénéfice vient de l'investigation ASM externe de **R**, pas d'un désaccord de deux reconstructions ni d'un vote. « R corrige deux erreurs » serait ici un faux comptage : ils avaient explicitement laissé une réserve.

**Résidu vérifié sur le C gelé** : `decomp/0x5A6D20__BdLinkCallback_5A6D20.md:92-94,159-167,181-184@a2791cd` conserve `actor` initial et réutilise `phase_s` après Camera. Le pack ASM relit phase **après** Camera à `5A6F88`, slot à `5A6FF2/5A7058` ; `asm.asm:171-172,202,234`. R avait déjà exigé ces relectures (`semantic_r.md:29`). L'effet diverge si les helpers mutent ces données ; aucun invariant de nonmutation ni occurrence runtime n'est établi. **Semantic clos ≠ C automatiquement corrigé.**

Ancre historique R : session `ses_ee44d1a6bffe2zMItwXhDdenNP`, message `msg_11bb8742b001CH8p7cKVvIn4by`, tool `call_9d393c036cf445d08a64d382`. A et B ont bien des contextes différents, mais leurs réserves convergentes ne prouvent pas le contrat.

### 4.3 Petits C — le seuil ≤80 n'est pas une garantie d'exactitude du générateur

**B6, 15 instructions** : A retourne shadowTable même au chemin NULL ; ASM conserve engine EAX. B/C sont corrects (`0x43b50c/glm_reconcile_notes.md:26-30`). **J2, 37 instructions** : B écrit `[tail+0]`, ASM `[tail+4]`, A/C suivent l'ASM (`0x508360/glm_reconcile_notes.md:7-9`). C7 B/C partagent un avancement de lignes faux (`0x4675c0/glm_reconcile_notes.md:8-12`).

Cela justifie un check exhaustif court, pas forcément un deuxième générateur systématique. Ces erreurs C ne sont pas des erreurs des A sémantiques ni la preuve que les quatre clôtures solo J étaient de vrais 2+1.

### 4.4 B9/B10 — V corrige les anciens R ; B strict ne fournit pas un nouveau correctif

**B9** : `mov edx,[eax-324h] @0x465B30` recharge le count après callbacks. Le `for` historique le fige. V donne déjà la correction, plus **3 groupes de32** et possibilité de rejeu lorsque génération=0 (`semantic_v_sol.md:7,24-28`). B strict confirme ; R L24-28 reprend. Le C est vraiment changé pour le reload ; le type de retour void versus résidu machine est traité séparément.

Ancre V : `ses_ee4080e4effegnkcTnvHfdY3uy` / `msg_11bfb46b4001Kat23M4fb51o03` / `call_4bbf644f70454cad916a05713a27b04b`.

**B10** : compagnon **+24**, retour **+2C** ou banque **+34**, arg_C non NULL-testé, count0 publie puis **teste** +24. V le démontre déjà (`semantic_v_sol.md:13-18,23-25`). R distingue clairement résumé faux et **corps C de sélection déjà correct** (`semantic_r_sol.md:38,42-47`). Le patch du commentaire n'est pas une correction de ce corps.

Ancre V : `ses_ee4080e44ffe7oYrSAcpRUCdqs` / `msg_11bfa6793001NJsi6XgBn2vb31` / `call_d9988d2b88c040e297fc38960741d94d`.

**B3** est la troisième comparaison : V avait déjà l'ordre du mode zéro, la distinction deux stores/deux nonNULL et le type dynamique invalidant « 0/67 » (`semantic_v_sol.md:7,20`). R corrige la confiance globale et les résumés ; aucune nouvelle modification du C n'est requise. Sources respectives sous `0x465930/`, `0x465ce0/`, `0x41619a/`.

### 4.5 B7/C3 — deux vraies générations Sol, pas de différence algorithmique trouvée

B7 : neuf calls, args/cleanups, compteur signé, masque, absence de garde et retour concordent (`0x407914/reconcile_notes_sol.md:18-24`). R choisit représentation DWORD/adresses et vue caller des prototypes, corrige les hallucinations Hex-Rays **déjà évitées par A/B**, et complète les preuves.

C3 : flux identique, BYTE assignment, asymétrie reloadNULL, pointeur EAX et sortie12octets identiques (`0x41ac34/reconcile_notes_sol.md:12,19-23,29-31`). Frame/volatile/annotations changent ; **pas d'erreur comportementale prouvée A/B**. Les réserves ISO C ne deviennent pas des défauts ASM.

Ancres : B7 `ses_ee3ecbb81fferHjUfM3XWrKtY2` / `msg_11c14853d0014l53MijWp1TsGg` / `call_f7178c1179494e5b92e6a4b880385cfd` ; C3 `ses_ee3b97ae9ffeVVjKWxBNOXHR4c` / `msg_11c48f122001RRsdAXhfwxQgh1` / `call_6c923a0341f44d7cb2acca7fb7be3698`.

### 4.6 C8 alias et faux positif de réconciliation C — séparer l'ASM du C hors invariants

V **ACCEPTE** la sémantique C8 mais découvre une correction C supplémentaire : chargement couleur haute **`0x467901` avant premier store `0x467908`** ; le C fait le lookup après. Si CLUT et destination aliasent, la valeur peut changer. C'est une vraie exigence d'ordre mémoire, **conditionnelle**, pas un désaccord de rôle avec A (`0x4677d0/semantic_v_sol.md:6`). Le shift `((u32)global+3)&31` était déjà signalé par A.

Ancre V : `ses_ee3a66b3affePfl6pJIw1SrV20` / `msg_11c5b588f001JxPV4W8gZr8DEM` / `call_eb7a59f64b7a472981cfceff5a6e5e4a`.

À l'inverse, l'ancien réconciliateur C des clones A8/A10 qualifie `&0x1F` d'invention (`0x5bd460/glm_reconcile_notes.md:13`, `0x5ef910/glm_reconcile_notes.md:13`). Pourtant **SAR r32,CL masque matériellement le compte à cinq bits**. A8 `glm_c_a.c:52`, A10 `glm_c_a.c:37` le modélisent correctement ; le C réconcilié ne garde que `(unsigned char)shift` (A8 L48), potentiellement ≥32 en C. **Faux positif de réconciliation C**, pas du V sémantique ; risque de domaine/UB séparé en classe7, aucune violation runtime démontrée. « Pas d'AND explicite dans l'ASM » ne suffit pas à rejeter une normalisation fidèle à l'instruction.

## 5. Coût observé, non tarif extrapolé

Les 94 sessions exposent des champs message totalisant input **7 330 992**, output **889 554**, reasoning **409 322**, `cost` enregistré **1,30942144 USD**. Les sessions OpenAI abonnement affichent 0 : **pas la preuve qu'elles sont économiquement gratuites**. Reasoning et output peuvent se recouvrir ; aucune addition comme catégories disjointes. Les générations gateway anciennes ne sont pas facturées par cette somme. Les temps outils/wait ne sont pas assimilés à de la réflexion.

Pour les mêmes trois EA B3/B9/B10, les champs de sessions donnent :

| Étape | Input déclaré | Output déclaré | Cache read déclaré |
|---|---:|---:|---:|
| V | 170 131 | 18 959 | 1 860 352 |
| B strict + R ajoutés | 308 236 | 50 714 | 3 957 504 |

**Correctif substantiel inédit attribuable à B : 0/3 dans ce sous-groupe.** Le surcroît est observé, mais ce n'est pas un prix ni un coût causal d'un protocole neuf : V traite aussi des défauts historiques, R poursuit des recherches, les reprises et la taille des préfixes contaminent l'expérience. Les sessions exactes et valeurs par rôle sont dans `observed_usage`.

B7 C : A 43 026/3 638 input/output ; B 30 615/2 748 ; R 42 696/9 056. C3 C : A 69 089/8 279 ; B 37 414/7 208 ; R 55 681/11 032. **0/2 divergence algorithmique** ; ni preuve de gaspillages universels, ni tarif inventé.

Infrastructure séparée des erreurs d'analyse : **5 refus depth**, **2 enfants funds failed**, **5 appels interrompus au restart**, **5 enfants quota failed**, **1 erreur SQLite OOM historique**, **3 premiers B Sol meta/wiki exclus**, **1 première tentative B3 strict sans outils remplacée**. Aucun nouvel OOM pendant cet audit. Un call subagent peut être « completed » alors que son enfant est failed : ce statut n'est pas un verdict sémantique. Sources : journal L18,65,76,80,84,119 ; ancre depth `msg_11b6e2081001VnyIbL0622NE55`, interruption `msg_11be5873e001XK0OcooIP0r6nx`, OOM `msg_11c628a34001ArksBHNZncJsCk`/`call_e909d1fa74424f7087cee333e3e3a6c5`.

## 6. Recommandation — à valider par l'utilisateur, rien changé

**Démontré** : un ASM reviewer réel est plus important qu'un accord textuel ; les sorties C brutes peuvent être fausses même très courtes ; les anciens R aussi peuvent être faux ; le nouvel auteur B ne remplace ni l'ASM ni la propagation des corrections.

**Hypothèse à tester** : garder sémantique **1+V par défaut**, **1+P uniquement ≤80 + CERTAIN + gate ASM parent réellement exécutée**, et rendre **2+1 adaptatif** sur désaccord réel, couverture incomplète, ABI/retour non fermés, nom/contrat trompeur ou échec du reviewer. Pour C, une reconstruction + **review ASM exhaustive indépendante** est un candidat ; dual-gen+R reste pertinent quand l'ambiguïté ou un échec le justifie. Ces données **ne valident pas** de retirer le seuil actuel >200 ; l'utilisateur doit approuver toute évolution.

Gates mesurées à ne pas perdre :

1. Tous les retours/largeurs ; véritables mots poussés et cleanup groupé.
2. Strides développés, arithmétique des pointeurs typés ; adresse versus contenu.
3. Reloads et ordre mémoire à travers callbacks ; shifts x86 masqués et invariants C explicites.
4. CFG/switch complets ; claims de nom/confiance bornés à leurs preuves.
5. Code, commentaires et provenance séparés ; contrôle **du livrable final réel** après correction acceptée.
6. Aveuglement vérifié dans les lectures observées, pas seulement dans le prompt ; clones comptés par famille.

**Pilote apparié blind conseillé** : packs gelés, un représentant/famille, trois bins de taille ; A figé, V et B aveugle dérivent sans se lire ; parent valide d'abord les corrections V seules puis les découvertes marginales B/R. Inclure des petits contrôles propres et des gros ambiguës ; noter tokens réellement observés, relances infra/contamination, erreurs inédites adjudiquées. Pas de classement GLM/Sol sur tâches non appariées. Effectifs actuels **0/3 et 0/2** trop faibles/sélectionnés pour une décision dogmatique ou un intervalle populationnel crédible ; fractions et bornes suffisent.

## Traçabilité et trous restants

Les citations `tools/_tmp_semantic_triple/...` concernent uniquement les EA stables du corpus. Les citations `docs/...@a2791cd` sont gelées. Les 33 fiches de cas, corrections classées, sessions sources et métriques reproductibles sont dans `audit.json`. Les noms métiers demeurent ceux des livrables, pas de renames.

Trous : payloads tronqués32 ; historique d'origine de générations septembre non relié ; tests d'équivalence/compilation/runtime absents ; effet causal B versus ASM parent non isolé ; aucun audit exhaustif des 555 C. Le résidu C J3 et le faux positif `&31` sont signalés au parent **dans ce rapport seulement**, sans contacter ni modifier la campagne active.
