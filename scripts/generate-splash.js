import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/splash');

// Assurez-vous que le dossier de sortie existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Créer l'écran de démarrage pour iPhone 12 (1170x2532)
sharp(inputSvg)
  .resize(400, 400) // Taille de l'icône sur l'écran de démarrage
  .extend({
    top: 1066,
    bottom: 1066,
    left: 385,
    right: 385,
    background: { r: 79, g: 70, b: 229, alpha: 1 } // Même couleur que l'icône
  })
  .png()
  .toFile(path.join(outputDir, 'apple-splash-1170-2532.png'))
  .then(() => console.log('Generated splash screen'))
  .catch(err => console.error('Error generating splash screen:', err)); 