---
name: form-persistence-pro
description: Padronização de salvamento, validação e feedback em formulários.
---

# 📝 Skill: Form Persistence Pro

Esta Skill define como os dados entram no sistema com segurança e clareza.

## 📋 Regras de Ouro

1.  **Zod Schema First**: Todo formulário deve ter um schema Zod bem definido.
2.  **Duplicate Check**: Antes de `add` ou `update`, verifique duplicidade se o campo for único (ex: Código do Produto).
3.  **Loading State**: Exiba um spinner (`Loader2`) no botão de submissão enquanto o banco processa.
4.  **Toast Feedback**: Sucesso e Erro precisam ser notificados com títulos claros (ex: "Produto Salvo", "Erro ao Salvar").
5.  **Submission State Control**: Para fluxos de "Salvar e Continuar", use estados locais (`shouldExit`, `shouldNavigate`) para evitar incompatibilidades com o `SubmitHandler` do React Hook Form.

## 🛠️ Padrão de Salvamento (HandleSave)

```typescript
// 1. Defina o estado de fluxo
const [shouldExit, setShouldExit] = useState(true);

// 2. Handler compatível com SubmitHandler<T>
const onSubmit = async (data: FormValues) => {
  try {
    await db.save(data);
    toast({ title: 'Sucesso' });
    
    if (shouldExit) {
      onClose();
    } else {
      form.reset(defaultValues);
      toast({ title: 'Pronto para o próximo!' });
    }
    
    window.dispatchEvent(new CustomEvent('datachanged'));
  } catch (e) {
    toast({ title: 'Erro', variant: 'destructive' });
  }
};

// 3. UI com botões de controle de estado
<Button type="submit" onClick={() => setShouldExit(false)}>Salvar e Continuar</Button>
<Button type="submit" onClick={() => setShouldExit(true)}>Salvar e Sair</Button>
```

## 🔍 Como Validar
- Tente salvar um item com código/CPF já existente e confirme se o sistema impede e avisa.
- Verifique se o formulário é limpo ou fechado após o sucesso.
