const db = require('./database');
async function checkRoles() {
    try {
        const [rows] = await db.query('SELECT DISTINCT role FROM users');
        console.log('Roles found:', rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkRoles();
