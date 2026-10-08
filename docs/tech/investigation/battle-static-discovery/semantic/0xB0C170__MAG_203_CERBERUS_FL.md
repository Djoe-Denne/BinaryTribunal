# MAG_203_CERBERUS_FL @ 0xB0C170 — tranchage CONFLICT (2+1 solo réduit)

- Confiance: CERTAIN (tranché contre l'ASM live)
- Mode: 2+1 réduit solo (A+B non spawnables) : dérivation parent + §5.6 live ; R synthèse = parent
- Verdict CONFLICT : **CONTRE L'ASM** — nom FL (félévation hétérogène) infirmé : init = **préchargement MAGIC de 2 fichiers mag202_b**, aucun effet FL/magic dédié. mag202/203 (CERBERUS) diverges dans le stockage de 2 globals.
- Push IDB: oui, [semantic-triple 2026-10-08], pas de rename
- Preuves §5.6 parent (live IDB 2026-10-08):
  - `b0c170 push offset aMag202B00 ("mag202_b.00")` ; `b0c175 call IO_GetFile_MAGIC` → `dword_2796DDC`
  - `b0c17a push offset aMag202B01 ("mag202_b.01")` ; `b0c184 call IO_GetFile_MAGIC` → `dword_2796DD8`
  - `b0c189 add esp, 8` (2 args earns cdecl) ; `b0c191 retn` ; **void** semantics (pas de retour analysé)
- Notes parent: mag202/mag203 CERBERUS = nombreux globaux : (dword_2796DDC = file .00 pointer ; dword_2796DD8 = .01) — loader d'images magiques.

## Analyse réconciliée

# Sémantique MAG_203_CERBERUS_FL @ 0xB0C170

- Rôle (1 phrase) : loader d'init d'images magique CERBERUS mag203 (mag202 two files) : lit les fichiers "mag202_b.00" et "mag202_b.01" via `IO_GetFile_MAGIC`, store les handlers dans `dword_2796DDC` et `dword_2796DD8`.
- In / Out : cdecl void, none ; globals efet de bord.
- Preuves : cf. §5.6 (2 push + 2 calls + stores + add esp,8 + retn).
- Question fermée : nom FL hétérogène non-substantiel ; assembler alternative `MAG_203_CERBERUS_LoadAssets` probable.
