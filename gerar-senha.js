const bcrypt = require('bcryptjs');

async function gerarHash() {
    const senhaPlana = 'admin123'; // Defina uma senha de teste fácil de lembrar
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senhaPlana, salt);

    console.log('Senha em texto plano:', senhaPlana);
    console.log('---');
    console.log('COPIE ESTE HASH PARA USAR NO BANCO DE DADOS:');
    console.log(hash);
}

gerarHash();