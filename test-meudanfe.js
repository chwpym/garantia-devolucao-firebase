async function testMeuDanfe() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFeId="NFe35230312345678901234550010000000011234567890" versao="4.00"><ide><cUF>35</cUF></ide></infNFe></NFe></nfeProc>`;
    const apiKey = 'b892d838-3449-49fd-b32d-aaf8c66be05f';
    
    // Testando endpoint V2 assumido
    const urlV2 = 'https://api.meudanfe.com.br/v2/get/nfe/xmltodanfepdf';
    
    try {
        const response = await fetch(urlV2, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey
            },
            body: JSON.stringify({ xml: xml })
        });
        
        console.log("V2 Status:", response.status);
        const data = await response.json();
        console.log("V2 Response:", data);
    } catch (e) {
        console.error("Erro V2:", e);
    }
}
testMeuDanfe();
