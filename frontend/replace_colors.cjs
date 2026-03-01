const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/pages/ProjectDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replacements: 
content = content.replace(/bg-senti-dark text-white/g, 'bg-senti-dark text-senti-text');
content = content.replace(/text-gray-500/g, 'text-senti-muted');
content = content.replace(/text-gray-400/g, 'text-senti-muted');
content = content.replace(/text-gray-300/g, 'text-senti-text/80');
content = content.replace(/text-gray-200/g, 'text-senti-text/90');
content = content.replace(/text-gray-100/g, 'text-senti-text');
content = content.replace(/text-gray-50/g, 'text-senti-text');
content = content.replace(/bg-black\/50/g, 'bg-senti-dark/80');
content = content.replace(/bg-gray-800/g, 'bg-senti-card');

fs.writeFileSync(file, content);
console.log('Done');
