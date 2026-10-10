# Backend minimal (MVP) — VIBE

Ce dossier implémente une base backend minimale alignée à la spec: RBAC, modération/tribunal anonyme, sanctions/pardon, SOS temps réel, abonnements 2500/500, compatibilité, notifications et audit.

## Fichiers

- `schema.sql` : tables, types, contraintes et audit immuable.
- `functions.sql` : fonctions métier clés.
- `openapi.json` : contrat d’API minimal.

## Exécution (PostgreSQL/Supabase)

1. Exécuter `schema.sql`.
2. Exécuter `functions.sql`.
3. Publier les endpoints applicatifs en s’appuyant sur `openapi.json`.

## Règles incluses

- RBAC strict (fondateur, directeur ops, modérateur, juré, utilisateur).
- Finance/paiement/remboursement isolés par permission dédiée.
- Tribunal interne anonymisé: tirage aléatoire de 6 jurés.
- Décision attendue sous 24h avec escalade des dossiers en retard.
- Sanctions progressives: 1 semaine, 2 semaines, puis bannissement à vie.
- Pardon unique: 60 CAD, une seule fois par utilisateur.
- SOS: création de session, heartbeat GPS/voix, clôture de session.
- Allocation serveur des offres: gratuit jusqu’à 2500, puis 500 billets annuels payants à 99 CAD.

## Limites de cette implémentation minimale

- Le contrat API est fourni, mais la couche HTTP (serveur/edge functions) reste à brancher.
- Les notifications externes (SMS/email/push) nécessitent des providers.
- Le scoring IA de compatibilité doit être alimenté par un moteur dédié.
