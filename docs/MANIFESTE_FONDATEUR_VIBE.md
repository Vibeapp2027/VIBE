# Manifeste Fondateur — VIBE

Version: 1.0
Propriétaire du document: Fondateur
Portée: gouvernance complète, sécurité, finance, incidents majeurs, conformité.

## 1) Mandat du fondateur

Le fondateur est responsable des décisions finales sur:
- finance (paiements, remboursements, chargebacks),
- sécurité et conformité,
- décisions critiques de modération,
- stratégie produit et gestion des risques.

## 2) Priorités non négociables

- Aucune fausse promesse opérationnelle (SOS, temps réel, disponibilité).
- Aucun secret dans GitHub.
- Journal d’audit immuable actif pour toute action sensible.
- Séparation stricte des permissions finance.
- Protection des données personnelles et anonymat des jurés.

## 3) Supervision des départements

### Technique
- uptime, latence, erreurs critiques, déploiements.
- suivi Vercel + Supabase + GitHub Actions.

### Opérations / support
- SLA de réponse,
- qualité de traitement des plaintes,
- incidents en cours.

### Modération / tribunal interne
- tirage de 6 jurés anonymes,
- verdict sous 24h,
- application cohérente des sanctions.

### Finance
- encaissements, litiges, remboursements,
- contrôle anti-fraude,
- audit des transactions.

## 4) Protocole plainte et sanction

- 1re infraction: suspension 1 semaine
- 2e infraction: suspension 2 semaines
- 3e infraction: bannissement à vie
- pardon: une seule demande, 60 CAD, tracée

## 5) Procédure d’incident majeur

1. Déclarer incident (P1/P2/P3) avec horodatage.
2. Nommer le responsable incident.
3. Stabiliser immédiatement (rollback/feature off).
4. Informer direction ops + support.
5. Corriger cause racine.
6. Post-mortem sous 48h.

## 6) Runbook Vercel

- Vérifier statut déploiement.
- Vérifier variables de prod.
- Vérifier domaine/SSL.
- Revenir au dernier déploiement stable en cas de P1.

## 7) Runbook GitHub

- Vérifier workflows CI/CD.
- Revoir diff PR avant merge.
- En cas de régression: revert et redéployer.

## 8) Runbook Supabase

- appliquer `backend/schema.sql`, puis `backend/functions.sql`.
- valider RBAC et audit immutable.
- vérifier fonctions métiers (onboarding, jury, sanctions, SOS).

## 9) Paiement et remboursement

- fondateur = autorité finale.
- remboursement avec motif obligatoire.
- toute décision documentée dans l’audit.

## 10) Escalade: qui appeler

- P1 sécurité/SOS/paiement: fondateur + directeur ops immédiat.
- P1 indisponibilité infra: directeur ops + support Vercel/Supabase.
- risque légal: fondateur + conseil juridique.

## 11) Checklist quotidienne fondateur

- [ ] état incidents P1/P2
- [ ] santé paiements/remboursements
- [ ] conformité et sécurité
- [ ] état modération/tribunal
- [ ] arbitrages stratégiques
