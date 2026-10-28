# L7 mesures — adjudication du DTO déjà capturé, aucun rerun

ORDRE T5 est optionnel mais READY et indépendant de L8/V3. Le parent le lance
pendant les reviews, sans nouvelle exécution. Capturer/hash/read les pins puis
ACK-HOLD ; analyse sur GO parent distinct. Ne pas finaliser la tâche sur ACK.

Lire le DTO JSON dans run-capture.txt comme données et le code driver seulement
pour interpréter définitions/unités/fairness/déterminisme. Calculs sur valeurs
du DTO permis, pas d'import/eval/run du driver ou autre produit. Identifier ce
qui est observé (walltime/mémoire process), synthétique déterministe (makespan/
completions/compteurs), borne analytique, ou indisponible (CPU/profilage etc.).
100k exclu, seulement1k/10k,3bras/4seeds/warmup+5reps ; mêmes cas/ties et
fingerprints avant/après, assertions d'ancres2890/28915 source. Pas de gain natif,
produit,battle/FF8,science,L9/L10/globalQA déduit. Conserver l'incident de capture
du premier run et le fait que le receipt concerne run2 ; ne pas créer un run3.

Rapport court avec5–8constats numériques bornés,source DTO JSONpath ou driver:ligne,
limites/ce qui reste à mesurer ; pas de grand dump ni tableau. Rehash final ;
rapport via team_message, pas d'écriture de code/registre/config/git/DB/natif/
processus/IDA/live/réseau/délégation. Source hors paquet/origines interdites.
