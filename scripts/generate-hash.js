/**
 * Setup script — interactively sets up admin username and generates bcrypt hash for password
 * Run: node scripts/generate-hash.js
 */

const readline = require('readline');

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch {
  console.error('\n❌ Jalankan "npm install" terlebih dahulu.\n');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function simplePrompt(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function promptPassword(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    const stdin = process.openStdin();
    process.stdin.setRawMode(true);
    let password = '';
    process.stdin.on('data', (char) => {
      char = char + '';
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdout.write('\n');
        process.stdin.setRawMode(false);
        resolve(password);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(query + '*'.repeat(password.length));
        }
      } else {
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

async function main() {
  console.log('\n🔐 Setup Kredensial Admin Portal - Tanya Jawab Kajian\n');

  const usernameInput = await simplePrompt('Masukkan username admin baru [default: admin]: ');
  const username = usernameInput.trim() || 'admin';

  let password;
  try {
    password = await promptPassword('Masukkan password admin baru (min. 8 karakter): ');
  } catch {
    password = await simplePrompt('Masukkan password admin baru (min. 8 karakter): ');
  }

  if (!password || password.length < 8) {
    console.error('\n❌ Password minimal 8 karakter.\n');
    rl.close();
    process.exit(1);
  }

  console.log('\n⏳ Membuat hash bcrypt (cost factor 12)...');
  const hash = await bcrypt.hash(password, 12);

  console.log('\n✅ Konfigurasi kredensial berhasil dibuat!\n');
  console.log('Tambahkan atau perbarui baris berikut di file .env Anda:\n');
  console.log(`ADMIN_USERNAME=${username}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash.replace(/\$/g, '\\$')}`);
  console.log('\n⚠️  Simpan kredensial ini dengan aman dan jangan dipublikasikan ke repository git.\n');

  rl.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
