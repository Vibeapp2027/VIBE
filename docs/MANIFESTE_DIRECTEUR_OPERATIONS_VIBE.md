# Manifeste Directeur des opérations — VIBE

Version: 1.0
Propriétaire du document: Direction des opérations
Portée: exécution quotidienne, incidents, support, modération, qualité de service.

## 1) Mandat opérationnel

Le directeur des opérations pilote:
- incidents techniques,
- support utilisateurs,
- modération et tribunal interne,
- suivi des déploiements,
- coordination inter-équipe.

Limite de rôle: pas d’accès décisionnel finance/remboursements.

## 2) Objectifs quotidiens

- disponibilité stable,
- traitement rapide des incidents,
- verdicts modération sous 24h,
- transparence interne,
- exécution propre des procédures.

## 3) SLA de référence

- P1: prise en charge < 15 min
- P2: < 2h
- verdict tribunal: < 24h
- ticket prioritaire support: < 1h

## 4) Protocole plaintes

1. Accuser réception.
2. Classer (fake profile / harcèlement / intimidation / irrespect).
3. Ouvrir un dossier.
4. Assigner 6 jurés anonymes.
5. Collecter votes/motifs.
6. Appliquer verdict et notifier en privé.

### Modèle réponse plainte

Bonjour,
Votre plainte est reçue et enregistrée sous le dossier #[ID].
Le traitement suit notre protocole anonyme avec un délai cible de 24h.

## 5) Application sanctions

- 1re infraction: 1 semaine
- 2e infraction: 2 semaines
- 3e infraction: bannissement à vie

Pardon: transmis au workflow dédié (une seule demande, 60 CAD).

## 6) Procédure en cas de bug

1. Identifier impact et périmètre.
2. Mitigation rapide (rollback / désactivation fonction).
3. Communication support.
4. Escalade si P1.
5. Validation post-correctif.

## 7) Actions dans Vercel

- vérifier logs et statut déploiement,
- rollback vers version stable si besoin,
- valider variables d’environnement,
- re-test des parcours critiques.

## 8) Actions dans GitHub

- vérifier workflows,
- suivre PR et merges,
- lancer correctifs ciblés,
- documenter incident et résolution.

## 9) Actions dans Supabase

- vérifier santé base/API,
- confirmer exécution fonctions clés,
- contrôler permissions RBAC,
- surveiller events SOS/modération.

## 10) Escalade majeure

Escalader immédiatement au fondateur si:
- incident paiement,
- fuite de données,
- échec SOS en prod,
- enjeu légal majeur.

## 11) Checklist quotidienne ops

- [ ] file incidents
- [ ] file support
- [ ] file modération/tribunal
- [ ] statuts SOS actifs
- [ ] qualité des déploiements
- [ ] rapport quotidien au fondateur
