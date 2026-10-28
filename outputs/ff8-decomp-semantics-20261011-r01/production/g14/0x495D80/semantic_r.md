# Réconciliation sémantique R — g14 / 0x495D80

## Admission et provenance

Mission `ff8-decomp-semantics-20261011-r01`, tâche `task_mv44seh0_00b1_dezhco`, R `pool-219`, session `ses_ecf08488affe6V9zlY1H2kZmZa`, modèle `openai/gpt-6-astra / medium`, admission native attestée par le parent. R fresh sans fork. A (`pool-196`, Astra medium) et B (`pool-197`, Sol medium) sont distincts ; leur fork commun depuis l'explorateur factuel est conservé, explicitement autorisé par le contrat run01 point 5 cité par le lead dans INPUT-ADMISSION-HARDENING-v1. Le blocage initial de provenance est ainsi levé, sans effacer les forks.

Projection exclusivement lue dans `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g14/0x495D80/semantic/` : manifest, A/B, compaction, native-manifest, cinq fragments ASM, bytes complets et metadata. 101 instructions / 18 blocs, chunk `[0x495D80,0x495EB3)`. Le packet original n'a pas été relu : sa projection verbatim complète suffit ici.

Hashes déclarés, cohérents entre manifests ; intégrité taille/hash des 12 fichiers **attestée par le parent**, non recalculée par R :
- manifest : `a45db34e16de02e41baa83ddc77d657aba52ee17f3a897a34243b13969d89a11` ;
- A : `88641248048b11d5eac0b3c477260c52f5763edc76d6d989d002173d7e7c02c8` ;
- B : `3231852b435a48ce6604b960a7cbe40c170237293220803a157ecd21cb8718dc` ;
- packet : `862f2ad69328e5f7b6edf55f2758945567bbedec39d64efd8db945c141c4ad7b` ;
- compaction : `1972f7b1c746b0faf2526a5bbd825130cf653de28074b5ba617852d5661d6c0c`.

## Verdict et nom

**`GF_RebuildRuntimeStatsAndClampSavedHP` — LIKELY.** Reconstruit un record dérivé de 12 octets depuis un record persistant GF de 68 octets : expérience, résultat probablement niveau, cumuls d'aptitudes, maximum HP, HP courants et flags. Peut modifier les HP dans le record persistant, puis les copie dans le record dérivé.

Les opérations, largeurs et conditions ci-dessous sont **CERTAIN sur le gel**. Le métier GF/HP est étayé par le layout indépendant de la compaction §31 ; niveau et sens précis des modificateurs restent **LIKELY/UNCERTAIN**, faute de corps des helpers/tables. Le nom ne promet pas une réduction mathématique universelle des HP : les conversions signées/word rendent cette lecture valable seulement dans le domaine HP usuel. « Saved » désigne le record mémoire persistant, pas une écriture disque.

## Matrice de confrontation A/B et arbitrages

| Point | A / B | Arbitrage R, preuve |
|---|---|---|
| Nom | ClampSavedHP / ClampCurrentHP | Retenir SavedHP pour rendre visible l'écriture à P+12, distincte de la copie R+0 (0x495E8F–E97). Les deux décrivent les mêmes HP courants persistants ; aucune divergence fonctionnelle. |
| Nature GF, rebuild | Accord | Accepté avec confiance métier limitée par la compaction §31 ; strides, copie XP et écritures réellement vérifiés à 0x495D88–DCD et E87–E97, pas par vote. |
| Base dérivée | Tous deux 0x1CFF618 ; documentation 0x1CFF318 | Immediate `18 f6 cf 01` du LEA 0x495DA3 tranche pour **0x1CFF618**. CONFLICT documentaire conservé ; identité du global historique non promue. |
| Bits 19–27 | A dit « globaux », B ne précise pas la base | Correction : 19–27 relativement à la fenêtre scannée commençant à P+1C, tous dans son premier dword. Avec le bitmap complet commençant à P+14 (compaction §31), indices zéro-based **83–91**, pas 19–27. Aucune identité d'aptitude déduite de ces indices. |
| Arithmétique HP | Accord signé /100, plafond 9999, aucun plancher | Confirmé ; expliciter surtout la **troncature à DX après le plafond**, puis sa réinterprétation int16. Le maximum stocké n'est pas universellement ≤9999, ni la mutation persistante une réduction unsigned : contre-exemple ci-dessous. |
| Flag 0x80 | A précise qu'il peut venir de table ; B insiste sur le seuil signé | Conserver les deux : OR conditionnel strict au seuil signé, mais aucun effacement d'un 0x80 déjà agrégé (0x495E06, EA7). Ce bit ne constitue pas un test équivalent « HP bas ». |
| Retour | Accord AX résiduel, EAX non normalisé | Confirmé par `66 8b 40 12` à E93 puis absence d'écriture EAX jusqu'à RET. Type de retour contractuel UNCERTAIN ; ni int HP zéro-étendu ni void CERTAIN. |
| Confiance du conflit d'adresse | A CONFLICT ; B UNCERTAIN sur identité + CONFLICT documentaire | Distinguer les objets : adresse native CERTAIN, ancienne attribution CONFLICT, identité exacte et renommage global UNCERTAIN. |

