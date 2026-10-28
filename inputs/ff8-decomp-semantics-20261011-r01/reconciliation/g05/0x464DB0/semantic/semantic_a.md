# 0x464DB0 — sémantique A indépendante

## Périmètre et provenance

Rôle : auteur sémantique A, mission `ff8-decomp-semantics-20261011-r01`, fonction **0x464DB0 seulement**. Aucun C cible, autre auteur, review, classifier ou verdict consulté. Pas de promotion ni de §5.6 effectué.

Entrées consommées : `inputs/ff8-decomp-semantics-20261011-r01/g05/common-compaction.md` et, dans `0x464DB0.readable/`, `manifest.json`, `metadata.json`, les six fichiers `asm-001.txt` à `asm-006.txt` et `bytes-001.txt`, intégralement. Les références `R/` ci-dessous désignent ce répertoire readable ; `K` désigne la compaction commune. La projection annonce l'ASM et les bytes complets, sans correction/troncature (`R/manifest.json:3–7`). Hash du packet natif faisant autorité : `9c59075630146d8ae274a6bcb36ffc91b884316984555a9375ec86eba9ab5c9d` ; hash de la compaction : `31f54f91acd75f7900cac43fa360f6aaa697af6f6e8cb7d4486a439b614ec451` (manifest:4–5). Le packet original n'a pas été relu séparément ; ses projections verbatim sont l'entrée de cette analyse.

Couverture : 147 lignes ASM, bytes de `[0x464DB0,0x464F6F)`, dix blocs du CFG (`R/metadata.json:11–82,107`), comprenant les deux branches de construction, le retour immédiat et l'échec d'allocation. Aucun test, compilation, différentiel ou accès IDA/live exécuté. Les commentaires et labels natifs sont exclus comme preuves.

## Résultat et confiance

**Nom proposé : `Gfx_EnsureTextureSlotAlphaLists` — LIKELY.**

**Rôle mécanique CERTAIN :** initialisation paresseuse de deux résultats de fabrique, publiés dans les DWORDs `slot+0x44` et `slot+0x48`, avec une branche préparant un tampon dérivé de pixels/CLUT et une branche réutilisant un objet imbriqué provenant de `slot+0x24`. Le seul témoin initial d'initialisation est `slot+0x44 != 0` ; il n'existe ni contrôle de `+0x48` ni réparation de cette paire dans ce cas.

**Interprétation métier LIKELY :** construction de listes auxiliaires alpha pour un slot de texture. « Ensure » est étayé par le garde d'entrée et les publications après fabrique (preuves 1, 5, 7). « TextureSlot » est étayé par les champs/géométrie du slot validés dans K:18 et par le calcul de source pixels (preuve 4). « AlphaLists » a deux appuis indépendants : l'appel de conversion alpha avec huit arguments (preuve 4 et ABI validée K:13), puis les deux fabriques types 6/14 et le transfert de leur objet imbriqué par le descripteur (preuves 5 et 7, contrat de fabrique K:15). Il ne s'agit pas d'une déduction depuis l'ancien nom.

**UNCERTAIN :** raison exacte de ces listes dans le rendu, sens métier des globals `1CCFD88`/`1CA8A00`, contrat des helpers `0x464160`, `0x467160`, `0x417FA6`, garanties d'allocation/propriété et signification des deux types. « UploadCLUT » serait trop affirmatif : ici la CLUT est une source de conversion, aucun transfert matériel de palette n'est prouvé.

## Entrées, sorties et ABI

- ABI observée compatible **cdecl, trois mots d'arguments** ; la fonction lit les positions `arg_0`, `arg_4`, `arg_8` et termine par `RET C3`, sans nettoyage des arguments. EBX/ESI/EDI sont sauvegardés ; EBP est utilisé/sauvegardé seulement dans la branche de staging et restauré avant son retour. Aucun argument flottant, aucune instruction x87 dans cette fonction.
- `arg_0` : adresse du slot, déréférencée sans garde NULL. Accès DWORD : `+4`, `+8`, `+0xC`, `+0x10`, `+0x14`, `+0x24`, `+0x44`, `+0x48`, `+0x5C`, `+0x60`. K:18 documente le slot de 100 octets, coordonnées `+4/+8`, dimensions `+C/+10`, mode `+14` ; ces noms sont du contexte validé, non du typage natif implicite.
- `arg_4` : mot 32 bits encodant la page ; seulement bits 0–3 et bit 4 utilisés, et seulement dans la branche `1CCFD88 != 0`.
- `arg_8` : adresse d'un record dont **WORD non signé à +0x448** est lu dans cette même branche. Le `xor eax,eax` avant `mov ax,[...+448h]` garantit zéro-extension réelle ; aucun masque `0x7FFF` ni extension signée ici. Dans l'autre branche et au retour immédiat, ces deux arguments ne sont pas lus.
- Globals lus directement : `1CCFD88` (sélecteur), `1CA8A00` (choix filtre 2/0 dans la branche alternative), `1CB602C` (base mémoire). L'appel `0x40A04A` fournit un pointeur conservé dans EBX ; son DWORD `+0xA50` est relu avant **chaque** fabrique comme cinquième argument.
- **Retour EAX32 hétérogène, pas un booléen/statut** : garde initial → valeur initiale non nulle de `slot+44`; allocation auxiliaire nulle → zéro ; construction → EAX de la seconde fabrique, également publié dans `slot+48`, potentiellement NULL. Aucun résultat AL/AX n'est imposé au retour. Le retour de conversion n'est pas propagé : EAX est remplacé par le chargement du propriétaire puis par les fabriques.

