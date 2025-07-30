# 🚀 Configuration Vercel pour Dictée Magique

## 📋 **Variables d'Environnement Requises**

### **1. GEMINI_API_KEY**
Cette variable est **obligatoire** pour que l'IA fonctionne sur Vercel.

#### **Comment l'ajouter :**

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre projet** "dict"
4. **Cliquez sur "Settings"** (Paramètres)
5. **Allez dans "Environment Variables"**
6. **Cliquez sur "Add New"**

#### **Configuration :**
- **Name** : `GEMINI_API_KEY`
- **Value** : `votre_cle_api_gemini_ici`
- **Environment** : 
  - ✅ **Production**
  - ✅ **Preview** 
  - ✅ **Development**

### **2. Obtention de la Clé API Gemini**

1. **Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)**
2. **Connectez-vous** avec votre compte Google
3. **Cliquez sur "Create API Key"**
4. **Copiez la clé** générée
5. **Collez-la** dans la variable d'environnement Vercel

## 🔧 **Vérification de la Configuration**

### **Test Local :**
```bash
# Vérifiez que le fichier .env existe
ls -la .env

# Vérifiez le contenu (sans afficher la clé)
cat .env | grep -v API_KEY
```

### **Test Vercel :**
1. **Déployez** votre application
2. **Ouvrez** l'application en production
3. **Sauvegardez une note** avec le bouton "Sauvegarder avec IA"
4. **Vérifiez** que vous obtenez "Note enrichie par l'IA !"

## 🐛 **Dépannage**

### **Problème : "Note (IA non disponible)"**

**Solutions :**
1. ✅ **Vérifiez** que `GEMINI_API_KEY` est définie dans Vercel
2. ✅ **Vérifiez** que la clé API est valide
3. ✅ **Redéployez** l'application après avoir ajouté la variable
4. ✅ **Vérifiez** les logs Vercel pour les erreurs

### **Problème : Erreur 500 sur Vercel**

**Solutions :**
1. ✅ **Vérifiez** que la clé API n'est pas vide
2. ✅ **Vérifiez** que la clé API est correctement formatée
3. ✅ **Vérifiez** les quotas de l'API Gemini

## 📝 **Structure des Variables**

```env
# .env (local)
GEMINI_API_KEY=votre_cle_api_gemini_ici

# Vercel Environment Variables
GEMINI_API_KEY=votre_cle_api_gemini_ici
```

## 🔒 **Sécurité**

- ✅ **Ne committez jamais** votre clé API dans Git
- ✅ **Utilisez** des variables d'environnement
- ✅ **Limitez** l'accès à votre clé API
- ✅ **Surveillez** l'utilisation de votre quota

## 🎯 **Fonctionnalités IA**

Une fois configurée, l'IA permettra :
- ✅ **Enrichissement automatique** des notes
- ✅ **Génération d'e-mails** professionnels
- ✅ **Génération de SMS** synthétiques
- ✅ **Chat interactif** avec l'IA
- ✅ **Suggestions** d'approfondissement 