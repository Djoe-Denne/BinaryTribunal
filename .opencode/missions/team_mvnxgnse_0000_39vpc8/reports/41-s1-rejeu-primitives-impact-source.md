# M2 — 41 : groupe envelope rejouable après changement de sa source

Le worker poursuit le raccordement07 et les joins/schémas. Il signale que le groupe envelope/all inclut mécaniquement les trois primitives déjà vertes. Leur fichier importe directement le module envelope (lignes2–3) ; ces tests ne sont pas indépendants de sa version.

Parent vérifie le reçu `author-02-envelope` : module testé SHA072c1195… ; module actuel SHAf09d255d… différent. Ce n'est donc pas une reprise sur source inchangée. La clause « ne pas rejouer les primitives inchangées pour remplir les logs » ne doit pas empêcher une non-régression proportionnée du module modifié.

**Décision : autoriser le groupe envelope avec les nouveaux tests et ses trois cas conservés**, dans le budget existant et sans changer le runner. Motif du run : nouvelles clauses/joins dans le module directement importé, tests enrichis. Aucun cas supprimé, SKIP, filtre ou compteur détourné. La composition finale all reste permise selon le plan35 lorsque l'intégration ou des entrées/sources/conditions pertinentes ont encore changé ; pas de seconde campagne identique à seule fin de remplir un bilan. Même preuve déjà valide à composition inchangée reste réutilisée.

Aucun budget supplémentaire, nouvelle infrastructure ou autorisation des checks globaux/numeric. Les 3PASS historiques gardent leur portée ; les futurs résultats doivent être réellement observés avant verdict. Le worker n'a pas à redemander l'autorisation de chaque contrôle affecté couvert par ce contrat.
