# readbackVramRectToRam @ 0x45BE70

- Statut : validé par le parent le 2026-10-09 — clôture documentaire historique LIKELY, hors métriques pilote.
- Push IDB : append `[semantic-triple 2026-10-09]`, sauvegarde true et relecture exacte, tag unique ; aucun rename/type/patch ni activité debugger/runtime.
- Verdict : ACCEPTE (V) ; confiance LIKELY ; le CERTAIN du frozen couvre uniquement les opérations numériques conditionnelles.
- Mode : 1+V ; A==V séparément : rôle oui ; nom oui au niveau hypothétique indiqué ; faits numériques oui ; confiance LIKELY oui.
- Fusion A+V, provenance explicite : A = `semantic_a.md` SHA-256 `27b655eced58505f7af4b984dc31aebef99000e255d5f31c021d0d60297ba230` (session H-C11-sem-A, GPT-6.1 Sol demandé explicitement, gel descriptif 2026-10-09T19:10:20.623397+00:00) ; V = `semantic_v.md` SHA-256 `8a47d6529d96afb0426e31835857116e5267807a75573b7f02201897f4c5f751` (review indépendante, hors cohorte, non blindée) ; V : zéro contradiction ASM trouvée ; le « confirme » de A est accepté avec sa réserve VRAM explicite. Canon hors cohorte Flash A + Sol B indépendante + Sol R ; pas un triple GLM.
- Nom catalogue : confirmation = hypothèse LIKELY seulement ; « VRAM » n'est pas prouvée par le nom ; alternative purement descriptive : `CopyFixedBaseStridedWordRectToBuffer` (proposition markdown seulement).

## Rôle (A==V)

Gate parent §5.6 exécutée sur ASM natif complet et C final réel : 42 instructions/un chunk/5CFG/hash inchangé, zéro callee, trois xrefs CODE/parents corrects, deux mots entrants/+8 caller, strides numériques2048/1024mots/2*w, polarité zéro seulement/counter modulo32, EAX32=1 sur deux retours. Deux preuves nom : calcul/copieur rectangulaire stridé et caller à rectangleconstant/tamponde4096mots ; VRAM pas certifiée par ce nom. DF/homealias/ordre DWORD puis octets/PUSHPOP/RET/EIP et toutes corrections C-R présents dans bloc exact5685octets. Backend mémoire non fourni, mapping/DFglobal/nonalias/flags complets non prouvés ; aucune équivalence CISO/native/runtime inconditionnelle. Ancien refus mission/hints conservés hors nouveaux inputs, canon dualgenC+R et sémA/V distincts respecté.

Copie vers une adresse fournie des fragments de lignes issus d'une base fixe, décrits par quatre mots signés compatibles avec un rectangle, avec sortie compacte si DF=0 et dimensions valides.

## Analyse réconciliée

