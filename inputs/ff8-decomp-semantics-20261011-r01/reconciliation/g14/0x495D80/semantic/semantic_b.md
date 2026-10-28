# Sémantique B — 0x495D80 / g14

## Contrat et sources

Analyse indépendante du gel autorisé, sans lecture A, C, review ou verdict. Modèle effectif confirmé par le lead : `openai/gpt-6.1-sol`, `medium` (admission persistée ; ancienne mention high historique).

Sources : `inputs/ff8-decomp-semantics-20261011-r01/g14/common-compaction.md`, et `0x495D80.readable/{manifest.json,metadata.json,asm-001.txt…asm-005.txt,bytes-001.txt}` dans ce même préfixe. Les 101 instructions, 18 blocs et bytes du chunk [0x495D80,0x495EB3) ont été lus. Hash packet déclaré : `862f2ad69328e5f7b6edf55f2758945567bbedec39d64efd8db945c141c4ad7b` ; hash compaction déclaré : `1972f7b1c746b0faf2526a5bbd825130cf653de28074b5ba617852d5661d6c0c`. Validation des hashes par le parent, pas recomputation locale.

## Rôle et nom proposés

**Nom : `GF_RebuildRuntimeStatsAndClampCurrentHP` — LIKELY.** Reconstruit pour un index de GF les champs runtime XP, niveau, modificateurs d'aptitudes, maximum HP et flags ; réduit si nécessaire le HP persistant au maximum calculé, puis copie ce HP dans le runtime. Le nom repose sur deux familles indépendantes de preuves : XP/niveau et agrégation d'aptitudes (preuves 1–4), calcul/copie/clamp du HP (preuves 5–7), avec la correspondance de structure GF du contexte gelé. L'ancien nom IDA n'est pas une preuve.

