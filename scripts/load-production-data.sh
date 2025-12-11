#!/bin/bash
set -e

echo "======================================"
echo "  Carregando dados no MySQL..."
echo "======================================"

# Aguarda MySQL estar pronto
echo "⏳ Aguardando MySQL estar pronto..."
until docker exec chatbot-mysql mysqladmin ping -h localhost -uodt04 -p${DB_PASSWORD} --silent 2>/dev/null; do
    printf "."
    sleep 2
done

echo ""
echo "✅ MySQL está pronto!"
echo ""
echo "📦 Carregando dados de produção..."

# Carrega os dados
docker exec -i chatbot-mysql mysql \
    -uodt04 \
    -p${DB_PASSWORD} \
    eleicoes < database/data/02-data.sql

echo ""
echo "======================================"
echo "  ✅ Dados carregados com sucesso!"
echo "======================================"