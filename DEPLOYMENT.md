# VIBE — déploiement de production

Ce guide distingue le site public (frontend) du serveur d’API. Les fichiers du dépôt ne peuvent pas créer les DNS, certificats TLS ni les secrets de vos comptes d’hébergement.

## Frontend — Cloudflare Pages

- Dépôt : `Vibeapp2027/VIBE`, branche `main`.
- Commande de build : `npm ci && npm run build`.
- Répertoire de sortie : `dist`.
- Domaine personnalisé à ajouter dans Cloudflare Pages : `vibegay.ca` (ajouter aussi `www.vibegay.ca` si vous souhaitez servir le sous-domaine).
- Variables publiques à configurer dans Cloudflare Pages :

```dotenv
VITE_API_BASE_URL=https://api.vibegay.ca
VITE_API_HEALTH_URL=https://api.vibegay.ca/api/health
VITE_SOS_API_URL=https://api.vibegay.ca/api/sos/heartbeat
VITE_LOI25_POLICY_URL=https://vibegay.ca/confidentialite
VITE_TRANSLATION_HEALTH_URL=https://api.vibegay.ca/api/translation/health
VITE_VOICE_HEALTH_URL=https://api.vibegay.ca/api/voice/health
VITE_FREE_REGISTRATIONS_LIMIT=2500
VITE_YEARLY_PAID_TICKETS_LIMIT=500
VITE_YEARLY_PAID_TICKET_PRICE_CAD=99
VITE_NON_SUBSCRIBER_RADIUS_KM=20
VITE_HEALTHCHECK_TIMEOUT_MS=5000
VITE_GEOLOCATION_TIMEOUT_MS=10000
VITE_SOS_TIMEOUT_MS=10000
VITE_SOS_HEARTBEAT_MS=10000
```

Les variables `VITE_*` sont intégrées au JavaScript livré au navigateur : n’y mettez jamais de clé secrète. Les valeurs d’URL de santé et les fonctions associées ne fonctionneront que si les services et routes correspondants existent réellement.

## Backend — Render, Railway ou serveur Node

Configurer le service pour utiliser le sous-répertoire `backend` comme répertoire racine (Root Directory), la commande d’installation `npm install` et la commande de démarrage `npm start`. Le point d’entrée est `backend/server.js`; ses dépendances et son script de démarrage sont déclarés dans `backend/package.json`.

Variables privées du service backend :

```dotenv
NODE_ENV=production
PORT=3000
BASE_URL=https://vibegay.ca
CORS_ORIGIN=https://vibegay.ca
SUPABASE_URL=https://<projet>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<secret>
STRIPE_SECRET_KEY=<secret>
STRIPE_WEBHOOK_SECRET=<secret>
STRIPE_PRICE_PREMIUM=<price_id>
STRIPE_PRICE_FOUNDER=<price_id>
```

Ne publiez jamais ces secrets dans GitHub ou dans une variable `VITE_*`. Configurez `api.vibegay.ca` dans le fournisseur DNS pour qu’il pointe vers l’URL/target fournie par votre hébergeur backend, puis configurez ce domaine dans le service hébergé.

Le serveur répond sur `/api/health` même avant la configuration de Supabase. Les routes nécessitant Supabase ou Stripe renvoient une erreur de service non configuré plutôt que de simuler une opération réussie.

## Supabase et Stripe

Le schéma de base doit être créé dans Supabase avant d’utiliser les routes de données. Le SQL minimal est dans la section précédente de l’historique de déploiement et le schéma MVP est dans `backend/schema.sql`; vérifiez les politiques RLS et la correspondance des colonnes avec le code avant de l’exécuter en production.

Dans Stripe, créer un webhook `https://api.vibegay.ca/api/webhooks/stripe` avec l’événement `checkout.session.completed`, puis configurer son secret dans `STRIPE_WEBHOOK_SECRET`. Configurer également les identifiants de prix réels dans les variables du backend.

## Vérification après configuration

- `https://vibegay.ca` : le frontend s’affiche.
- `https://api.vibegay.ca/api/health` : le backend répond `status: ok`.
- `https://api.vibegay.ca/api/platform/status` : vérifie la connexion à Supabase.

Un workflow GitHub Pages vert confirme seulement que ce workflow a publié ses fichiers; il ne prouve ni le DNS du domaine, ni le déploiement Cloudflare, ni la disponibilité du backend. La configuration des domaines, DNS, certificats et secrets doit être faite dans les comptes d’hébergement correspondants.
