# Manifeste opérationnel VIBE (Fondateur + Directeur des opérations)

Version: 1.0
Portée: exploitation complète vibegay.ca (frontend, backend, modération, SOS, paiements, incidents)

---

## 1) État actuel et posture

- Le dépôt contient un frontend Vite/React, un socle backend SQL minimal (`/backend/schema.sql`, `/backend/functions.sql`, `/backend/openapi.json`) et des flows UI avancés (SOS, accès, profils).
- Certaines briques exigent encore de l’infrastructure active (providers paiement, notifications, monitoring 24/7, exécution API/Edge).
- Objectif d’exploitation: robustesse, vérité opérationnelle, anonymat modération, traçabilité.

---

## 2) Contacts, rôles et escalade

### 2.1 Contacts de référence (config actuelle)
- Fondateur / Finance: `vibegay666@hotmail.com`
- Directeur des opérations: `jmarcreid@gmail.com`
- Support: `support@vibegay.ca`

### 2.2 Rôles
- **Fondateur**: paiements, remboursements, décisions juridiques sensibles, accès total.
- **Directeur des opérations**: incidents techniques, modération, support, marketing ops, sans finance.
- **Modérateur/Juré**: traitement des dossiers selon protocole anonyme.

### 2.3 Qui appeler en cas de problème majeur
1. **P1 sécurité/SOS/paiement**: Fondateur + Directeur ops immédiatement.
2. **P1 indisponibilité site/API**: Directeur ops puis référent infra (Vercel/Supabase).
3. **P1 risque légal**: Fondateur + conseiller juridique externe.
4. **Urgence vitale immédiate**: services d’urgence locaux (ne jamais attendre le workflow applicatif).

> Important: ce manifeste ne remplace pas les obligations légales locales ni les protocoles des services d’urgence.

---

## 3) Classification incidents

- **P1 Critique**: fuite de données, SOS en panne, paiement cassé global, site inaccessible.
- **P2 Majeur**: fonctionnalité clé dégradée (modération, inscription, compatibilité).
- **P3 Mineur**: bug local, régression UI non bloquante.

SLA internes cibles:
- P1: prise en charge < 15 min, updates toutes 30 min.
- P2: prise en charge < 2h.
- P3: planification sprint.

---

## 4) Runbook global “si bug”

1. Ouvrir un incident (horodatage, impact, owner).
2. Geler les changements non urgents.
3. Identifier portée (frontend, API, DB, provider).
4. Mitiger rapidement (rollback, feature flag, bypass sûr).
5. Communiquer statut interne + support.
6. Corriger cause racine.
7. Vérifier (`lint`, `build`, checks manuels critiques).
8. Clôturer + post-mortem sous 48h.

---

## 5) Procédure Vercel (frontend/API edge)

### 5.1 Vérifications de base
- Dernier déploiement: statut Success/Failed.
- Variables d’environnement VITE_/API présentes en Production.
- Domaines/SSL valides.

### 5.2 Si incident prod
- Revenir au dernier déploiement sain (rollback).
- Vérifier logs runtime/functions.
- Couper temporairement features risquées via variables.

### 5.3 Checklist recovery Vercel
- [ ] Build vert local et CI
- [ ] Variables prod cohérentes
- [ ] Endpoint santé OK (`/healthz.json` + API health)
- [ ] Test navigation + SOS + accès + compatibilité

---

## 6) Procédure GitHub (code, PR, actions)

### 6.1 Flux standard
- Branche dédiée
- PR avec résumé, risques, plan de rollback
- Validation lint/build/secrets
- Merge contrôlé

### 6.2 Si workflow échoue
- Ouvrir logs Actions
- Identifier step en erreur
- Corriger minimalement
- Relancer workflow

### 6.3 Recovery GitHub
- [ ] Restaurer commit stable
- [ ] Vérifier fichiers critiques (`src/`, `backend/`, `.env.example`)
- [ ] Repasser validation avant redéploiement

---

## 7) Procédure Supabase/PostgreSQL

### 7.1 Déploiement backend minimal
1. Exécuter `backend/schema.sql`
2. Exécuter `backend/functions.sql`
3. Brancher endpoints API selon `backend/openapi.json`

