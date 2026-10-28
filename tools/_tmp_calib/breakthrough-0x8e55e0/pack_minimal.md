# Pack minimal read-only — 0x8E55E0

Collecte 2026-10-02, MCP ida-pro-mcp, IDB live. Aucune écriture IDB, aucun git, aucune exécution du jeu.
Glob `tools/_tmp_semantic_triple/0x8e55e0/**` : aucun fichier. Les sorties A/V/B/R originales ne sont donc pas disponibles dans ce pack.

## lookup_funcs / meta

- VA : 0x8E55E0 ; nom : Op178_SetSeqCtxA2 ; taille : 0x22 ; fin exclusive : 0x8E5602.
- 8 instructions, disasm intégral ci-dessous, commentaires IDA exclus.
- `idc.get_type` : `int()` ; métadonnée héritée, non-preuve d'un retour C exploité.
- Entrée IDB : `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`.
- `callees` : [] ; more=false.
- `xrefs_to(0x8E55E0)` : [] ; more=false. Ne signifie pas absence d'appels indirects.

## ASM et octets lus

```asm
008E55E0 A1 50 74 79 02       mov eax, [02797450h]
008E55E5 8B 15 EC 73 79 02    mov edx, [027973ECh]
008E55EB 8A 48 02             mov cl, [eax+2]
008E55EE 88 8A A2 00 00 00    mov [edx+0A2h], cl
008E55F4 A1 50 74 79 02       mov eax, [02797450h]
008E55F9 83 C0 04             add eax, 4
008E55FC A3 50 74 79 02       mov [02797450h], eax
008E5601 C3                   retn
```

## Résolution indirecte (py_eval lecture)

- Table 0x1852A98, nom `funcs_8E96EC`.
- DWORD[0x1852AB0] = 0x8E54A0 : index 6.
- DWORD[0x1852B5C] = 0x8E0420 : index 49.
- DWORD[0x1852D60] = 0x8E55E0 : index 178.
- Xrefs vers base table : 0x8E96EC, 0x8E9710, 0x8E9AFF, 0x8E9B23 (type 3).
- Callers : `MAG_331_PassIfIPNegative` 0x8E9630 ; `MAG_331_PassIfIPPositive` 0x8E9A50.
- 0x8E96E0 `movsx eax,word ptr [edi]` ; 0x8E96E3 `mov [ecx+4Ah],ax` ; 0x8E96E7 `and eax,1FFh` ; 0x8E96EC `call funcs_8E96EC[eax*4]`.
- Même chaîne 0x8E9AF3/0x8E9AF6/0x8E9AFA/0x8E9AFF ; boucles équivalentes 0x8E96FF–0x8E9710 et 0x8E9B12–0x8E9B23.
- Après appel : lecture runtime slot puis comparaison `[slot+3Eh]` ; EAX ensuite rechargé depuis IP, retour non exploité sur ces chemins.

## Consommateur A2 : Op6_QueueChunk

- 0x8E54BA `mov ebx,[027973ECh]`.
- 0x8E54FB `xor ecx,ecx` ; 0x8E54FD `mov cl,[ebx+0A2h]` ; 0x8E5503 `add eax,ecx`.
- 0x8E5505 `mov g_MagicFileChunkTable[eax*4],esi`.
- 0x8E550C `movsx edx,word ptr [ebx+0A0h]` ; 0x8E5513 `add eax,edx`.
- 0x8E5515 `push offset sub_8E55D0` ; 0x8E551A `push 0` ; 0x8E551C `and eax,0FFFFh` ; 0x8E5521 `push esi` ; 0x8E5522 `push eax` ; 0x8E5529 `call BattleFile_preLoad` ; 0x8E5533 `add esp,10h`.
- Observation locale : A2 est un biais unsigned d'index, pas une preuve de borne universelle ni de tous ses usages.

## Contraste 0x8E0420

29 instructions : 0x8E0439 `call sub_8E05D0`, 0x8E0462 `call BdTransSummonStream`, 0x8E046F `add eax,2`, branche busy à 0x8E0427. Corps distinct du setter sans CALL.

## Sources documentaires consultées

- `docs/tech/investigation/battle-static-discovery/semantic-certainty.md:553` : CONFLICT, « divergence notée parent ».
- `docs/tech/investigation/battle-static-discovery/decomp/0x8E55E0__Op178_SetSeqCtxA2.md` : A==B non (ligne 8), notes parent ligne 11, C réconcilié lignes 31–43.
- QMD CLI collection ff8-wiki, lectures complètes : `#6a1328` battle-address-catalog, notamment lignes 145, 248–256 ; `#4caff1` gf-asset-loading-and-authoring, ligne 111. Recherche exacte 8E55E0 sans résultat, recherches SetSeqCtxA2/STREAM16 fructueuses.
- Aucune vérification des 58 clones ni des valeurs runtime revendiquées par les documents.
