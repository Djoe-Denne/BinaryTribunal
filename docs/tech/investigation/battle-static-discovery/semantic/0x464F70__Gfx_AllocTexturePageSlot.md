# Gfx_AllocTexturePageSlot @ 0x464F70

- Confiance: **LIKELY — R sémantique historique conservé**, pas un verdict nouveau de C6-C-R-SOL.
- Nom catalogue: **trop large / ambigu** selon R ; proposition markdown seule `Gfx_InitTexturePageSlotAndDrawLists`, catalogue/IDB inchangés.
- Mode: **2+1 sémantique historique**. A CONFLICT avec l'ancien C → V **ESCALADE_2+1** (confiance rôle LIKELY) → B blind → R final LIKELY.
- A==V: pas de contradiction locale démontrée par V ; l'accord ne certifiait pas le C historique.
- Statut: **validé par le parent le 2026-10-09**, récupération hors métriques pilote ; le worker n'a écrit ni IDB ni Git.
- Push IDB: oui — append `[semantic-triple 2026-10-09]` et avenant `[semantic-correction 2026-10-09 C6]`. Première relecture non exacte : ligne nouvelle tronquée à 1024 caractères par IDA, conservée sans réécriture. Supplément multiligne complet `[semantic-correction 2026-10-09 C6-readback]` : sauvegarde true, relecture exacte, tags uniques et préfixes conservés.
- Instr (live): 294/294 ; 18 CFG ; un chunk `[0x464F70,0x46539A)`, 0x42A = 1066 octets, revérifié 2026-10-09.
- Notes parent: trois retours EAX32 **0 / ctx / dixième création**, pas bool/slot/buffer ; arg_24 d'entrée gate vs +58 relu post-helper ; sept args blit, format+44 **valeur** ; dix owners relus ; signed JGE, SAR &31, uint32 wrapping ; x87 contrôle original ; cache `74→B0,7C→B8`. Slot 0x64, contexte 0x44C, branche externe 0x470, WORD MOVSX callers ; pas occupancy 1+2/F_CHAR 0x1D0/slot 0xD0/GF Exists/OT07/AL2/TIM stride 0x10. Aucun latch d'occupation déduit.

## Provenance explicite

Source sémantique finale : [semantic_r_sol.md](../../../../../tools/_tmp_semantic_triple/0x464f70/semantic_r_sol.md), produite le 2026-10-08 après [A](../../../../../tools/_tmp_semantic_triple/0x464f70/semantic_a_sol.md), [V](../../../../../tools/_tmp_semantic_triple/0x464f70/semantic_v_sol.md) et [B aveugle](../../../../../tools/_tmp_semantic_triple/0x464f70/semantic_b_blind_sol.md). Le présent document publie ce résultat historique avec ses limites ; il ne remplace pas le parcours A/V/B/R.

Correction C le 2026-10-09 : **Flash** [c_a_flash.c](../../../../../tools/_tmp_semantic_triple/0x464f70/c_a_flash.c), guidé par R, et **Sol** [c_b_sol.c](../../../../../tools/_tmp_semantic_triple/0x464f70/c_b_sol.c), indépendant/opcodes seuls ([attestation](../../../../../tools/_tmp_semantic_triple/0x464f70/c_b_independence_sol.md)), puis **C6-C-R-SOL**. Les choix sont tranchés contre l'ASM live, pas par vote. Flash contient six sources cache décalées, rejetées ; B conserve correctement ces MOV et l'ordre mémoire. Les deux C ne créent pas un nouveau « 2+1 » sémantique.

[C documenté exact](../decomp/0x464F70__Gfx_AllocTexturePageSlot.md) ; [notes de réconciliation et vérifications](../../../../../tools/_tmp_semantic_triple/0x464f70/c_reconcile_notes_sol.md). Le commentaire IDA ancien de 6473 caractères « fail→0 » est non utilisé comme preuve, non modifié ; avenant parent daté supersédant ce retour uniforme sans effacement historique.

## Analyse réconciliée historique (R)

Rôle cité de R : « Initialise un slot de page texture fourni, prépare son format et ses pixels, extrait éventuellement une région de VRAM logicielle, puis construit dix listes graphiques en cinq paires. »

