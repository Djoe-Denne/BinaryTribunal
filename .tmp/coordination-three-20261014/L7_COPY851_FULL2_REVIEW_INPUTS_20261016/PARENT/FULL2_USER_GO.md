# L7 — accord utilisateur pour une tentative distincte launcher-seule

L'utilisateur a sélectionné **« Nouvel essai (Recommended) »** à la question :

> Autorises-tu un nouveau full L7 unique (≤420 s), même auteur Astra Max et mêmes
> sources/tests pinés, avec seulement un TEMP court neuf et son sous-dossier
> `${TEMP}/opencode` préparé ? Les preuves rouges restent intactes ; nouveau contrat,
> ACK, réservation exclusive et GO final avant lancement. Review indépendante et
> intégration resteront des gates séparées.

Cela autorise la préparation d'une **nouvelle** gate et, après ces contrôles,
un seul full distinct. Ce n'est ni une relance de la gate rouge consommée, ni un
GO de modification de source, test, fixture, oracle, dépendance ou configuration.

Même auteur `l7-copy-astra`, task `task_mvb1jeoy_0011_n4y9u9`, session
`ses_ebaf6d8c9ffeEq9w6t6V1gxFrE`, natif `openai/gpt-6-astra/max` à relire.
Sources/test851/cb111 et les deux autres candidats, toutes dépendances/DTO restent
byte-exacts. Pas nouvelle délégation ni changement modèle/provider/harness/politique.

Seule correction de launcher : réserver un TEMP enfant court dédié sous
`C:/Users/djden/AppData/Local/Temp/opencode/`, puis préparer et vérifier son
sous-dossier `opencode` AVANT le full. Seuls TEMP/TMP de l'enfant changent ; guard
interop strictement absent/inchangé, LOCALAPPDATA/APPDATA/config hérités inchangés.
Les 11 DB de l'essai rouge sont raw-scellées avant/après, jamais ouvertes en SQL,
sans accès aux anciennes DB d'autres sessions ; anciennes preuves non écrasées.

Contrat piné, ACK complet, réservation exclusive neuve puis GO FINAL distinct
restent obligatoires. Une `bun test --timeout 30000` ≤420s ; rouge/setup/drift
impose HOLD sans fix/rerun automatique. Éventuel GREEN nécessite encore review L7
fresh SolMAX indépendante et gates parent/croisées avant intégration. Aucune
autorité native/live/IDB/science, action power ou autre mission n'est accordée.
