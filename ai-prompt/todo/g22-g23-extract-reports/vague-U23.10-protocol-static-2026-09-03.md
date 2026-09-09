# Rapport U23.10 protocole — `g23-battle-end-v1` offline 2026-09-03

```text
Vague : U23.10-protocol
Date : 2026-09-03
Agent / outil : Cursor Grok 4.6
Rail : P-G23
G23 core/ commencé : déjà (U23.1–U23.9)
satisfied proposé : false
```

## Contrat

Protocole runtime offline seulement. Schéma **28**, snapshot **4856**,
témoin **256 o** `[4600:4856]`, bit `1u << 23`, evidence kind **35**,
protocole **v1**. G22 reste scellé `[4344:4600]` ; les enveloppes
historiques 4600 / schémas 26–27 restent décodables.

Le profil payload **P3** est un candidat de test, pas une promotion.
`[promotion.G23].satisfied` reste `false`. `[P3.G23]` = `offline-protocol`.
Allowlist live vide. Aucune write persist hôte.

## Implémentation

- ABI `FF8IsoG23BattleEndWitness` + append snapshot.
- `observe_g23_scenario` / `fill_g23_witness` : domaine core/application
  seulement ; `fill` ne stampe pas `armed=1` ni `native_helper_calls=0`.
- Suite runner : allowlist vide, evidence kind 35, profil attendu P3.
- Payload `--group G23` défaut P3 ; refuse P0/P1/P2 ; `--g23-family`
  uniquement pour scenario 8.
- Collecteur + schéma JSON + `validate_evidence_envelope`.
- Ownership / evidence-policy : promotion G23 unsatisfied.

## Hors ownership

- Filtre live-necessity et campagne FF8.
- L-FAM5 / L-DELTA / L-PHXW.
- Menu XP/GF, result 5 supporté, writes persist hôtes.
- `[promotion.G23].satisfied = true` et claim P3.
