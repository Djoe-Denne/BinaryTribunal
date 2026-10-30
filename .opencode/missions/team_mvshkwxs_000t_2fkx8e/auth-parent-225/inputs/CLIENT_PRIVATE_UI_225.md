# Projection non secrète du protocole client Auth225

Projection faite par le superviseur depuis ses lectures autorisées du candidat Temp198. Aucune valeur réelle de code OAuth, token, mot de passe ou base privée. Client courant gel225 : `bcaf3c88c4ba3a1ab286cb0a43044ee3c90a2d00d2dc744d5856d553977f6673`. Le helper privé est inchangé par la correction du root.

Le constructeur ne réessaie pas les lectures external_directory refusées et ne lance aucun outil/processus/test. Cette projection est son input local autorisé. Seuls les deux fichiers candidats nommés au rapport225 sont ses sorties.

## Protocole exact

Le client envoie deux probes READY séquentielles : la première avant préflight, la deuxième immédiatement avant le claim CONNECT. Il envoie ensuite un seul CHALLENGE après le claim, la réception de tentative et son enregistrement durable, puis l'accusé de réception du bootstrap.

READY a exactement trois clés :

```ts
{ type: "RMS_AUTH_PRIVATE_UI_READY", intentId, uiNonce }
```

CHALLENGE a exactement quatre clés :

```ts
{ type: "RMS_AUTH_PRIVATE_UI_CHALLENGE", intentId, uiNonce, challenge }
```

`uiNonce` est une chaîne de64caractères hexadécimaux minuscules, nouvelle à chaque échange. `intentId` est le UUID retenu par le parent pour cette invocation.

Le challenge est exactement :

```ts
{
  attemptId: string, // /^con_[A-Za-z0-9_]{1,160}$/
  url: "https://auth.openai.com/codex/device",
  code: string, // /^[A-Z0-9]{3,8}(?:-[A-Z0-9]{3,8}){0,2}$/
  created: number, // entier sûr ; created <= Date.now()
  expires: number  // entier sûr ; Date.now() < expires
}
```

Les ACK vers le même enfant RMS ont exactement trois clés, sans champ ok, challenge ou code :

```ts
{ type: "RMS_AUTH_PRIVATE_UI_READY_ACK", intentId, uiNonce }
{ type: "RMS_AUTH_PRIVATE_UI_CHALLENGE_ACK", intentId, uiNonce }
```

Le client attend chaque ACK au plus min(5000ms, temps restant moins15000ms). Un ACK d'interface ne vaut ni fin de login humain ni succès OAuth. Une perte de canal après claim n'autorise pas un second CONNECT.

## Extrait privé client892–907, structure et gardes projetées

```ts
const privateUi = async (challenge?: ReturnType<typeof ownedAuthChallengeV1>) => {
  current();
  ownedNeedV1(process.connected && typeof process.send === "function", "auth private parent UI IPC required");
  const uiNonce = randomBytes(32).toString("hex");
  const type = challenge ? "RMS_AUTH_PRIVATE_UI_CHALLENGE" : "RMS_AUTH_PRIVATE_UI_READY";
  // Listener client : ignorer autres types ; pour type_ACK vérifier EXACTEMENT
  // les trois clés type/intentId/uiNonce et leurs valeurs attendues.
  // Un ACK divergent refuse ; timeout ou abort refuse ; finally retire les
  // listeners et le timer puis refait current().
  // Le callback send ne journalise ni message privé ni erreur importée.
  process.send!({ type, intentId: config.intentId, uiNonce, ...(challenge ? { challenge } : {}) }, callback);
};
```

Contexte995 : `await privateUi(challenge);` — code et URL uniquement ici, jamais dans résultat/journal/logs. Les faits de protocole ci-dessus sont les valeurs exactes ; le bloc projeté omet les types locaux et les détails de nettoyage, non requis pour réaliser le relais.

## API parent ratifiée

`createPrivateUiRelay({windowScriptPath,powershellPath,deadlineMonotonicMs})` : import sans effet. `start()` démarre explicitement la fenêtre et attend son READY réel borné. Le parent prépare cette fenêtre avant de lancer RMS. `bindOwnedChild(child,intentId)` s'applique une seule fois au ChildProcess réel possédé, installe son handler immédiatement après spawn et avant de rendre la main. `close()` ferme seulement les ressources possédées avec attente bornée et état public non secret.

La deadline monotone externe ne se réinitialise jamais dans start/bind/message ; plafond240s. Le relais respecte aussi la réserve15s et la borne5s par échange. Formes de messages entre fenêtre et relais à fermer localement, avec READY/ACK/CLOSED sans secrets. Aucun ACK client avant réception effective par une fenêtre vivante. Deux READY puis un CHALLENGE ; doublon, divergence, mauvaise cible, clôture ou délai dépassé refusent la suite sans retry ni fallback.

Fenêtre Forms STA au bureau utilisateur courant, challenge en contrôle mémoire seulement. URL officielle constante ouverte uniquement sur clic humain. Pas de presse-papiers automatique, secret argv, fichier, sortie console, chat, capture, serveur ou nouvelle dépendance. Erreurs en codes bornés ; aucune exception brute. Les messages privés ne sont jamais une preuve publique d'authentification.
