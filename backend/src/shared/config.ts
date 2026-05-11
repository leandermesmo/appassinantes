/**
 * Flags globais de funcionalidade do sistema.
 */
export const FLAGS = {
  // Define se o fluxo de leitura/escrita de indicadores técnicos e sinais no banco está ativo.
  ENABLE_INDICATOR_PERSISTENCE: process.env.ENABLE_INDICATOR_PERSISTENCE === 'true' || false,
  // Define se o scanner automático de mercado está ativo.
  ENABLE_MARKET_SCANNER: process.env.ENABLE_MARKET_SCANNER === 'true' || false,
  // Define se a ingestão automática de alta precisão está ativa.
  ENABLE_AUTO_INGESTION: process.env.ENABLE_AUTO_INGESTION === 'true' || false,
};
