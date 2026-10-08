# Op178_SetSeqCtxA2 @ 0x8E55E0 — tranchage CONFLICT (2+1 solo réduit)

- Confiance: CERTAIN (tranché contre l'ASM live — réglement CONFLICT)
- Mode: 2+1 réduit solo (A + B non spawnables) : dérivation parent double passe + §5.6 live ; R synthèse = parent
- Verdict CONFLICT : **CONTRE L'ASM** — ce EA n'est PAS un alias/opcode SubmitTIM (0x8E0420) : rôle = écriture `seqCtx+0xA2 = [IP+2]` et avance `IP += 4` (STREAM16 idx 178 @0x1852D60).
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - `8e55e0 mov eax, g_MagVm_IP` ; `8e55e5 mov edx, g_GfCinematic_SequenceCtxPtr`
  - `8e55eb mov cl, [eax+2]` ; `8e55ee mov [edx+0A2h], cl`
  - `8e55f4 mov eax, g_MagVm_IP ; add eax, 4 ; mov g_MagVm_IP, eax` ; `8e5601 retn`
  - byte-identiques: 58 clones famille (34 octets) — diff ASM vs alias 0x8E0420 (SubmitTIM) : this = SetSeqCtxA2
- Notes parent: conflit blacklisté par la divergence nom ; la tranche ASM = rôle unique monotone (pas d'appel, pas d'accès fichier).

## Analyse réconciliée

# Sémantique Op178_SetSeqCtxA2 @ 0x8E55E0

- Rôle (1 phrase) : STREAM16 operation idx 178 — lit le byte `[IP+2]` and stores bytes to `[seqCtx+0xA2]` (mutable sequence context: base index Op6), advances IP of 4 bytes.
- In / Out : no args; execute of interpretations global (`g_MagVm_IP`/`g_GfCinematic_SequenceCtxPtr`).
- Preuves : cf. §5.6 (4 inst. I/O + IP update + retn).
- Question fermée : aliasing avec 0x8E0420 impossible (appel nul de JOB tunes, 8 lecteurs/writers distinct).