## Contrat final : entrées, sorties, effets

- Un argument stack dword à ESP d'entrée +4, utilisé comme index, sans contrôle de bornes ni signedness contractuelle démontrée. Domaine GF 0–15 seulement documentaire. Arithmétique d'adresse x86 modulo 2^32 : `P=0x1CFDCA8+68*index`, `R=0x1CFF618+12*index`.
- ABI compatible cdecl : 12 octets locaux ; EBX/EBP/ESI/EDI sauvegardés/restaurés ; RET simple. Les deux appels sont nettoyés de 8 octets par cette fonction. Callee 0x4960C0 reçoit `(dword[P+0C], index)` dans l'ordre stack usuel ; seul AL est stocké à R+8. Callee 0x496120 reçoit `(zero_extend(byte[R+8]), index)` ; seul AX, interprété signé, sert au calcul. Pas de contrat interne de callee inventé.
- Lit P+0C dword, P+12 word, P+1C et P+20 dwords ; lit des octets de table sélectionnés. La copie XP relit P+0C **après** le premier helper ; elle n'est pas substituable sans hypothèse d'absence d'effets du helper par la valeur passée avant l'appel.
- Initialise R+9=0, R+A=100, R+B=0 avant le premier appel ; écrit R+8=AL puis R+4=dword[P+0C]. Dans le parcours, pour chaque bit actif dont le curseur est admissible, OR table[-1] dans R+B ; type table[0]=0 ajoute table[1] à R+9, type 1 à R+A. Additions byte modulo 256, sans saturation. Autres types : flags seulement.
- Parcourt deux dwords, 32 bits chacun, LSB d'abord, curseur initial 0x1CF812E, +8 par bit, +0x100 par dword. Accepte le curseur dans `[0x1CF81C6,0x1CF820E)` via comparaisons signées. Sur ces adresses fixes, seuls les bits 19–27 du premier dword contribuent ; le second est néanmoins chargé/parcouru.
- Écrit R+2 word maximum calculé, R+0 word HP persistant finalement lu ; peut écrire P+12 word. R+4 est un dword incluant +6/+7, pas une collection de sous-champs indépendants.
- Effets des helpers inconnus ; pas de preuve de pureté, ni de garantie globale sur leurs mutations. Pas d'I/O directe dans ce corps.

### Formule exacte et conditions

Notations : `u16`/`u8` extractions non signées ; `s16` réinterprétation signée d'un word ; troncature vers zéro pour `/100`.

1. `product = s16(AX_helper2) * u8(R[A])` ; produit exact dans int32.
2. `q = trunc_toward_zero(product / 100)` ; si `q > 9999` signé, remplacer par 9999. Aucun plancher.
3. `m = low16(q)` ; écrire `R.max = m`.
4. Si `s16(m) < u16(P.HP)`, écrire `P.HP = m` ; sinon conserver P.HP.
5. Charger `h = u16(P.HP)` et écrire R.HP=h.
6. Si `s16(h) < arithmetic_shift_right_16(m,2)`, OR 0x80 dans R.flags. L'égalité ne suffit pas ; un flag déjà posé reste posé.