ABI : deux arguments cdecl sur la pile — a1 pointe quatre `int16` signés (offsets +0/+2/+4/+6 = x/y/w/h, lus dans l'ordre natif +2/+0/+4/+6), a2 est l'adresse destination ; les trois callers nettoient 8 octets (`83 C4 08`). Source = `0x01B47818 + 2*(1024*y+x)` ; longueur par ligne = `2*w` modulo 2^32 ; stride source `0x800` (1024 mots), stride destination `2*w`. `B8 01 00 00 00` définit EAX32=1 complet sur les deux retours, pas AL/AX. Le premier slot d'argument (`[S+4]`) devient le compteur, réellement rechargé après copie : `TEST ECX,ECX; JZ` n'exclut que `count==0`, jamais un test de positivité ; `DEC ECX; JNZ` compte modulo 2^32.

## Preuves (8)

Reprises des preuves ASM fraîches de V, concordantes avec A :

1. **Format/source.** `MOVSX` à 0x45BE76/7A/7D/81 lit quatre int16, aux offsets 2/0/4/6. `SHL EDX,10; ADD EDX,ESI; SHL EAX,1; LEA EBX,[EDX*2+0x01B47818]` (0x45BE85–8C) donne source = base + 2*(1024*y+x), longueur L = 2*w, modulo 2^32. Pas de preuve d'identité VRAM dans cette adresse.
2. **Copie native.** `SHR ECX,2` (0x45BEA9), `F3 A5` (0x45BEAC), puis `AND ECX,3; F3 A4` (0x45BEB2/BB) copient L>>2 dwords et L&3 octets. Chaque dword est lu puis écrit intégralement ; aucun memcpy/memmove natif, aucune sûreté d'overlap.
3. **Strides/DF.** `ADD EDX,EAX` (0x45BEB0) avance la base destination de L ; `ADD EBX,0x800` (0x45BEB5) avance la source de 2048 octets, soit 1024 mots. Aucun CLD/STD : DF=1 inverse les mouvements internes, pas ces avances de bases ; extraction compacte seulement sous DF=0 et domaine valide.
4. **Garde/polarité.** `TEST ECX,ECX; JZ` (0x45BE97/99) exclut h==0, pas h<=0. `DEC ECX; JNZ` (0x45BEC1/C6) compte modulo 2^32 : h=-1 implique 0xFFFFFFFF tours sans alias/faute ; w=-1 donne L=0xFFFFFFFE et 0x3FFFFFFF dwords par tour. w==0 ne copie rien mais compte ; h==0 n'évite pas les lectures préalables des quatre mots et du second argument.
5. **Pile/retour.** Avec S=ESP d'entrée, `MOV [ESP+0x14],ECX` (0x45BE9D/C2) écrit S+4 et `MOV ECX,[ESP+0x14]` (0x45BEBD) le recharge réellement après copie. Alias possibles sur compteur, sauvegardes, mots d'entrée et RET ; restauration conditionnelle. EBP sert de longueur (`MOV EBP,ECX`, 0x45BEA5), pas de frame pointer ; ABI neutral erroné sur ce point et sur `string_ops:[]`. `B8 01 00 00 00` (0x45BECB/D3) fixe EAX32=1, pas AL ; les deux `C3` ne dépilent aucun argument.
6. **Callers CODE (xrefs réelles du code, parents vérifiés, pas les métadonnées du producteur).** Trois CALL near type 17, `iscode:true` : `0x472A9E` dans le parent `0x472A60`, `0x505D8B` dans `0x505D20`, `0x5393A2` dans `0x5391B0` ; aucun DATA recensé ; parents vérifiés par `get_func` sur chaque xref. Le premier caller écrit quatre mots 512,240,256,16 (0x472A82–97), pousse destination `0x019FD118` puis pointeur (0x472A7C/81), appelle, puis masque 4096 mots par `AND word ptr [EAX],0x7FFF` (0x472AAB–B9). Les deux autres fenêtres poussent destination puis pointeur aux quatre mots, appellent et nettoient 8 octets (`83 C4 08` : 0x505D84–90 ; 0x53939B–A7). Cela corrobore indépendamment rectangle→tampon de mots, pas l'identité VRAM.
7. **Taille/arbre.** IDA frais : un chunk [0x45BE70,0x45BEDA), 106 octets, 42 instructions, zéro CALL sortant, cinq blocs. 42 arêtes internes d'instruction plus deux sorties RET = 44 ; ni 44 instructions ni 44 blocs.
8. **Limite du C.** Le C réconcilié suit ces mécanismes, notamment DF, rechargement du home slot et EAX32. Ses callbacks sont une interface mémoire explicitement non fournie, pas des callees natifs. Modèle RAM plate little-endian, accès réussis ; fautes/états partiels, segments, MMIO, concurrence, atomicité et EFLAGS hors DF exclus. Aucune équivalence backend ni promotion CISO/runtime revendiquée.

## Questions ouvertes

- Quelle preuve indépendante identifie `0x01B47818` comme VRAM ? Quels callers garantissent DF=0, dimensions et bornes valides, buffers sans overlap ? Quel sens contractuel donner au retour constant 1 ? Le caller à constantes positives ne prouve pas les invariants des deux autres.
- Alias pile/structure/source/destination : PUSH peut modifier les mots avant leur lecture ; la copie peut écraser compteur, registres sauvegardés et adresse RET ; conservation des registres, nombre de tours et retour au caller prévu ne sont pas inconditionnels.
- Équivalence CISO/native/runtime non revendiquée ; §5.6 parent natif vert et clôture documentaire bornée seulement.

## Empreintes et références pack

- `semantic_a.md` : `27b655eced58505f7af4b984dc31aebef99000e255d5f31c021d0d60297ba230`
- `semantic_v.md` : `8a47d6529d96afb0426e31835857116e5267807a75573b7f02201897f4c5f751`
- `c_reconciled_sol.c` : `4937e99ec95735f59728289df118319901a562cfda3de21e8fe05a2e3db284ef`
- Octets natifs : `de079e91588b791dd85e6a8a8db7efa0ba38d9f6a2eb967bd8faae29b1dae7bc`
- Pack : `tools/_tmp_semantic_triple/0x45be70/pilot-2026-10-09/` (`c_reconcile_sol.md`, `coverage_reconcile_sol.json`).
- [Doc decomp validé](../decomp/0x45BE70__readbackVramRectToRam.md) embarquant strictement le C, sous les limites explicites de son modèle.
