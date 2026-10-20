# Contrat de raccordement audio SOS — non déployé

`src/sosTransport.js` est une bibliothèque testée, non raccordée à l'interface. Elle n'active aucun transfert réel. `captureSosAudio` peut fournir les fragments à son appelant via `onChunk` ; aucune destination réseau n'est branchée par défaut.

## Prérequis bloquants du serveur

1. Session utilisateur authentifiée par cookies sécurisés HttpOnly, Secure et politique SameSite adaptée. Vérification Origin et protection CSRF sur les opérations sensibles. Pas de secret dans une variable VITE_*.
2. Création d'une session SOS côté serveur après validation du consentement versionné et des destinataires choisis et vérifiés. Ne pas accepter une identité ou des droits transmis librement par le navigateur.
3. Endpoint HTTPS, sans redirection, acceptant les fragments binaires ; vérification du propriétaire de la session, état actif, durée maximale de réception et quotas serveur. En-têtes X-SOS-Session et X-SOS-Sequence. Validation du type et de la taille réelle du contenu. Séquence unique, déduplication ; contrôle CORS strict si origine différente.
4. Les limites client (32 fragments, 2 Mio par fragment, délai de requête 10 s) ne constituent pas des contrôles de sécurité serveur. Décider et imposer des limites serveur adaptées aux codecs, à la durée et au budget.
5. Stockage privé chiffré, aucun bucket public. Destinataires authentifiés et autorisés ; accès révocable, expiration, notifications ne contenant pas l'audio ni la position dans leurs aperçus.
6. Réponse 2xx = fragment accepté uniquement. Suivre séparément notification envoyée, accès du destinataire et accusé de réception ; ne pas confondre ces états.
7. Résolution et purge : première échéance entre clôture + 24 h et déclenchement + 72 h. Tâche serveur idempotente, reprise sur panne, contrôle de suppression et politique des sauvegardes documentée. Base légale des exceptions de conservation à valider séparément.
8. Audit minimal des accès et exports sans enregistrement de l'audio, des cookies, des jetons ou des coordonnées dans les logs applicatifs.

## Comportement client livré

- Ordre séquentiel, pas de parallélisme ni de répétition automatique après erreur.
- Annulation de requête par signal, timeout par requête, rejet des réponses non-2xx.
- Refus des URL non HTTPS, avec identifiants, paramètres ou fragments.
- Le navigateur peut retarder les timers en arrière-plan : arrêt et limite de durée également à imposer côté serveur. Tester sur appareils réels.

## Décisions et connexions restantes

Confirmer l'instance d'authentification/base de données et le stockage à utiliser, puis le canal de notification (SMS, courriel ou push). Fournir les accès par les mécanismes protégés des services, jamais dans une PR ou une conversation. Aucun fournisseur externe n'a été créé ou connecté par ce lot.
