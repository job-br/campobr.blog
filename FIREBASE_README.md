# Configurações do Firebase - Portal CampoBR

Este projeto utiliza o **Google Cloud Firestore** para banco de dados NoSQL e persistência de matérias, comentários e configurações do robô editorial, além do **Firebase Authentication** para login com Google.

---

## 📁 Arquivos de Configuração Inclusos no Projeto

1. **`firebase-applet-config.json`**:
   Contém as credenciais completas da API do Firebase (apiKey, authDomain, projectId, firestoreDatabaseId, storageBucket, messagingSenderId, oAuthClientId).
   
2. **`firestore.rules`**:
   Regras de segurança completas do Firestore:
   - Permite leitura pública de postagens e comentários (`/posts/{postId}`);
   - Valida tamanho e tipos de dados em criações e atualizações;
   - Protege coleções administrativas e de sistema.

3. **`firebase.json`** e **`.firebaserc`**:
   Configurações padrão do Firebase CLI para deploy de regras e hosting.

4. **`src/services/firebase.ts`**:
   Código TypeScript que inicializa o Firebase SDK v12, implementa fallback resiliente para armazenamento local e gerencia operações de CRUD com tratamento de erro integrado.

---

## 🚀 Como Conectar / Publicar as Regras no Firebase

Se você deseja publicar as regras no seu próprio projeto Firebase via terminal:

```bash
# 1. Instale o Firebase CLI (caso ainda não tenha)
npm install -g firebase-tools

# 2. Faça login na sua conta Google
firebase login

# 3. Conecte ao seu projeto
firebase use seu-projeto-id

# 4. Publique apenas as regras de segurança do Firestore
firebase deploy --only firestore:rules
```

---

## 🛠️ Como Rodar o Projeto com o `src/` e `package.json`

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```
