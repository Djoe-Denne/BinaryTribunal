# Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup @ 0x5BD460

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

# Sémantique Ot_EmitPrim_Code24_AVSZ3_FromObj44_Dup @ 0x5BD460 (clone diff de 0x595AA0)

- Rôle (1 phrase) : clone exact de Ot_EmitTriPacket_AVSZ3_FromObj44 (0x595AA0) — même émetteur de paquet triangle 32 octets avec profondeur AVSZ3 ; preuves détaillées dans le livrable du rep.
- Confiance : CERTAIN (classe diff ; sens porté par le rep, LIKELY sur la formule du slot OT)
- In / Out / Effets : cdecl, 4 args (p_v0, p_v1, p_v2, p_obj), caller cleanup via `add esp,24h` ; retour non défini par l'ASM (EAX hérité de l'allocateur).

## Avenant correction C 2026-10-09 — DRAFT

### Validation parent 2026-10-09 — supersession du statut DRAFT

Reviews Sol du C conditionnel, embedding et prose finales acceptées ; §5.6 parent natif complet56instructions/un bloc/chunk, SHA `2113d6df7227337be647186f558f1cbf056b7915ed783e2848c3eb2be6dc5517`. Six callees présents, cinq xrefs CODE/trois callers, quatre args objpremier/+16 (le +36 historique est cleanup **interne** neuf mots), stride paquet32, SARsigned count&31 et EAX32 allocateur contrôlés ; tag0x24+AVSZ3/link donnent deux preuves nom/famille. Captures DWORD/WORD et reloadhome natif effectivement dans C final, raw fence exactsource4550octets. Classe diff historique conservée ; correction hors pilote, pas nouveau vote. Append `[semantic-correction 2026-10-09 A8]`, sauvegarde true et relecture exacte, ancien préfixe préservé. Les états DRAFT en provenance suivants sont historiques ; attentes de review/gate levées, **pas les limites de pile/alias/frame/CISO/native non prouvées**.

Correction C indépendante (review Sol, statut CORRIGÉ) propagée dans le livrable decomp homonyme ; elle n'est pas un nouveau vote et laisse inchangés le mode 1+P-diff, l'histoire et la confiance ci-dessus. Faits machine : l'ordre d'entrée des paramètres est (obj, v0, v1, v2) et la sortie est EAX 32 bits hérité de l'allocateur — deux comportements définis machine ; ces nouveaux faits corrigent la vieille prose « p_obj en dernier argument » et « retour non défini par l'ASM ». Pas de claim d'équivalence native ni ISO, pas de promotion ; re-review et §5.6 parent pending.
