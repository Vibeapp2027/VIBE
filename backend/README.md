# Backend VIBE

Ce dossier peut être déployé comme un service Node séparé du frontend.

- Répertoire racine du service : `backend`
- Installation : `npm install`
- Démarrage : `npm start`
- Santé : `GET /api/health`

Les dépendances runtime sont déclarées dans `package.json`. Configurez les secrets côté hébergeur uniquement; voir `../DEPLOYMENT.md`. Sans secrets, le serveur peut démarrer et fournir le health check, mais les paiements et accès Supabase ne sont pas opérationnels.

Le backend demeure un MVP : l’authentification des utilisateurs, le contrôle d’accès administrateur, la configuration des politiques RLS, les notifications SOS et les validations de sécurité/juridiques doivent être terminés avant d’exposer les fonctions sensibles à de vrais utilisateurs.
