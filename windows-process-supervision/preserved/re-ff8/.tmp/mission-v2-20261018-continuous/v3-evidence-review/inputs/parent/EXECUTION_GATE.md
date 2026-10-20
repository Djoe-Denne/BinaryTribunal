# Gate parent V3 — cinq variantes bornées, sérielles

Compilation qualifiée exit0/194ms,9sources+compilateur/3refs rehashés, zéro
diagnostic, PE32+/AMD64/WindowsGUI 76288B. EXE SHA
8fec39602f3a8a1fa47c2b43bbe5187dc2d53697b61db7eb75b838083265deec.
Source et review/adjudication parent déjà acquises. Reprise utilisateur continue
permet au parent d'instruire cette gate distincte, sans nouveau GO de routine.

Une invocation par cas, jamais parallèle : d-loss-signalled,s-loss-signalled,
g-thread-loss-postRun-preACK,ack-mismatch-byte191,attestation-incoherent-length4.
Parent ne transmet JAMAIS le sentinel enfant ni un nonce à la ligne de commande.
Runner et enfant inerte = seule image compilée ; zéro FF8/run01/live/G5/G6/G7.

Préconditions : Windowsx64,EXE/source/toolchain hashes exacts,variable
FF8_ENSEMBLE_SOURCE absente sans nettoyage d'environnement, scratch propre,
case-directory feuille NON précréé. Lease locale exclusive du batch ; aucune
suppression de lease ou fichiers antérieurs. Droits/nesting sont vérifiés par le
runner, pas supposés acquis ; refus OS = précondition/HOLD à analyser.

Timeout70000ms/par cas,stdout/stderr bornés65536B. Seule terminaison autorisée
est celle du processus RUNNER directement créé par ce parent si son timeout
expire (spawnSync/SIGKILL Windows), jamais un processus arbitraire ou PID réutilisé.
Aucune revendication de last-close ou de disparition G causée par cette action.
Pas de retry automatique : rouge/injection absente/timeout=>arrêt du batch,
évidence préservée, investigation/correction sous contrôle parent en parallèle
des branches saines. Aucun nettoyage global ou power.

Faits à contrôler : sortie naturelle0,ligne unique bornée FACTS_ONLY avec
MATRIX_HOLD=none-expected-facts-only,CASE/STATE/PHASE/OUTCOME exacts par cas,
compteurs et injections exercés,cleanupfalse. Le HOLD scientifique attendu de S
et le rejet ACK sont des faits NÉGATIFS attendus, jamais des PASS/promotions ;
ils ne doivent pas être confondus avec un MATRIX_HOLD d'échec de qualification.
g absent=>QQ/JobRetained null dans le receipt typé, pas preuve négative de booléens.

Fichiers :8noms exacts,regular/non-symlink/nlink1,tailles+SHA,cap262144.
D/ACK : seuls GuardianResult et SupervisorReceipt=192B,octets égaux ;6autres0.
S/G/attestation :8slots0 sur les chemins attendus. Record GCV3/version1,
nonce64hex/epoch/sequence positifs,flags0x2208/8/4GiB,comptages/caps et padding
contrôlés comme données. D : padding168..191=0. ACK : padding168..190=0,
octet191=1,réel readback égal au fichier ; différence complète contre publication
non persistée NON prétendue. La publication précède ACK : son outcome natural
ne doit pas être comparé au résultat final quarantined après rejet.

Conserver raws stdout/stderr/receipt et8fichiers puis geler ; release distincte
du lease batch. Pas de release de réservation S/G,publication000c/intégration,
full44 ou acceptance native automatique. Budget cross-process NOT_PROVEN,
last-closecase6 NOT_ESTABLISHED,événementsD/S stand-ins,G postRun-préACK seulement.
