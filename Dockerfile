# ============================================
# IMAGEM BASE
# ============================================
# Isso diz: "Eu quero usar o Node.js versão 20, versão Alpine (pequena)"
FROM node:20-alpine

# ============================================
# DIRETÓRIO DE TRABALHO
# ============================================
# Cria uma pasta /app dentro do container e entra nela
WORKDIR /app

# ============================================
# COPIAR ARQUIVOS DE DEPENDÊNCIAS
# ============================================
# Copia package.json e package-lock.json para o container
COPY package*.json ./

# ============================================
# INSTALAR DEPENDÊNCIAS
# ============================================
# Roda npm install dentro do container
RUN npm ci --legacy-peer-deps

# ============================================
# COPIAR TODO O CÓDIGO
# ============================================
# Copia todo o resto do projeto para o container
COPY . .

# ============================================
# EXPOR PORTA
# ============================================
# Avisa que o container vai usar a porta 3000
EXPOSE 3000

# ============================================
# COMANDO PARA INICIAR
# ============================================
# Quando o container iniciar, roda esse comando
CMD ["node", "index.mjs"]