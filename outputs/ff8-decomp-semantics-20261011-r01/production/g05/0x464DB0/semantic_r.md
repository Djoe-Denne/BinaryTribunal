# 0x464DB0 — réconciliation sémantique R, 2+1

## 1. Périmètre, provenance et couverture

Mission `ff8-decomp-semantics-20261011-r01`, tâche `task_mv44rkhf_0076_asoj1n`, volet **sémantique uniquement**, fonction **0x464DB0 uniquement**. Ce document est le contrat sémantique réconcilié, pas le livrable C du volet distinct, ni une promotion.

Préfixe **I** : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g05/0x464DB0/semantic/`. Sources consommées : `manifest.json`, les deux auteurs, `common-compaction.md`, le packet original `0x464DB0.json`, `native-manifest.json`, `native-metadata.json`, **tous** les six `native-asm-001.txt` à `native-asm-006.txt` et `native-bytes-001.txt`. Aucun autre volet, output, historique, index, service natif ou verdict antérieur consulté.

Le manifest parent dépose deux auteurs indépendants avec sessions et tâches distinctes :

| Auteur | Session native | Modèle effectif déclaré | SHA256 du livrable gelé |
|---|---|---|---|
| A | `ses_ed3cffa5cffeG5NoDhDSDniMxv` | `openai/gpt-6.1-sol`, `high` | `662554b2c5eac2516a3c6a39dcdd0801479328207f2a7034cd0a1b74229c9768` |
| B | `ses_ed3cff70dffetLtxLvvCHIgVyj` | `openai/gpt-6.1-sol`, `high` | `9cc57a7a9c32c78f98d64021fc16c02f09ba331c3059f44546c609bb26e000ba` |

Le packet est déclaré SHA256 `9c59075630146d8ae274a6bcb36ffc91b884316984555a9375ec86eba9ab5c9d`, la compaction `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451`. Ces identifiants concordent dans le manifest R, le manifest natif, la compaction et les déclarations des auteurs ; les hashes des sept slices et des métadonnées concordent entre les deux manifests. Aucun auteur manquant ni incohérence déclarative de hash détecté. **Pas de recomputation cryptographique des fichiers avec les outils autorisés : contrôle byte-exact des hashes laissé au parent, comme permis par la mission.** La déclaration d'indépendance est celle du gel parent, non une inspection des sessions par R.

Source native déclarée : x86 32 bits, export `2026-10-11T16:38:25.140966+00:00`, IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`, input SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.

Couverture : un chunk `[0x464DB0,0x464F6F)`, **447 octets**, 147 instructions et dix blocs CFG. Les 14 lignes de bytes sont complètes (13 × 32 octets, puis 31). Le lecteur abrège la longue propriété `assembly` du JSON original : **aucun raisonnement ne repose sur cette chaîne tronquée** ; l'ASM est consommé intégralement via les six projections verbatim explicitement fournies. L'enveloppe, les bytes du chunk, le CFG, les xrefs et les cibles du packet concordent avec leurs projections. Les branchements, déplacements de pile, largeurs sensibles et appels sont recoupés avec les bytes. Pas de conflit bytes/ASM identifié pour cette cible. Le conflit d'une autre EA mentionné dans la compaction n'est ni réparé ni utilisé ici.

Context Mode n'est pas exposé dans le catalogue de cette session ; seules les lectures courtes bornées autorisées par la mission ont été utilisées. Aucun shell, compilation, test, exécution différentielle, IDA/live, mutation IDB/Git/registre/configuration ou délégation. Le parent conserve le contrôle natif final §5.6, sauvegarde/readback et promotion.

## 2. Verdict et nom final proposé

**Rôle mécanique : CERTAIN sous le gel et la convention cdecl** — constructeur paresseux de deux résultats de fabrique publiés dans les DWORDs `slot+0x44` et `slot+0x48`, avec garde uniquement sur le premier. Une configuration prépare une source pixels/CLUT et appelle un convertisseur avant les fabriques ; l'autre prépare le descripteur depuis le résultat d'un helper appliqué à `slot+0x24`.

**Nom proposé : `Gfx_LazyBuildTextureSlotAlphaDrawListPair` — LIKELY.**

Deux chaînes de preuve distinctes appuient ce nom :

1. Garde `+44`, deux appels de fabrique types numériques 6/14 et publications `+44/+48` sur les deux chemins (ancrages 1, 5, 7), associés au contrat de fabrique déjà validé et transmis dans la compaction §3, ligne 15.
2. Calcul de source pixels et de CLUT, pitch source 0x800 octets, huit arguments vers `0x4677D0` (ancrages 3–4), associés au contrat alpha-only de ce callee et à la géométrie du slot transmis aux lignes 13 et 18 de la compaction.

