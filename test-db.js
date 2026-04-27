const { Client } = require('pg');

const passwords = ['postgres', 'admin', 'root', 'password', '123456', '', 'yourpassword'];

async function testPasswords() {
  for (const pw of passwords) {
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: pw,
      port: 5432,
    });

    try {
      await client.connect();
      console.log(`SUCCESS: password is '${pw}'`);
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed for '${pw}'`);
    }
  }
  console.log('None of the default passwords worked.');
}

testPasswords();
