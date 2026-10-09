# moveVramRectToVram @ 0x45BDD0

- Statut : validé par le parent le 2026-10-09 ; récupération historique hors métriques pilote.
- Confiance : LIKELY
- Nom catalogue : trop large ; proposition markdown : `VramShadow_CopyRectAndInvalidateDestination`.
- Mode : 1+V
- A==V : oui (rôle, nom, faits et confiance ; verdict V ACCEPTE).
- Push IDB : oui — append `[semantic-triple 2026-10-09]`, sauvegarde true et relecture exacte par le parent.
- Provenance : A SOL indépendante ; V/R `C10-V-R-SOL` (GPT-6.1 Sol demandé explicitement, pas GLM). Comparaison Flash uniquement en R C ; ni Hex-Rays ni wiki. Override Sol explicitement autorisé par l'utilisateur ; ce n'est pas une exécution GLM ni un écart restant à arbitrer.
- Preuves :
  - `0x45BDD8–0x45BDE3 MOVSX word` : rectangle de quatre mots signés ; trois arguments cdecl confirmés par `0x505DAD CALL / 0x505DB2 ADD ESP,0xC` et xrefs live.
  - `0x45BDF5 SHL 10 / 0x45BDFC LEA ...*2` : même base `0x1B47818`, 1024 mots par ligne ; `0x45BE22/0x45BE2E ADD ...,0x800` : stride de 2048 octets, indépendant de la longueur de copie.
  - `0x45BE2A REP MOVSD / 0x45BE37 REP MOVSB` : snapshot DWORD puis octets ; chevauchement non sécurisé, pas memmove, DF=0 non prouvé.
  - `0x45BE51/0x45BE56 LEA ...-1`, quatre PUSH, `CALL 0x464850`, `ADD ESP,0x10` : notification destination inclusive. Callee `SAR 6/8`, `JG/JLE` signés, stores `0xFFFFFFFF` à `0x4648F4/0x464980` : marquage/invalidation associé, pas upload GPU démontré.
  - `0x45BE03 JZ` seulement pour hauteur zéro ; appel final maintenu. `0x45BE65 MOV EAX,1 / RETN` : retour entier constant normal, pas seulement AL.
  - Hash live `93994b3d9d5d2a739f17ec478b26dc80b2831f134827f14fc205f6cb241d12ca`, 159 octets, 59 instructions, cinq blocs, un chunk `[0x45BDD0,0x45BE6F)`.
- Notes parent : §5.6 parent natif exécuté sur les 59 instructions et cinq blocs complets ; neuf xrefs CODE dont un hors fonction IDA, callee réel 0x464850/quatre arguments et cleanup +10, caller 0x505DAD/trois PUSH/+C, cleanup différé 0x53F457 +10 pour 3+1 mots. Stride 2048, TEST/JZ et DEC/JNZ sans garde de positivité, EAX32=1, copie même base + bornes inclusives donnent deux preuves du nom. C final relu : deux bases avancées avant REP respectives, snapshot DWORD, wrap32 et limites DF/pile/alias ; corrections propagées au bloc C exact. Aucun test runtime ni équivalence ISO hors invariants revendiqués.

## Analyse réconciliée

Copie un rectangle de mots de 16 bits entre deux positions du même tampon à base fixe, puis signale ses bornes inclusives de destination au marquage des structures associées. Le rôle « miroir VRAM / invalidation » reste LIKELY ; le comportement local est directement établi par les opcodes.

ABI : `(rectangle, destination_x, destination_y)` cdecl, paramètres destination de 32 bits. Les quatre champs signés sont lus une fois, dans l'ordre largeur/y/x/hauteur. Le slot natif arg_0 devient le compteur ; le local sauvegarde la largeur. EBX/ESI/EDI préservés ; EBP préservé si utilisé. ECX final reçoit la largeur, ce n'est pas un registre préservé. Les callers retirent les arguments, parfois en lots avec des appels ultérieurs.

Les calculs d'adresses, longueurs, compteurs et bornes wrappent modulo 2³². Le seul test de hauteur est zéro : valeurs négatives possibles, compteurs énormes ; aucune validation/clipping démontré. Hauteur zéro saute la copie mais pas la notification. Le retour du helper est ignoré ; EAX vaut 1 après son retour normal.

Questions ouvertes : DF entrant, taille/allocation et validation du tampon, effets complets de `0x467550`, garanties des callers. Le C sous DF=0 ne couvre ni MMIO, fautes, interruptions, flags ni alias avec la pile CPU. Format couleur et transfert matériel non établis.

Références pack : `semantic_a_sol.md`, `semantic_v_sol.md`, `c_reconcile_notes_sol.md`, `artifact_verify_sol.md`. Le [decomp validé](../decomp/0x45BDD0__moveVramRectToVram.md) embarque strictement `c_reconciled_sol.c` ; sa validation statique ne prouve pas l'équivalence native.
