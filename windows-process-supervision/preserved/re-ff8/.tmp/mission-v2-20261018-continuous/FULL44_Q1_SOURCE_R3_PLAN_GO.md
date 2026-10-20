# Parent — plan R3 approuvé, GO source isolée seulement

Plan natif result_mve323e5_0018_bynmfu, message
msg_14ffed535001k0GUECrA3c73Ae, session ses_eb004d5e6ffeROpgyjFZWKwuGz,
task task_mve2v30s_0016_i0tyxz. ACK16/16pins259347B début/final exacts,
manifest74b968c6ae37244e5c4eb2c63d8c42d5b9a55fd7d23569b45db1ac5096609d33.
Model.Ref natif Sol/xhigh vérifié sous politique approuvée v2, aucun override.
Parent approuve les sept points du plan ; aucune source n'est acceptée par ce GO.

GO pour les seuls trois outputs du sibling full44-q1-source-fix :
GenericTargetPlan.cs, DESIGN.md, MANIFEST.json. API/layout/IDs/caps/C#4 inchangés.
Originaux historiques et sources V3 intacts ; pas d'accès implémentation QA.

Invariants à préserver lors de la réalisation :
- Capturer input une fois ; références extérieures puis snapshots bornés à leur
  étape. Valider uniquement les copies de références possédées, jamais le builder
  relu ultérieurement. Aucune prétention de transaction atomique face à un caller
  concurrent ; les bytes hashés et publiés doivent être exactement ceux conservés.
- Raw argv entier et politique à BadArgv avant mesure cmd ; entries/duplicates/
  membership à BadEnvironmentEntries avant mesure bloc. Pas d'expansion hors
  limite, ni code sous-test invoqué comme mesure. Primitives sans flags policy.
- Artifacts : vérifier tous les innernull/longueurs au stade17 AVANT le cap15.
  Mesurer métadonnées canoniques sans buffers UTF8/payload expansés ; compter
  lengths réelles capturées, pas entier déclaré. Deepcopy des payloads seulement
  après canonical+actualbytes<=32768, puis hash de ces copies et écriture cohérente.
- Échecs mémoire/encodage/hash ne deviennent ni succès ni plan partiel. Ne pas
  convertir une panne interne en refus de données 6/7/10 pour contourner l'ordre.
  La validation normale conserve les premiers refus ; pas garantie hard-RT.
- TryCountControlFiles n'a pas de réserve canonique ou cardinalité16 implicites.
  La borne16 appartient aux additional artifacts du plan, pas à cette API seule.
- DoubleNUL environnement vide exact, un seul IComparer résolu, char<32/NUL/
  surrogate et cardinalités natives contrôlés avant quoter/assembleur.
- Getters deepcopies et constructor protection restent ; les allocations encore
  requises sont bornées par les données déjà validées. Pas de nouveau framework,
  crypto maison, capacité host, runtime OS, profil ou plafond pour simplifier.

DESIGN présente par méthode le stade/mesure/copies/refus et limites ; MANIFEST
référence ce supplément hashé, les16pins initiaux inchangés et le diff R2→R3.
Toute extension structurante hors plan doit remonter avant écriture.
Retour NATIF trois hashes/tailles/ancres/deltas/limites, pas taskcomplete.
Pas compile/run/test/validator/import produit/OS/DB/git/réseau/IDA/live/teamtools.
Nouvelle revue delta FRESH composée sourceR3+QA R2 puis gates parent distinctes.
La portabilité est un suivi de prochaine mission, pas un changement de ce GO.
