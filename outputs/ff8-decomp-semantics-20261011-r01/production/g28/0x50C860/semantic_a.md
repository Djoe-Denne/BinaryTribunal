# Sémantique A — 0x50C860

Mission run01, g28, tâche `task_mv44tfg8_00f1_vd0ju6`. Modèle contractuel : openai/gpt-6.1-sol / high. Analyse indépendante du gel autorisé ; aucune production voisine lue, aucune promotion.

## Sources et confiance

Entrée : `inputs/ff8-decomp-semantics-20261011-r01/g28/0x50C860.readable/asm-001.txt` à `asm-004.txt` (79 instructions complètes), `metadata.json`, `manifest.json`, et `../common-compaction.md`. Hash du paquet selon manifest : `c5b9f7bd3dc89ef1e19b9bdbdef5f37bd727ee44b0f9ad04273b845c7ec575e4`. Compaction : `5442a854c4df763dcddb516d9026dba4f1547b8c1023243f14a9def6edc4d951`.

- **CERTAIN** : sélection d'un record par offset u16, résolution d'un ordinal dans un masque de 12 bits, construction d'un bloc local de quatre mots, deux appels au même helper avec modification intermédiaire du bloc.
- **LIKELY** : décomposition d'un transfert rectangulaire en deux bandes pour défilement vertical d'un emplacement de texture.
- **UNCERTAIN** : contrat exact du helper 0x505EB0, validation des dimensions/delta, nom de structure H4, sens et type du retour.

Nom proposé conservateur : **`ModelSlot_SubmitVerticalSplitTransfers`** (LIKELY). Deux justifications indépendantes : (1) coordonnées à pas 64/128 et quatre champs u16 issus d'un record compact, compatibles avec une rectangle de texture ; (2) deux soumissions avec hauteur première diminuée du delta, origine Y diminuée et hauteur seconde égale au delta. Le nom IDA et le commentaire d'appel ne servent pas de preuves. `BattleModel_ScrollH4SlotV` demeure un nom historique non validant.

## Entrées, sortie et effets mécaniques

ABI compatible cdecl x86 : trois emplacements d'arguments dword, `retn` sans immédiat ; la compaction rapporte le nettoyage de 12 octets au caller 0x50C950. Pas de thiscall démontré.

1. Arg0 : pointeur d'objet ; lecture du pointeur à +0x84, puis du pointeur table à +0x30 de cet état. Ni arg0 ni le pointeur +0x84 ne sont gardés contre NULL.
2. Arg1 : index dword de table, stride **2 octets**, sans test de bornes. L'entrée est un offset **u16 relatif au début de table**, zéro signifiant absence.
3. Arg2 : delta transporté en **dword** dans EBX. Les écritures au bloc local utilisent BX, mais les calculs d'arguments utilisent EBX entier. L'ancien prototype `__int16` ne suffit pas à ignorer les bits hauts.

Lectures : état+2 (masque u16), record+0 (ordinal u8), record+1/+2/+3/+4 (octets non signés). Le masque est parcouru aux positions 0..11. L'ordinal est zéro-based : un bit actif avec compteur pré-décrément égal à zéro sélectionne sa position. Si aucun bit ne correspond, la valeur restante de l'ordinal est utilisée, sans signal d'échec. Le `jl` est signé, mais son compteur reste dans 0..12 ; les données initiales ne sont pas signées.

Le bloc local de 8 octets contient quatre mots : X, Y, champ issu du record+3, champ issu du record+4. Sur la première construction, X = 64*(10 + index/2) + record[1], Y = 128*(index&1) + record[2]. Tous les stores sont tronqués sur 16 bits. L'index est non négatif sur les chemins atteignables : la décrémentation de zéro est immédiatement remplacée par la position sélectionnée. `cdq/sub/sar` réalise ici la division par deux ; ne pas généraliser cette séquence à une division signée standard pour tout négatif.

Appel 1 à 0x505EB0 : arguments dans l'ordre logique `(adresse du bloc, dword X|Y<<16, dword Y|champ3<<16 moins arg2)`. Le chargement dword à l'offset +2 chevauche Y et champ3 ; ce n'est pas un simple calcul 16 bits sur Y. Ensuite le mot Y est diminué de BX et le quatrième mot est remplacé par BX ; appel 2 avec le même bloc et un nouveau couple de dwords.

