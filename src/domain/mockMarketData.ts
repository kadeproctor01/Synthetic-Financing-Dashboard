import type { BoxRequest, MarketDataProvider, MarketDataSnapshot, ModelConfiguration, OptionQuote, OptionRight } from "./types";
import { addMonthsIso } from "./date";

export class MockMarketDataProvider implements MarketDataProvider {
  async getSnapshot(request: BoxRequest, config: ModelConfiguration): Promise<MarketDataSnapshot> {
    const snapshotTimestamp = `${request.tradeDate}T16:15:21.000Z`;
    const expirations = [
      addMonthsIso(request.tradeDate, request.desiredTenorMonths),
      addMonthsIso(request.tradeDate, request.desiredTenorMonths + 1)
    ];
    const strikes = [6800, 7000, 7200, 7450, 7700, 7950, 8200];
    const quotes: OptionQuote[] = [];
    for (const expirationDate of expirations) {
      for (const strike of strikes) {
        quotes.push(makeQuote(config, expirationDate, strike, "CALL", snapshotTimestamp));
        quotes.push(makeQuote(config, expirationDate, strike, "PUT", snapshotTimestamp));
      }
    }
    return {
      provider: "mock-market-data",
      snapshotTimestamp,
      underlying: config.approvedUnderlying,
      quotes
    };
  }
}

function makeQuote(
  config: ModelConfiguration,
  expirationDate: string,
  strike: number,
  right: OptionRight,
  quoteTimestamp: string
): OptionQuote {
  const callByStrike: Record<number, [number, number]> = {
    6800: [885.2, 886.7],
    7000: [690.4, 691.8],
    7200: [493.2, 494.5],
    7450: [248.8, 250.1],
    7700: [14.1, 15.4],
    7950: [4.8, 5.9],
    8200: [1.7, 2.4]
  };
  const putByStrike: Record<number, [number, number]> = {
    6800: [3.9, 4.6],
    7000: [5.3, 6.1],
    7200: [7.2, 8.1],
    7450: [22.4, 23.5],
    7700: [5.8, 6.8],
    7950: [251.3, 252.6],
    8200: [502.4, 503.9]
  };
  const [bid, ask] = right === "CALL" ? callByStrike[strike] : putByStrike[strike];
  return {
    contract: {
      underlying: config.approvedUnderlying,
      expirationDate,
      strike,
      right,
      multiplier: config.contractMultiplier,
      exerciseStyle: config.exerciseStyle,
      settlementType: config.settlementType,
      seriesType: "STANDARD",
      symbol: `${config.approvedUnderlying}-${expirationDate}-${right}-${strike}`
    },
    bid,
    ask,
    bidSize: 10,
    askSize: 10,
    openInterest: 1200,
    quoteTimestamp
  };
}
