
import http from 'http';

function checkCors(origin, expectedStatus, delay = 0) {
    setTimeout(() => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/health',
            method: 'GET',
            headers: {
                'Origin': origin
            }
        };

        const req = http.request(options, (res) => {
            console.log(`\n--- Testando Origin: ${origin} ---`);
            console.log(`Status Code: ${res.statusCode}`);
            const allowOrigin = res.headers['access-control-allow-origin'];
            console.log(`Access-Control-Allow-Origin: ${allowOrigin || 'NÃO PRESENTE'}`);

            if (expectedStatus === 'ALLOWED') {
                if (allowOrigin === origin) {
                    console.log('✅ SUCESSO: Origem permitida.');
                } else {
                    console.error('❌ FALHA: Origem deveria ser permitida.');
                    process.exit(1);
                }
            } else { // BLOCKED
                if (!allowOrigin) {
                    console.log('✅ SUCESSO: Origem bloqueada.');
                } else {
                    console.error(`❌ FALHA: Origem deveria ser bloqueada, mas recebeu ${allowOrigin}`);
                    process.exit(1);
                }
            }
        });

        req.on('error', (e) => {
            console.error(`Problema na requisição: ${e.message}`);
            process.exit(1);
        });

        req.end();
    }, delay);
}

// Execução sequencial simples via delay
checkCors('http://192.168.15.121:5173', 'ALLOWED', 0);
checkCors('https://malicious-site.com', 'BLOCKED', 1000);