Qualification métier **LIKELY**, non CERTAIN : chaîne TIM amont, ownership et effets transitifs restent incomplets. « Alloc » ne signifie pas une allocation du slot lui-même : les callers calculent une adresse existante et la cible l'initialise. Les deux preuves indépendantes du nom proposé sont le slot fourni (`0x464C1B`, `0x465F41`) et le clear suivi des dix stores associés (`0x464F97`, `0x465255–0x46538C`). Pas d'exclusivité Battle ni d'API GPU déduite.

### In / Out / Effets

- ABI native : cdecl dix mots `(ctx,slot,x,y,w,h,mode,tpage,arg_20,arg_24)`, RET C3, quatre sauvegardes EBX/EBP/ESI/EDI, 0x8C locaux. `ctx`/`slot` non testés contre zéro ; `arg_20` stocké, rôle opaque.
- Slot : span 0x64 = 100 octets effacé par 25 DWORD (DF clair dans le contrat cdecl ordinaire) ; `+4/+8=x/y`, `+C/+10=w/h`, `+14=mode`, `+18/+1C=réels`, `+20=arg_20`, `+58=pixels d'entrée`. Format demandé au pool : 0xF0 = 240 octets, champ `+54`.
- Buffer partagé `ctx+444` : allocation seulement si champ nul et **mode signé <2** ; mode 0→0x4000, sinon→0x8000, y compris mode négatif. Mode≥2 saute allocation et test d'échec post-allocation.
- Format/pixels : helper `0x463FC0(ctx,slot,mode,w,h)` peut écrire `slot+58` ; retour ignoré. Blit seulement si **arg_24 d'entrée relu ==0**, avec pixels courants post-helper ; quatrième argument = **DWORD format+44**. Sept mots `(sourceVRAM,0x800,pixels,format_value,w,h,mode)`, sans garde supplémentaire inventée.
- Adresse : wrapping 32 bits ; `base + 2*(((((tpage SAR32 4)&1)*256+y)*1024)+(tpage&15)*64+SAR32(x,(2-mode)&31))`. Source pitch 2048 octets = 1024 WORD ; sens VRAM logicielle→pixels selon les preuves callee conservées dans R, non upload GPU démontré.
- Mode exactement 2 : sonde si global B7DB44==-1 ; hit nul laisse -1 ; hit non nul fixe `(hit[+44]==0x7E0)` et copie 0x84 octets. Global exactement 1→quinze stores de layout cache→format : `30→6C,34→70,3C→78,40→7C,44→80,4C→88,50→8C,54→90,5C→98,60→9C,64→A0,6C→A8,70→AC,74→B0,7C→B8` (hex).
- Descripteur local 0x84 ; dix créations types 6/14, cinq paires de filtres 4/4/0/1/3. Stores listes `+24/+28/+2C/+30/+34/+38/+3C/+40/+4C/+50`, pas de store direct à +44/+48. Après la première création : `desc+2C=1`, `desc+30=résultat du helper nested`. Owner `[buffer+A50]` relu dix fois ; pas de succès global/rollback/libération directe.
- **Sortie machine EAX32** : pool nul→**0** ; partagé échoué après relecture→**ctx** ; parcours complet→**dixième création**, éventuellement nulle. Les quatre sites caller observés ignorent ce retour ; ce n'est ni un booléen ni le slot.

### Précisions de modèle, sans changer le rôle historique

FILD m32int→FDIVR m32real→FSTP m32real : les dimensions ne sont pas préarrondies en float32. Le premier FILD précède le clear, le second suit les stores. La formulation historique « division 80 bits/arrondi unique » ne doit **pas** être lue comme garantie de précision indépendante du control word. Le C final expose des primitives x87 sous état/contrôle original, **backend non fourni**, plutôt qu'une division C prétendue byte-exact.

« Argument original » distingue le **slot d'argument d'entrée relu** du champ pixels courant, sans garantir l'immuabilité de la pile en cas d'alias. Les primitives mémoire du C gardent les adresses natives, DWORD non alignés et l'ordre séquentiel des REP ; aucun hoist ou non-alias inventé. Modèle à completion normale, sans export des flags hors DF/exception/fault/EIP final ; pas fonction native autonome ni attestation runtime.

## Preuves structurantes (revérification locale 2026-10-09)

