# 📚 Dictée Magique

Dictée Magique est une application web de dictée interactive, optimisée pour une expérience mobile et installable comme une PWA (Progressive Web App), notamment sur iPhone 12. 

## 🚀 Fonctionnalités principales
- Interface moderne et responsive (React + Vite + TailwindCSS)
- Installation sur l'écran d'accueil (PWA)
- Icône et écran de démarrage optimisés pour iPhone 12
- Fonctionne hors-ligne grâce au Service Worker
- Déploiement facile sur Vercel

## 🖥️ Lancer en local

**Prérequis :** Node.js >= 18

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Générer les assets PWA (icônes et splash screen) :
   ```bash
   npm run generate-assets
   ```
3. Lancer le serveur de développement :
   ```bash
   npm run dev -- --port 3000
   ```
   L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📱 Installation sur iPhone 12
1. Ouvre l'application dans Safari sur ton iPhone 12
2. Clique sur le bouton de partage (carré avec flèche)
3. Choisis « Sur l'écran d'accueil »
4. Profite d'une expérience comme une vraie app native !

## 🛠️ Scripts utiles
- `npm run generate-icons` : Génère l'icône PWA (180x180)
- `npm run generate-splash` : Génère le splash screen iPhone 12 (1170x2532)
- `npm run generate-assets` : Génère tous les assets PWA
- `npm run build` : Build de production (output dans `dist/`)

## ☁️ Déploiement sur Vercel
1. Pousse le code sur GitHub
2. Connecte le repo à [Vercel](https://vercel.com/)
3. Vercel détecte automatiquement Vite :
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Le fichier `vercel.json` gère la redirection SPA/PWA

## 📂 Structure du projet
- `public/icons/` : Icônes PWA
- `public/splash/` : Splash screen iPhone 12
- `public/manifest.json` : Manifest PWA
- `public/sw.js` : Service Worker
- `scripts/` : Scripts de génération d'assets

## ✨ Personnalisation
Pour d'autres appareils, adapte les scripts de génération d'assets et les balises dans `index.html`.

---

**Auteur :** Laurent S. — 2024

Licence : MIT