« LazyBuild » décrit le garde sans promettre l'existence des deux listes au retour. « Texture/Alpha/DrawList » demeure une interprétation métier **LIKELY**, étayée par ces contrats externes gelés mais non nouvellement auditée dans leurs corps. Le vieux label `Gfx_UploadCLUTSlot` n'est pas une preuve : la CLUT est ici une source de conversion ; aucun upload matériel de palette n'est établi. Le sens exact des types 6/14, de la politique de rendu et des sélecteurs reste **UNCERTAIN**.

## 3. Convergences, divergences et erreurs communes recherchées

L'accord des auteurs n'a pas servi de vote : chaque décision ci-dessous est re-dérivée de l'ASM, des bytes, de la pile et du contexte explicitement autorisé.

| Point | A / B | Arbitrage R et preuve |
|---|---|---|
| Garde, paire et retours | Accord | Confirmés : `464DC0–464DC5`, stores `464EBB/464EEA` et `464F45/464F62`, retours `464EF7/464F6E`. Le second champ n'est jamais testé. |
| Nom | A : `EnsureTextureSlotAlphaLists` ; B : `EnsureTextureSlotAlphaDrawLists` | Retenir le nom proposé ci-dessus. Le contrat externe de `416D82` étaye « DrawList » ; le défaut de réparation du second résultat déconseille de faire lire « Ensure » comme postcondition. Ce choix de nom n'est pas une certitude native supplémentaire. |
| Helper `417FA6` / objet imbriqué | A présente un résultat/objet imbriqué ; B conserve son sens comme tentative | **UNCERTAIN** pour la navigation ou la nature imbriquée. Le label/commentaire ne suffit pas. Certain seulement : argument = premier EAX de fabrique sur staging, ou DWORD `slot+24` sur l'autre chemin ; EAX du helper devient DWORD `desc+30`. `464EC6–464ECC`, `464F16–464F2A`. |
| Helper `467160(0xF0)` | A parle d'allocation auxiliaire ; B dit allocation-like tentative | Certain : appel à un mot, publication EAX à `+5C`, puis test zéro (`464E09–464E1B`). Allocation/pool/ownership et taille effective du résultat **UNCERTAIN** ; 0xF0 est un argument, pas une preuve isolée de capacité. |
| Convertisseur, arithmétique, largeurs | Accord | Confirmés indépendamment : WORD zéro-étendu, base unique, `SAR edx,cl`, stride WORD ×2 et pitch 0x800 octets, ancrages 3–4. Pas de correction « à la majorité » ni selon la formule documentaire contradictoire. |
| Séquençage du descripteur | Accord | `+28` est écrit avant la conversion/fabrique staging ; `+2C/+30` après la première fabrique seulement sur staging, mais avant les deux fabriques sur l'autre chemin. Déplacements ESP recoupés ci-dessous. |
| Retour / échec partiel | Accord | EAX32 exact, pas booléen ; pas de test de fabrique. Les conséquences de retour nul ne doivent pas être présentées comme des garanties de propreté des callees opaques. |
| ABI et propriété | Accord sur cdecl ; prudence variable sur métier | Convention caller-cleaned corroborée par RET C3 et nettoyages regroupés. Aucun prototype opaque, aucune garantie de destination, de libération ou de propriété ajouté. |

Contrôle d'erreurs communes : le masque CLUT `0x7FFF` documenté chez un caller est **absent ici** ; bit15 conservé. Le pitch destination est `[aux+44]`, pas `desc+44`. La remise à zéro de `slot+60` ne prouve pas qu'il reste zéro après `464160`. Le descripteur peut être muté par les fabriques et n'est pas reconstruit entre elles. L'owner est relu deux fois ; la base pixels est chargée une fois. Aucun de ces détails n'est remplacé par une hypothèse de pureté, une garde ou une interprétation de label.

## 4. Interface et contrat de retour

Interface observée compatible **cdecl à trois mots d'arguments** : `(slot, page_key, record)`. Cette notation identifie les mots consommés, non un prototype C inventé. `RET C3` ne dépile pas les arguments. EBX/ESI/EDI sont sauvegardés/restaurés ; EBP seulement dans le chemin staging, où il est utilisé. Il n'existe aucune instruction x87 locale ni gestion explicite du contrôle/état x87 ; l'effet des callees opaques sur cet environnement reste inconnu.