### 7.2 Contrôles après migration
- Tables présentes (`users_app`, `role_assignments`, `moderation_cases`, `sos_sessions`, `payments`, etc.)
- Fonctions présentes (`allocate_onboarding_offer`, `assign_random_jury`, `sos_heartbeat`, etc.)
- Permissions RBAC valides
- Audit immuable (update/delete refusés sur `audit_logs`)

### 7.3 Sauvegarde / restauration
- Activer sauvegardes automatiques DB
- Tester restauration sur environnement staging
- Documenter RPO/RTO

---

## 8) Plaintes, harcèlement, tribunal anonyme

### 8.1 Règle de traitement
- Ouvrir dossier modération depuis signalement.
- Assigner 6 jurés aléatoires anonymes.
- Rendre verdict sous 24h.
- Notifier la personne concernée en privé.

### 8.2 Échelle sanctions
- 1re infraction: 1 semaine
- 2e: 2 semaines
- 3e: bannissement à vie

### 8.3 Pardon payant
- Une seule demande par utilisateur
- 60 CAD
- Décision tracée + audit

### 8.4 Modèle réponse plainte (template)

```
Objet: Accusé de réception – dossier #[ID]

Bonjour,
Nous confirmons la réception de votre plainte. Votre dossier #[ID] est en cours de traitement
selon notre protocole de modération anonyme.

Délai cible: verdict sous 24 heures.

Merci,
Équipe VIBE
```

### 8.5 Modèle verdict (template)

```
Objet: Verdict final – dossier #[ID]

Bonjour,
Le dossier #[ID] a été clôturé.
Verdict: [dismissed|warning|suspend_1_week|suspend_2_weeks|ban_lifetime]
Application: [date début] -> [date fin / permanent]

Cette décision est enregistrée et traçable.

Équipe VIBE
```

---

## 9) SOS / Mode Ange opérationnel

### 9.1 Conditions de fonctionnement
- Contacts de confiance requis
- Déclenchement discret triple tape (UI)
- Session SOS: GPS continu + état capture vocale
- Heartbeat périodique au backend

### 9.2 En cas d’échec SOS
- Basculer immédiatement en mode simulé explicite
- Afficher message de non-transmission
- Escalader P1 si backend SOS était censé être actif

### 9.3 Checklist SOS prod
- [ ] Endpoint session start OK
- [ ] Heartbeat reçu en base
- [ ] Contacts notifiés (provider)
- [ ] Clôture session fonctionnelle

---

## 10) Paiement / remboursement

### 10.1 Règles business actuelles
- Jusqu’à 2500 inscriptions: gratuit
- À partir du 2501e: flux payant
- Produit annuel: 500 billets à 99 CAD paiement unique

### 10.2 Contrôles paiements
- Vérifier statut provider vs base interne
- Vérifier idempotence webhook
- Vérifier journal d’audit

### 10.3 Remboursements
- Autorité: fondateur uniquement (selon RBAC)
- Motif obligatoire
- Traçabilité complète (qui, quand, pourquoi)

### 10.4 Message remboursement (template)

```
Objet: Mise à jour remboursement – dossier #[ID]

Bonjour,
Votre demande #[ID] a été [approuvée/refusée].
Détail: [raison].
Statut paiement: [pending/succeeded/failed/refunded].

Équipe VIBE
```

---

## 11) Compatibilité, profils et décisions

- Score compatibilité 0-100 + explication courte
- Décision garder/rejeter pour profils peu compatibles
- Suggestion IA brise-glace unique, arrêt si interaction reste froide
- Journaliser décisions et événements IA

---

## 12) Checklists quotidiennes

### Fondateur
- [ ] Revenus, chargebacks, remboursements
- [ ] Incidents P1/P2
- [ ] Santé légale/compliance
- [ ] Revue sécurité hebdo

### Directeur des opérations
- [ ] Dashboard incidents
- [ ] Files modération et SLA 24h
- [ ] Statut SOS actifs
- [ ] Qualité support (SLA)
- [ ] État déploiements

---

## 13) Post-mortem minimal (modèle)

```
Incident ID:
Date:
Impact:
Cause racine:
Ce qui a bien marché:
Ce qui a échoué:
Action corrective immédiate:
Action préventive (owner + deadline):
```

---

## 14) Rappels sécurité absolus

- Jamais de secrets dans GitHub.
- Principe du moindre privilège.
- Logs d’audit non modifiables.
- Tests de restauration réguliers.
- Transparence: ne jamais afficher “opérationnel” sans preuve réelle.