## Contrat mécanique par chemin

1. Si le DWORD `slot+44` est non nul, retour immédiat de ce DWORD sans appel ni écriture explicite.
2. Sinon appel `0x40A04A`, conservation du résultat, puis lecture de `1CCFD88`.
3. Si ce sélecteur est non nul : écrire **DWORD slot+60 = 0** ; extraire la page ; si `slot+5C` est nul, appeler `0x467160(0xF0)`, stocker son EAX dans `slot+5C`, puis sortir si zéro. Cette sortie conserve la mise à zéro de `+60` et la publication nulle de `+5C` ; ce n'est pas un rollback.
4. Toujours sur ce chemin, initialiser le descripteur local de 0x84 octets via `0x40702F(0,desc)`, puis appeler `0x464160(slot)` ; son contrat reste opaque et ses effets ne sont pas remplacés par une allocation supposée. **Après cet appel**, relire `slot+5C`, puis `slot+60` et les dimensions pour préparer la conversion. Écrire `desc+28 = slot+5C` et utiliser `[slot+5C]+44` comme pitch destination de la conversion.
5. Appeler `0x4677D0` avec huit mots, dans l'ordre logique cdecl : `(src, 0x800, slot+60, [slot+5C]+44, slot+C, slot+10, slot+14, clut)`. L'ABI dans K:13 valide src_u8, pitches en octets, destination_u16, largeur/hauteur, mode et clut_u16. Cela n'autorise ni garde supplémentaire ni hypothèse de réussite du helper.
6. Appeler `0x416D82(1,6,desc,0,owner)`, publier EAX à `slot+44`, écrire `desc+2C=1`, appeler `0x417FA6(EAX)` et écrire son résultat à `desc+30`. Relire owner ; appeler `0x416D82(1,14,desc,0,owner)`, publier EAX à `slot+48` ; retour de ce dernier EAX. Aucune vérification du premier résultat avant le helper, aucune vérification du second résultat.
7. Si `1CCFD88 == 0` : initialiser desc avec filtre `(1CA8A00 != 0 ? 2 : 0)` ; charger `slot+24`, écrire `desc+2C=1`, appeler `0x417FA6` sur cette valeur et écrire EAX à `desc+30`. Construire/publi­er les mêmes types 6 puis 14, chacun avec `(1,type,desc,0,owner)` et owner relu. Pas d'écriture directe à `slot+5C/+60`, pas de conversion ; aucun accès à arg_4/arg_8.

Les offsets locaux `desc+28/+2C/+30` sont établis par les déplacements ESP des bytes, indépendamment des noms `var_5C/var_58/var_54` : adresse desc `esp+10` avant sauvegarde EBP, écriture `esp+48` après EBP et trois arguments en attente, puis `esp+40` après nettoyage 0x40, puis `esp+48` après un push helper. Branche alternative : `esp+3C` puis `esp+44`. Le nettoyage 0x40 du chemin staging regroupe 3 mots init/helper + 8 conversion + 5 fabrique ; 0x18 suivant regroupe 1 helper + 5 fabrique. Le nettoyage 0x2C alternatif regroupe 1 helper + 5 + 5 fabriques. Ne pas inférer des prototypes élargis des seuls ADD ESP.

## Arithmétique, strides et effets

Au moment du calcul, définir `t = arg_4` (bits32), `m` = DWORD slot+14 chargé après le helper, `u` = zéro-extension du WORD record+448, `B` = DWORD global1CB602C. Le calcul natif donne :

- `page_x = (t & 15) << 6` ; `page_y = ((SAR32(t,4) & 1) << 8)` (0 ou 256). Le SAR est signé, mais son masque ne retient que le bit4 original, même pour t négatif.
- `clut = B + (u << 5)` modulo 2^32. La décomposition `((u >> 6) << 6) + (u & 63)` restitue u, sans perte de bit15.
- `q = SAR32(slot+4, (2 - m) & 31)` ; soustraction modulo2^32, count x86 masqué à cinq bits ; **pas** une division C ni un décalage à borne garantie.
- `src = B + 2 * (((slot+8 + page_y) << 10) + page_x + q)` modulo2^32. Row stride **1024 WORDs = 0x800 octets** ; page x en unités WORD ; la constante passée au blit est son pitch source en octets. Aucune multiplication par 0x800 WORDs.

