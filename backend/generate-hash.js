// generate-hash.js
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'demo123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Bcrypt Hash:', hash);
  
  // SQL to update database
  console.log('\n--- SQL to run ---');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email LIKE '%ottalika.com%';`);
}

generateHash().catch(console.error);