1. **Cible complète / bytes** : lookup par VA puis disasm terminé, 294/294 ; redécodage read-only 1066 octets et 18 blocs ; SHA-256 live = dump pack `04ec8ffc088dc8220f4ccc82ed7bb6a3ed716c67059e882687d46b6ab4b56d10`. Aucun chunk omis.
2. **Slot fourni / strides** : World entier relu, `0x464C1B LEA [ESI+EDI+4]`, `0x464CF2 ADD EDI,64`, `0x464D04 ADD ESI,44C`, autre branche `0x464D8E ADD ESI,470` ; sélecteur `0x465F28/33/41` ×5×5×4. WORD `MOVSX` à `0x465F3A/46/4D/56`.
3. **ABI/callers** : quatre xrefs CODE natifs `0x464C23/0x464CBD/0x464D71/0x465F61`, dix PUSH et cleanup +28. Retours ignorés/écrasés ; `0x464C28 MOV EAX,[ESI]` précède le TEST/JG, `0x465F6D MOV EAX,1`.
4. **Trois EAX** : pool TEST/JZ `0x465030/32` ; partagé **MOV EAX=ctx** `0x465088`, TEST **ECX** `0x465095`, JZ `0x465097` ; dixième CALL `0x465384`, store +50 `0x46538C`, épilogue sans EAX.
5. **Pixels/blit** : callee relu `0x46412F CALL pool`, **`0x464139 MOV [EBX+58],EAX`** ; cible `0x4651DC` arg_24, `0x4651FE` +58 post-helper, `0x4651FA` format+44 valeur, CALL `0x465235`, cleanup +1C.
6. **Signedness/x87** : `0x46504C JGE` signé ; `0x46521A SAR EAX,CL`, ADD/SHL/LEA 32 bits ; FILD/FDIVR/FSTP `0x464F76/87/FD5` et `0x464FD8/DF/FE5`, constante live 0000803F.
7. **Cache** : SETZ CL `0x465104` après XOR ECX ; REP MOVSD `0x465117`, ECX=21 ; MOV chain `0x465176–0x4651D6` confirme les six sources contestées et **74→B0 / 7C→B8**. R/B corrects, Flash incorrect sur +90..+AC.
8. **Listes/owners** : dix CALL 416D82, dix MOV `[EBP+A50]` aux sites `0x46523D/269/28F/2AC/2D2/2E9/315/32F/355/372`. Setters `0x407083/0x4070BF` confirment filtre +20. Callback `0x41E646 CALL [EDX+48]` relu, non preuve de mutation mais aucune pureté établie. Nettoyages différés +48/+44/+4C/+14 conservés dans le C.

## §5.6 et limites de publication

Contraintes R structurantes vérifiées ; **pas de nouvelle ESCALADE**, statut métier LIKELY historique conservé. Parent a relu les 294 instructions natives et le C final, contrôlé 18 CFG/chunk/hash, dix callees/23 CALL, quatre xrefs CODE/deux callers, dix mots/cleanup +28, nettoyages groupés +48/+44/+4C/+14, strides 100/1100/1136, JGE signé, SETZ, SAR masqué et EAX32 sur trois chemins. Slot fourni + dix listes donnent deux preuves du nom proposé. Les quinze mappings cache (dont six sources Flash rejetées), dix reloads owner et ordre lecture owner avant store +34, gating arg_24/reload +58 et sept mots blit sont présents dans **fichier final réel**, bloc C exact. Pas de SetType/rename ni validation runtime ; backend mémoire/calls/x87 non fourni.

Pack préexistant complet, bytes toujours frais, pas de stub Hex-Rays missing-addr ni troncature ASM. Callgraph MCP brut **TRUNCATED**, profondeur 2 bornée ; pas d'exhaustivité transitive. GrepAI du pack sans relations, couverture de trace non résolue ; pas de relance hors périmètre. Aucune nouvelle inspection PE disque, ni compilation/test runtime ; contrôle de transcription final vs B distinct d'une preuve d'équivalence machine.

Questions ouvertes de R conservées : ownership/libération, aliasing/nullité, pixels nuls après échec ignoré, modes/dimensions invalides, wrap tailles/adresses, callbacks/thread-safety, sens `arg_20`, identité 0x7E0 et chaîne TIM amont. Rien d'atomique : effets partiels conservés. Aucun ajout de guard/rollback ni appel bibliothèque inventé. Aucun quota/refus/SQLite OOM rencontré ; IDB et Git non écrits.
