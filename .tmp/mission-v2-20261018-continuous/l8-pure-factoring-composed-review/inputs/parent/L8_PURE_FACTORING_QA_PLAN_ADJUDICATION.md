# Parent QA factoring — plan corrigé puis GO source, pas validation de l'auteur

Plan result_mvdzhg1m_001v_utefcf lu ; ACK36pins1085644B et native Flash/max connus.
Cette décision vient des références ANCIENNES et du contrat, pas d'une remise
d'implémentation auteur à QA. Garder le contexte indépendant et les pins intacts.

GO SOURCE des trois outputs QA après les corrections obligatoires suivantes :

1. Identité === uniquement pour les PUBLICS historiques réellement exportés.
   validatePlanning (:124), validateInputSource (:241), parseAdmissionSource
   (:252) du graph-pipeline PINNÉ étaient privés. Ils sont disponibles dans le
   nouveau codec pour S1, mais ne doivent PAS être nouvellement réexportés par
   l'ancien pipeline juste pour satisfaire un test. Retirer ces trois assertions
   d'identité legacy, tester directement leur nouveau point d'entrée selon son
   contrat ancien sans prétendre vieuxpublic. Le reste des publics conserve ===.
2. graphCopy appelle graphJson AVANT canonical (:48–63) : une propriété dont la
   valeur est undefined doit être REFUSÉE, pas silencieusement abandonnée. La
   sémantique directe de canonical n'est pas la composition graphCopy. Ne pas
   modifier le produit pour accommoder cet oracle faux. Getters/proxies refusés
   par graphJson avant copie : compteur getter zéro sur ces chemins si testé.
3. validatePlannerPolicy(..., admission=true) ajoute des clés OPTIONNELLES
   autorisées (:104–120), il ne les rend pas obligatoires et ne prouve pas une
   allocation/context complète. Une policy valide sans ces champs n'est pas
   refusée par ce validateur de forme seul. Tester la vraie admission complète
   via son assertion/source dédiée avec tous prérequis, pas un refus inventé.
4. immutableSnapshot utilise structuredClone PUIS freeze avec seen-set (:122–134
   lineage). Cycle pris en charge, copie séparée ; structuredClone peut exécuter
   un getter caller. Ce n'est PAS un guard sans getter/Proxy comme graphJson.
   Pas d'oracle «accessor effacé sans appel» ou zéro getter sur cette API générique.
5. Respecter les phases réelles de guards pour chaque message exact : array hole
   peut échouer au comptage Reflect.ownKeys avant le check de descriptor ; ne pas
   lui attribuer arbitrairement le message du guard suivant. Pour negatives
   admission, fournir les prérequis heap réellement nécessaires, sinon TypeError
   d'un objet incomplet n'est pas le refus planifié attendu. Tout cast/testdata
   négatif doit rester explicitement de donnée malformée, pas dataset valide.
6. Ne pas généraliser -0/safeinteger entre APIs : graphInteger refuse, graphNumber
   et graphJson ont leurs propres règles inchangées, static-schema a son oracle.
   Aucun nouveau plafond ou assouplissement pour aligner artificiellement.

Positifs complexes manquants : manque admis dans ce nouveau fichier ciblé, pas
prétention de couverture complète. Le gate parent devra sélectionner les suites
lineage/planner/admission/compat déjà acceptées après V. Il n'est pas vrai qu'un
JSON cohérent ne puisse exister que via un producteur : une fixture gelée peut
être fournie ultérieurement sous pins ; pas en inventer/produire/charger ici.
Positifs minimaux schema permis depuis les vrais schémas pinnés, avec domaines/
limites exacts. Ne pas consacrer un tour à réauditer leurs implémentations entières.

Les imports legacy du TEST pour vérifier réexports sont connus, distincts du
contrôle pureclosure statique parent. Aucun EventLog/GraphStore/planMission/
clusterGraph exécuté par la source QA. Pas compile/run/validator/DB/OS/git/etc.
Rapport final NATIF sourceproposée/hashes/ancres/limites+rehash36pins/supplément,
pas teamtools/claim/complete. Vfresh composé et gates parent restent nécessaires.
