# 0x485EC0 — sémantique B indépendante

## Sources et couverture

Analyse bornée au gel g07 : `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md`, `0x485EC0.json` (source native faisant autorité), et tous les fichiers du manifeste `0x485EC0.readable/manifest.json` : `asm-001.txt`, `bytes-001.txt`, `metadata.json`. Les chemins courts ci-dessous sont relatifs à ce répertoire d'entrée g07.

Manifeste : SHA256 déclaré du paquet `50a28e8cec513ad24cf73574d698fa89d1877ea254fe333b0b6d761db3c711af`; compaction `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Hashes lus, non recalculés. Binaire x86 32 bits, SHA256 EXE `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export du 2026-10-11T16:38:25.140966+00:00.

Couverture complète des 23 instructions et des 59 octets du chunk unique `[0x485EC0,0x485EFB)`, cinq blocs CFG, deux chemins du test zéro et boucle. Aucune lecture de production C, d'autre auteur, de classifier, de review ou de verdict. Aucun test, compilation, différentiel ou observation live effectué.

## Rôle, nom et confiance

- **CERTAIN — mécanique :** traite deux octets consécutifs dans une ligne indexée d'une zone globale. Pour chaque valeur non nulle, appelle `0x486B40(valeur_unsigned, 0)`, puis remet l'octet à zéro après le retour normal. L'ordre est octet 0 puis octet 1; les valeurs identiques ne sont pas dédupliquées.
- **Nom proposé, CERTAIN sur la mécanique :** `BattleSlot_ProcessAndClearStashedIds`. « BattleSlot » s'appuie sur le layout commun et sur le calcul natif de stride; « ProcessAndClear » sur l'appel conditionnel et l'écriture après appel. « StashedIds » est **LIKELY**, car la valeur octet est transmise comme premier argument au helper et les appelants se trouvent sur des chemins de nettoyage/synchronisation décrits par le gel.
- **LIKELY — interprétation métier :** restitue les deux identifiants d'objets mis en réserve par ce slot au buffer d'objets de bataille, puis libère la réserve. Variante métier admissible : `BattleItem_RefundStashedItems`, mais pas une conclusion CERTAIN dans cette projection : le corps de `0x486B40` n'est pas fourni. Son nom ancien et les commentaires ne prouvent pas « refund ».
- **UNCERTAIN :** domaine exact des IDs, signification prouvée du deuxième argument zéro, quantité créditée, plafonnement, succès/échec, persistance dans l'inventaire de sauvegarde et type de retour source.
- **CONFLICT documentaire :** la compaction:62 signale des labels historiques « queue-clear » pour la cible et « magic-deduction » pour le helper, face au contexte de buffer d'objets. Ces labels ne modifient pas le constat natif et ne sont pas utilisés comme preuves.

## Contrat observable

**Entrée :** un mot de 32 bits chargé depuis `[ESP_initial+4]` (octets `8B 44 24 04`). Interprété comme index de ligne par le contexte, sans borne, test négatif ni validation dans la cible. La signedness métier de cet argument n'est pas établie; le calcul d'adresse est modulo 2^32.

**Adresse :** les LEA donnent `3*x`, puis `13*x`; SHL 4 donne `0xD0*x` modulo 2^32. Le LEA absolu encodé vise `0x01D27BC8 + 0xD0*x`, soit base de slot `0x01D27B10 + 0xB8` selon le layout autorisé. Les deux octets sont donc aux offsets `+0xB8` et `+0xB9`; ce ne sont pas deux WORDs ni deux lignes. L'appellation historique de `+0xB9` comme flag ne prouve pas son usage ici.

**Appels/effets :** zéro à deux appels. Lecture BYTE, test d'égalité à zéro; sur non-zéro, `AND EAX,0xFF` transforme le registre partiellement chargé en entier 0..255. Les pushes zéro puis ID donnent les arguments cdecl `(ID,0)`; `ADD ESP,8` enlève ces arguments. L'écriture BYTE zéro suit l'appel et ne dépend pas de son résultat. Si le helper retourne normalement mais signale un échec par registre, l'ID est quand même effacé. Si le helper ne revient pas normalement, aucun effacement après cet appel n'est garanti. Le second octet est lu seulement après le traitement du premier; les effets éventuels du helper sur la mémoire ne doivent pas être ignorés ou remplacés par une lecture anticipée des deux valeurs.

**Sortie ABI :** RET simple; la cible ne dépile pas son argument. ESI et EDI sont sauvegardés/restaurés; EBX/EBP ne sont pas touchés directement. EAX/ECX/EDX et flags ne forment pas un contrat de résultat stable. Aucun accès direct x87/SSE ni flottant; effets du helper hors projection.

