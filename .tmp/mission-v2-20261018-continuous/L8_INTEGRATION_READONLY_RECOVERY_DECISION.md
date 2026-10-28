# Parent — arrêt de copie EPERM diagnostiqué, reprise limitée distincte

Le premier script integrate-l8-factoring-and-typecheck.cjs s'est arrêté pendant
déploiement, avant receipt intégré et avant tout compiler/test. Erreur EPERM
copyFile vers tools/ff8-harness/src/graph-pipeline.ts ; Get-Item confirme
Attributes33, IsReadOnly=true. Les deux premières cibles eventlog.ts et
graph-persistence-errors.ts contiennent déjà les bytes revus ; les autres sont
au baseline ou absentes. Les sept backups originaux existent avant la copie.

Il s'agit d'un arrêt du déploiement parent, pas d'un échec TypeScript ni d'une
revue source. Le premier script/lease et les gels restent intacts, sans relance
aveugle ni rollback/destruction de preuves. Aucune opération globale sur attributs,
ACL ou configuration, aucun besoin d'élévation/userGO pour les cibles possédées.

GO parent à un script de reprise DISTINCT :
- Revalider chaîne d'acceptation scoped,13source+3QApins et outils ; vérifier
  les263anciens guards, en autorisant uniquement les12cibles à être soit baseline,
  soit bytes revus. Toute autre empreinte est bloquante, jamais écrasée.
- Vérifier chaque backup existant contre son empreinte d'origine. Figer une
  attestation du stade partiel et du motif avant toute nouvelle écriture.
- Ne pas recopier une cible déjà conforme. Pour les autres, capturer son mode
  présent, rendre la seule cible momentanément inscriptible si nécessaire,
  copier les bytes acceptés, puis restaurer ce mode. Les nouvelles cibles
  prennent le mode standard0644. Aucun fichier hors12cibles n'est touché.
- La copie initiale de deux fichiers a déjà transporté des attributs readonly ;
  ne pas prétendre connaître/restaurer leurs attributs précédents perdus. Garder
  leur état présent et documenter cette limite, sans supposer un changement user.
- Rehash268guards après déploiement complet, receipt lié à l'incident et à la
  nouvelle lease ; premier typecheck nonémettant seulement ensuite. Si rouge,
  conserver le diagnostic, zéro tests et aucune relance automatique.

Les revues source/QA ne changent pas, pas de nouveau delta scientifique.
S1codeHOLD, full44/native/G5G7 et portabilitéfuture inchangés.
