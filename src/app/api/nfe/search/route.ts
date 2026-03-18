import { NextResponse } from 'next/server';
import https from 'https';
import zlib from 'zlib';
import { XMLParser } from 'fast-xml-parser';
// @ts-ignore
import forge from 'node-forge';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fileBase64, senha, cnpj } = body;

        if (!fileBase64 || !senha || !cnpj) {
            return NextResponse.json({ status: 'error', message: 'Certificado, senha e CNPJ são obrigatórios.' }, { status: 400 });
        }

        // 1. Extrair Chave e Certificado do PFX usando node-forge (evita erro de cifra legada no OpenSSL 3.0)
        const pfxDer = Buffer.from(fileBase64, 'base64').toString('binary');
        const pfxAsn1 = forge.asn1.fromDer(pfxDer);
        const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, senha);

        let keyPem = '';
        let certPem = '';

        const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] || [];
        const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] || [];

        if (keyBags.length > 0) {
            keyPem = forge.pki.privateKeyToPem(keyBags[0].key);
        }
        if (certBags.length > 0) {
            certPem = forge.pki.certificateToPem(certBags[0].cert);
        }

        if (!keyPem || !certPem) {
            // Em alguns PFX mais antigos o tipo da chave pode ser 'keyBag'
            const keyBagsAlt = pfx.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] || [];
            if (keyBagsAlt.length > 0) {
                 keyPem = forge.pki.privateKeyToPem(keyBagsAlt[0].key);
            }
            if (!keyPem || !certPem) {
                 return NextResponse.json({ status: 'error', message: 'Não foi possível extrair a chave/certificado válido do arquivo .pfx' });
            }
        }

        const agent = new https.Agent({
            key: keyPem,
            cert: certPem,
            rejectUnauthorized: false
        });

        // 2. Montar SOAP Envelope para NFeDistribuicaoDFe
        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>
        <distDFeInt versao="1.01" xmlns="http://www.portalfiscal.inf.br/nfe">
          <tpAmb>1</tpAmb>
          <cUFAutor>35</cUFAutor>
          <CNPJ>${cnpj.replace(/\D/g, '')}</CNPJ>
          <distNSU>
            <ultNSU>000000000000000</ultNSU>
          </distNSU>
        </distDFeInt>
      </nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap12:Body>
</soap12:Envelope>`;

        // 3. Disparar Requisição via módulo nativo https (para respeitar o PFX)
        const soapRequest = () => new Promise<string>((resolve, reject) => {
            const req = https.request({
                hostname: 'www1.nfe.fazenda.gov.br',
                path: '/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
                method: 'POST',
                agent: agent,
                headers: {
                    'Content-Type': 'application/soap+xml; charset=utf-8',
                    'Content-Length': Buffer.byteLength(soapEnvelope)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.write(soapEnvelope);
            req.end();
        });

        const xmlResponse = await soapRequest();

        // 4. Parser do XML de Resposta
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
        const result = parser.parse(xmlResponse);

        // Caminhar na resposta SOAP
        const bodyNode = result['soap12:Envelope']?.['soap12:Body'];
        const responseNode = bodyNode?.['nfeDistDFeInteresseResponse'];
        const resultNode = responseNode?.['nfeDistDFeInteresseResult'];
        
        if (!resultNode) {
             return NextResponse.json({ status: 'error', message: 'Resposta da SEFAZ inválida ou vazia.' });
        }

        const retDistNode = resultNode['retDistDFeInt'];
        const cStat = retDistNode?.['cStat'];
        const xMotivo = retDistNode?.['xMotivo'];

        // cStat 137 = Nenhum documento encontrado, 138 = Documentos encontrados
        if (cStat !== 138 && cStat !== '138') {
            return NextResponse.json({ status: 'success', message: `${xMotivo || 'Nenhum item novo.'} (Código ${cStat})`, notas: [] });
        }

        const loteNode = retDistNode['loteDistDFeInt'];
        const docs = loteNode?.['docZip'];
        const docArray = Array.isArray(docs) ? docs : [docs].filter(Boolean);

        const notasFormatadas: any[] = [];

        docArray.forEach((doc: any) => {
            try {
                const zipBuffer = Buffer.from(doc['#text'] || doc, 'base64');
                const unzipped = zlib.gunzipSync(zipBuffer).toString('utf-8');
                const innerParsed = parser.parse(unzipped);

                // Identificar o tipo de documento (resNFe, nfeProc, etc)
                if (innerParsed.resNFe) {
                    const res = innerParsed.resNFe;
                    notasFormatadas.push({
                        id: res.chNFe,
                        numero: res.chNFe?.slice(25, 34) || 'N/A', // O NSU/Numero fica na chave
                        emissor: res.xNome || 'Desconhecido',
                        valor: parseFloat(res.vNF) || 0,
                        data: res.dhEmi ? res.dhEmi.split('T')[0] : 'S/D',
                        tipo: 'Resumo'
                    });
                } else if (innerParsed.nfeProc) {
                    const infNfe = innerParsed.nfeProc.NFe?.infNFe;
                    if (infNfe) {
                        notasFormatadas.push({
                            id: infNfe.id || infNfe.Id,
                            numero: infNfe.ide?.nNF || 'N/A',
                            emissor: infNfe.emit?.xNome || 'Desconhecido',
                            valor: parseFloat(infNfe.total?.ICMSTot?.vNF) || 0,
                            data: infNfe.ide?.dhEmi ? infNfe.ide.dhEmi.split('T')[0] : 'S/D',
                            tipo: 'Completo'
                        });
                    }
                }
            } catch (e) {
                console.error('Falha ao processar docZip:', e);
            }
        });

        return NextResponse.json({
            status: 'success',
            message: `${notasFormatadas.length} Notas localizadas com sucesso na SEFAZ!`,
            notas: notasFormatadas
        });

    } catch (error: any) {
        console.error('Erro na API de NFe:', error);
        return NextResponse.json({ status: 'error', message: 'Falha interna ao processar consulta: ' + (error.message || '') }, { status: 500 });
    }
}
