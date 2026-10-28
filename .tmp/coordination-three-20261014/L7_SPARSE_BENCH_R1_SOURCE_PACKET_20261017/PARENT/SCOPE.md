# L7 — nouveau générateur de benchmark pur, source seulement

Contrat local parent `l7-sparse-bench-source-v1`. Fresh build/SolMax, paquet/ACK
physique puis GO source distinct. Nouveau dossier .tmp disjoint ; aucun fichier
produit/fixture/candidat antérieur modifié. Livrables : sparse-bench.ts,
sparse-bench.test.ts, PROTOCOL.md, MANIFEST.json. Ne pas exécuter de code/import,
tests, compilation, benchmark ou allocation de graphe pour valider ces sources.

Objectif : préparer concrètement §17.3 sans dépendre du Job V3. Source TypeScript
pure sans I/O, horloge, RNG global, import produit, DB, processus ou configuration.
DTO source-neutre explicite, pas prétendu compatible avec GraphDocument/SimScenario
sans adapter ultérieur. Le futur adapter devra être revu contre leurs contrats.

API : generateSparseCase({size:1000|10000|100000,seed:uint32,allowLarge?:boolean}) ;
100000 exige allowLarge=true, sinon refus AVANT allocation. Entrées strictement
validées, déterminisme indépendant de l'ordre Map/locale. Sortie versionnée neuve :
nodes identifiés, edges orientées typées, labels planted SYNTHÉTIQUES seulement,
durées entières et eventTape identique pour comparer les politiques.

Familles : communautés clairsemées, hubs/utilitaires, ponts rares, isolés et cycles
bornés. Une construction O(N+E) avec degré plafonné, E≤8N, pas matrice N² ni toutes
paires. Pas forcément chaque famille dans chaque graphe ; documenter la couverture.
Compter exactement N/E, densité orientée et distribution de degrés, SCC et proportion
sémantifiée comme données préparées, pas vérité native. SCC par parcours itératif,
pas récursion non bornée par N. Tout calcul additionnel doit annoncer sa complexité.

Protocole futur : seeds fixés ; toutes politiques reçoivent mêmes graphes, durées,
événements et ressources. Baselines sequential, readylist, fair, impact/fanout et
candidate selon API réelle à brancher ensuite. Mesures CPU/mémoire/temps/overhead,
versions/commandes/machine/threads/logs/exit, contre-exemples et coût d'investigation.
Ne pas inventer des mesures. Les labels planted sont un oracle synthétique annoncé,
pas labels LLM ni preuve scientifique. Ablations structure/capacités/lexical/embeddings
et sensibilité décrites ; encodeur absent/désactivé signalé, jamais substitué en douce.

Tests SOURCES : petits calculs fermés indépendants du générateur, limites 1k/10k,
refus100k sans accord, input immutability, déterminisme seeds, endpoints uniques,
E≤8N, SCC/isolés/bridge attendus et zéro all-pairs. Les attendus ne doivent pas être
calculés par une seconde invocation de la fonction testée. Aucun test lancé par
le worker. Toute divergence d'API ou coût non borné à escalader au parent.

Ce travail ne qualifie aucune performance ou couverture L7 globale. Après livraison :
fresh review, adapter public, compilation/mesures offline sous gates distinctes.
0Git/délégation/runtime/FF8/native/config/installation ; ContextMode<2800Bpréémission.
