import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const markers = [/^<<<<<<< /m, /^=======$/m, /^>>>>>>> /m];

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

const conflicted = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (markers.some(regex => regex.test(text))) {
    conflicted.push(file);
  }
}

if (conflicted.length > 0) {
  console.error('Merge conflict markers detected in:');
  for (const file of conflicted) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('No merge conflict markers detected.');