Exemple mécanique hors invariants métier, non observation live : helper AX=-20000 et coefficient byte=200 donnent q=-40000, non plafonné ; m=25536 après troncature word. Avec P.HP=30000, le code stocke 25536, **supérieur à 9999**. Avec helper=-1 et coefficient=100, m=65535/s16=-1 ; même P.HP=10 est remplacé par 65535. Les formulations générales « max toujours borné à 9999 » et « HP ne peut qu'être réduit » seraient donc des erreurs communes si promues sans préconditions.

À la sortie normale, EAX vaut mécaniquement `(P & 0xFFFF0000) | h` ; AX=h, AL=low8(h). Ceci ne prouve pas un résultat contractuel consommé par les appelants.

## Huit preuves natives contrôlées

1. **Adresses/ABI** — 0x495D80–DA3 : allocation, argument, shifts/LEA et strides 68/12 ; bytes-001 lignes 1–2 confirment les bases, notamment LEA `8d348d18f6cf01`. Pas de borne sur index.
2. **Initialisation/helper/XP** — 0x495DAA–DCD : pushes index/XP, initialisations byte, CALL, AL vers R+8, relecture XP puis store dword. Les labels n'ont pas servi à nommer le helper.
3. **Sélection de bitmap** — 0x495DD0–E40 : deux tours de 32, SHR logique, curseur +=8 et base +=0x100 ; bytes lignes 3–4 fixent 0x1CF812E et bornes 0x1CF81C6/820E. Différences 0x98/8=19 et 0xE0/8=28 exclusif.
4. **Cumuls byte et flags** — 0x495E03–E21 : `OR [esi+B],cl`, tests type 0/1 et ADD byte à +9/+A. Pour type 0, EBX temporairement altéré via BL est rechargé depuis l'argument à E15 avant le second helper ; index conservé.
5. **Maximum signé** — 0x495E42–E75 : AL zéro-étendu pour l'argument niveau ; résultat AX sign-étendu ; coefficient zéro-étendu ; IMUL avec 0x51EB851F, SAR5 et correction de signe équivalent à /100 signé ; JLE signé et borne 0x270F.
6. **Conversion et HP persistant** — 0x495E7A–E97 : `movsx edi,dx` contre ECX contenant un word zéro-étendu ; store word conditionnel P+12 et copies word. Préfixes 66 et MOVSX visibles dans bytes ligne 9. La réduction unsigned générale ne suit pas de cette séquence.
7. **Seuil/retour partiel** — 0x495E93–EB2 : MOV AX, SAR DX,2, CMP AX,DX signé, OR byte 80, épilogue sans normalisation EAX ni `ret 4`. Bytes lignes 9–10 confirment la largeur 16 bits et RET C3.
8. **Portée des xrefs** — metadata lignes 147–169 : entrants 0x493E24 / 0x495ECF / 0x495F2F depuis 0x493D80 / 0x495EC0 / 0x495EF0 ; cibles 0x4960C0/0x496120 concordantes avec les CALLs. Sans instructions appelantes, aucune preuve d'usage du retour ou du domaine d'index.

## Limites et disposition

- **UNCERTAIN** : contrats internes/pureté des helpers, attribution niveau exacte, sens de R+9 et des flags de table, invariant de coefficient et de HP, usage du retour, identité du tableau dérivé. Aucun gel supplémentaire nécessaire pour ce contrat mécanique borné ; un nom métier plus fin exigerait captures des deux helpers, des neuf records de table et des fenêtres des trois callers.
- **CONFLICT documentaire** : base historique 0x1CFF318 contre base native 0x1CFF618. Pas de conflit dans les bytes/ASM de cette cible ; pas de correction documentaire ou globale effectuée.
- La divergence PE rapportée par la compaction pour 0x495960 est hors de ce chunk et n'est ni héritée ni réparée ici. Concordance PE de 0x495D80 rapportée par le contexte, non vérifiée nativement par R.
- Dépôt sémantique réconcilié seulement. Aucun C/autre volet consulté, aucun accès IDA/index/histoires/git/live, aucune délégation ni mutation protégée. Ne vaut ni promotion ni contrôle natif final §5.6 ; gates finaux réservés au lead.
