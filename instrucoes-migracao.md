# Instruções para Migração do Sistema de Vendas para o Google Cloud

## Arquivos de migração necessários

Já criamos os seguintes arquivos para você:
- `backup.sql` - Backup do banco de dados (448KB)
- `Dockerfile` - Configuração para criar a imagem do container
- `app.yaml` - Configuração para o App Engine
- `.gcloudignore` - Lista de arquivos que não devem ser enviados para o Google Cloud

## Passo 1: Baixar os arquivos

Baixe estes arquivos do Replit:
- O arquivo `backup.sql` (clique nele na barra lateral e depois em "Download")
- Todo o código-fonte do projeto:
  - Clique nos três pontos (...) no canto superior direito
  - Selecione "Download as zip"

## Passo 2: Preparar o ambiente local

1. Instale o **Google Cloud SDK**:
   - Windows: Baixe o instalador em https://cloud.google.com/sdk/docs/install
   - Mac: Use o comando `brew install google-cloud-sdk`
   - Linux: Siga as instruções em https://cloud.google.com/sdk/docs/install

2. Abra um terminal e faça login:
   ```
   gcloud auth login
   ```

3. Crie um novo projeto:
   ```
   gcloud projects create sistema-vendas-app
   gcloud config set project sistema-vendas-app
   ```

## Passo 3: Configurar o banco de dados PostgreSQL

1. Acesse o Console do Google Cloud: https://console.cloud.google.com
2. No menu lateral, vá para "SQL"
3. Clique em "Criar instância"
4. Selecione "PostgreSQL"
5. Configure:
   - Nome: `banco-vendas`
   - Senha: (crie uma senha segura e anote-a)
   - Região: `us-central1` (ou a mais próxima)
   - Configuração da máquina: `db-f1-micro` (mais barata)
   - Clicar em "Criar"

6. Após a criação, clique na instância e:
   - Vá para "Bancos de dados" e clique em "Criar banco de dados"
   - Nome: `vendas`
   - Clique em "Criar"

7. Para importar os dados, você terá duas opções:
   - **Opção 1 (Console web)**: Na página da instância, clique em "Importar" e siga as instruções para fazer upload do `backup.sql`
   - **Opção 2 (Linha de comando)**:
     ```
     gcloud sql import sql banco-vendas backup.sql --database=vendas
     ```

## Passo 4: Implantação do código

### Opção A: App Engine (recomendado para iniciantes)

1. Descompacte o arquivo ZIP do projeto em seu computador
2. Navegue até a pasta do projeto no terminal
3. Edite o arquivo `app.yaml` para incluir as variáveis do banco de dados:
   ```yaml
   env_variables:
     DATABASE_URL: "postgresql://postgres:SUA_SENHA@/vendas?host=/cloudsql/sistema-vendas-app:us-central1:banco-vendas"
     NODE_ENV: "production"
     SESSION_SECRET: "uma_senha_segura_aleatoria"
   ```
4. Execute o comando de deploy:
   ```
   gcloud app deploy
   ```
5. Responda "Y" quando perguntado para continuar
6. Aguarde o processo de implantação (pode levar alguns minutos)
7. Quando finalizar, acesse seu app pela URL fornecida (geralmente https://sistema-vendas-app.appspot.com)

### Opção B: Cloud Run (mais flexível)

1. Habilite as APIs necessárias:
   ```
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com cloudsql.googleapis.com
   ```

2. Construa a imagem Docker:
   ```
   gcloud builds submit --tag gcr.io/sistema-vendas-app/vendas-app
   ```

3. Implante no Cloud Run:
   ```
   gcloud run deploy vendas-app \
     --image gcr.io/sistema-vendas-app/vendas-app \
     --platform managed \
     --allow-unauthenticated \
     --region us-central1 \
     --add-cloudsql-instances sistema-vendas-app:us-central1:banco-vendas \
     --set-env-vars "DATABASE_URL=postgresql://postgres:SUA_SENHA@/vendas?host=/cloudsql/sistema-vendas-app:us-central1:banco-vendas,SESSION_SECRET=uma_senha_segura_aleatoria"
   ```

## Dicas adicionais

1. **Monitoramento**: Configure alertas de faturamento para evitar surpresas com custos
2. **Suporte**: Se precisar de ajuda, use o "Cloud Support" no console do Google Cloud
3. **Backups**: Configure backups automáticos do banco de dados nas configurações da instância SQL
4. **Domínio personalizado**: Você pode configurar um domínio personalizado nas configurações do serviço

## Estimativa de custos mensais

- App Engine: ~$0 (dentro do nível gratuito para uso leve)
- Cloud SQL (PostgreSQL): ~$25-30/mês para a instância mais básica
- Cloud Storage: ~$0 (dentro do nível gratuito para uso leve)
- Total estimado: ~$25-30/mês

Para reduzir custos, você pode pausar a instância do Cloud SQL quando não estiver em uso.