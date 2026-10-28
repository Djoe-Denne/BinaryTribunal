# M2 — 159 : signature du spy livrée, revue de type ciblée

Le parent vérifie le seul fichier modifié :33812octets/e98eed9c…, treize autres pins155 et inputs122 inchangés, toutes les lignes d'assertions identiques au snapshot157. Quatorze sources readonly. [Manifeste158](../evidence/s2-replacement-source-158.json).

Lecture parent : import uniquement TYPE SQLQueryBindings ; fonction liée annotée typeof x.db.query ; callback générique natif avec transfert explicite des mêmes paramètres de type et de sql, retour du Statement original. Les compteurs et fautes ne changent pas. Compilation158 encore non exécutée ; paquet157 rouge conservé.

Reprise indépendante sur ces seules annotations et le renommage args→sql : vérifier contrat Bun réel, même appel natif et absence de cast/effacement du type ou d'effet sur les spiesget. Réutiliser oracle156 et produit154 hors impact ; aucun réaudit des66cas. Retour prêt pour compilation ou défaut précis, pas de succès TypeScript anticipé.

StrictRO sans import évalué/typing/test/SQL/DB/asset/thread/provider/Git/délégation/oracleQA. Après acceptation, compilation neuve parent puis tests ciblés seulement si verte. Délais15s inchangés, gain inconnu, HOLD125 intégral ; S2/M2 non acceptés et commandes consolidées non lancées.
