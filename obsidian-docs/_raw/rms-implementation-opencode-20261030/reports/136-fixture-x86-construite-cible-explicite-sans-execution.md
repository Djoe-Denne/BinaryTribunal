# 136. Fixture x86 construite : cible explicite, aucune exécution

## Objectif et décision

Fournir une identité source compatible avec la projection canonique sans prétendre connaître une ISA que le modèle abstraitV2 ne définissait pas. L'audit auteur et l'avis indépendant convergent sur une nouvelle fixture brute, construite pour une cible explicitement fixée. Le parent ratifie cette option sans changer V2 ni les gardes de GraphStore.

La [décision D3](../native-preparation-136/source-decision-v3.json) fixe le mode x86-32, le layout, le mapping offset/RVA et la provenance de construction. Les octets seuls ne prouvent pas un mode exclusivement32bits : la cible vient de la recette gelée, pas d'une inférence sur l'adresse ou le PID.

## Données réellement créées

Le parent a calculé les bytes puis exécuté uniquement un petit émetteur local de données, sans import du produit ni appel à un outil de compilation. Il crée exclusivement [le blob brut](../native-preparation-136/constructed-x86-32.bin) de262octets :256zéros réservés comme données non fonctionnelles, puis B8 00 00 00 00 C3. Le readback est byte-exact et son SHA256 est6356b01f78a791926d2fbce72456364c6c7ed17b7839736dc4249e5e3dbd3020.

En mode de construction32bits, la définition décrit mov eax,0 sur cinq bytes puis ret sur un byte. Le fragment n'est pas exécuté ; la réponse textuelle du worker n'est pas attribuée à ce stub. Le module hash porte sur ces262bytes, pas sur le JSON descriptif ou sur le binaire du serveur.

[Q3](../native-preparation-136/constructed-function-model-v3.json) décrit la fonction/chunk0x100–0x106, ses deux instructions et les univers fermés. [La configurationV3](../native-preparation-136/source-config-v3.json) conserve les valeurs antérieures et change seulement les destinations vers un namespace neuf. Aucun snapshot sourceV3 n'est encore construit.

## Preuves restant à produire

Le parcours candidate devra vérifier tous les bytes, padding, spans et tables, la correspondance aux instructions dans le mode fixé et les cibles/références. Ses résultats et sa provenance seront liés à la recette, aux bytes et au producteur versionné. Format reste unknown, aucune section PE ou IDB inventée, oracle false. Les métriques non effectivement mesurées restent inconnues.

L'audit des autres préconditions locales est reçu : création et leases réelles, projection canonique complète, plan/sidecar/binding immuables, CAS du plan, READY et prerequisites, ressources exactes de famille, contrôle d'obsolescence et de projection, puis réutilisation de la lease par prepare. Aucun autre blocage statique n'est identifié sous ces conditions ; ce n'est pas une preuve de réservation réussie. Les retentatives SQLITE_BUSY déjà présentes à l'ouverture sont distinguées d'un retry de travail, sans nouveau mécanisme ajouté.

## Frontières et suite

Cette décision autorise uniquement la nouvelle source fixture et sa vérification, pas un nouveau diagnostic scientifique, framework, PE exécutable, installation, configuration globale ou campagne RE. Les versions précédentes restent intactes. Le staging demeure suspendu jusqu'aux preuves affectées.

Aucune base, session, réservation, acquisition, origine ou compte natif créé. Inventaire/canary et droits/budgets réels restent HOLD. La source x86 construite n'est jamais une preuve d'architecture ou de contenu FF8 ou du service OpenCode.

## Références

- Audit auteur : READ_ONLY_SINGLE_RAW_X86_FIXTURE_PROPOSAL_AND_LOCAL_CHAIN_AUDIT.
- Avis indépendant : result_mvudla9v_0002_a0jain, message msg_18ab727bf001q0vvitQ6WRLCZP.
- Parent : émetteur materialize-raw-fixture.mjs, syntaxe node --check exit0 puis création/readback exit0. Durée fine non mesurée ; commande bornée à dix minutes. Aucun byte généré exécuté.
- D3 SHA2561796363315de98e1866a4648441ccb99da1acfee2dbae66db75d8248a0234950 ; blob et JSON descriptif relèvent de domaines d'empreinte distincts.
