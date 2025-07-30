# Plan de Test - Dictée Magique

## 🚀 Serveur Local
- **URL** : http://localhost:5173
- **Statut** : ✅ Opérationnel

## 📋 Tests à Effectuer

### 1. **Interface de Base**
- [ ] Page se charge correctement
- [ ] Titre "Dictée Magique" visible
- [ ] Zone de texte principale présente
- [ ] 4 boutons visibles : Effacer, Microphone, Copier, Sauvegarder

### 2. **Reconnaissance Vocale**
- [ ] Test de compatibilité navigateur
- [ ] Permission microphone accordée
- [ ] Démarrage de la dictée (bouton microphone)
- [ ] Affichage du texte en temps réel
- [ ] Arrêt de la dictée
- [ ] Gestion des erreurs (pas de microphone, réseau, etc.)

### 3. **Fonctionnalités de Texte**
- [ ] Saisie manuelle dans la zone de texte
- [ ] Bouton "Effacer" fonctionne
- [ ] Bouton "Copier" copie le texte dans le presse-papiers
- [ ] Notifications d'action (copie, effacement)

### 4. **Nouvelle Fonctionnalité : Sauvegarde des Notes**
- [ ] Bouton "Sauvegarder la note" visible (vert)
- [ ] Sauvegarde d'une note avec du texte
- [ ] Notification "Note sauvegardée !"
- [ ] Section "Notes Sauvegardées" apparaît
- [ ] Carte de note affichée avec :
  - Timestamp relatif ("Il y a X minutes")
  - Aperçu du texte (4 lignes max)
  - Bouton croix rouge pour supprimer
  - Indication "Cliquez pour copier"

### 5. **Gestion des Notes Sauvegardées**
- [ ] Clic sur une carte copie le texte
- [ ] Notification "Note copiée !"
- [ ] Clic sur la croix rouge supprime la note
- [ ] Notification "Note supprimée"
- [ ] Section disparaît si plus de notes

### 6. **Persistance des Données**
- [ ] Rechargement de la page
- [ ] Notes sauvegardées toujours présentes
- [ ] Timestamps mis à jour correctement

### 7. **Responsive Design**
- [ ] Test sur mobile (iPhone 12)
- [ ] Test sur tablette
- [ ] Test sur desktop
- [ ] Grille des notes s'adapte (1/2/3 colonnes)

### 8. **Accessibilité**
- [ ] Navigation au clavier
- [ ] Lecteurs d'écran (aria-label)
- [ ] Contraste des couleurs
- [ ] Focus visible

### 9. **PWA (Progressive Web App)**
- [ ] Installation sur l'écran d'accueil
- [ ] Icône personnalisée
- [ ] Splash screen
- [ ] Fonctionnement hors-ligne

## 🐛 Bugs Potentiels à Vérifier

### Reconnaissance Vocale
- [ ] Reconnaissance s'arrête inopinément
- [ ] Texte dupliqué ou manquant
- [ ] Erreurs de réseau non gérées
- [ ] Permissions microphone refusées

### Sauvegarde des Notes
- [ ] Notes vides sauvegardées
- [ ] Doublons de notes
- [ ] Perte de données localStorage
- [ ] Timestamps incorrects

### Interface
- [ ] Boutons désactivés quand ils devraient être actifs
- [ ] Notifications qui ne disparaissent pas
- [ ] Cartes qui ne se redimensionnent pas
- [ ] Texte tronqué incorrectement

## 📱 Tests Spécifiques Mobile

### iPhone 12
- [ ] Interface adaptée à l'écran
- [ ] Boutons de taille appropriée
- [ ] Reconnaissance vocale optimale
- [ ] Installation PWA fonctionnelle

### Safari Mobile
- [ ] Compatibilité SpeechRecognition
- [ ] Permissions microphone
- [ ] localStorage fonctionnel
- [ ] Copie dans presse-papiers

## 🔧 Tests Techniques

### Performance
- [ ] Chargement rapide de l'application
- [ ] Pas de lag lors de la dictée
- [ ] Gestion mémoire (notes nombreuses)
- [ ] Build de production fonctionnel

### Compatibilité
- [ ] Chrome/Chromium
- [ ] Safari
- [ ] Firefox
- [ ] Edge

## ✅ Checklist de Validation

- [ ] Toutes les fonctionnalités de base fonctionnent
- [ ] Nouvelle fonctionnalité de sauvegarde opérationnelle
- [ ] Interface responsive et accessible
- [ ] PWA installable et fonctionnelle
- [ ] Pas d'erreurs console
- [ ] Performance satisfaisante
- [ ] Tests sur différents appareils

---

**Date de test** : $(date)
**Testeur** : Développeur
**Version** : Avec fonctionnalité de sauvegarde des notes 