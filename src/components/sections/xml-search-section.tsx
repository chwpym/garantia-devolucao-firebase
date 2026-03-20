'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, ShieldCheck, Plus, Trash2, Search, Key, Download, Eye, ShoppingCart, ListChecks, FilePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db'; // Assuming IndexedDB has get/set capabilities

interface CertificadoItem {
    id?: number;
    empresa: string;
    cnpj: string;
    hasPassword?: boolean;
    senha?: string; // Salvar senha em memória para remover prompt duplo
    nomeArquivo?: string;
    fileBase64?: string; // Manter em memória para o teste
}

export default function XmlSearchSection() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('certificados');
    const [certificados, setCertificados] = useState<CertificadoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const fileInputDanfeRef = useRef<HTMLInputElement>(null);

    // Form states for Certificate
    const [empresa, setEmpresa] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [senha, setSenha] = useState('');
    const [fileBase64, setFileBase64] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');

    // Consulta states
    const [selectedCertIndex, setSelectedCertIndex] = useState<string>('');
    const [notas, setNotas] = useState<any[]>([]);
    const [ultNSU, setUltNSU] = useState<string>('0');
    const [meuDanfeKey, setMeuDanfeKey] = useState<string>('');

        // NCM states
    const [searchNcm, setSearchNcm] = useState<string>('');
    const [ncmResult, setNcmResult] = useState<any>(null);
    const [loadingNcm, setLoadingNcm] = useState<boolean>(false);

    // Products states
    const [selectedNotaXml, setSelectedNotaXml] = useState<string | null>(null);
    const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
    const [selectedNotaNumero, setSelectedNotaNumero] = useState<string>('');

    useEffect(() => {
        loadCertificados();
        if (typeof window !== 'undefined') {
            const savedIndex = localStorage.getItem('xml_search_selectedCertIndex');
            if (savedIndex) setSelectedCertIndex(savedIndex);

            const savedApiKey = localStorage.getItem('meudanfe_api_key');
            if (savedApiKey) setMeuDanfeKey(savedApiKey);
        }
    }, []);

    useEffect(() => {
        if (selectedCertIndex !== '') {
            const cert = certificados[parseInt(selectedCertIndex)];
            if (cert) {
                const savedNSU = localStorage.getItem(`ultNSU_${cert.cnpj}`);
                setUltNSU(savedNSU || '0');
            }
        } else {
            setUltNSU('0');
        }
    }, [selectedCertIndex, certificados]);

    const loadCertificados = async () => {
        try {
            const list = await db.getAllCertificados();
            const mapped: CertificadoItem[] = list.map((cert: any) => ({
                id: cert.id,
                empresa: cert.alias,
                cnpj: cert.cnpj,
                senha: cert.senha,
                hasPassword: !!cert.senha,
                fileBase64: cert.arquivo
            }));
            setCertificados(mapped);
        } catch (error) {
            console.error('Erro ao carregar certificados:', error);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
            toast({ title: 'Formato invalido', description: 'Por favor, selecione um arquivo .pfx ou .p12', variant: 'destructive' });
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFileBase64(base64String.split(',')[1]); // Only base64 data
        };
        reader.readAsDataURL(file);
    };

    const handleSaveCertificate = async () => {
        if (!empresa || !cnpj || !senha || !fileBase64) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos e selecione o certificado.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            await db.addCertificado({
                alias: empresa,
                cnpj: cnpj,
                senha: senha,
                arquivo: fileBase64,
                vencimento: ''
            });

            await loadCertificados();

            setEmpresa('');
            setCnpj('');
            setSenha('');
            setFileBase64(null);
            setFileName('');

            toast({ title: 'Sucesso', description: 'Certificado salvo localmente!' });
        } catch (error) {
            toast({ title: 'Erro ao salvar', description: 'Não foi possível salvar o arquivo.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCertificate = async (id?: number) => {
        if (id === undefined) return;
        setLoading(true);
        try {
            await db.deleteCertificado(id);
            await loadCertificados();
            toast({ title: 'Sucesso', description: 'Certificado removido com sucesso!' });
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao remover certificado.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleConsultarSefaz = async () => {
        if (selectedCertIndex === '') {
            toast({ title: 'Aviso', description: 'Selecione um certificado para consultar.', variant: 'destructive' });
            return;
        }

        const cert = certificados[parseInt(selectedCertIndex)];
        const inputSenha = cert.senha || window.prompt(`Digite a senha para o certificado da empresa ${cert.empresa}:`);

        if (!inputSenha) {
            toast({ title: 'Cancelado', description: 'Consulta abortada pelo usuário.' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/nfe/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileBase64: cert.fileBase64,
                    senha: inputSenha,
                    cnpj: cert.cnpj,
                    ultNSU: ultNSU
                })
            });

            const data = await response.json();

            if (data.ultNSU) {
                setUltNSU(data.ultNSU);
                const cert = certificados[parseInt(selectedCertIndex)];
                if (cert) {
                    localStorage.setItem(`ultNSU_${cert.cnpj}`, data.ultNSU);
                }
            }

            if (data.status === 'success') {
                setNotas(data.notas || []);
                toast({ title: 'Sucesso', description: data.message });
            } else if (data.status === 'warning') {
                toast({ title: 'Aviso', description: data.message, variant: 'default' });
            } else {
                toast({ title: 'Erro', description: data.message, variant: 'destructive' });
                if (data.debug) {
                    console.log('DEBUG SEFAZ:', data.debug);
                }
            }
        } catch (error) {
            toast({ title: 'Erro na requisição', description: 'Não foi possível falar com a API.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadXml = (xmlString?: string, id?: string) => {
        if (!xmlString) {
            toast({ title: 'Erro', description: 'Conteúdo do XML não disponí­vel.', variant: 'destructive' });
            return;
        }
        const blob = new Blob([xmlString], { type: 'text/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NFe-${id || 'Nota'}.xml`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const parseProductsFromXml = (xmlString: string) => {
        if (!xmlString) return [];
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const items = xmlDoc.getElementsByTagName("det");
            const products = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const xProd = item.getElementsByTagName("xProd")[0]?.textContent || 'N/A';
                const ncm = item.getElementsByTagName("NCM")[0]?.textContent || 'N/A';
                const vUnCom = item.getElementsByTagName("vUnCom")[0]?.textContent || '0';
                const qCom = item.getElementsByTagName("qCom")[0]?.textContent || '0';

                const icmsNode = item.getElementsByTagName("ICMS")[0];
                let orig = 'N/A';
                let cst = 'N/A';

                if (icmsNode) {
                    const origNode = icmsNode.getElementsByTagName("orig")[0];
                    if (origNode) orig = origNode.textContent || 'N/A';

                    // CST ou CSOSN
                    const cstNode = icmsNode.getElementsByTagName("CST")[0] || icmsNode.getElementsByTagName("CSOSN")[0];
                    if (cstNode) cst = cstNode.textContent || 'N/A';
                }

                products.push({
                    item: i + 1,
                    xProd,
                    ncm,
                    orig,
                    cst,
                    qCom: parseFloat(qCom).toFixed(2),
                    vUnCom: parseFloat(vUnCom).toFixed(2)
                });
            }
            return products;
        } catch (e) {
            console.error("Erro ao converter XML:", e);
            return [];
        }
    };

    const handleVisualizarDanfe = async (xmlString?: string) => {
        if (!xmlString) {
            toast({ title: 'Erro', description: 'Conteúdo do XML não disponí­vel..', variant: 'destructive' });
            return;
        }

        // Se tiver API Key do MeuDanfe cadastrada, usa ela via API v2 (fetch)
        if (meuDanfeKey) {
            setLoading(true);
            try {
                const response = await fetch('https://api.meudanfe.com.br/v2/fd/convert/xml-to-da', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'text/plain',
                        'Api-Key': meuDanfeKey
                    },
                    body: xmlString
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.data) {
                        const link = document.createElement('a');
                        link.href = `data:application/pdf;base64,${data.data}`;
                        link.download = `DANFE_${Date.now()}.pdf`;
                        link.click();
                        toast({ title: 'Sucesso', description: 'DANFE gerada com MeuDanfe!' });
                        return;
                    } else {
                        toast({ title: 'Erro MeuDanfe', description: 'Dados do PDF não encontrados na resposta.', variant: 'destructive' });
                    }
                } else {
                    toast({ title: 'Erro na API', description: 'Falha na comunicação com MeuDanfe.', variant: 'destructive' });
                }
            } catch (e) {
                console.error("Erro MeuDanfe:", e);
                toast({ title: 'Erro', description: 'Erro ao conectar-se ao MeuDanfe.', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
            return;
        }

        // FALLBACK: Usando o WebDanfe via POST para converter XML em DANFE na hora em nova aba
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://www.webdanfe.com.br/danfe/GeraDanfe.php';
        form.target = '_blank';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'xml';
        input.value = xmlString;
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleImportXmlForDanfe = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const xmlString = event.target?.result as string;
            handleVisualizarDanfe(xmlString);
        };
        reader.readAsText(file, 'ISO-8859-1');
        if (fileInputDanfeRef.current) fileInputDanfeRef.current.value = '';
    };

    const handleConsultarNcm = async () => {
        const cleanNcm = searchNcm.replace(/\D/g, '');
        if (cleanNcm.length !== 8) {
            toast({ title: 'Aviso', description: 'O NCM deve conter 8 dí­gitos.', variant: 'default' });
            return;
        }
        setLoadingNcm(true);
        setNcmResult(null);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/ncm/v1/${cleanNcm}`);
            if (response.ok) {
                const data = await response.json();
                setNcmResult(data);
            } else {
                toast({ title: 'Erro', description: 'NCM não localizado ou inválido.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possí­vel falar com a API de NCM.', variant: 'destructive' });
        } finally {
            setLoadingNcm(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Buscador de XML SEFAZ</h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie certificados e busque Notas Fiscais Eletronícas emitidas contra seu CNPJ.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="certificados" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Certificados
                    </TabsTrigger>
                    <TabsTrigger value="consulta" className="flex items-center gap-2">
                        <Search className="h-4 w-4" /> Consultar
                    </TabsTrigger>
                    <TabsTrigger value="ncm" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Consultar NCM
                    </TabsTrigger>
                </TabsList>

                {/* --- ABA CERTIFICADOS --- */}
                <TabsContent value="certificados" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Formulário de Upload */}
                        <Card className="md:col-span-1 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-primary" /> Novo Certificado
                                </CardTitle>
                                <CardDescription>Carregue o certificado A1 (.pfx/.p12)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="empresa">Nome da Empresa / Apelido</Label>
                                    <Input id="empresa" placeholder="Ex: Matriz Campinas" value={empresa} onChange={e => setEmpresa(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cnpj">CNPJ</Label>
                                    <Input id="cnpj" placeholder="Ex: 00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="file-upload">Arquivo do Certificado</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="file-upload" type="file" accept=".pfx,.p12" className="hidden" onChange={handleFileUpload} />
                                        <Button asChild variant="outline" className="w-full cursor-pointer">
                                            <label htmlFor="file-upload">
                                                <FileText className="mr-2 h-4 w-4" /> {fileName || 'Selecionar Arquivo'}
                                            </label>
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="senha" className="flex items-center gap-1.5">
                                        <Key className="h-3 w-3 text-muted-foreground" /> Senha do Certificado
                                    </Label>
                                    <Input id="senha" type="password" placeholder="Digite a senha" value={senha} onChange={e => setSenha(e.target.value)} />
                                </div>
                                <Button className="w-full mt-2" onClick={handleSaveCertificate} disabled={loading}>
                                    {loading ? 'Processando...' : 'Salvar Certificado'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Listagem de Certificados */}
                        <Card className="md:col-span-2 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Certificados Salvos</CardTitle>
                                <CardDescription>Múltiplos perfis cadastrados para consulta.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border bg-card">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Empresa</TableHead>
                                                <TableHead>CNPJ</TableHead>
                                                <TableHead>Arquivo</TableHead>
                                                <TableHead className="w-[80px] text-right">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {certificados.length > 0 ? (
                                                certificados.map((cert) => (
                                                    <TableRow key={cert.id}>
                                                        <TableCell className="font-medium">{cert.empresa}</TableCell>
                                                        <TableCell>{cert.cnpj}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{cert.nomeArquivo || '-'}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCertificate(cert.id)} disabled={loading}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                                        Nenhum certificado cadastrado localmente.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- ABA CONSULTA --- */}
                <TabsContent value="consulta" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
                            <div>
                                <CardTitle>Buscar Notas Fiscais</CardTitle>
                                <CardDescription>Consulte os XMLs emitidos no ambiente da SEFAZ.</CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <div className="flex items-center gap-1 bg-background border rounded-md px-2 h-9">
                                    <span className="text-xs text-muted-foreground mr-1">NSU:</span>
                                    <input
                                        type="text"
                                        className="w-[70px] bg-transparent text-xs text-right outline-none font-mono"
                                        value={ultNSU}
                                        onChange={(e) => setUltNSU(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                <select
                                    className="h-9 rounded-md border bg-background px-3 text-sm"
                                    value={selectedCertIndex}
                                    onChange={(e) => {
                                        setSelectedCertIndex(e.target.value);
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem('xml_search_selectedCertIndex', e.target.value);
                                        }
                                    }}
                                >
                                    <option value="">Selecione a Empresa...</option>
                                    {certificados.map((c, i) => (
                                        <option key={i} value={i.toString()}>{c.empresa}</option>
                                    ))}
                                </select>

                                <span className="text-muted-foreground self-center hidden sm:inline">|</span>

                                <Button variant="outline" size="sm" className="h-9 gap-1 text-xs" onClick={() => fileInputDanfeRef.current?.click()}>
                                    <FilePlus className="h-3.5 w-3.5" /> Gerar DANFE de Arquivo
                                </Button>
                                <input type="file" ref={fileInputDanfeRef} className="hidden" accept=".xml" onChange={handleImportXmlForDanfe} />
                                
                                <div className="flex items-center gap-1 bg-background border rounded-md px-2 h-9">
                                    <span className="text-xs text-muted-foreground mr-1">MeuDanfe Key:</span>
                                    <input
                                        type="password"
                                        className="w-[100px] bg-transparent text-xs outline-none font-mono"
                                        value={meuDanfeKey}
                                        onChange={(e) => {
                                            setMeuDanfeKey(e.target.value);
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('meudanfe_api_key', e.target.value);
                                            }
                                        }}
                                        placeholder="Opcional"
                                    />
                                </div>

                                <Button onClick={handleConsultarSefaz} disabled={loading || certificados.length === 0} className="gap-2">
                                    <Search className="h-4 w-4" /> {loading ? 'Consultando...' : 'Consultar SEFAZ'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {notas.length > 0 ? (
                                <div className="rounded-md border bg-card">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Número NF-e</TableHead>
                                                <TableHead>Emissor</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Valor</TableHead>
                                                <TableHead className="w-[100px] text-right">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {notas.map((nota) => (
                                                <TableRow key={nota.id}>
                                                    <TableCell className="font-medium">{nota.numero}</TableCell>
                                                    <TableCell>{nota.emissor}</TableCell>
                                                    <TableCell>{nota.data}</TableCell>
                                                    <TableCell>R$ {nota.valor.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleDownloadXml(nota.xml, nota.numero)} title="Baixar XML">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleVisualizarDanfe(nota.xml)} title="Visualizar DANFE">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground italic border-2 border-dashed rounded-md bg-muted/20">
                                    Nenhum resultado de consulta ou selecione um certificado para buscar.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ABA CONSULTA NCM --- */}
                <TabsContent value="ncm" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Consultar NCM Oficial</CardTitle>
                            <CardDescription>Consulte a Descrição e Vigência de um NCM na Base da Receita Federal.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 max-w-sm">
                                <Input
                                    placeholder="Digite o NCM (8 dígitos)"
                                    value={searchNcm}
                                    onChange={(e) => setSearchNcm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    className="h-9"
                                />
                                <Button onClick={handleConsultarNcm} disabled={loadingNcm} className="h-9">
                                    {loadingNcm ? '...' : <Search className="h-4 w-4" />}
                                </Button>
                            </div>

                            {ncmResult && (
                                <div className="rounded-md border bg-muted/20 p-4 space-y-2">
                                    <div>
                                        <span className="text-xs text-muted-foreground">Código NCM:</span>
                                        <p className="font-mono font-bold text-lg text-primary">{ncmResult.codigo}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground">Descrição Oficial:</span>
                                        <p className="text-sm font-medium">{ncmResult.descricao}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}



