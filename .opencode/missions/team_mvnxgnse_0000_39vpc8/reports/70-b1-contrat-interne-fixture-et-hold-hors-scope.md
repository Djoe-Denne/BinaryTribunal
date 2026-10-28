# M2 — 70 : contrat interne fixture pour B1, aucun format RPC inventé

## Manque confirmé

L'auteur identifie correctement QA_MATRIX171–172 : makeGraphIntentV3/S3 doit encore construire la vraie commande et sa projection d'inputs. Le format v1/v2 ne peut pas être casté en v3. Le parent ne demande pas d'inventer ce format pour rendre les tests verts. B2/B3 restent des corrections locales indépendantes autorisées69, sans exécution.

## Décision locale de supervision

Autoriser une **forme fermée interne aux tests et au stockage fixture S2**, explicitement non exécutable comme commande OpenCode. Ce n'est ni un InputBundle projeté vers un agent, ni un dossier/prompt final, ni un format RPC public. Toute autre commande (vide, v1/v2, native/S3 non définie) reste HOLD/refus avant SPENT/BURNED/outbox.

Le stockage fixture et l'origine S1 offline doivent rester identifiés comme tels. Un état PREPARED/SPENT de cette voie ne peut pas servir d'autorisation native ; absence de dispatcher conservée. S3 devra apporter son contrat et son contrôle de body complet avant tout raccordement public. Aucune exclusion de champ scientifique/transport59 ratifiée ici.

## Forme exacte et source de vérité

Le command interne porte uniquement :

- version = `l8-s2-bound-fixture-command-v1` ;
- scope = {missionId,generationId,rootAccountId,unitId,subIntentId,role} ;
- functionIdentity : identité exacte du sous-intent/grant ;
- profile : profil du rôle issu de bound.template.settings.profiles ;
- model : Model.Ref exact du rôle issu de bound.sourceSpec.models et compatible avec les bindings/grant root déjà vérifiésS1 ;
- sourceEnvelope : BoundDocument exact de bound.origin.document, y compris son utf8/ref complets.

Le document origine contient les sources input manifest, template/spec, connaissance, contextes et bindingsS1. On compare **ce document retenu par le store**, pas une empreinte d'origine fournie sans relecture par le caller. Le scope et les valeurs attendues sont reconstruits depuis this.current(...)/sourceS1 vérifiée et le grant exact dans la même transaction avant effet. Comparaison exhaustive de la forme/champs et du contenu attendu ; refus/HOLD des champs inconnus, substitutions, mauvais modèle/profil/fonction, documents/manifest/source/envelope altérés. Copier un hash depuis le caller ne suffit jamais.

BoundPreparationV1:201–208 confirme les champs template/sourceSpec et BoundExecution.origin disponibles. Lire les formes réelles ; pas d'alias implicite, injectivité inverse de Model.Ref imposée, champs arbitraires ou surcharge S1. La version interne peut être une interface privée au module ; aucun fichier partagé/sourceS1/SDK/client touché.

**Important :** sourceEnvelope est une preuve DATA fixture complète retenue pour la liaison, pas la projection des fichiers qui doit aller dans le contexte d'un auteurA/B/R. Le dossier peut contenir des informations administratives/preuves qui ne doivent pas être présentées comme blind-safe à un agent. Aucun de ces bytes n'est envoyé à un modèle par cette tranche.

## Tests et impact bornés

Les fixtures auteur construisent cette forme depuis les données synthétiques S1 déjà fournies ; pas d'appel à un builder du store pour fabriquer l'attendu. Nominal puis mutations isolées scope/model/profile/function et sourceEnvelope (manifest/contexte/bindings), sans changer la référence retenue. Rejeter aussi commande vide/ancien format inconnu avant tout nouvel effet. Conserver les tests de retry/BURNED/Q et les autres cas existants, adapter leur nominal à ce contrat explicite.

Ne pas ajouter de padding arbitraire interdit pour obtenir le cas over-cap : utiliser un fixture admissible dont la cap connue respecte le minimum scientifiqueS1 mais pas la taille de cette image, ou des données sources synthétiques réellement plus grandes. Si les valeurs de cap de test doivent changer, conserver les inégalités et débits/grants cohérents sans modifier seuils/numeric/oracles qualifiés ou couper un champ. Aucun actualBody natif inventé. Les longueurs restent non observées tant que le runner n'a pas exécuté le test.

Le même reviewer indépendant69 jugera si cette voie fixture lie bien la commande qu'elle consomme, et si les voies non définies restent non autorisantes. Ne pas déclarer B1 fermé sur la seule présence d'un champ sourceEnvelope ; toutes les comparaisons et sorties succès comptent.

## Droits et limites

Même allowlist69 : store/fixtures/atomic-test uniquement, source seulement ; autres fichiers readonly. Aucun test/typing/import produit/SQL/DB/opener/native/Git. Si un prérequis précis de cette forme locale manque encore, HOLD et signalement ciblé, pas nouveau contrat public ou nouvelle boucle de plan.000b et S2global restent ouverts, gateDB fermée jusqu'à revue.