- `slot` est déréférencé sans garde NULL. Accès directs DWORD : `+4,+8,+C,+10,+14,+24,+44,+48,+5C,+60`. La compaction fournit un span de slot de 0x64 octets et la géométrie ; la cible ne parcourt aucun tableau de slots et ne prouve aucun stride local de tableau.
- `page_key` est lu uniquement sur staging ; bits 0–3 et bit4 interviennent.
- `record` est lu uniquement sur staging ; accès **WORD** à `+0x448`, zéro-extension réelle par `xor eax,eax; mov ax,[edx+448h]`. Ni lecture DWORD, ni sign-extension, ni masque de bit15. Les arguments 1/2 ne sont pas lus sur les autres chemins.
- Globals directs : DWORD `0x1CCFD88` (sélecteur après l'accessor), DWORD `0x1CA8A00` (filtre alternatif), DWORD `0x1CB602C` (base source/CLUT sur staging).
- `0x40A04A` est appelé sans nouvel argument poussé. Son résultat EBX est conservé ; son DWORD `+0xA50` est relu avant chaque fabrique, après les appels précédents.

**Retour natif EAX32 hétérogène :**

| Chemin | EAX retourné |
|---|---|
| Garde `slot+44 != 0` | DWORD initial lu à `slot+44` |
| Résultat nul de `467160` | Zéro après sa publication à `slot+5C` |
| Staging terminé | EAX de la seconde fabrique, publié à `slot+48` |
| Alternative terminée | EAX de la seconde fabrique, publié à `slot+48` |

Pas de conversion en statut/BOOL, pas de retour limité à AL ou AX. Le résultat de conversion est écrasé. La consommation métier de ce retour par les callers n'est pas démontrée par leurs seuls xrefs.

## 5. Contrat complet par chemin et effets

### Entrée commune et garde

Lire le DWORD `slot+44`. S'il est non nul, retourner ce mot sans appel ni store direct. Sinon appeler `40A04A`, conserver son EAX en EBX, puis lire/tester `1CCFD88`. Le garde n'est pas retesté après cet appel ; un changement de slot par le callee ne crée pas de garde supplémentaire.

### `1CCFD88 != 0` : staging

1. Lire `page_key`, écrire DWORD `slot+60=0`, calculer/stocker page_y et conserver page_x. Lire DWORD `slot+5C`. S'il est nul, appeler `467160(0xF0)`, publier EAX à `slot+5C`, puis tester EAX. S'il est nul, sortir avec zéro ; le store `+60=0` et le store nul `+5C` restent effectués, sans rollback.
2. Appeler `40702F` avec les mots logiques `(0,desc)`, puis `464160(slot)`. Le premier contrat externe initialise un descripteur de 0x84 octets ; le second demeure opaque. Ne pas substituer une allocation ou une validation supposée au second appel.
3. Dans l'ordre natif : charger le pointeur `record`, charger `aux=slot+5C`, charger le WORD `record+448`, charger le DWORD mode `slot+14`, puis charger la base `1CB602C`. Recomposer le WORD et calculer CLUT. Écrire DWORD `desc+28=aux`, puis lire DWORD `aux+44` (pitch destination). Charger hauteur `slot+10`, largeur `slot+C`, destination `slot+60`, puis x `slot+4` et y `slot+8` pour la source. Ces lectures surviennent **après** `464160`.
4. Appeler `4677D0` avec exactement huit mots, ordre logique cdecl : `(source,0x800,destination,pitch_destination,width,height,mode,clut)`. Les pushes inverses et les chargements intercalés fixent le séquençage ; aucun retour de succès ou contrôle NULL n'est ajouté.
5. Lire `EBX+A50`, appeler `416D82(1,6,desc,0,owner)`, publier EAX à `slot+44`. Écrire DWORD `desc+2C=1`. Passer **cet EAX**, et non une relecture de `slot+44`, à `417FA6`, puis écrire son EAX à `desc+30`.
6. Relire `EBX+A50`, appeler `416D82(1,14,desc,0,owner)`, publier EAX à `slot+48`, retourner cet EAX. Le descripteur utilisé par la deuxième fabrique inclut les mutations possibles de la première et du helper ; aucune réinitialisation intermédiaire.

### `1CCFD88 == 0` : réutilisation

1. Lire `1CA8A00`. Appeler `40702F(2,desc)` s'il est non nul, sinon `40702F(0,desc)`.
2. Lire DWORD `slot+24`, écrire DWORD `desc+2C=1`, appeler `417FA6` avec le mot lu, écrire son EAX à `desc+30`.
3. Lire `EBX+A50`, appeler `416D82(1,6,desc,0,owner)`, publier EAX à `slot+44` ; relire `EBX+A50`, appeler `416D82(1,14,desc,0,owner)`, publier EAX à `slot+48`, retourner cet EAX.

Cette branche ne lit pas `page_key/record`, n'appelle pas `464160/467160/4677D0`, n'écrit pas directement `slot+5C/+60` ni `desc+28`. Cela n'interdit pas des effets indirects des callees.

### Effets et garanties absentes

Effets directs : stores DWORD du slot décrits ci-dessus et du descripteur local. Effets transitifs : convertisseur alpha-only, initialisation du descripteur et fabrique avec allocations/callbacks/autres effets selon les contrats gelés ; effets des trois helpers opaques non reconstruits. Aucun free explicite, verrou, synchronisation, test de capacité, rollback ou réparation du second résultat.

Il n'y a aucun test après les fabriques : un premier EAX nul n'empêche ni `417FA6` sur staging, ni la seconde fabrique. Si les callees ne modifient pas ensuite les champs, première réussite/seconde valeur nulle laisse `+44!=0,+48==0`, et le prochain appel saute tout travail. Ce scénario est permis par la mécanique ; ce n'est pas une garantie sur les effets cachés des callees.

## 6. Largeurs, arithmétique et pile

Noter `U32(v)` la représentation bits32 et `SAR32(v,n)` le décalage arithmétique x86 avec `n&31`. Toutes les sommes, soustractions et multiplications d'adresses ci-dessous sont modulo 2^32 ; les expressions ne réclament ni overflow signé C ni shift C hors domaine.

Avec `t=page_key`, `u=zext16(record[+448])`, `m=slot[+14]`, `x=slot[+4]`, `y=slot[+8]` et `B=global[1CB602C]` au point de leur chargement :

```text
page_x = (t & 15) << 6
page_y = (SAR32(t,4) & 1) << 8
clut   = B + (u << 5)
q      = SAR32(x, U32(2-m) & 31)
source = B + 2 * (((y + page_y) << 10) + page_x + q)
```

Le `SAR` de t, suivi d'un masque 1, sélectionne exactement bit4, même pour un t négatif. La décomposition CLUT `((u>>6)<<6)+(u&63)` restitue tous les 16 bits ; les `SHR` sont logiques. Le `SAR edx,cl` impose la signedness de x et le count masqué ; aucune borne de mode 0/1/2 n'est assurée ici. Le row stride est 1024 WORDs, soit **0x800 octets**, confirmé par le pitch poussé. Le facteur final 2 s'applique à l'indice WORD complet. Ne pas transformer ce calcul en row×0x800 WORDs ni en division signée C.

Le descripteur commence à `ESP+0x10` après les trois sauvegardes initiales ; page_y à `ESP+0x0C` est immédiatement avant lui. Son span de 0x84 octets provient du contrat transmis de l'initializer. Les offsets `+28/+2C/+30` sont re-dérivés des bytes, non des noms `var_*` :

- Staging : après EBP et trois mots init/helper en attente, store `[esp+48h]` à `464E61` = `desc+28`. Après nettoyage 0x40, store `[esp+40h]` à `464EBE` = `desc+2C`. Après push du helper, store `[esp+48h]` à `464ECC` = `desc+30`.
- Alternative : après nettoyage initializer, `[esp+3Ch]` à `464F1C` = `desc+2C` ; après push du helper, `[esp+44h]` à `464F2A` = `desc+30`.
- `ADD ESP,40h` regroupe initializer 2 + helper 1 + convertisseur 8 + première fabrique 5 mots ; `ADD ESP,18h` regroupe helper 1 + seconde fabrique 5 ; `ADD ESP,2Ch` alternatif regroupe helper 1 + deux fabriques 5+5. Cela ne prouve pas des prototypes à 16/6/11 paramètres.

Les écritures locales/publications sont DWORD ; le chargement CLUT est WORD ; les pixels WORD sont écrits **par le callee**, pas directement par cette cible. Le contrôle x87 natif n'est pas transformé en modèle flottant C : aucune opération locale x87, aucun environnement callee garanti.

Aliasing : aucun `restrict` ni non-recouvrement démontré. Slot, record, globals, buffer/owner et destination peuvent être modifiables par les appels. Les lectures après appels ne peuvent être hoistées ; les stores du descripteur ne peuvent être déplacés avant la première fabrique staging. La base B n'est pas relue entre source et CLUT. Les contrats externes du convertisseur signalent également une sensibilité à l'ordre des lectures/stores. Aucune copie sûre, immutabilité ou durée de vie n'est garantie ici.

## 7. Huit ancrages ASM/bytes/xrefs exacts

1. **Garde / interface / premier retour** : `464DB0–464DD9`, puis `464F65–464F6E` ; `I/native-asm-001.txt:1–13`, `native-asm-006.txt:18–22`, bytes lignes 1–2 et 14. MOV DWORD `+44`, JNZ au seul épilogue commun, RET C3 ; accessor avant lecture sélecteur.
2. **Staging et sortie nulle** : `464DDF–464E1B` ; ASM 001:14–25, 002:1–6 ; bytes 2–4. Store DWORD `+60=0`, extraction page, appel un mot 0xF0 à `467160`, store `+5C` avant test/branche sortie.
3. **CLUT / aux / largeur** : `464E34–464E65` ; ASM 002:14–25, 003:1–3 ; bytes 5–6. XOR EAX, préfixe 66 MOV AX depuis `+448`, mode DWORD, SHR/SHL, base DWORD, store `desc+28`, lecture DWORD `aux+44`.
4. **Source et huit arguments** : `464E68–464E9C` ; ASM 003:4–25, 004:1 ; bytes 6–8. `D3 FA` = SAR EDX,CL, `SHL ECX,0Ah`, `LEA EDX,[EAX+ECX*2]`, push 0x800 et call `4677D0`. Contrat alpha-only externe : compaction ligne 13.
5. **Paire staging / modifications entre fabriques** : `464EA1–464EF7` ; ASM 004:2–25, 005:1–6 ; bytes 8–11. Calls `416D82` types 6/14, stores `+44/+48`, écritures descripteur après première fabrique, call `417FA6`, owner relu.
6. **Alternative / filtre / helper** : `464EF8–464F2A` ; ASM 005:7–23 ; bytes 11–12. Test `1CA8A00`, filtre 2/0, init puis lecture `slot+24`, writes `desc+2C/+30` avant fabrique.
7. **Paire alternative / dernier retour** : `464F2E–464F6E` ; ASM 005:24–25, 006:1–22 ; bytes 12–14. Owners relus, appels 6/14 et publications, nettoyage 0x2C, EAX inchangé jusqu'au RET.
8. **Deux callers indépendants et contexte** : `I/native-metadata.json:84–106`, `0x464DB0.json:92–114` : xref call `464CCC` depuis fonction `464BD0`, et `465FAF` depuis `465CE0`, sept cibles directes. Compaction lignes 18–20 fournit géométrie des slots/records et CLUT WORD `+448`, sans faire d'un nom de caller une preuve « World ».

Ces ancrages couvrent les dix blocs : entrée ; accessor/sélecteur ; page/test aux ; appel/test auxiliaire ; staging jusqu'au retour propre ; test filtre ; chacun des deux pushes filtre ; réutilisation/fabriques ; épilogue commun. Les deux retours, les deux sorties précoces et les deux constructions sont inclus.

## 8. Limites et captures utiles au parent

- **UNCERTAIN** : contrat complet de `464160`, notamment destination `+60`, pitch `aux+44`, capacités et éventuelles mutations de mode ; contrat de `467160`, propriété et sens de 0xF0 ; contrat de `417FA6`, comportement pour NULL et signification de `desc+30`. Une capture native de ces helpers est nécessaire pour trancher ces points, pas pour décrire les appels locaux déjà visibles.
- **UNCERTAIN** : sens de `1CCFD88/1CA8A00`, politique des types 6/14, nécessité de ces listes dans le rendu. Pas de sens backend, alpha-pass ou upload matériel CERTAIN inventé.
- **UNCERTAIN** : bornes/validation des dimensions, modes, coordonnées et CLUT, capacités, alias autorisés, ownership/lifetime et intégrité de la paire. Les contrats transmis ne garantissent ni propreté des échecs ni sûreté générale. Le convertisseur documenté rejette hauteur<=0, comporte des différences de packing/pitch selon mode et ne fournit pas de garantie pour largeur négative ; ces faits externes ne deviennent pas des gardes de cette cible.
- Hashes de fichiers non recomputés, corps des callees non audités ici, environnement x87/callbacks non reconstruit, absence de tests/différentiel et de contrôle natif final §5.6. Validation finale réservée au lead.

**Conclusion : mécanique locale réconciliée CERTAIN sous le gel ; nom/rôle alpha de paire de draw-lists LIKELY ; helpers, politiques, sûreté et propriété UNCERTAIN. Aucun CONFLICT local bytes/ASM observé, aucune promotion revendiquée.**
