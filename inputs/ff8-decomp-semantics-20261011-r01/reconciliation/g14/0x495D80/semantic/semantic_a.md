# Sémantique A — 0x495D80

## Contrat et sources

Mission run01, g14, tâche `task_mv44seg8_00ay_ek9tzp`, volet A aveugle. Modèle autorisé par correction du lead : `openai/gpt-6-astra`, `medium` (readback parent, non vérifié indépendamment ici). Aucune lecture de production sœur, aucun changement IDB/git/live.

Sources lues : `inputs/ff8-decomp-semantics-20261011-r01/g14/common-compaction.md` (CC), et, sous `0x495D80.readable/`, `manifest.json`, `metadata.json`, les cinq `asm-001.txt` à `asm-005.txt` et `bytes-001.txt`. Les 101 instructions et le chunk [0x495D80,0x495EB3) sont couverts par cette projection. Hash packet déclaré : `862f2ad69328e5f7b6edf55f2758945567bbedec39d64efd8db945c141c4ad7b`; contexte : `1972f7b1c746b0faf2526a5bbd825130cf653de28074b5ba617852d5661d6c0c`. Intégrité vérifiée par le parent selon son GO ; pas de recalcul local. Les labels natifs ne constituent pas des preuves métier.

## Conclusion

**Nom proposé : `GF_RebuildRuntimeStatsAndClampSavedHP` — LIKELY.**

La fonction reconstruit un enregistrement dérivé de GF à partir de son expérience et de bits d'aptitudes persistants, calcule un maximum HP modifié, réduit au besoin les HP persistants à ce maximum, copie les HP courants et marque un état sous le quart du maximum. La qualification GF/HP s'appuie sur le layout persistant documenté (CC:31) confronté aux accès natifs, non sur l'ancien nom. Le rebuild de l'enregistrement et la réduction des HP ont des preuves indépendantes (preuves 1–6 et 7 ci-dessous).

**CERTAIN** : transferts, adresses, largeurs, parcours et conditions décrits ci-dessous. **LIKELY** : signification niveau, bonus de puissance et état HP bas ; niveau et puissance ne sont pas confirmés par le corps des callees. **CONFLICT** : adresse du tableau dérivé dans la documentation historique, pas dans le gel natif. Aucun nom de global historique n'est promu.

## Entrée, sorties et effets

