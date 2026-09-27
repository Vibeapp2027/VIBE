# VIBE (vibegay.ca)

Application frontend React/Vite en français avec tableau de bord communautaire, salon audio, boutique et Mode Ange/SOS.

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

- `VITE_API_HEALTH_URL`, `VITE_SUPABASE_HEALTH_URL`, `VITE_LOI25_POLICY_URL`
  - Si vides: statut **non configuré**.
  - Si configurées: vérification HTTP réelle au chargement (`vérification en cours`, puis `opérationnel` ou `indisponible`).
- `VITE_SOS_API_URL`
  - Si vide: Mode Ange en **simulation explicite** (aucun envoi réel).
  - Si configurée: un SOS n'est affiché comme transmis que si la réponse backend retourne `{"confirmed": true}`.
- `VITE_ADMIN_CONTACT_EMAIL`
  - Adresse admin affichable côté client (par défaut `vibegay666@hotmail.com`).
- `VITE_SUPPORT_CONTACT_EMAIL`
  - Adresse support affichable côté client (par défaut `support@vibegay.ca`).

> Ne jamais commiter de mot de passe, token SMTP, clé API ou autre secret dans le dépôt.

## Mode Ange / SOS

- La géolocalisation dépend du consentement utilisateur et des permissions navigateur.
- Les erreurs de permission, délais et réseau sont gérées explicitement.
- Sans backend configuré, l'UI reste utilisable mais identifie clairement le mode simulé.

## Santé applicative et monitoring

- Endpoint statique: `/healthz.json`
- Portée: disponibilité frontend statique uniquement.
- La surveillance 24/7, les alertes (UptimeRobot/Better Uptime), logs et incidents (ex. Sentry) doivent être configurés séparément.

## Emails: limites non automatisables

Le code prépare uniquement la configuration et la documentation des adresses de contact.

- `vibegay666@hotmail.com` peut être utilisée comme contact administrateur via `VITE_ADMIN_CONTACT_EMAIL`.
- `support@vibegay.ca` doit être configurée chez votre fournisseur email/domaine (DNS, boîte, redirection, transfert).

Le dépôt ne peut pas modifier automatiquement Hotmail, DNS, ou la messagerie du fournisseur sans accès externe sécurisé.