Effets directement visibles : écritures uniquement à la pile locale, puis deux appels externes sur le chemin valide. Aucune mutation directe du record ou de l'état et aucun global directement accédé. Les mutations de queue/mémoire et la consommation synchrone du pointeur de pile restent à établir dans le helper.

Retour : **aucun retour booléen ni AL/AX normalisé**. EAX = 0 si pointeur table nul ; EAX = pointeur table si offset nul ; sur succès, EAX est le retour/résidu du second appel. Un `void` logique est plausible, pas un fait ABI démontré. ESI/EDI sont restaurés, EBX est sauvegardé/restauré sur le chemin qui l'utilise.

## Preuves instruction/xref (8)

1. `asm-001.txt:1-12`, 0x50C860–0x50C885 : chaîne +0x84/+0x30 et deux sorties anticipées ; stride de table 2.
2. `asm-001.txt:13-19`, 0x50C88B–0x50C89B : zéro-extension explicite de l'offset/ordinal/masque ; offset ajouté au début de table.
3. `asm-001.txt:20-25` et `asm-002.txt:1-8`, 0x50C89F–0x50C8BB : sélection ordinal parmi bits actifs, borne 12 signée, absence de branche d'erreur sur miss.
4. `asm-002.txt:10-25`, 0x50C8BE–0x50C8F0 : demi-index, +10, échelles 64/128, champs u8 devenant mots ; premier indice indépendant de coordonnées de texture.
5. `asm-003.txt:1-10`, 0x50C8F5–0x50C910 : chargements dwords chevauchants et premier appel avec pointeur au bloc ; soustraction **32 bits** du delta.
6. `asm-003.txt:11-23`, 0x50C915–0x50C93A : Y diminué en **16 bits**, dernier mot remplacé par delta, seconde soumission ; deuxième indice indépendant du découpage vertical.
7. `asm-003.txt:24-25` et `asm-004.txt:1-4`, 0x50C93F–0x50C948 : nettoyage différé des deux jeux de 3 arguments (24 octets), restaurations et retour non défini explicitement.
8. `metadata.json:86-96` : unique xref 0x50C9F8 dans 0x50C950 ; cible de code 0x505EB0. La compaction lignes 22-28 rapporte que le troisième argument vient de record[6] quand record[5]==0, ce qui appuie le delta de défilement, mais reste un contexte rapporté, non une lecture indépendante du caller.

## Limites et divergences du contexte

- Le helper n'est pas fourni. Après l'appel 1, `movzx ax,[edi+2]` et `movzx cx,[edi+4]` ne réinitialisent que **16 bits** d'EAX/ECX. Leurs bits hauts proviennent de l'appel précédent. Les opérations dword suivantes et le troisième argument de l'appel 2 peuvent donc dépendre du contrat natif du helper. Ne pas simplifier ce troisième argument en une formule de mots sans ce contrat. Le pointeur local peut également avoir été modifié par ce helper.
- La compaction est livrée sous forme de chaînes `L.push(...)`, mais son contenu est lisible. Sa ligne 5 annonce « 180 bytes » : la frontière 0x50C860–0x50C949 donne **233 octets**, contradiction de prose ; aucune frontière native corrigée ici.
- Compaction ligne 10 : « signed /2 » demande la restriction de domaine ci-dessus. Ligne 42 : les seuls stores BX ne prouvent pas l'absence d'effet des bits hauts, contredite par les `sub eax,ebx` natifs.
- Les historiques cités en compaction (H4, type-3 queue, prototypes et ancien C) restent non validés ; aucun ancien C ouvert ni utilisé comme preuve.

Questions ouvertes : fournir ASM/ABI de 0x505EB0 (retour EAX, bits hauts ECX, mutations du bloc, rangement/copie des champs) ; préciser domaine/sign-extension réelle du delta ; documenter bornes de table et invariant ordinal/popcount ; confirmer la destination du helper et le rôle texture, plutôt qu'un autre domaine de coordonnées ; vérifier si les callers consomment EAX. Sans ce complément, les détails métier et le retour restent UNCERTAIN.