- Un argument dword sur pile à l'entrée ESP+4, utilisé comme index sans contrôle de bornes. Convention compatible cdecl : `retn` simple ; EBX/EBP/ESI/EDI préservés, 12 octets locaux. Le domaine GF 0–15 provient du layout (CC:31), pas d'un guard natif. Multiplications d'adresse x86 32 bits : stride persistant 68 (0x44), dérivé 12 (0x0C).
- P = `0x1CFDCA8 + 68*index`, R = `0x1CFF618 + 12*index`.
- Lit P+0x0C dword (expérience), P+0x12 word (HP), P+0x1C et +0x20 dwords (portion du bitmap d'aptitudes). Lit des octets de table, stride 8.
- Écrit R+0 word (HP courant), +2 word (maximum calculé), +4 dword (expérience copiée), +8 byte (résultat AL de 0x4960C0, probablement niveau), +9 byte (accumulation type 0), +0xA byte (coefficient type 1 initialisé à 100), +0xB byte (flags). Réinitialise +9/+B à zéro avant accumulation ; octets additionnés modulo 256.
- Peut écrire P+0x12 lorsque le maximum interprété signé est inférieur aux HP persistants lus non signés. Les effets internes des deux callees ne sont pas couverts par le gel.
- **Retour :** AX contient les HP finalement lus à P+0x12 ; AL en contient seulement l'octet faible. Le dernier `mov ax,[eax+12h]` conserve la moitié haute du pointeur P précédemment chargé en EAX. EAX n'est donc ni un résultat HP zéro-étendu ni un entier de succès. Sans consommation côté appelant, retour contractuel **UNCERTAIN** : préférer effet de bord/retour non établi plutôt qu'inventer `int HP`.

## Huit preuves instructionnelles

1. **Index et structures** — asm-001:3–13, 0x495D84–0x495DA3 : `(index*16+index)*4` produit 68 octets pour P ; `(index+index*2)*4` produit 12 pour R. `bytes-001:1–2` confirme les bases immédiates, notamment `18 f6 cf 01` pour R. CC:31 rattache P au layout GF persistant, indépendamment du label de fonction.
2. **Reconstruction initiale** — asm-001:14–25, 0x495DAA–0x495DCD : pousse index puis expérience pour 0x4960C0 (arguments observés : expérience, index), stocke seulement AL en R+8 ; remet R+B/R+9/R+A à 0/0/100, copie l'expérience en R+4. Ce faisceau justifie « rebuild runtime stats », mais ne démontre pas seul le nom du calculateur de niveau.
3. **Bitmap borné et table** — asm-001:24, asm-002:1–13, asm-003:1–11 : deux mots de 32 bits lus à P+1C/+20, test du bit bas puis SHR logique ; table initiale 0x1CF812E, stride 8, base extérieure +0x100. Comparaisons d'adresse **signées** acceptent [0x1CF81C6,0x1CF820E). Les immédiats sont lisibles dans bytes-001:3–5. Sur ces constantes, seuls les bits globaux 19 à 27 (neuf records du premier dword) peuvent contribuer ; la seconde boucle parcourt bien ses 32 bits mais ses adresses sont hors plage. Ne pas transformer ce constat en lecture de tout le bitmap de 16 octets.
4. **Agrégation d'aptitudes** — asm-002:14–25, 0x495E03–0x495E21 : pour chaque bit admissible, OR de table[-1] vers R+B ; sélecteur table[0]==0 ajoute table[1] à R+9 ; sélecteur 1 l'ajoute à R+A. Ce sont des additions byte, sans saturation. R+9 n'est pas consommé localement : son rôle exact (notamment bonus de dégâts) reste hypothétique.
5. **Valeur de base et coefficient** — asm-003:12–25, 0x495E42–0x495E66 : pousse index puis R+8 zéro-étendu vers 0x496120 ; ne retient que **AX signé** (`movsx ecx,ax`). Multiplie par R+A **non signé** zéro-étendu. Les appels nettoient chacun 8 octets de pile. La lecture du niveau est byte, pas dword ; la valeur HP de base ne doit pas être traitée comme uint16 dans l'arithmétique.
6. **Pourcentage et borne** — asm-003:21–25, asm-004:1–5, 0x495E59–0x495E75 : produit signé, multiplication haute par 0x51EB851F, SAR 5, correction du signe = division signée par 100 tronquée vers zéro. Puis plafond **signé** 9999, sans plancher zéro. Le produit initial d'un int16 et d'un uint8 tient dans int32 ; un coefficient byte peut cependant avoir déjà débordé pendant l'accumulation.
7. **Maximum et mutation persistante** — asm-004:6–15, 0x495E7A–0x495E97 : R+2 reçoit DX ; comparaison entre DX sign-étendu et P+12 zéro-étendu ; si le premier est inférieur, écrit DX dans P+12. Puis copie P+12 vers R+0. Avec CC:31 (HP à P+12), preuve indépendante du nom proposé « ClampSavedHP ». Pour valeurs négatives inattendues, il s'agit exactement de cette condition signée, pas d'un clamp sain garanti.
8. **Seuil strict et résidu retour** — asm-004:14–25 et asm-005:1, 0x495E93–0x495EB2 : AX courant comparé **signé 16 bits** à `(int16)R.maxHP SAR 2`; si strictement inférieur, OR 0x80 en R+B. L'égalité ne déclenche pas l'OR. Le bit peut néanmoins venir de l'agrégation précédente : il n'exprime pas forcément une équivalence logique avec le seuil. Aucun effacement/extension d'EAX après le chargement partiel AX ; épilogue sans `ret 4`.

## Conflits et limites

- **Adresse dérivée :** CC:32 cite l'ABI historique VA 0x1CFF318/stride12, alors que l'instruction 0x495DA3 et ses bytes imposent **0x1CFF618**. Conserver la base native ; identité exacte du tableau à résoudre par le lead. Le layout persistant, lui, concorde.
- Le défaut de bytes de 0x495960 décrit en CC:20 concerne une autre cible. CC indique une concordance PE pour 0x495D80 ; ne pas transférer le défaut ni les conclusions de cette voisine au présent corps.
- Xrefs entrants gelés : 0x493E24 dans 0x493D80, 0x495ECF dans 0x495EC0, 0x495F2F dans 0x495EF0 (metadata:147–165). Sans instructions appelantes, ils ne valident ni la plage des arguments ni une utilisation du retour.
- Questions ouvertes au lead : fournir un gel borné de 0x4960C0/0x496120 pour confirmer niveau et HP de base ; identifier les neuf records de table et les flags sans se fonder sur leurs labels ; résoudre la base R ; vérifier si les appelants lisent AX/EAX ; établir les invariants excluant HP signés négatifs et débordements des coefficients.

Aucune promotion, aucune validation finale §5.6 ; les faits mécaniques sont distingués des interprétations et hypothèses ci-dessus.
