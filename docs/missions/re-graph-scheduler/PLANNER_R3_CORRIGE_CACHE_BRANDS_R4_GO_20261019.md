# R3 CORRIGE cache/marques natives ; correctif R4 source uniquement

V `result_mvf9phny_0086_bfwi3g` confirme deux P1. Parent relit gate193–245/293,
shim TSC1–8 et capture61–110 ;19pins1338176B rehashés exacts. R3gate n'a pas été
exécuté. Reviewtask close comme findings acceptés, reviewer arrêté, gels conservés.

- Node/TSC enableCompileCache crée des fichiers incompatibles avec inventaire
  scratch fermé. Pas d'assouplissement d'inventaire autorisé.
- Promise/Map dont le prototype est remplacé passent comme objets ordinaires et
  perdent leur état ; prototype n'est pas marque native ni preuve d'origine.

Parent a exécuté seulement des **fixtures de capacités stdlib/runtimes** propres,
sans produit, TSC, capture, harness ou gate importé :
- Node disabled `NODE_DISABLE_COMPILE_CACHE=1` -> statutDISABLED/0cache ; contrôle
  enabled avec variable ABSENTE ->1cache. Premiercontrôle avait erronément mis
  string0, également truthy donc disabled ; receipt rouge de fixture conservé,
  contrôle corrigé dans receipt séparé, aucune relance produit masquée.
- Bun fixtureTS187177B, cachepath réel ->1cache ; cachepath string0 ->0cache,
  pas de répertoire0. Aucun flag inventé ni configuration globale changée.
- util.types isProxy/isPromise/isMap/isSet/isNativeError disponibles ; PromiseprotoNull
  et MapprotoObject restent positivement reconnus par leurs marques sur les deux.

Source R4 GO même writerbuild/task_mvf8l6yr_007y_xv7l9j, Model.Ref Solxhigh
revérifié r4-cache-brand-fix, nouveaupacket21pins467196B/
d82c5a3cc77b86accf976753f3091d2967ebd12a9d77643f012837c1ebd37076.
Quatre outputs nouveaux uniquement : cachesexplicitementneutralisés ; native
brands indépendantes/prototypecohérent, contre-probe clone postdescriptors permise.
Aucune promesse universelle sur origine littérale/état privé d'objets JS arbitraires.
Contrat reste graphe DATA des producteurs fixes, pas équivalence opérationnelle.

Sixautres contrôles et produit/testcorpus inchangés ; nouveaux stem/approval/sourceGO
R4 pour empêcher confusion. FreshdeltaV puis parentselfchecks cache/brands/fatal/
footer encore exigés avant une seule nouvelle gate. Numeric et planner restent
acceptables statiques seulement ; aucune intégration/repinS1/exécution native.
