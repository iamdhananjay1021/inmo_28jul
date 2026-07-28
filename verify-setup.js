#!/usr/bin/env node

/**
 * SFA Live Admin Panel - Setup Verification Script
 * Run this to verify your installation is complete
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

const checkFile = (filePath, description) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`${description}`);
    return true;
  } else {
    log.error(`${description} - Missing: ${filePath}`);
    return false;
  }
};

const checkDirectory = (dirPath, description) => {
  const fullPath = path.join(__dirname, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    log.success(`${description}`);
    return true;
  } else {
    log.error(`${description} - Missing: ${dirPath}`);
    return false;
  }
};

console.log(`
${colors.bold}${colors.blue}
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        SFA Live Admin Panel - Setup Verification     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}
`);

let allChecks = true;

// Check Core Files
log.header('📁 Core Files');
allChecks &= checkFile('package.json', 'Package configuration');
allChecks &= checkFile('vite.config.js', 'Vite configuration');
allChecks &= checkFile('tailwind.config.js', 'Tailwind configuration');
allChecks &= checkFile('postcss.config.js', 'PostCSS configuration');
allChecks &= checkFile('index.html', 'HTML entry point');

// Check Source Structure
log.header('📂 Source Structure');
allChecks &= checkDirectory('src', 'Source directory');
allChecks &= checkDirectory('src/components', 'Components directory');
allChecks &= checkDirectory('src/contexts', 'Contexts directory');
allChecks &= checkDirectory('src/layouts', 'Layouts directory');
allChecks &= checkDirectory('src/pages', 'Pages directory');
allChecks &= checkDirectory('src/services', 'Services directory');
allChecks &= checkDirectory('src/utils', 'Utils directory');

// Check Components
log.header('🧩 Components');
allChecks &= checkFile('src/components/Sidebar.jsx', 'Sidebar component');
allChecks &= checkFile('src/components/Navbar.jsx', 'Navbar component');
allChecks &= checkFile('src/components/SessionTimer.jsx', 'Session Timer component');
allChecks &= checkFile('src/components/CustomizationPanel.jsx', 'Customization Panel');
allChecks &= checkFile('src/components/DataTable.jsx', 'Data Table component');
allChecks &= checkFile('src/components/StatCard.jsx', 'Stat Card component');
allChecks &= checkFile('src/components/LoadingSpinner.jsx', 'Loading Spinner');
allChecks &= checkFile('src/components/LiveIndicator.jsx', 'Live Indicator');

// Check Contexts
log.header('🔄 Contexts');
allChecks &= checkFile('src/contexts/AuthContext.jsx', 'Auth Context');
allChecks &= checkFile('src/contexts/ThemeContext.jsx', 'Theme Context');

// Check Pages
log.header('📄 Pages');
allChecks &= checkFile('src/pages/Login.jsx', 'Login page');
allChecks &= checkFile('src/pages/Dashboard.jsx', 'Dashboard page');
allChecks &= checkFile('src/pages/users/AppUsers.jsx', 'App Users page');

// Check Services
log.header('🔌 Services');
allChecks &= checkFile('src/services/api.js', 'API service');

// Check Utils
log.header('🛠️ Utilities');
allChecks &= checkFile('src/utils/inactivityTimer.js', 'Inactivity Timer');

// Check Main Files
log.header('⚙️ Main Files');
allChecks &= checkFile('src/App.jsx', 'App component');
allChecks &= checkFile('src/main.jsx', 'Main entry point');
allChecks &= checkFile('src/index.css', 'Global styles');

// Check Assets
log.header('🎨 Assets');
allChecks &= checkFile('public/assets/logo.png', 'Logo file');

// Check Documentation
log.header('📚 Documentation');
allChecks &= checkFile('README.md', 'Main README');
['QUICKSTART.md', 'FEATURES.md', 'DEPLOYMENT.md', 'PROJECT_SUMMARY.md', 'COMPLETE_GUIDE.md'].forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    log.success(`${file}`);
  }
});

// Check Dependencies
log.header('📦 Dependencies');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    'framer-motion',
    'tailwindcss',
    'axios',
    'recharts',
    'lucide-react'
  ];
  
  requiredDeps.forEach(dep => {
    const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    if (version) {
      log.success(`${dep} - v${version}`);
    } else {
      log.error(`${dep} - Not installed`);
      allChecks = false;
    }
  });
} catch (error) {
  log.error('Could not read package.json');
  allChecks = false;
}

// Check node_modules
log.header('📦 Installation');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  log.success('node_modules directory exists');
} else {
  log.warning('node_modules not found - Run: npm install');
}

// Final Summary
console.log('\n' + '═'.repeat(60) + '\n');

if (allChecks) {
  console.log(`${colors.green}${colors.bold}
✓ All checks passed! Your setup is complete.

Next steps:
1. Run: npm run dev
2. Open: http://localhost:5173
3. Login with your credentials
4. Explore the premium admin panel!
${colors.reset}`);
} else {
  console.log(`${colors.red}${colors.bold}
✗ Some checks failed. Please review the errors above.

To fix:
1. Ensure all files are present
2. Run: npm install
3. Run this script again: node verify-setup.js
${colors.reset}`);
}

console.log('═'.repeat(60) + '\n');

process.exit(allChecks ? 0 : 1);