**AL / AX / EAX exact :** `MOV AL,[EDI+ESI]` ne remplace que les 8 bits bas, préservant EAX[31:8]. `AND EAX,0xFF` n'arrive que sur la branche non nulle avant l'appel. Si le second octet est non nul, EAX à la sortie est le résidu de retour du second appel; aucune normalisation finale. Si le second octet est nul, AL vaut zéro et les 24 bits supérieurs sont ceux présents avant sa lecture : résidu du premier appel s'il a eu lieu, sinon ceux de l'argument initial. Sans aucun appel, EAX vaut donc `argument_initial & 0xFFFFFF00`, AX vaut `argument_initial & 0xFF00`, AL vaut zéro. Ce n'est pas une preuve d'un retour booléen ou d'un compteur. Le type `void` est une interprétation d'usage raisonnable, pas une signature native démontrée par des consommateurs de retour gelés.

**Boucle/signedness :** ESI démarre à zéro, INC puis CMP 2 / JL signé; itérations 0 et 1 exactement sous ABI conforme du helper (ESI/EDI préservés). Le branchement signé est réel, mais n'introduit aucune ambiguïté pour ces valeurs. IDs zéro-étendus et non signés, jamais MOVSX. Aucune protection contre index invalide ni pointeur hors zone ne doit être ajoutée au contrat natif.

## Sept preuves exactes et indépendance du nom

1. **Index/stride :** `0x485EC0`, `0x485EC8`, `0x485ECB`, `0x485ECE`, `0x485ED1`; `0x485EC0.readable/asm-001.txt:1,5-8`, bytes:1. `8D BA C8 7B D2 01` fournit la base numérique, indépendamment du label. Compaction:29-30 donne base/stride/layout corroborants. Preuve de la composante « BattleSlot », pas du métier refund.
2. **Deux entrées :** `XOR ESI,ESI @0x485EC5`; `INC/CMP/JL @0x485EF2/EF3/EF6`; asm:3,18-20. Deux indices 0 et 1 avec stride BYTE. Preuve de réserve à deux positions.
3. **Valeur optionnelle et non signée :** `MOV AL @0x485ED7`, `TEST AL @0x485EDA`, `JZ @0x485EDC`, `AND EAX,0xFF @0x485EDE`; asm:9-12. Zéro signifie omission; valeur entière 1..255 au helper. Pas de preuve autonome du type d'objet.
4. **Traitement externe :** `PUSH 0 @0x485EE3`, `PUSH EAX @0x485EE5`, `CALL @0x485EE6`, `ADD ESP,8 @0x485EEB`; asm:13-16, bytes:2. E8 `55 0C 00 00` avec next-IP `0x485EEB` donne `0x486B40`; destination également paquet:82-84. Preuve indépendante de « Process » sans utiliser le nom du helper.
5. **Consommation/effacement :** `MOV BYTE PTR [EDI+ESI],0 @0x485EEE`; asm:17, bytes:2. Effacement après appel sans test EAX. Avec preuve 4, justifie indépendamment « ProcessAndClear » et rend plausible une restitution de réserve, sans prouver le crédit.
6. **Xrefs de nettoyage :** paquet:63-74 : appels `0x486903` dans `0x4868C0` et `0x486CB7` dans `0x486C70`. Compaction:57-58 décrit le premier appel dans une boucle à trois slots suivie d'une fusion de tables d'objets stride 5 vers paires stride 2. Corroboration métier indépendante du seul nom cible; pas de corps complet du helper ici.
7. **Autres utilisateurs/ABI :** paquet:56-80 : `0x485835` dans `0x485610`, `0x493A84` dans `0x493840`; compaction:49-51 situe ce dernier dans une mise à jour de données de slot. `POP EDI/ESI; RET @0x485EF8-EFA`, asm:21-23, confirme terminaison et préservation locale, sans retour défini. Aucun consommateur de retour exporté.

## Questions ouvertes et limites

1. Un gel borné du helper `0x486B40` permettrait-il de prouver zéro = ajout, quantité ajoutée et destination réelle? Nécessaire pour promouvoir « refund » en CERTAIN.
2. Quels producteurs écrivent aux offsets +B8/+B9 et sous quelles conditions? La cible accepte deux IDs identiques, n'interprète pas +B9 comme un booléen et n'établit pas elle-même l'origine de la réserve.
3. Des appelants consomment-ils AL/AX/EAX après le retour? Les xrefs seuls ne permettent pas de définir une signature de retour.
4. Quelle est la borne autorisée des slots et l'étendue réelle de la zone? Le layout logique ne prouve pas une allocation continue pour tous les indices; aucune borne native ici.
5. Les effets indirects du helper, en particulier une mutation du second octet, restent non déterminés. Conserver l'ordre lecture/appel/effacement et ne pas supposer un snapshot préalable ou une transaction atomique.

Aucune promotion, §5.6 finale, modification IDB/Git/registre ni validation expérimentale. Le parent possède la réconciliation et les hashes de sortie.
