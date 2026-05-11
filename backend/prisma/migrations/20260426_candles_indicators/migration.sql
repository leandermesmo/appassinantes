-- Migration: Tabelas de candles e indicadores técnicos
-- Criadas via SQL direto para suportar ON DUPLICATE KEY UPDATE (não suportado pelo Prisma ORM)

CREATE TABLE IF NOT EXISTS `candles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `symbol` VARCHAR(20) NOT NULL,
  `timeframe` ENUM('15m','1h','4h','1d','1w','1M') NOT NULL,
  `open_time` BIGINT NOT NULL,
  `close_time` BIGINT NOT NULL,
  `open` DECIMAL(18,8) NOT NULL,
  `high` DECIMAL(18,8) NOT NULL,
  `low` DECIMAL(18,8) NOT NULL,
  `close` DECIMAL(18,8) NOT NULL,
  `volume` DECIMAL(20,8) NOT NULL,
  `quote_asset_volume` DECIMAL(20,8) NOT NULL,
  `number_of_trades` INT NOT NULL DEFAULT 0,
  `taker_buy_base_asset_volume` DECIMAL(20,8) NOT NULL DEFAULT 0,
  `taker_buy_quote_asset_volume` DECIMAL(20,8) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_candle` (`symbol`, `timeframe`, `open_time`),
  INDEX `idx_candle_lookup` (`symbol`, `timeframe`, `open_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `indicators` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `symbol` VARCHAR(20) NOT NULL,
  `timeframe` ENUM('15m','1h','4h','1d','1w','1M') NOT NULL,
  `open_time` BIGINT NOT NULL,
  `rsi_k` DECIMAL(10,5) DEFAULT NULL,
  `rsi_d` DECIMAL(10,5) DEFAULT NULL,
  `rsi` DECIMAL(10,5) DEFAULT NULL,
  `rsi_ma` DECIMAL(10,5) DEFAULT NULL,
  `macd` DECIMAL(18,8) DEFAULT NULL,
  `macd_signal` DECIMAL(18,8) DEFAULT NULL,
  `ema1` DECIMAL(18,8) DEFAULT NULL,
  `ema2` DECIMAL(18,8) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_indicator` (`symbol`, `timeframe`, `open_time`),
  INDEX `idx_indicator_lookup` (`symbol`, `timeframe`, `open_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
