# Sémantique numérique 0x0045EE10 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le mien) : Lit trois DWORD packed, en extrait six signed16, écrit la somme modulo 2^32 de trois produits de différences puis un DWORD nul, et laisse le troisième produit entier dans EAX.
- Confiance : LIKELY — calcul et effets machine établis ; identité métier et prototypes source non établis.
- Nom catalogue : confirme uniquement le descriptif provisoire `PackedS16Triple_StoreCrossSum32_ClearWord_ReturnThirdTerm`, re-dérivé des extractions, produits et destinations ; « ClearWord » désigne ici explicitement un DWORD. Aucun nom IDA/catalogue consulté ni validé.
- Désaccords avec A : 0. Les tentatives de réfutation sur signedness, polarité, retour, ordre mémoire et ABI ne révèlent aucune divergence.
- Preuves (8) :
  1. **0x45EE10/15/1B — MOV R32** : lectures à 0x01CA8A40/44/48, stride 4, toutes avant le premier PUSH et les stores. Les octets recomposés couvrent 36 instructions contiguës, 98 octets, SHA256 `f7c8a3fa14338bf8eebd44ebea749fac350348c02efb5c0b4709f5f447f7ff03`.
  2. **0x45EE27/32/38 — SAR 16 ; 35/42, 45/4E, 3B/4B — SHL/SAR 16** : hauts et bas deviennent signés, pas unsigned. Avec xi=sext16(bas Pi), yi=sext16(haut Pi), chacun est dans [-32768,32767].
  3. **0x45EE3E/40/54 — SUB ; 51/48/58 — IMUL** : EBP reçoit T0=(y0-y1)*x2, ECX T1=(y1-y2)*x0, EAX T2=(y2-y0)*x1. Chaque produit est représentable S32 : |Ti|≤2147450880. La polarité est confirmée depuis les registres, non depuis A.
  4. **0x45EE56/5B — ADD EBP ; 5E — MOV [0x01CA8A70],EBP** : stockage u32(T0+T1+T2). Aucune écriture EAX après IMUL à 58 : EAX entier reste T2, jamais la somme ni seulement AL. ECX=T1, EDX=x2.
  5. **0x45EE66 — C7 05, MOV DWORD [0x01CA92F8],0** : deuxième store, après celui de la somme ; zéro mémoire, pas remise à zéro d'EFLAGS. MOV/POP/RET ne changent pas les flags laissés par ADD à 5B. L'identité métier du DWORD n'est pas prouvée.
  6. **0x45EE21/22/23/26 — PUSH ; 5D/64/65/70 — POP ; 71 — RET C3** : sauvegarde/restauration de quatre registres, 16 octets, ESP rétabli avant RET ; EBP sert de scratch. Aucun argument natif lu, aucun CALL/branche interne. Compatible zéro argument/cdecl, non exclusif ; frsize=16 n'ajoute pas une allocation locale démontrée.
  7. **0x533ADD — CALL E8 ; 0x7865D2 — CALL E8** : contrôle numérique de tous les 1200 sites uniques CODE type 17 et de leurs CALL directs vers 0x45EE10. À 533AD8, un autre CALL intervient après les PUSH ; à 533AE2, LEA écrase EAX. Les PUSH et usages du retour ne définissent donc pas automatiquement le prototype cible. 14 sites sans frame ; graphe entrant depth=2/max_nodes=64, 1744 arêtes, TRUNCATED=true : racine complète du gel, ascendance bornée.
  8. **0x45EE40/48, 3E/51, 54/58, 56/5B/5E/66 — comparaison au C autorisé** : extraction unsigned puis sext représentable, différences/produits élargis en int64, somme bornée conservativement à 6442352640 puis conversion uint32 définie modulo 2^32, retour T2 représentable int32. Hash C vérifié `7317516b606d94f9fc6bf108d584c28b4778a95278554104cad165fcb0409cf9` ; projection mathématique seulement, aucune preuve compilée/runtime.
- Questions ouvertes : Rôle métier, types/prototypes source, garanties tous chemins des callers et ascendance tronquée ; liaison/adressage backend, transactions DWORD, alias avec la pile, concurrence et fautes. Modèle RAM distincte/pile privée/sans interférence ; aucune équivalence native runtime ou ISO démontrée. Aucun motif d'escalade numérique constaté.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `Gte_NCLIP` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 36 EA / 98 octets, SHA-256 `f7c8a3fa14338bf8eebd44ebea749fac350348c02efb5c0b4709f5f447f7ff03`.
- C relu exact : `7317516b606d94f9fc6bf108d584c28b4778a95278554104cad165fcb0409cf9` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x45ee10/native-2026-10-10/parent_drain_gate.json`, SHA `23cb118f952d796d22a866b454315c025fb7864177822d3f3fb55b259895e02a`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda58a9d8ffe054VCuL1ZwFW9L` ; V `ses_eda4f7ee2ffeyjQ27JKQ8iaQt4`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:14.577950+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x45ee10/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `e9c53566c3802bab5b9cc0707a6a405b97804f4e228663d0e9fccdaa854676b1`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: Three packed DWORDs; shifts16 extract signed16 coordinates. No232/464stride.
- polarity: No Jcc/setcc; signed extraction SAR16; products and accumulated stored sum modulo32.
- return: Full EAX third product, NOT accumulated DWORD sum in EBP. C3 follows store-zero/POP, no EAX rewrite.
- name: Gte/NCLIP identity NOT_CONFIRMED; packed signed16 extractions and cyclic difference products prove numeric role. ClearWord label means DWORD, explicitly disambiguated.
