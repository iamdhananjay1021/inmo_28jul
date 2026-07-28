import fs from 'fs';
import path from 'path';

const BASE = '/home/netambit/Documents/SFAnewPanel/SFA-Admin-Panel/sfa-admin-panel/src/pages';

const getAllJsxFiles = (dir) => {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getAllJsxFiles(fullPath));
    } else if (item.name.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
};

const files = getAllJsxFiles(BASE);
let fixed = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Fix 1: Replace "flex items-center justify-between" in motion.div headers
  // Pattern: className="flex items-center justify-between" that's NOT inside a pagination/border-t context
  // We target lines that are part of motion.div with initial/animate (page headers)
  content = content.replace(
    /(<motion\.div\s+initial=\{[^}]*\}\s+animate=\{[^}]*\}\s+className=")flex items-center justify-between(")/g,
    '$1flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4$2'
  );

  // Fix 2: Also handle multiline pattern
  content = content.replace(
    /(<motion\.div\s*\n\s*initial=\{[^}]*\}\s*\n\s*animate=\{[^}]*\}\s*\n\s*className=")flex items-center justify-between(")/g,
    '$1flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4$2'
  );

  // Fix 3: Make button containers flex-wrap on mobile
  // Find <div className="flex items-center gap-2"> or gap-3 that comes after the title in headers
  // These are typically the button groups
  content = content.replace(
    /(<div className="flex items-center gap-2">\s*\n\s*(?:<button|<DownloadExcelButton|\{selectedUsers))/g,
    '<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">\n          $1'
  );

  // Simpler approach: just replace the exact class patterns we know are button containers in headers
  content = content.replace(
    /className="flex items-center gap-2">\s*\n(\s*(?:\{selectedUsers|\<button|\<DownloadExcelButton))/g, 
    'className="flex flex-wrap items-center gap-2 w-full sm:w-auto">\n$1'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    fixed++;
    console.log(`FIXED: ${path.relative(BASE, filePath)}`);
  }
}

console.log(`\nDone! Fixed ${fixed} files.`);
