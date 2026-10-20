# QA0 réception R1 — CORRIGE local, pas acceptation finale ni bug produit

Candidate result_mvdynvog_0016_a7x9v4, native msg_14f8e9f910010X5I0f6C5GJqUK.
Parent rehash des3outputs exacts : ARG_ENV23011B/3572df00…b0b1e2,
QA_PLAN10356B/ec962451…aa48d, MANIFEST6511B/0fbb9ffd…8ee03c.
Original R1 conservé avant modification. Ne pas l'effacer/réécrire dans l'archive.

Contrôle parent données seules : 19 littéraux avec longueur déclarée, 18 exacts,
un défaut ENV-A16 : expected_environment_block `path=C:\Program Files\x\0\0`
contient 25 UTF16 code units, pas24. L'entrée est23, plus2NUL. Corriger 24→25
seulement dans cet oracle, puis actualiser tailles/hashes/provenance du manifeste.
Pas de changement de chaîne attendue/encodeur pour accommoder le mauvais entier.

Dispositions parent pour les questions ouvertes (pas d'implémentation auteur vue) :
- API commune fixée `FULL44_Q1_API_FIXED_R1.md` est lisible comme supplément à
  ce stade. U2/U3/U4/U5 ne sont plus inconnus, mais QA0 d'origine les ignorait
  légitimement ; distinguer cette chronologie, ne pas prétendre rétroactivité.
- OPEN-C01/C02 s'ils ciblent TargetImagePath finissant espace/point : REFUSE par
  suffixe `.exe` OrdinalIgnoreCase déjà requis, même si DosPath seul accepte.
  Ne pas modifier DosPath ni prétendre canon/reparse réels. Un cwd finissant
  espace/point reste syntaxique-only selon prédicat core ; host réel futur devra
  vérifier chemin effectif, aucune normalisation OS ou permission acquise ici.
- API ne prend pas de TimeProfile/Version/Intent arbitraires : vérifier constantes/
  dérivés, pas inventer champs d'entrée ou parseur pour les négatifs. Les tableaux
  additional/allowlist/metadata et compte contrôle suivent le supplément R1.

GO correction QA0 trois fichiers possédés seulement. Pas de source C# QA1 encore :
nouvelle tâche/pins/gate après réception de ce delta. Figer un encodage attendu
canonique ne passe pas par l'implémentation auteur (accès toujours interdit).
Final natif : hashes/tailles, rehash9pins+suppléments, delta/limites, pas teamtools.
