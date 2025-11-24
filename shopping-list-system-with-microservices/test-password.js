const bcrypt = require('bcryptjs');
const fs = require('fs');

// Ler o arquivo de usuários
const users = JSON.parse(fs.readFileSync('./services/user-service/database/users.json', 'utf8'));

// Encontrar o admin
const admin = users.find(u => u.email === 'admin@microservices.com');

if (!admin) {
    console.log('❌ Usuário admin não encontrado!');
    process.exit(1);
}

console.log('✅ Usuário encontrado:');
console.log('   Email:', admin.email);
console.log('   Username:', admin.username);
console.log('   Hash:', admin.password);
console.log('');

// Testar a senha
const password = 'admin123';
console.log('🔐 Testando senha: admin123');

bcrypt.compare(password, admin.password)
    .then(match => {
        if (match) {
            console.log('✅ SENHA CORRETA!');
        } else {
            console.log('❌ SENHA INCORRETA!');
            console.log('');
            console.log('Criando novo hash...');
            return bcrypt.hash(password, 12);
        }
    })
    .then(newHash => {
        if (newHash) {
            console.log('Novo hash:', newHash);
            console.log('');
            console.log('Atualize o admin no banco com este hash.');
        }
    })
    .catch(err => {
        console.error('Erro:', err);
    });
