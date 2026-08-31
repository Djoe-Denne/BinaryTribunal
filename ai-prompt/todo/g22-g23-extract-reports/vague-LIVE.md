# Rapport vague LIVE

```text
Vague : LIVE
Date : 2026-08-31
Agent / outil : Cursor Grok 4.6
Rail : C-live
G23 core/ commencé : non
Live lancé : non
satisfied proposé : false
Lignes REGISTER touchées : L-PROMO P-SAT
```

## Live (carte pour l’opérateur)

- EXE SHA-256 attendu : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- DLL : **nouvelle** build `ff8_battle_iso` (pas v1 `14cd2bbf` / v15 `d901a8c2` / v16 `5d5f5c61`).
- PID : (à remplir après attach)
- Enveloppes L22-A/B/C : à hasher après pack
- `refused_mask` ordinary **prédit : 32** (`InitialEnqueue` seulement) si party/kernel/DAT/config host OK.
- `refused_mask==0` : **interdit** sans consommateur `special_id=0` fermé.
- restore_hash == preimage_hash : à constater
- native_helper_calls / imported_post_init : 0
- Safety rouge : aucun attendu si allowlist inchangée (pas d’écriture `BATTLE_DEAD_TIMER`)

## Pour le chat parent

Ne pas flipper `[promotion.G22].satisfied`. G23 `core/` reste interdit tant que P-SAT n’est pas tranché. Recommandation : **rester fail-closed** sur le bit 32 ; live promo = preuve `mask==32` + restore, pas `mask==0`.
