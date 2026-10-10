# Sémantique candidate P1 — BattleGeom_SetCurrentBoneMatrix @ 0x509B30 (propagation mécanique post-freeze)

- **Rôle (1 phrase)** : deux appels ordonnés capturent huit DWORD par lectures successives dans une banque globale et convertissent neuf demi-mots signés vers float32 divisés par 4096 ; retourne EAX32=7 sur continuation normale avec ABI/frames intacts.
- **Confiance** : LIKELY numérique (mécanisme machine établi dans la chaîne native, sous mémoire/frames/x87 valides et retours ordinaires) ; **UNCERTAIN** pour l'identité métier « bone ».
- **Nom catalogue** : `BattleGeom_SetCurrentBoneMatrix` — trop large pour la preuve autorisée ; « bone » **NON CONFIRMÉ**, sans qu'aucune fausseté soit établie. Proposition descriptive markdown uniquement : `Load8Dwords_Convert9SignedWordsBy4096`. Aucun rename IDB, aucune substitution par retour constant.
- **Provenance** : propagation mécanique déterministe depuis le manifest exclusif `input_manifest.json` (18 fichiers, hashes revérifiés 18/18) ; spec authoritative `parent_postfreeze_context.json`. Aucun nouveau vote, aucun recalcul natif : faits numériques repris du corpus gelé et de l'adjudication R révision 2.

## In / Out / Effets

Un DWORD entrant, capturé une seule fois (`0x509B31 8B742408`, home slot [ESP entrée+4], pas `*arg0`), sert d'adresse p ; lectures p+0…p+0x1C ordonnées et intercalées avec les stores (p+8/p+0xC/p+0x10 après les indices 0/1 ; p+0x1C après l'indice 5). Huit écritures DWORD `[0x1CA927C,0x1CA929C)` ; neuf float32 `[0x1CA9234,0x1CA9258)` avec permutation non triviale ; temporaires dans le second argument du helper (`[ESP_helper+8]`) ; effets ECX/EDX/EFLAGS/x87. Aucune photographie initiale des 32 octets ; ni pureté, ni atomicité, ni non-alias supposés. Sur continuation normale avec slots intacts : ESI entrant restauré, ECX=p (dernier `POP ECX`), EAX32 final = 7 ; premier callee EAX32 = 4. Pas de prototype métier, pas d'équivalence ISO/native/runtime.

## Ancres numériques (preuve du descripteur : stores / conversions)

1. **Stores** : `0x45D7FA 890C857C92CA01` — huit écritures DWORD indexées `[0x1CA927C+4*EAX]`, effectuées avant les gardes, stride 4 (SIB `85`).
2. **Conversions** : table `0x45DB4C` → cases `0x45D817/84E/885/8BC/8F3` ; 2+2+2+2+1 chaînes `MOVSX WORD; FILD DWORD; FMUL [0xB695F8]; FSTP float32` ; constante native `00008039` = 1/4096. Le dixième demi-mot est copié sans conversion — sémantique « padding » non prouvée.
3. **Portage racine** : `0x509B36→0x56BAE0→0x45DE00` et `0x509B3C→0x56BB30→0x45DEF0` portent les huit appels indexés 0..7 au leaf `0x45D7F0` (indice poussé avant valeur, cdecl (valeur, indice), cleanups 40/24 octets ; cleanup racine `ADD ESP,8`). Retours : indice 4 → `0x45D90E C3`, EAX=4 ; indice 7 → `JG 0x45D80A`, `JL 0x45D912`, `JL 0x45DA2F`, `0x45DB48 C3`, EAX=7, aucune réécriture ensuite.

## Statut, baseline et nouveautés

