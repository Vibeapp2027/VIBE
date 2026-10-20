# Livraison progressive — sécurité et temps réel

Ce document est un cahier de mise en œuvre, pas une attestation juridique ni une preuve de service opérationnel.

## Lot livré dans cette PR

Choix de découverte modifiable pendant la session : tous les profils ou les plus compatibles d'abord. Aucun profil n'est exclu par le tri. Les profils et scores actuels restent explicitement fictifs. Pas de moteur IA ni de disponibilité 24/7 revendiquée.

## SOS — critères bloquants avant production

- Triple appui ; audio transmis pendant 30 secondes maximum après déclenchement, sans écoute permanente préalable.
- Consentements séparés et non précochés : audio, localisation et destinataires nommés. Permissions navigateur en complément, non en remplacement du consentement.
- Révocation et arrêt accessibles ; refus du micro sans blocage des autres fonctions communautaires.
- Destinataires et signification de « SOS trouvé/résolu » à confirmer.
- Proposition de conservation à valider : suppression à la première échéance entre clôture + 24 h et déclenchement + 72 h. Si non clôturé : déclenchement + 72 h. Application serveur, stockage, copies et sauvegardes à documenter ; les copies exportées chez les destinataires ne sont pas effaçables à distance.
- Ne pas annoncer une livraison sans accusé de réception. Signaler hors-ligne et échecs ; pas de garantie de remplacement du 911.
- Authentification, autorisations serveur, chiffrement, liens temporaires, journal des accès et purge vérifiée indispensables.
- Évaluation des facteurs relatifs à la vie privée, responsable identifié, politique de confidentialité, procédure d'incident, droits des personnes et contrats fournisseurs à valider avant collecte réelle. Examiner les voix de tiers et les traitements hors Québec avec un juriste.

## Autres lots non livrés

- Temps réel : identité authentifiée, présence expirante, messages et likes autorisés côté serveur ; état déconnecté/reconnexion visible. Jamais de faux utilisateurs présentés comme réels.
- Compatibilité : préférences autorisées et explications ; aucune utilisation de données SOS, cardiaques ou de déplacements ; navigation sans score si l'IA tombe.
- Montres : rythme cardiaque et vibrations via intégrations compatibles à confirmer. Consentements distincts, intensité plafonnée, pause, blocages et protection contre le pistage. Aucune promesse médicale.
- Empreintes : dépôt volontaire, audience et expiration choisies, suppression ; pas de publication automatique de trajets ou données SOS.
- Salons : audio avant identité, profils flottants, brouillard à dévoilement volontaire, son progressif, DJ désactivable. Infrastructure audio multi-utilisateurs et droits musicaux à établir.
- Globe : présentation terrestre, limite gratuite de 20 km et portée abonnée à faire respecter côté serveur sans exposer la position précise.
- Traduction : dix langues, fournisseur à connecter et confidentialité à évaluer.
- Soirée fantôme vendredi 17–21 h : fuseau horaire et consentement à confirmer ; l'anonymat doit être protégé côté serveur, pas seulement par un effet visuel.
- Administration : fondateur et directeur avec contrôle serveur ; finances et remboursements réservés au fondateur. Pas d'immunité secrète aux signalements. Attribution de billets tracée et révocable.
- Modération : jury de six avec conflits d'intérêts, minimisation des preuves et recours ; sanctions et réactivation payante à examiner juridiquement avant implémentation.
- Paiements, DNS, courriels et réseaux sociaux : connexions autorisées nécessaires ; aucune connexion effectuée par cette PR. Aucun secret en frontend. Automatisation financière et publication soumises à contrôles explicites.

## Références juridiques de cadrage

- Loi québécoise sur la protection des renseignements personnels dans le secteur privé, notamment articles 3.3, 13, 14 et 17 : https://www.legisquebec.gouv.qc.ca/fr/document/lc/P-39.1
- Consentement valable : https://www.priv.gc.ca/fr/sujets-lies-a-la-protection-de-la-vie-privee/lois-sur-la-protection-des-renseignements-personnels-au-canada/la-loi-sur-la-protection-des-renseignements-personnels-et-les-documents-electroniques-lprpde/p_principle/principles/p_consentement/

Aucune garantie de conformité, de zéro panne ou de classement commercial mondial n'est donnée.
