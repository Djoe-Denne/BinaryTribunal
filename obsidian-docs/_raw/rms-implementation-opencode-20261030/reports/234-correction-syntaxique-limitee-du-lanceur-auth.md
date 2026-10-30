# 234. Correction syntaxique limitée du lanceur Auth

Le contrôle233 a refusé le lanceur PowerShell avant toute exécution. Les deux scripts JavaScript passent leur syntaxe. Le défaut est localisé aux expressions booléennes réparties sur plusieurs lignes, avec opérateurs de continuation mal placés pour le parseur Windows.

Le parent conserve le gel PS20392/9a3b1901 dans `qa-auth-parent-233/baseline-before-ps-fix-234`. Il autorise au constructeur une correction mécanique du seul `auth-parent-231/auth-parent-native-v1.ps1` : rendre explicites les continuations ou regrouper les expressions, sans modifier leurs conditions, opérateurs, champs, refus ou effets. Native-Number, contrôle ACL, Remaining-Ms et validations de summary restent logiquement identiques. Aucune condition n'est supprimée pour obtenir une syntaxe valide.

Les deux MJS, le produit, les interfaces, les pins de dépendance et les marqueurs restent inchangés. Seule l'empreinte extérieure du lanceur changera ; pas de propagation cyclique à ses propres dépendances. Le constructeur ne lance aucun parser ou test et livre le nouveau gel puis s'arrête.

Le parent relira le diff puis reprendra uniquement le contrôle syntaxique PS affecté. Les deux syntaxes MJS réussies ne sont pas rejouées sans impact. Le reviewer poursuit les parties stables et sera informé des octets finaux ; les vérifications d'autorité, de secret et de budget ne sont pas dispensées. Aucun effet native, bail, ACL, déploiement, OAuth ou base réelle exécuté.

## Correctif et résultat reçus

Le nouveau PS fait20350octets, SHA256 `1954976ad50f1f6bf0077b74391f0335e2c2cfbe225301a8966af1df9b3471b7`. Le parent confirme par comparaison binaire que seules huit jonctions de lignes avant -and ont changé, sans autre octet logique ; les deux MJS gardent leurs pins.

Le parseur PowerShell passe maintenant : zéro erreur,6ms, cinq attentes toujours explicitement bornées, pin avant/après concordant. Reçu `qa-auth-parent-233/syntax-ps-corrected-234.json`. Le précédent FAIL24erreurs reste conservé ; les deux syntaxes MJS33/29ms sont réutilisées. Aucune évaluation ou exécution.

Le reviewer reçoit ces preuves et les octets corrigés. La syntaxe seule ne reçoit pas les nouveaux actes d'autorité et de confidentialité : leur revue reste nécessaire avant préparation native ou connexion.
