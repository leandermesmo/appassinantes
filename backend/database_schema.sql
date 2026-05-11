-- Script SQL para criação do banco de dados MySQL - Plataforma SaaS Crypto
-- Gerado automaticamente com base no esquema do Prisma

CREATE DATABASE IF NOT EXISTS appcrypto;
USE appcrypto;

-- ─────────────────────────────────────────────
-- 1. CONFIGURAÇÕES GERAIS
-- ─────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────
-- 2. TABELAS INDEPENDENTES
-- ─────────────────────────────────────────────

-- Tabela de Usuários
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified DATETIME,
    image VARCHAR(255),
    password_hash VARCHAR(255),
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Planos
DROP TABLE IF EXISTS plans;
CREATE TABLE plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    billing_cycle ENUM('MONTHLY', 'YEARLY') DEFAULT 'MONTHLY',
    max_favorites INT DEFAULT 5,
    max_signals INT DEFAULT 1,
    max_history_records INT DEFAULT 20,
    has_vip_signals TINYINT(1) DEFAULT 0,
    has_signal_alerts TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Criptomoedas
DROP TABLE IF EXISTS cryptocurrencies;
CREATE TABLE cryptocurrencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    base_asset VARCHAR(20) NOT NULL,
    quote_asset VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_crypto_symbol (symbol),
    INDEX idx_crypto_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Indicadores Técnicos
DROP TABLE IF EXISTS technical_indicators;
CREATE TABLE technical_indicators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parameters JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Configuração Freemium
DROP TABLE IF EXISTS freemium_config;
CREATE TABLE freemium_config (
    id INT PRIMARY KEY DEFAULT 1,
    allowed_symbols JSON NOT NULL,
    allowed_timeframes JSON NOT NULL,
    max_history_records INT DEFAULT 20,
    max_signals INT DEFAULT 1,
    max_favorites INT DEFAULT 3,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Candles (Dados OHLCV)
DROP TABLE IF EXISTS candles;
CREATE TABLE candles (
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    open_time BIGINT NOT NULL,
    close_time BIGINT NOT NULL,
    `open` DECIMAL(20, 8) NOT NULL,
    high DECIMAL(20, 8) NOT NULL,
    low DECIMAL(20, 8) NOT NULL,
    `close` DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(20, 8) NOT NULL,
    quote_asset_volume DECIMAL(20, 8) NOT NULL,
    number_of_trades INT NOT NULL,
    taker_buy_base_asset_volume DECIMAL(20, 8) NOT NULL,
    taker_buy_quote_asset_volume DECIMAL(20, 8) NOT NULL,
    PRIMARY KEY (symbol, timeframe, open_time),
    INDEX idx_candles_close_time (close_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Indicadores (Valores Calculados)
DROP TABLE IF EXISTS indicators;
CREATE TABLE indicators (
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    open_time BIGINT NOT NULL,
    rsi_k DECIMAL(18, 8),
    rsi_d DECIMAL(18, 8),
    rsi DECIMAL(18, 8),
    rsi_ma DECIMAL(18, 8),
    macd DECIMAL(18, 8),
    macd_signal DECIMAL(18, 8),
    ema1 DECIMAL(18, 8),
    ema2 DECIMAL(18, 8),
    PRIMARY KEY (symbol, timeframe, open_time),
    CONSTRAINT fk_indicators_candles FOREIGN KEY (symbol, timeframe, open_time) 
        REFERENCES candles(symbol, timeframe, open_time) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Tokens de Verificação
DROP TABLE IF EXISTS verification_tokens;
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires DATETIME NOT NULL,
    UNIQUE KEY idx_verification_identifier_token (identifier, token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 3. TABELAS DEPENDENTES (RELACIONAMENTOS)
-- ─────────────────────────────────────────────

-- Tabela de Contas (OAuth)
DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INT,
    token_type VARCHAR(50),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    UNIQUE KEY idx_provider_account (provider, provider_account_id),
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Sessões
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
    id CHAR(36) PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id CHAR(36) NOT NULL,
    expires DATETIME NOT NULL,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Refresh Tokens
DROP TABLE IF EXISTS refresh_tokens;
CREATE TABLE refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id CHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rt_user (user_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Assinaturas
DROP TABLE IF EXISTS subscriptions;
CREATE TABLE subscriptions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING') DEFAULT 'ACTIVE',
    current_period_start DATETIME NOT NULL,
    current_period_end DATETIME NOT NULL,
    canceled_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sub_user_status (user_id, status),
    INDEX idx_sub_end_date (current_period_end),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Pagamentos
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    subscription_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    payment_method VARCHAR(50) NOT NULL,
    external_transaction_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pay_user (user_id),
    INDEX idx_pay_status (status),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Histórico de Sinais
DROP TABLE IF EXISTS signal_history;
CREATE TABLE signal_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    crypto_id INT NOT NULL,
    indicator_id INT NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    signal_type ENUM('BUY', 'SELL', 'NEUTRAL', 'STRONG_BUY', 'STRONG_SELL') NOT NULL,
    value DECIMAL(18, 8) NOT NULL,
    generated_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sig_crypto_timeframe (crypto_id, timeframe),
    INDEX idx_sig_generated_at (generated_at),
    INDEX idx_sig_composite (crypto_id, indicator_id, timeframe),
    CONSTRAINT fk_signal_crypto FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id),
    CONSTRAINT fk_signal_indicator FOREIGN KEY (indicator_id) REFERENCES technical_indicators(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Favoritos
DROP TABLE IF EXISTS user_favorites;
CREATE TABLE user_favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    crypto_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_user_crypto_unique (user_id, crypto_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_crypto FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Logs Administrativos
DROP TABLE IF EXISTS admin_logs;
CREATE TABLE admin_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id CHAR(36) NOT NULL,
    action ENUM(
        'ROLE_CHANGE', 
        'STATUS_CHANGE', 
        'SUBSCRIPTION_CHANGE', 
        'SUBSCRIPTION_CANCEL', 
        'SUBSCRIPTION_OVERRIDE', 
        'FREEMIUM_CONFIG_CHANGE', 
        'PLAN_CHANGE', 
        'CRYPTO_STATUS_CHANGE', 
        'CRYPTO_SYNC'
    ) NOT NULL,
    target_user_id CHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_log_admin (admin_id),
    INDEX idx_admin_log_date (created_at),
    CONSTRAINT fk_admin_log_admin FOREIGN KEY (admin_id) REFERENCES users(id),
    CONSTRAINT fk_admin_log_target FOREIGN KEY (target_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
