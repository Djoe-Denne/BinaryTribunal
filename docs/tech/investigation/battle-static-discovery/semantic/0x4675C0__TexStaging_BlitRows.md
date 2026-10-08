# TexStaging_BlitRows @ 0x4675C0 — Sémantique

- Verdict V Sol : **ACCEPTE** ; classe / confiance : **CERTAIN** pour le rôle et les chemins décrits.
- Nom catalogue : confirmé par le corps et deux callers indépendants, pas seulement par le nom existant.
- Sources : analyses `semantic_a_sol.md` et `semantic_v_sol.md` du pack `0x4675c0` ; aucun désaccord A/V Sol.
- Couverture rapportée par A/V Sol : **195/195 instructions, 32/32 blocs CFG**, un chunk `[0x4675C0, 0x4677CF)`, taille **0x20F**, **quatre retours**, **aucun call** ; ASM pack/live sans divergence après retrait des commentaires.
- SHA-256 des octets IDB live rapporté : `48ac01fedc2a07f6deb363beeb48c003c74454aed0bfa711c73ba3e49aafcb36` ; ce n'est pas une vérification du PE.
- §5.6 parent : 195 instructions / 32 blocs, aucun call, quatre retours, deux callers CODE et cleanup 1Ch, signedness, strides et EAX relus live. Push `set_func_cmt` append-only `[semantic-triple 2026-10-08]`, tag relu ; `save_database=true` vérifié après le push. Aucun rename ni patch octets.

## Rôle

Copie, dépaquette ou convertit des lignes dans un tampon de staging texture depuis une source à strides, alimentée par le miroir VRAM dans les deux callers observés.

## Contrat observé

ABI x86 **cdecl, sept arguments DWORD** : `(src, src_stride_octets, dst, dst_stride_octets, largeur, hauteur, mode)`. Arguments poussés droite→gauche, nettoyage caller `add esp, 1Ch`. EBX/EBP/ESI/EDI préservés ; aucun local alloué, mais des cases d'arguments sont réutilisées comme compteurs. Aucun appel, allocation ou dispatch GPU dans le callee.

Les strides sont en **octets**. La largeur est en octets copiés au mode 1, en indices produits au mode 0, en pixels 16 bits au mode 2. Le rôle CERTAIN ne prouve pas la validité des dimensions ni des buffers.

### Mode 0 — dépaquetage compact

`p = trunc_signed(largeur / 2)`. Si `hauteur > 0` signé, chaque ligne lit `p` octets source et produit deux indices par octet : nibble bas, puis nibble haut. Le résidu `src_stride - p` donne un avancement source net égal au stride. La destination avance de **2*p octets**, sans lecture de `dst_stride` : elle est compacte. Une largeur positive impaire perd son dernier indice ; aucune correction de tail.

### Mode 1 — copie brute inline

Si `hauteur > 0` signé, copie `uint32(largeur)` octets par ligne : `rep movsd` pour `largeur_unsigned >> 2`, puis `rep movsb` pour `largeur & 3`. Les bases de ligne avancent des deux strides. Ce sont des instructions inline, **pas un appel memcpy/qmemcpy/memmove**. DF=0 est supposé selon l'ABI, sans `cld` local ; le chevauchement n'est pas généralement garanti.

### Mode 2 — conversion 555/565 sélectionnée par comparaison signée

Lit `dword_B7DB44` une fois et choisit la branche par **comparaison signée > 0**, pas par test d'un bit. La hauteur n'est testée que contre **zéro** ; une hauteur négative n'est pas rejetée. Traite `p = trunc_signed(largeur / 2)` paires de pixels par DWORD, puis un WORD si `largeur & 1`. Les bases de ligne avancent des deux strides en octets.

Pour un pixel source `x` :

- `B7DB44 <= 0` : `((x & 0x1F) << 10) | (x & 0x3E0) | ((x >> 10) & 0x1F)` — permutation des champs bas/haut de cinq bits, disposition 555, bit 15 supprimé.
- `B7DB44 > 0` : `((x & 0x1F) << 11) | ((x & 0x3E0) << 1) | ((x >> 10) & 0x1F)` — permutation et sortie 565 ; bit 5 nul, vert décalé sans réplication du bit de poids fort, bit 15 source supprimé.

Le masque DWORD `0xFFFF001F` donne ces mêmes conversions pour deux pixels après les décalages 32 bits ; ce n'est ni un statut ni un masque alpha. Le caller relie le choix au masque vert `0x7E0`, sans établir un flag Battle.

### Mode 3 et tous les autres modes — no-op

Seuls 0, 1 et 2 sont actifs. Le mode 3, les autres valeurs `>=3` et les valeurs négatives ne touchent pas les buffers et ne lisent pas le global. Aucun mode ne met à jour le global ; les modes actifs écrivent la destination et des cases d'arguments temporaires.

## Retour

**EAX entier 32 bits**, résiduel, **pas AL seul ni un booléen de succès** :

