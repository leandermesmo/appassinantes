import { MarketService } from "../src/application/services/market.service";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

async function test() {
  console.log("Iniciando teste de análise de mercado...");
  try {
    const analysis = await MarketService.getAnalysis("BTCUSDT", "1d");
    console.log("Sucesso!");
    console.log(`Symbol: ${analysis.symbol}`);
    console.log(`Interval: ${analysis.interval}`);
    console.log(`Últimos 2 indicadores calculados (Padrão Projeto TESTE):`);
    console.log(JSON.stringify(analysis.indicators.slice(0, 2), null, 2));
  } catch (error) {
    console.error("Erro no teste:", error);
  }
}

test();