**CERTAIN mécaniquement :** reconstruction d'un record 12 octets depuis un record 68 octets et deux helpers, avec agrégation de bitmap, calcul signé, clamp supérieur et écritures persistantes conditionnelles. **LIKELY métier :** records GF, niveau, HP et modificateurs d'aptitudes. **UNCERTAIN :** identité exacte de la zone runtime (conflit d'adresse historique), sens du modificateur +9 et des bits de flags hors 0x80. Pas de CONFLICT dans les instructions cibles observées ; conflit documentaire explicitement conservé ci-dessous.

## Entrées, sorties, effets et ABI

- Un argument stack 32 bits, index ; aucun test de borne. `P=0x1CFDCA8+68*index`, `R=0x1CFF618+12*index`. L'argument n'est pas établi signé/non signé : seules opérations de calcul d'adresse modulo 32 bits sont observées.
- Lit P+0x0C (dword XP), P+0x1C et P+0x20 (deux dwords bitmap), P+0x12 (word HP), et des champs de table à stride 8. Le contexte associe les deux bitmaps à une sous-partie des aptitudes terminées ; il ne faut pas étendre la lecture aux 16 octets de bitmap complets.
- Écrit R+0 (word HP), +2 (word maximum), +4 (dword XP), +8 (byte retour du premier helper), +9 (byte cumul initialement 0), +0xA (byte coefficient initialement 100), +0xB (byte flags initialement 0). P+0x12 est la seule écriture persistante directe et seulement dans la branche de réduction. +6/+7 ne sont pas des champs indépendants : ils appartiennent au dword +4.
- `0x4960C0` reçoit en ordre stack usuel `(XP,index)`, seul AL consommé ; `0x496120` reçoit `(zero_extend(R[8]),index)`, seul AX consommé et signé. Effets internes des helpers non fournis/non établis.
- EBX/EBP/ESI/EDI préservés ; 12 octets locaux ; caller-cleanup pour ces deux appels et `retn` sans immédiat pour la cible.
- **Retour non établi.** AX contient finalement le HP recopié. EAX n'est pas normalisé : sa moitié haute reste celle de l'adresse P chargée à 0x495E7A, sa moitié basse est remplacée à 0x495E93. AL est donc seulement l'octet bas de ce HP. Ne pas annoncer un retour entier propre ou un contrat `void` certain sans caller ASM.

## Huit preuves indépendamment vérifiables

1. **Index et strides / XP** — `asm-001:3–13`, 0x495D84–0x495DA3 : `(index<<4)+index`, puis scale 4, donne 68 ; `(index+2*index)*4` donne 12. Bytes 0x495DA0 confirment la base runtime **0x1CFF618**, sans recours au label. `asm-001:22–25`, 0x495DC4–0x495DCD : copie dword P+0x0C vers R+4. Compaction:31 associe P à la structure GF et +0x0C à XP.
2. **Niveau et initialization** — `asm-001:14–21`, 0x495DAA–0x495DC1 : push index puis XP, appel 0x4960C0, stockage AL à R+8 ; initialise flags/+9/+A à 0/0/100. Attribution métier du niveau LIKELY, non dérivée du nom du helper.
3. **Sélection d'aptitudes** — `asm-002:1–13`, `asm-003:1–11`, 0x495DD0–0x495E40 : deux mots de 32 bits, test du bit bas, SHR logique, stride table 8, déplacement de base 0x100 et déplacement bitmap 4. Comparaisons de pointeurs **signées** JL/JGE ; bornes raw bytes : [0x1CF81C6,0x1CF820E). Base initiale raw 0x1CF812E : seuls les indices de bit 19…27 passent ces bornes (tous dans le premier mot), bien que la boucle parcoure 64 bits.
4. **Agrégation distincte de flags et coefficients** — `asm-002:14–25`, 0x495E03–0x495E21 : OR du byte table[-1] vers R+0xB ; type byte 0 ajoute table[+1] à R+9, type 1 ajoute à R+0xA. Cumulations **byte modulo 256**, sans saturation. Type 0 ne satisfait pas le second test type 1 ; aucun double cumul pour la même entrée.
5. **Maximum calculé** — `asm-003:12–25`, `asm-004:1–5`, 0x495E42–0x495E75 : helper 0x496120, MOVSX ECX,AX, coefficient R+0xA zéro-étendu, produit signé, multiplication haute signée par 0x51EB851F, SAR 5 et correction du signe. Équivaut à division signée par 100 avec troncature vers zéro, sur le produit ; clamp **supérieur signé** à 9999, aucune borne inférieure. Le produit signé d'un int16 et d'un uint8 tient dans int32.
6. **Réduction du HP stocké** — `asm-004:6–15`, 0x495E7A–0x495E97 : stocke DX dans R+2 ; compare sign_extend(DX) à zero_extend(word P+0x12), écrit DX à P+0x12 seulement si inférieur, puis copie le word persistant à R+0. Cette asymétrie de signedness interdit une réécriture par un minimum uint16 universel.
7. **Flag seuil HP** — `asm-004:16–20`, 0x495E9A–0x495EA7 : SAR **16 bits** du maximum par 2, comparaison **signée 16 bits** AX/DX, OR 0x80 seulement si HP strictement inférieur à ce seuil. Interprétation « faible HP sous un quart du maximum » LIKELY pour valeurs positives usuelles ; hors ce domaine, appliquer les règles int16 exactes, pas un seuil unsigned.
8. **ABI et portée d'usage** — `asm-004:21–25`, `asm-005:1` : restauration des registres et retour sans valeur normalisée. `metadata:147–165` donne trois xrefs entrants 0x493E24 (fonction 0x493D80), 0x495ECF (0x495EC0), 0x495F2F (0x495EF0). Ces xrefs établissent la réutilisation, pas l'usage du retour ni la finalité de ces callers.

## Divergences et questions ouvertes

- **CONFLICT documentaire d'adresse** : compaction:32 rapporte le ledger historique à VA 0x1CFF318, alors que instruction 0x495DA3 et bytes fixent **0x1CFF618**. Aucun ajustement de 0x300 autorisé ; nom exact/type global runtime à confirmer par le lead.
- Sens métier précis de R+9, bits provenant de table[-1], et contrats/effects des helpers : demander un gel borné des tables et de 0x4960C0/0x496120 si un nom plus fin est souhaité.
- Le retour AX est-il utilisé par un caller ? Demander les fenêtres ASM des trois appels ; aucun prototype de retour ferme ici.
- Domaine des indices, XP/niveau et valeur signée du helper HP non prouvé. Valeurs négatives possibles mécaniquement : elles ne sont pas clampées à zéro et peuvent entraîner stockage de words à bit de signe actif. Ne pas remplacer les tests finaux par des comparaisons unsigned.
- Le span corrompu/disputé 0x495A29…0x495A2F signalé pour une autre cible du groupe n'affecte pas directement le chunk étudié ; ne pas en hériter une preuve métier. Le contexte rapporte égalité PE/freeze pour 0x495D80, mais ne valide pas toute la réécriture historique.

Analyse offline uniquement ; aucune promotion, §5.6, mutation IDB/Git/ledger/live ni délégation.
