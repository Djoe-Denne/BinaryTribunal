# Parent R3 timing correction : publication de sceau, hash paspréconnu

Supersède UNIQUEMENT l'idée PARENT_NATIVE_EMITTER_CATALOG_SHA256 dans ENVchild
duCODEGO64pins. UnhashducataloguecapturéAPRÈSstart n'estpasconnaissableavantspawn.
Ne pasinventer une mutationenvduchild, pré-hasheremitstandalone ou secondrun.
Ce complément estUNEentrée supplémentaire immuable pinnée ;64inputs d'origine
restentinchangés etbookendés. Manifestfutur déclarecepinadditionnel distinct.

## Interface ratifiée

ENVconnusavantspawn :
- PARENT_NATIVE_EMITTER_CATALOG : cheminabsolu final du catalogue attendu ;
- PARENT_NATIVE_EMITTER_SEAL : cheminabsolu final dusceau attendu ;
- PARENT_NATIVE_EMITTER_RUN_ID : identifiantunique parentconnudecechild ;
- PARENT_NATIVE_EMITTER_EXPECTED_BINDING_SHA256 : SHA256 d'un document JSON de
  bindinginvocationROOTétabliAVANTspawn (mêmecontenu exact fourniaucatalogue).

Parentcollecteprotocole/nativebuffers/maps, valide etpersistefilesWX/readonly.
PuiscatalogueWX. Publiedernier unSEALJSONferméWX ourenameatomiqueoffuturetmp :
{version:'numeric-native-emitter-seal-v1',runId,invocationBindingSha256,
 catalogue:{path,bytes,sha256}}. Séparerlastpublicationdufichiercatalogueencours.
ChildattendSEAL<=10000ms, puisrelitbytescatalogue etvérifie SHA/taille/pathduSEAL,
runID+bindingSHAEXACTauxENVpréconnus, tousfilesnamespaceowned/hashs/shape commeGO.
Cataloguedescribe bindinginvocation viaBoundJSON{utf8,sha256} dontbyteshash=
expectedBindingSHA (JSONutf8byteexact, pasrecanonicalisation pourégalité).
LeJSONbindingcontientversion/runId/runnerByteRef/argvDigest/configByteRef/envDigest
sourceModulePinsréels autorisésparroot. Définir envDigest hors sa proprevariable
PARENT_NATIVE_EMITTER_EXPECTED_BINDING_SHA256 pourévitercycledehash ; joindre
exactdefinition dansDESIGN, pasignorer d'autresoptions ou runtimeflags.
ProcessPIDréelcatalogue, s'il présent, estvalidé contreprocess.pid ETparentdriver ;
il n'estpasimprovisé commechamppréconnuavantspawn dansbindinghash.

LeSEALprouvepublicationcohérente de bytes, PAS sonpropreauteur/auth. ROOTgateverifie
séparémentcatalogue/maps/emit contrePROTOCOLEdeSONchild, avantqualifiedtrue et
readback. Uncatalogue/SEALforgéparchildmêmehashconsistentdoitêtrerefuséparroot
finalauditor, pasautoconférerautorité. Pas crypto/serveur/signature/frameworknouveau.
Ne jamais publierSEALouacceptercientificpairs sans preuveprotocole/rawsourcepins.

Cataloguenamespaceinputs parentreadonly etcasnamespace testWXfresh restentdistincts.
TOUTESlesautresrègles64pinCODEGO(ycomprisErreurRAW/450ledger/caps/F1F2/freshV/
nocandidateexec/nogatewayWSdansworker) restentopposables. Si besoinunschemajoin
encoreincomplet, escaladeravantinventer. Lesnouveaux4outputs exposentexplicitement
cetteinterface, aucunefausseENVhashdisponibleavantcompilation.
