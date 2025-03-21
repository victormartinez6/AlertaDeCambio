import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as flags from 'country-flag-icons/flags/4x3/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const flagsDir = path.join(__dirname, '..', 'src', 'assets', 'flags');

// Ensure flags directory exists
if (!fs.existsSync(flagsDir)) {
  fs.mkdirSync(flagsDir, { recursive: true });
}

// Map of currency codes to country codes
const currencyToCountry = {
  USD: 'US',
  EUR: 'EU',
  GBP: 'GB',
  CAD: 'CA',
  AUD: 'AU',
  JPY: 'JP',
  CNY: 'CN',
  CHF: 'CH',
};

// Download and save each flag
Object.entries(currencyToCountry).forEach(([currency, country]) => {
  const flagSvg = flags[country];
  if (flagSvg) {
    fs.writeFileSync(
      path.join(flagsDir, `${country.toLowerCase()}.svg`),
      flagSvg
    );
    console.log(`✓ Saved ${country}.svg`);
  } else {
    console.error(`✗ Flag not found for ${country}`);
  }
});