- **Même rôle numérique que les gels A/V corrigés** ; l'inconnu métier n'est pas un nouveau désaccord numérique. Les gels A/V restent la baseline de comparaison.
- **B novel contre BOTH** (chaîne C-review ET gels A/V) : **0 défaut matériel prouvé** ; nouveautés descriptives seulement : permutation explicite des neuf destinations float, représentation flags/état pile (six flags ADD, masque 0x8D5), détail CFG (27 blocs, 15 RET). Pas de claim d'absence exhaustive d'erreurs ; aucune claim littérale « B=0 ».
- **R-only, non attribué à B** : témoins d'alias pile p=S−36 (`0x45DE07 6A00`) et p=S−8 (`0x509B35 56`), sans caller réel observé ; qualification d'exactitude binary32 de x/4096 (65 536 valeurs, zéro écart) — la valeur exacte ne certifie ni l'état x87, ni les exceptions, ni une équivalence de substitution C.
- **Contexte QMD/métier non fourni** : rien n'est inventé — « bone matrix », orthogonalité et usage caméra restent hors preuve.
- Couverture reçue (non recalculée) : racine 9 instructions/22 octets/un chunk, SHA256 `c029df7ea2c29f93f080400654c8937447e4e12192bd1db4f562340cd9b0ed7d` ; profondeur 6 fonctions/241 instructions/1016 octets ; 7 xrefs CODE, 0 DATA. Modèle callbacks C-B distinct des appels natifs ; aucun backend implémenté/validé ; compilation de test et runtime natif non exécutés.
- **Pas de promotion ; §5.6 non clôturé.** Portes restantes au parent : gate de propagation, §5.6, push/commit ; les vérifications natives du parent sont des sondes, pas une clôture.


## Gate parent natif 2026-10-10 — clôture numérique bornée

Append IDB réel via `set_func_cmt` : tag `[semantic-triple 2026-10-10]` unique1,
ancien commentaire non-répétable vide (aucun historique supprimé), save attendu
`D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64` true, readback exact SHA
`6b7b20097012087723f0b510c96d6006d5bdf3c58ca42b8a69d3f684f822dedb`.
Parent a réellement audité les API C-B/sémB historiques, contrairement au
scribe qui ne les avait pas lui-même authentifiées ; la limite de périmètre
numérique demeure. QMD disponible, recherche EA exacte vide : pas de panne
documentaire invoquée pour relever la confiance métier.

Les mentions candidate/pending sont historiques et supersédées par ce gate final. §5.6 parent PASS dans la projection déclarée : 9/9 instructions root,6fonctions241insns/1016bytes rehashées en natif, caller7CODECALL(type17), ancres502222/509A8D. RootCALL56BAE0 puis56BB30 existent, deferredcleanup8/POP_ESI/RET C3. Relais nettoient4 par POP ECX ; deepcall5×2args=40 et3×2args=24octets, index poussé avant valeur. Facteur bank4 bytes et sign-extendedWORD→FILDdword→FMULm32=1/4096→FSTPfloat32, neuf conversions, table5cases dérivée en ASM natif. EAX32 root final7 sur continuation normale avec ABI/frames valides ; firstnativecallee4, pasAL-only ni substitutionreturn7. Root sans setcc/shift/condition. Leafguards JL/JG signed, storebank avantguards, index7→45D90F→45DA2C→45DB48 conserveEAX7. Les reads source sont successifs, pas snapshot mémoire ; p=1CA9278 expose aliasglobal, S-36/S-8 aliasesstack R-only sanscaller réelprouvé. C final fence exact SHA5b6895601f08e3a943e823027e731d2340c7346a6aaff25abecb4b186f68f708, 8/8gels inchangés. Métierbone UNCERTAIN, catalogue trop large/noncertifié mais pas fausseté établie ; nomnumérique proposé prouvé par storesbank et conversions, pas rename. 0défaut matériel inéditB contre BOTHgels, détailsdescriptifs/flags etR-only séparés ; pas absence exhaustive d'erreurs ni certificat infrastructure aveugle universel. No compile/ISO/native/runtime/backend/machine-stack/flags/x87-state equivalence claimed. Probes parent SHA32d2af7fa5b9aec3c6462f8f110ecb9a099a0047e95a6467b91f96b543e54e22 etaf380940f2abdcbc535dc15f7f0c41bf111a1fc4ee937ad61262124944841e3c.
