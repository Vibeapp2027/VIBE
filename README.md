# VIBE (vibegay.ca)

Application frontend React/Vite en français avec tableau de bord communautaire, salon audio, boutique, profils/match et Mode Ange/SOS.

## Installation

```bash
npm install
npm run dev
```

## Qualité

```bash
npm run lint
npm run build
```

## Configuration (`.env`)

Copiez `.env.example` vers `.env` puis adaptez les variables `VITE_*`.

### Statuts de services

- `VITE_API_HEALTH_URL`, `VITE_SUPABASE_HEALTH_URL`, `VITE_LOI25_POLICY_URL`, `VITE_TRANSLATION_HEALTH_URL`, `VITE_VOICE_HEALTH_URL`
  - Si vides: statut **non configuré**.
  - Si configurées: vérification HTTP au chargement (`vérification en cours`, puis `opérationnel` ou `indisponible`).

### Mode Ange / SOS

- `VITE_SOS_API_URL`
  - Si vide: Mode Ange en **simulation explicite** (aucun envoi réel).
  - Si configurée: un SOS n’est affiché comme transmis que si la réponse backend retourne `{"confirmed": true}`.

### Rôles de contact affichés

- `VITE_ADMIN_CONTACT_EMAIL` (fondateur / finance)
- `VITE_OPERATIONS_DIRECTOR_NAME`
- `VITE_OPERATIONS_DIRECTOR_EMAIL`
- `VITE_SUPPORT_CONTACT_EMAIL`

### Règles inscription et billets

- `VITE_FREE_REGISTRATIONS_LIMIT` (par défaut 2500)
- `VITE_FREE_REGISTRATIONS_USED`
- `VITE_YEARLY_PAID_TICKETS_LIMIT` (par défaut 500)
- `VITE_YEARLY_PAID_TICKETS_SOLD`
- `VITE_YEARLY_PAID_TICKET_PRICE_CAD` (par défaut 99)

L’UI affiche la bascule du quota gratuit vers les billets payants annuels (paiement unique), mais l’encaissement réel nécessite un backend de paiement.

## Fonctionnalités UI ajoutées

- Tarifs visibles: 1 semaine, 1 mois, 3 mois, 6 mois, 1 an, boost.
- Profils avec mode fantôme: silhouette masquée par brouillard et bouton de dévoilement.
- Clic profil: effet chuchotement local navigateur.
- Match simulé: flash blanc + message de match lors de clics rapprochés (simulation locale).
- Traduction 10 langues affichée avec statut de disponibilité (backend requis pour vrai temps réel).

## Santé applicative et monitoring

- Endpoint statique: `/healthz.json`
- Portée: disponibilité frontend statique uniquement.
- Surveillance 24/7, alertes (UptimeRobot/Better Uptime), logs et incidents (ex. Sentry) à configurer séparément.

## Limites importantes

- Aucun secret (mot de passe, token SMTP, clé API) ne doit être commité.
- Les permissions fortes (ex. directeur des opérations sans accès finance) nécessitent un backend RBAC.
- Les fonctions temps réel (voix, traduction, match cross-utilisateurs) nécessitent infrastructure backend/WebSocket.