- Mode 1 : hauteur si `hauteur <= 0`, sinon 0 après terminaison normale.
- Mode 0 : `src_stride - trunc_signed(largeur / 2)`.
- Mode 2 : `B7DB44` si hauteur=0, sinon 0 après terminaison normale.
- Autres modes : valeur du mode.

Les deux callers observés ignorent ce retour. Le type `int` concorde avec ces résidus machine, sans prouver une API de retour intentionnelle.

## Preuves — huit ancrages du review V Sol

1. **Caller texture 1 / ABI** — `0x4651F8–0x46523A`, dans `Gfx_AllocTexturePageSlot @ 0x464F70` : sept push, source `[0x1CB602C]+index*2`, pitch `0x800`, destination `[ebx+0x58]`, pitch `[desc+0x44]`, call `0x465235`, puis `add esp,1Ch`.
2. **Caller texture 2 indépendant** — `0x465401–0x465452`, dans `isUpdateVRAMOrSomething @ 0x4653B0` : destination `[edi+0xD8]`, pitch `[edi+0x44]`, source `[0x1CB602C]+ebx*2`, pitch `0x800`, call `0x46544D`, même nettoyage. V Sol rapporte seulement ces deux xrefs live.
3. **Sélection des modes** — `0x4675CF cmp eax,1`, `0x46760B test eax,eax`, `0x46765F cmp eax,2` : seuls 0/1/2 sont actifs, tout autre mode est no-op sans lecture du global. Les quatre `retn` sont `0x46760A`, `0x46765E`, `0x467724`, `0x4677CE` (A, confirmé par la couverture V Sol).
4. **Copie mode 1** — `0x4675DB jle` signé ; `0x4675EB shr ecx,2`, `0x4675EE rep movsd`, `0x4675FB rep movsb` : largeur unsigned en octets, copie inline et deux strides, aucun memcpy appelé.
5. **Mode 0 compact** — `0x467617 cdq/sub/sar`, `0x467622 sub eax,edi`, `0x46763D and dl,0Fh`, `0x467640 shr cl,4` : quotient signé vers zéro, résidu source, ordre bas→haut ; destination compacte sans `dst_stride`, hauteur protégée par `jle` signé.
6. **Choix et conversions 555/565** — `0x467668 mov eax,[B7DB44]`, `0x467673 jle` signé ; caller `0x4650FC cmp edx,7E0h`, puis `setz cl` et écriture du global. Masques/décalages `0x4676AB–0x4676CB` et `0x467757–0x467772` : formules ci-dessus. V Sol rapporte zéro écart sur les 65536 valeurs de chaque tail et 524288 paires choisies, sans prétendre à l'exhaustivité DWORD.
7. **Mode 2, hauteur et tails** — `0x46767B/0x467727 jz` seulement ; tails WORD `0x467702/0x4677AC`, strides `0x467711/0x467713` et `0x4677BB/0x4677BD` : largeur en pixels, paires puis impair, hauteur négative non rejetée.
8. **Retour EAX** — `0x467603/0x467715/0x4677BF dec eax`, `0x467622 sub eax,edi` : retours résiduels 32 bits. `0x467794 mov al,cl`, suivi de `and eax,1Fh`, est un intermédiaire de conversion, pas un retour AL-only ; les callers écrasent EAX sans le consommer.

## Domaines non prouvés et limites du C existant

Aucun clamp ni contrôle null/taille. La largeur zéro ne déréférence pas les buffers, mais le mode 2 lit le global et les modes actifs peuvent avancer leurs bases. Une hauteur `<=0` protège les modes 0/1 ; seule hauteur=0 protège le mode 2. Une largeur négative au mode 1 devient une énorme copie unsigned ; un quotient négatif aux modes 0/2 lance une boucle de décrément modulo. Une hauteur négative au mode 2 ne s'arrête pas immédiatement.

La validité numérique générale des callers n'est pas prouvée. Dimensions, strides, étendues de buffers, alignement, aliasing et chevauchement restent à contractualiser. Le cache format peut valoir -1 avant initialisation : seuls les tests signés observés sont affirmés.

Le C réconcilié existant conserve les modes, strides et formules ; il n'est pas régénéré. Ses arithmétiques signées et calculs de pointeurs ne prouvent pas une équivalence C définie pour toutes les entrées : l'ASM opère sur des compteurs/adresses 32 bits modulo. Les corrections sont limitées aux commentaires (quatre retours, débuts de callers distincts des sites d'appel, 555/565, domaines non prouvés). Les métadonnées historiques du header ne constituent pas un nouveau PUSH.

Le pack Hex-Rays contient une erreur de paramètres ; A/V Sol ont consulté la décompilation live sans régénérer le C. Les qmemcpy sont des intrinsics des `rep`, et les anciens `v22/v23` sont des compteurs, pas des pointeurs. Aucun nouveau verdict PE ni garantie de sécurité des entrées n'est déduit du pack ou de la wiki.
