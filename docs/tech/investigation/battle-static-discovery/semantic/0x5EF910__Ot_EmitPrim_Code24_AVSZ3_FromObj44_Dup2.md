# Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2 @ 0x5EF910

- Confiance: CERTAIN (solo parent : classe par diff ASM vs rep complet 0x595AA0, corps 100 % identique)
- Nom catalogue: IDA conservé ; famille `Ot_EmitTriPacket_AVSZ3*` (rep : Ot_EmitTriPacket_AVSZ3_FromObj44)
- Mode: 1+P-diff (clone ; §5.6 live)
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - Diff ASM corps vs rep 0x595AA0 : 100 % des instructions identiques (seules les étiquettes locales des paramètres IDA diffèrent : p_v0/p_v1/p_v2/p_obj → arg_4/arg_8/arg_C/arg_0)
  - Même chaîne de callees, en-tête `dword[esi]=0x07000000`, `or … 24000000h`, stride `add esi,20h`, cleanup `add esp,24h`
  - curseur [obj+44h], slot OT [obj+3Ch]/[obj+40h]/[obj+50h]
- Notes parent: diff confirmée par pack asm — toutes les instructions du corps sont identiques à celles du rep.

## Analyse réconciliée

# Sémantique Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup2 @ 0x5EF910 (clone diff de 0x595AA0)

- Rôle (1 phrase) : clone exact de Ot_EmitTriPacket_AVSZ3_FromObj44 (0x595AA0) — même émetteur de paquet triangle 32 octets avec profondeur AVSZ3 ; preuves détaillées dans le livrable du rep.
- Confiance : CERTAIN (classe diff ; sens porté par le rep, LIKELY sur la formule du slot OT)
- In / Out / Effets : cdecl, 4 args (p_v0, p_v1, p_v2, p_obj), caller cleanup via `add esp,24h` ; retour non défini par l'ASM (EAX hérité de l'allocateur).

## Avenant 2026-10-09 — DRAFT (correction C indépendante, pas nouveau vote)

Corps C final corrigé dans le livrable decomp homonyme (relecture Sol, verdict CORRIGE ; premier fence remplacé par copie exacte, SHA256 `88bb07d71e8510938155cdfe8ad7f6d2183b995896b2534441a42c776d0dbb64`). Faits machine corrigés : ordre d'entrée cdecl (obj, v0, v1, v2) — la vieille prose « p_v0, p_v1, p_v2, p_obj » (obj en dernier) est corrigée par ces nouveaux faits — et sortie EAX32 héritée de l'allocateur, définie par la machine (aucune instruction après l'allocateur ne modifie EAX), ce qui corrige la prose « retour non défini par l'ASM » ci-dessus. Correction C indépendante : ce n'est pas un nouveau vote s1+P-diff ni une re-classe ; histoire et confiance inchangées ; re-review et §5.6 parent restent pending. Pas de claim d'équivalence native/ISO, pas de promotion.

### Validation parent 2026-10-09 — supersession du statut DRAFT

Re-review C Sol indépendante ACCEPTE, puis parent §5.6 natif complet : 56 instructions/un bloc/chunk, SHA `ef66cb1673c44b0666d3e0315e476b7d6b3027c474015ce5cbadaadee37e2b36`, six destinations CALL réellement présentes, cinq xrefs CODE/deux callers, quatre args `(obj,v0,v1,v2)`/+16, neuf mots groupés/+36, paquet stride 32, SAR signé count&31 et EAX32 non modifié après allocateur. Tag paquet 0x24 + AVSZ3/link justifient famille par deux ancres indépendantes. Le `add esp,24h` historique est cleanup des appels **internes**, pas celui des quatre arguments d'entrée. C final exact/relectures/ordre mémoire/provenance contrôlés ; classe diff historique conservée. Append `[semantic-correction 2026-10-09 A10]`, sauvegarde true et relecture exacte, anciens commentaires préservés. Correction documentaire close **sous contrat explicite**, pas preuve de backend fourni, de nonalias réel ou d'équivalence native/ISO ; pas nouvelle clôture pilote.
