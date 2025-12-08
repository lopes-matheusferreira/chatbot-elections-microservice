#!/bin/bash

# =====================================================
# SCRIPT AUXILIAR PARA GERENCIAR DOCKER
# =====================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR="database/backups"
DB_CONTAINER="chatbot-mysql"
DB_NAME="chatbot_db"
DB_USER="chatbot_user"

# =====================================================
# FUNÇÕES
# =====================================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# =====================================================
# COMANDOS
# =====================================================

start_all() {
    print_header "Iniciando todos os serviços"
    docker-compose up -d
    print_success "Serviços iniciados!"
    show_status
}

stop_all() {
    print_header "Parando todos os serviços"
    docker-compose down
    print_success "Serviços parados!"
}

restart_all() {
    print_header "Reiniciando todos os serviços"
    docker-compose restart
    print_success "Serviços reiniciados!"
    show_status
}

show_logs() {
    SERVICE=${1:-}
    if [ -z "$SERVICE" ]; then
        print_header "Logs de todos os serviços"
        docker-compose logs -f
    else
        print_header "Logs do serviço: $SERVICE"
        docker-compose logs -f "$SERVICE"
    fi
}

show_status() {
    print_header "Status dos serviços"
    docker-compose ps
    echo ""
    print_header "Saúde dos containers"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

backup_database() {
    print_header "Criando backup do banco de dados"
    
    # Criar pasta de backups se não existir
    mkdir -p "$BACKUP_DIR"
    
    # Nome do arquivo com timestamp
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    print_warning "Fazendo backup do banco '$DB_NAME'..."
    
    # Pegar senha do .env.docker
    DB_PASS=$(grep DB_PASSWORD .env.docker | cut -d '=' -f2)
    
    # Fazer backup
    docker exec "$DB_CONTAINER" mysqldump \
        -u "$DB_USER" \
        -p"$DB_PASS" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        "$DB_NAME" > "$BACKUP_FILE"
    
    # Comprimir
    gzip "$BACKUP_FILE"
    
    print_success "Backup criado: ${BACKUP_FILE}.gz"
    
    # Mostrar tamanho
    SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "Tamanho: $SIZE"
}

restore_database() {
    BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        print_error "Uso: $0 restore <arquivo_backup.sql>"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Arquivo não encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    print_header "Restaurando banco de dados"
    print_warning "ATENÇÃO: Isso vai sobrescrever todos os dados atuais!"
    read -p "Tem certeza? (sim/não): " CONFIRM
    
    if [ "$CONFIRM" != "sim" ]; then
        print_warning "Restauração cancelada"
        exit 0
    fi
    
    DB_PASS=$(grep DB_PASSWORD .env.docker | cut -d '=' -f2)
    
    # Se arquivo está comprimido, descomprimir temporariamente
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        print_warning "Descomprimindo backup..."
        gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" \
            mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
    else
        docker exec -i "$DB_CONTAINER" \
            mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_FILE"
    fi
    
    print_success "Banco restaurado com sucesso!"
}

connect_mysql() {
    print_header "Conectando ao MySQL"
    DB_PASS=$(grep DB_PASSWORD .env.docker | cut -d '=' -f2)
    docker exec -it "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
}

clean_all() {
    print_header "Limpando tudo (containers, volumes, networks)"
    print_warning "ATENÇÃO: Isso vai apagar TODOS os dados!"
    read -p "Tem certeza? Digite 'DELETAR' para confirmar: " CONFIRM
    
    if [ "$CONFIRM" != "DELETAR" ]; then
        print_warning "Limpeza cancelada"
        exit 0
    fi
    
    docker-compose down -v
    docker system prune -f
    print_success "Tudo limpo!"
}

reset_database() {
    print_header "Resetando apenas o banco de dados"
    print_warning "Isso vai apagar todos os dados do MySQL!"
    read -p "Tem certeza? (sim/não): " CONFIRM
    
    if [ "$CONFIRM" != "sim" ]; then
        print_warning "Reset cancelado"
        exit 0
    fi
    
    docker-compose stop mysql
    docker volume rm chatbot-mysql-data || true
    docker-compose up -d mysql
    
    print_success "Banco resetado! Aguardando inicialização..."
    sleep 10
    docker-compose logs mysql
}

show_stats() {
    print_header "Estatísticas de recursos"
    docker stats --no-stream
}

show_help() {
    cat << EOF
${BLUE}========================================
Docker Helper - Chatbot Project
========================================${NC}

${GREEN}Uso:${NC} $0 [comando] [opções]

${GREEN}Comandos:${NC}
  ${YELLOW}start${NC}              Inicia todos os serviços
  ${YELLOW}stop${NC}               Para todos os serviços
  ${YELLOW}restart${NC}            Reinicia todos os serviços
  ${YELLOW}status${NC}             Mostra status dos serviços
  ${YELLOW}logs${NC} [serviço]     Mostra logs (mysql, app, redis, nginx)
  ${YELLOW}backup${NC}             Cria backup do banco de dados
  ${YELLOW}restore${NC} <arquivo>  Restaura backup do banco
  ${YELLOW}mysql${NC}              Conecta ao MySQL via terminal
  ${YELLOW}stats${NC}              Mostra uso de CPU/RAM
  ${YELLOW}reset-db${NC}           Reseta o banco de dados
  ${YELLOW}clean${NC}              Remove tudo (containers + volumes)
  ${YELLOW}help${NC}               Mostra esta ajuda

${GREEN}Exemplos:${NC}
  $0 start
  $0 logs mysql
  $0 backup
  $0 restore database/backups/backup_20240101.sql.gz
  $0 mysql

${GREEN}Atalhos úteis:${NC}
  ${YELLOW}docker-compose ps${NC}                   # Ver containers
  ${YELLOW}docker-compose logs -f app${NC}          # Logs do app
  ${YELLOW}docker exec -it chatbot-app sh${NC}      # Entrar no container
  ${YELLOW}docker system df${NC}                    # Ver uso de disco

EOF
}

# =====================================================
# MAIN
# =====================================================

case "${1:-}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "${2:-}"
        ;;
    mysql)
        connect_mysql
        ;;
    stats)
        show_stats
        ;;
    reset-db)
        reset_database
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando desconhecido: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac