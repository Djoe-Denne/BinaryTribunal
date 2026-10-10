# Sémantique fn_0x45E5C0 @ 0x0045E5C0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Efface un DWORD avant de lire un facteur WORD signé, multiplie celui-ci par la somme des 16 bits bas de trois DWORD, tronque le produit à 32 bits, applique SHR 12 et écrit puis retourne le même entier.
- Confiance : LIKELY — mécanique établie ; identité métier et convention appelante non établies.
- Nom catalogue : confirme la proposition numérique `U16Sum3_MulS16_Wrap32_Shr12_Store2`, re-dérivée des charges/masques et du couple IMUL/SHR/stores ; aucun nom catalogue/IDA consulté.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0. Les deux cibles voisines citées par A concernent les trois fenêtres avec cleanup, pas l'ensemble des fenêtres.
- Preuves (7) :
  1. `0x0045E5C0/C5/CB`, `A1`/`8B 0D`/`8B 15` : charges DWORD absolues à `0x01CA8A5C/58/54`. `0x0045E5D1/D6/DC`, `25`/`81 E1`/`81 E2` avec `FFFF0000`, puis `03 C1` et `03 C2` : somme des trois valeurs unsigned masquées, bornée à 196605.
  2. `0x0045E5E4`, `C7 05 F892CA01 00000000` : zéro DWORD à `0x01CA92F8` avant `0x0045E5EE`, `0F BF 0D F092CA01` : charge WORD signée vers ECX. Cet effacement mémoire n'est pas celui d'EFLAGS.
  3. `0x0045E5F7`, `0F AF C1`, puis `0x0045E5FA`, `C1 E8 0C` : produit modulo 2^32 suivi d'un décalage logique, non SAR ; résultat dans `[0,0xFFFFF]`. Somme 1, facteur -1 donnent `0xFFFFF`, réfutant une division signée ou un BOOL.
  4. `0x0045E5FD`, `A3 2C8ACA01`, puis `0x0045E602`, `A3 708ACA01` : même EAX entier écrit dans deux DWORD, dans cet ordre ; `0x0045E607`, `C3`, le laisse au retour. Aucun accès aux arguments entrants, CALL, branche, saturation ou RET imm16 sur les 15 instructions/72 octets contigus, un bloc ; hash natif recomposé conforme.
  5. Graphe parcouru : 544 xrefs CODE distinctes, 544 fenêtres/4896 entrées hex, longueurs cohérentes. Toutes omettent call-site+5 ; 1088 trous internes après-appel. `0x00570478/0x00653B7A/0x00653CAA`, `83 C4 10`, sont tardifs : impossible de prouver une absence de cleanup immédiat ou une convention exclusivement cdecl.
  6. `0x0057045D`, `E8 0EDEEEFF`, cible `0x0045E270` ; `0x00653B66/0x00653C96`, `E8 45A6E0FF`/`E8 15A5E0FF`, ciblent `0x0045E1B0`. Les PUSH voisins ne prouvent pas les arguments de notre fonction. Les 607 CALL E8 présents dans toutes les fenêtres ont leurs cibles numériques recalculées ; aucun n'est un callee interne de ce corps.
  7. C accepté vérifié : multiplication unsigned, extension du short, SHR et ordre effacement → lecture facteur → deux stores concordent avec ces opcodes sous hypothèses u32/i32/s16, RAM ordinaire, cadres privés et mapping exact. Ces hypothèses restent des conditions, non des faits prouvés ; le `__cdecl` du C et les affirmations ABI du pack ne sont pas des preuves de convention native exclusive.
- Questions ouvertes : Instructions manquantes des fenêtres, convention appelante, identité des adresses, largeurs/représentation C et mapping backend ; effets EFLAGS/MMIO/concurrence. Aucune preuve ISO, compilation ou exécution native produite.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `Gte_AVSZ3` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 15 EA / 72 octets, SHA-256 `b2f29fe85378b6409ab3f812e8c4189a407f4c7bb68420eb57e615a436458d74`.
- C relu exact : `b4afbd6cc0e4b3454d294f284b1636fb5be827644048e4e1013e8cfc27327aa0` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x45e5c0/native-2026-10-10/parent_drain_gate.json`, SHA `314452dcf3f1694a09edcee8ac99a1bc525786b7bc67f69214aa623d9e1702bf`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda58e990ffeKEnYtNGRMrygE5` ; V `ses_eda4fcdc8ffew5BMfq6Bz2jx6L`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:14.177604+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x45e5c0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `6a2aed0a9c9b4f17237f6906a63e53a3a727e87486815745e7e0e7760f2e1385`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: No array stride; three literal DWORD inputs masked16, two literal DWORD outputs.
- polarity: No Jcc/setcc; signed WORD via MOVSX, low32 IMUL then LOGICAL SHR12, not SAR.
- return: Computed full EAX after SHR12 stored twice, remains through C3; no AL-only result.
- name: Gte/ISA identity NOT_CONFIRMED; numeric sum3U16 timesS16/SHR12 and two stores prove only provisional role.

### Erratum de sérialisation Git — C inchangé

La source C byte-exacte est conservée dans le carrier Base64 du [decomp](../decomp/0x45E5C0__Gte_AVSZ3.md) : 695 octets, SHA-256 `b4afbd6cc0e4b3454d294f284b1636fb5be827644048e4e1013e8cfc27327aa0`. Le fence C rendu peut être normalisé LF par Git ; la présente correction supersède sa qualification antérieure de byte-exactitude. Source, algorithme, confiance, gate ASM, append/save/readback inchangés. Réparation documentaire ≠ nouvelle clôture ; aucun nouveau push IDB.
