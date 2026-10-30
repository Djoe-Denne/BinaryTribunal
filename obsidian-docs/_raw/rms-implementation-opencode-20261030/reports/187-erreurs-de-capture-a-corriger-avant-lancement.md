# 187. Erreurs de capture à corriger avant lancement

## Problème concret et décision

La revue fraîche identifie deux défauts du runner qui empêchent sa qualification : une erreur d'écriture ou de fermeture de logs dans un callback peut échapper au chemin d'arrêt supervisé ; une écriture partielle peut être ignorée alors que le reçu annonce une capture exacte. Le parent corrobore ces défauts dans le code livré.

**Aucun lancement n'est autorisé.** La correction locale de ces seuls chemins est engagée. Les trois fichiers initiaux ont été copiés dans `baseline-candidate-186`, sans écrasement, avant toute modification.

## Correction bornée autorisée

Le constructeur peut modifier seulement `run-host.mjs` et le pin associé dans `host-plan.json`. Le bootstrap, les paquets, les clôtures et la baseline restent inchangés.

Le runner doit traiter les écritures partielles avec un compteur réel et une boucle bornée, refuser l'absence de progrès, capturer les exceptions dans ses callbacks et finaliser chaque canal indépendamment. Une erreur de capture doit mener à HOLD et à l'arrêt supervisé, jamais à une sortie qui abandonnerait le processus enfant. Un canal incomplet ou en erreur ne sera pas déclaré byteExact. La rédaction du reçu ne doit pas masquer une fermeture non prouvée.

Le parent vérifiera la syntaxe et les chemins d'erreur par de petits contrôles isolés sans importer le main ni l'application, puis renverra le delta au même reviewer indépendant. La reprise de revue portera sur les deux bloquants et leur impact, sans nouvel audit de tous les acquis.

## Autres résultats de la revue

Les sources acquises corroborent les API Effect de signal/interruption, NodeServices, le câblage Global et le type d'adresse utilisé. Ces éléments ne sont pas des tests exécutés sous Bun. L'injection éventuelle de variables IPC et la forme d'argv Bun restent des risques d'incompatibilité à distinguer de défauts démontrés : aucune allowlist n'est élargie sur hypothèse.

Les identifiants de fichiers numériques sont auxiliaires, pas une preuve OS64bits exacte. Les pins portent sur les octets relus, sans prétention d'équivalence mémoire.

## Preuves et portée

- Avis frais `result_mvv2wghl_0059_75sbrs`, message `msg_18d4066a6001FTiFBABnxxwLru`.
- Parent : `run-host.mjs:58–80,164–166,194–210` lu ; appel writeSync sans contrôle du nombre écrit et callbacks/finalisations pouvant lever une exception.
- Baseline parent : trois copies dans `rms-owned-http-host-180/baseline-candidate-186`, aucun import ou exécution applicative.
- Syntaxe initiale31/29ms reste acquise pour sa version, sans qualifier les comportements d'erreur.
- Pas de nouvelle session, origine, requête modèle, API native ou modification du serveur desktop. La correction ne clôt ni D5 ni M2.

## Reproduction isolée de la version initiale

Le parent a extrait uniquement la fonction capture de la baseline et l'a évaluée dans un contexte JavaScript isolé avec des E/S simulées en mémoire. Le main du runner et les imports applicatifs n'ont pas été exécutés ; aucun processus enfant, fichier de sortie ou appel HTTP n'a été créé.

Quand le simulateur n'écrit qu'un octet par appel, la fonction rapporte32octets écrits alors que seulement2ont été acceptés. Quand le simulateur lève une erreur d'écriture, celle-ci sort de push. Les deux défauts sont ainsi reproduits par un oracle indépendant borné ; c'est une confirmation d'échec de la baseline, pas un PASS du produit corrigé. Les mêmes risques seront vérifiés sur le delta, avec les erreurs de finalisation pertinentes.
