import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Fix all storage calls to use await getStorage()
function fixStorageCalls() {
  const filePath = join(__dirname, 'routes.ts');
  let content = readFileSync(filePath, 'utf8');
  
  // Pattern to match: await storage.methodName(
  // Replace with: const storage = await getStorage(); await storage.methodName(
  const storageCallRegex = /(\s+)(await storage\.)([a-zA-Z_][a-zA-Z0-9_]*\()/g;
  
  content = content.replace(storageCallRegex, (match, indent, awaitStorage, methodCall) => {
    return `${indent}const storage = await getStorage();\n${indent}await storage.${methodCall}`;
  });
  
  // Fix any duplicate const storage declarations
  content = content.replace(/const storage = await getStorage\(\);\s*const storage = await getStorage\(\);/g, 
                           'const storage = await getStorage();');
  
  writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed storage calls in routes.ts');
}

fixStorageCalls();