Les chargements slot+4/+8 sont des DWORDs ; seul le SAR impose une interprétation signée du premier. La géométrie et les modes ne sont ni bornés ni validés ici. Le callee documenté K:13 interprète largeur/hauteur de façon signée, rejette hauteur<=0, ne garantit pas sécurité pour largeur négative ; mode0 diffère en stride et packing, autres modes invalides n'écrivent rien. Selon ce contrat validé, la destination reçoit des WORDs alpha-only (somme RGB555, shift global, saturation à15, puis <<12), pas une copie RGB complète. Ces effets sont **transitifs**, pas une preuve de corps natif nouvellement audité ici.

Effets directs : publications de pointeurs/résultats dans slot, mises à jour du descripteur local ; effets indirects : allocation/helper, écriture dans la destination de conversion et effets de fabrique/ownership documentés K:15. Pas de libération explicite, verrou, synchronisation ou restauration transactionnelle. Le premier résultat nul n'empêche pas la seconde construction ; un slot+44 non nul avec slot+48 nul sera laissé tel quel à l'appel suivant.

**Ordre/alias :** les appels peuvent modifier slot, globals ou owner. Le format est relu après `0x464160`, les propriétaires après conversion/helper et après première fabrique. Ne pas hoister ces lectures, supposer pureté/non-aliasing, ou remplacer par les valeurs antérieures. Si des sorties, slot, CLUT ou source se recouvrent, les contrats de conversion restent sensibles à l'ordre ; aucun `restrict` ni promesse de copie sûre n'est démontré. Aucune instruction x87 locale ; les effets de callees opaques sur l'environnement ne sont pas établis.

## Huit preuves indépendamment vérifiables

1. **Garde paresseux/retour** : `464DC0–464DC5`, `464F65–464F6E` ; `R/asm-001.txt:6–8`, `R/asm-006.txt:18–22`. Test DWORD +44, saut au RET sans transformer EAX.
2. **Sélecteur et allocation auxiliaire** : `464DD2–464E1B` ; `R/asm-001.txt:11–25`, `R/asm-002.txt:1–6`. Global, mise à zéro +60, allocation0xF0, publication +5C avant test/retour.
3. **CLUT largeur exacte/base** : `464E34–464E65` ; `R/asm-002.txt:14–25`, `R/asm-003.txt:1–3`. XOR EAX + MOV AX, recomposition du WORD, <<5, ajout base1CB602C, desc+28 et pitch +44.
4. **Source page/stride et conversion** : `464DEF–464E02`, `464E68–464E9C` ; `R/asm-001.txt:17–23`, `R/asm-003.txt:4–25`, `R/asm-004.txt:1`. Masques page, SAR variable, <<10 et facteur2, huit pushes ; contrat externe validé dans K:13.
5. **Paire staging et lien imbriqué** : `464EA1–464EEA` ; `R/asm-004.txt:2–25`. Fabriques6/14, stores+44/+48, desc+2C=1 et +30=résultat helper ; owner relu deux fois.
6. **Alternative filtre/reuse** : `464EF8–464F2A` ; `R/asm-005.txt:7–23`. Filtre2/0, récupération depuis slot+24, lien desc+30 ; aucune conversion sur ce chemin.
7. **Paire alternative/retour EAX32** : `464F2E–464F6E` ; `R/asm-005.txt:24–25`, `R/asm-006.txt:1–22`. Même types6/14, deuxième EAX publié puis retourné sans normalisation.
8. **Xrefs et structure environnante** : `R/metadata.json:84–96` atteste appels464CCC depuis464BD0 et465FAF depuis465CE0 ; K:18–20 fournit contexte validé de slots100 octets, records1100/1136 et champ CLUT WORD+448. Ces références corroborent la structure, pas un nom « World » tiré du label.

## Questions ouvertes / limites à transmettre au lead

- Gel natif des helpers464160/467160/417FA6 nécessaire pour confirmer allocation destination, préparation du format, propriété et comportement sur NULL. Ici leurs labels/comments ne valent pas contrat.
- Quelle garantie externe rend le garde +44 suffisant pour l'intégrité de +48 ? Les échecs partiels et allocations persistantes sont observables sans rollback local.
- Quelle configuration produit `1CCFD88 != 0`, et quel rôle exact a `1CA8A00` ? Aucun sens matériel/API n'est prouvé pour ces sélecteurs.
- Bornes de mode, dimensions, coordonnées, page et CLUT ; capacités des tampons et alias autorisés non démontrés. Le bit15 CLUT est conservé ici, contrairement à un masque documenté chez un caller : ne pas uniformiser les deux accès.
- Le calcul source utilise exactement row<<10 en WORDs ; la contradiction documentaire signalée dans K:23 ne change pas les bytes de cette cible. L'incertitude bytes/ASM de465720 dans K:9–10 est extérieure à cette fonction et n'a pas été utilisée pour compléter son corps.

Conclusion : **CERTAIN pour la mécanique locale complète ; LIKELY pour le nom/usage alpha auxiliaire ; UNCERTAIN pour sélecteurs, helpers opaques, sûreté et ownership.** Pas de divergence bytes/ASM identifiée dans le gel de464DB0 ; aucun contrôle parent final revendiqué.
