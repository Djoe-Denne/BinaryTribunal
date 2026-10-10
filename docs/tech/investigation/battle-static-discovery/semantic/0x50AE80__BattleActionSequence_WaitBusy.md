# Sémantique sub_50AE80 @ 0x50AE80 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Prédicat retournant EAX=1 lorsqu'une paire de DWORD sélectionnée par le masque `0x02` diffère dans un parcours borné de sept entrées, ou qu'une des trois lectures globales ordonnées atteintes est non nulle, sinon EAX=0.
- Confiance : LIKELY, comme A ; mécanisme certain sur les octets fournis, identité métier inconnue.
- Nom catalogue : confirme uniquement la proposition numérique provisoire de A ; aucun nom historique évalué. Dérivation propre : `AnyMaskedPairMismatchOrGlobalNonzero`, fondée sur le branchement d'inégalité et les gates globales, sans attribution métier.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0. Les attaques sur la polarité, les largeurs, le nombre d'entrées, l'ABI et les limites du C ne réfutent pas A.
- Preuves (6) :
  1. `0x50AE88–94`, `844898 / 7409 / 8B50FC / 8B30 / 3BD6 / 7529` : masque BYTE `0x02`, saut des DWORD si absent, lecture gauche puis droite, sortie 1 sur **inégalité**, jamais sur égalité.
  2. `0x50AE81`, `B82873D901`, puis `0x50AE96–A0`, `059C000000 / 3D6C77D901 / 7CE6` : curseur initial `0x01D97328`, stride 156, **JL signé**, exactement sept passages au maximum avant `0x01D9776C`. Aucun type de slot n'en découle.
  3. `0x50AEA2–B2`, `A1AC6AD901 / 85C0 / 7514`, puis `A01877D901 / 84C0 / 750B` : DWORD `0x01D96AAC`, puis BYTE `0x01D97718`, court-circuités dans cet ordre. `0x50AEB4`, `E8D762FFFF`, cible recalculée `0x501190` ; ses octets `A1B86DD901 C3` lisent le troisième DWORD, `0x01D96DB8`.
  4. `0x50AEB9–C5`, `85C0 / 7502 / 5E C3` et `B801000000 / 5E C3` : retour normal **EAX entier** exactement 0 ou 1 ; la lecture AL intermédiaire ne définit pas un retour AL-only. `56` à l'entrée et les deux `5E` restaurent ESI, sans argument entrant consommé ; zéro argument ne distingue pas cdecl de stdcall.
  5. Huit cibles CALL recalculées depuis leurs octets : `0x50AC98`, `0x50B0DD`, `0x50B253`, `0x50B4E9`, `0x50B9B9`, `0x50BCBE`, `0x50BE14`, `0x50BF1C`. Chacune vise `0x50AE80` et est suivie de `85C0`, puis JZ/JNZ confirmé. Ces fenêtres prouvent la consommation EAX zéro/non-zéro, pas les chemins complets ni un prototype void.
  6. Redécodage indépendant des **26 instructions / 70 octets**, hash vérifié ; les destinations et fallthroughs reconstruisent **9 blocs / 13 arcs**, tous conformes au graphe. Le C conserve les gates sous bindings SourceC32, mais son accès global déclaré 32 bits puis tronqué, ses objets/pointeurs et l'ordre d'évaluation des DWORD ne certifient ni les accès natifs ni un backend compilé ; A le signale correctement.
- Questions ouvertes : Identité métier ; bindings, objets valides, aliasing et pile privée ; ABI externe exacte, concurrence et runtime. Aucun de ces inconnus n'est promu en fait. La confirmation nominale reste numérique et provisoire.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleActionSequence_WaitBusy` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 26 EA / 70 octets, SHA-256 `1cae8aac570d0787a803e460e27e56773207d8e5be0a9d4be050a2b6885c72ef`.
- C relu exact : `73ab4fcd3d9d92c043e8f280f0d27c067b0f590591d0aead78169c2306670917` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x50ae80/native-2026-10-10/parent_drain_gate.json`, SHA `9fb8489b2f3d002230e29d7926b07b9fa95da87abac5abdff7b8bfd3a91dcad9`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9def12effeDVr9fjC3f3fYTR` ; V `ses_ed9cd8f4affeZglWa6ofhwk1hp`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:26.688867+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x50ae80/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `d922553817d495cf9dc51ea0be66e41fdacf8632be7beea64303449a36a3e379`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: Cursor1D97328+156*i (0x9C), signedJL until1D9776C gives seven entries; WORDviews not fabricatedstructsize.
- polarity: BYTE mask2 enables twoDWORDreads, JNZ on inequality; ordered globals DWORD1D96AAC/BYTE1D97718/501190 result.
- return: All normal exits full EAX0 or1, not bool prototype nor AL-only result.
- name: WaitBusy mÃ©tier NOT_CONFIRMED; masked-pair inequality and ordered three nonzero gates prove numeric role.
- extra: Helper no pushed argument does not prove(void). EightCODEcallers exact; document SHAâ†’commit/blob onlyCRLF/LF, historicalauthorAPIUNVALIDATED.

### Erratum de sérialisation Git — C inchangé

La source C byte-exacte est conservée dans le carrier Base64 du [decomp](../decomp/0x50AE80__BattleActionSequence_WaitBusy.md) : 1565 octets, SHA-256 `73ab4fcd3d9d92c043e8f280f0d27c067b0f590591d0aead78169c2306670917`. Le fence C rendu peut être normalisé LF par Git ; la présente correction supersède sa qualification antérieure de byte-exactitude. Source, algorithme, confiance, gate ASM, append/save/readback inchangés. Réparation documentaire ≠ nouvelle clôture ; aucun nouveau push IDB.
