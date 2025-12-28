import crypto from 'crypto';

// Generate a secure random JWT secret
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Generated JWT Secret:\n');
console.log(secret);
console.log('\n📝 Add this to your server/.env file:\n');
console.log(`JWT_SECRET=${secret}`);
console.log('\n⚠️  Keep this secret safe and never commit it to version control!\n');
