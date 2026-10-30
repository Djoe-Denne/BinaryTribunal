# 232. Connecteur IDA réactivé et identité confirmée

L'utilisateur indique avoir réactivé le MCP IDA dans cette session. Le parent confirme que le connecteur répond par une seule requête de métadonnées en lecture seule.

Le fichier ouvert est FF8_EN.exe, sous IDA9.3. Son SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` correspond à l'identité relevée au premier choix de périmètre147. Cela lève l'indisponibilité du connecteur observée222 ; la raison de sa désactivation antérieure n'est pas établie.

Aucune fonction n'est analysée ou relue par cette requête, aucune écriture/commentaire/renommage/sauvegarde IDB ou action du jeu, aucune demande de modèle. La concordance du binaire ne prouve pas que les annotations ou le graphe IDB sont restés identiques ; les anciennes captures149–150 ne sont pas requalifiées comme actuelles.

L'accès est maintenant disponible pour préparer les données du petit essai convenu quand elles seront consommées. La préparation231 du raccord Auth continue indépendamment : connexion OpenAI, envoi du travail et parcours complet ne sont pas encore acquis. Aucun nouveau GO utilisateur ou campagne RE historique n'est déclenché par cette réactivation.

Preuve : appel natif ida-pro-mcp.py_eval, uniquement get_input_file_path/retrieve_input_file_sha256/get_kernel_version, stdout JSON et stderr vide ; copie non secrète dans `evidence/ida-connector-232.json`.
