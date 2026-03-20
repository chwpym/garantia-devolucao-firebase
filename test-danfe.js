async function testDanfe() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFeId="NFe35230312345678901234550010000000011234567890" versao="4.00"><ide><cUF>35</cUF></ide></infNFe></NFe></nfeProc>`;
    const url = 'https://www.webdanfe.com.br/danfe/GeraDanfe.php';
    
    const formData = new URLSearchParams();
    formData.append('xml', xml);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        console.log("Status:", response.status);
        console.log("Headers:", response.headers.get('content-type'));
        const text = await response.text();
        console.log("Response text (first 200 chars):", text.substring(0, 200));
    } catch (e) {
        console.error("Erro:", e);
    }
}
testDanfe();
