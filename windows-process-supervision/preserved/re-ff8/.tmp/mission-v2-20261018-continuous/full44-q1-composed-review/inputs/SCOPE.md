# V fresh composé — source C#4 DATA_ONLY + QA1, aucune exécution

Mission v2 approuvée. Paquet fermé sourceR2 + QA1 source + contrats/API_R1 +
clarificationR2 + oraclesQA0 corrigés + golden parent indépendant. Fresh reviewer
disjoint des auteurs ; données des sources proposées seulement, pas produit
accepté. Lire/hash/ACK_HOLD+plan puis GO parent AUDIT avant revue de fond.

Rendu NATIF final : ACCEPTABLE_SOURCE_AND_QA_SCOPED | CORRIGE | BLOCK, 3–8ancres
et limites. Pour chaque défaut : chemin/ligne, entrée ou scénario falsifiant,
effet observable et disposition source vs oracle. Ré-dériver, ne pas croire la
prose auteur/parent ou se limiter au petit delta -r : la nouvelle source C# entière
n'a pas encore eu de V. Refus supplémentaires d'un positif contractualisé ne
deviennent pas une réussite. Pas de demande de réaudit global du V3 inchangé.

Vérifier :
- C#4/.NET4 surface interne, accès/factories/helpers et mono-assembly refs connues,
  pas d'API récente supposée. Statique seulement, aucune compilation prouvée.
- P8 n'est pas libre : getters de plan sont PROPRIÉTÉS internal, DTOs champs,
  seuls GetCanonicalEncoding/GetAdditionalControlArtifacts sont méthodes selon
  API fixée. Si source/QA diverge, CORRIGE avant gate, pas adaptation automatique
  de l'oracle à l'implémentation au compile. Vérifier offsets/tailles de chaque
  fixture depuis le vrai golden/layout, pas depuis les affirmations des docs.
- API/layout complets versionnés, enum/constantes/ordre refus/failure outputs ;
  DTO validé non autorisant, aucune capacité/OS pin/receipt trusted depuis JSON.
- argv Windows exacts (vide/quotes/backslashes/limites), codec vs TryBuild ;
  -r exact OU -r= refusés TryBuild, primitive encode ; pas -r* blanket ;
  envtrié OrdinalIgnoreCase, allowlist explicite/noinherit/duplicates/deny fixés.
- Pins/epochs/imagebinding/roots bornés et distinctlabels pas SHAunique inventé,
  chemins syntaxiques seulement, pas normalisation ou imagehash OS prétendus.
- Copies défensives input/output y compris byte[][] et absence de réutilisation
  de champs builder mutables après validation dans l'objet/hash retournés ;
  cohérence record/champs/intent sous mutations, pas autorité concurrente inventée.
- UTF8strict sans BOM/UTF16units natifs, endian/u32/i64/ordre des champs et
  intent SHA256 sans selfreference. Supplemental actual bytes copiés et bindés
  length+SHA32 ; aucun payload doublé dans record ni coût fictif entier déclaré.
- Cap actual32768=canonical bytes+sum artifacts, calculs/boucles/allocations
  bornés avant expansion, pas sous-cap8192 nonadopté ni refund/reset/ambientIO.
- QA1 assertions indépendantes : golden862B/c404dcf7 exact, limites par padding
  réel, pas codec sous test comme unique oracle, pas tests des faux champs
  Version/Intent/Profileinput, pas négatifs masqués par un guard antérieur.
  Domaines/copies/refus source+oracles alignés sans affaiblir les contrats.
- QA ne lit pas fichier/réseau/OS/native/DB, ne lance pas de code à l'import ;
  Console future bornée1024B, exit0 lié à assertions effectivement comptées.

Manques host (image réelle/ownership/inventaire complet contrôle/broker/Job/
readback/ACK/temps125s/DBcache/full44) restent ouverts. Aucun succès source/QA
ne prouve budget runtime intégré ou qualification native. Parent seul compile
après V acceptée, puis éventuel run sous gate distincte. Pas de compile/run/test/
validator/import produit/OS/DB/git/IDA/live/réseau/délégation/écriture/teamtools/
claim/complete. Rehash final et limites, parent seul accepte candidat et task.
