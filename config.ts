import { NextResponse } from "next/server";
import { defaultModelConfiguration } from "@/domain/config";
import { calculateBoxStructures } from "@/domain/engine";
import { MockMarketDataProvider } from "@/domain/mockMarketData";
import { validateRequest } from "@/domain/validation";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validation = validateRequest(payload);
  if (!validation.value) {
    return NextResponse.json(
      {
        calculationEngineVersion: "box-engine-0.1.0",
        configurationVersion: defaultModelConfiguration.configurationVersion,
        request: payload,
        marketDataProvider: "none",
        marketDataSnapshotTimestamp: null,
        candidates: [],
        selectedCandidate: null,
        validationIssues: validation.issues
      },
      { status: 400 }
    );
  }

  const result = await calculateBoxStructures(validation.value, defaultModelConfiguration, new MockMarketDataProvider());
  return NextResponse.json(result);
}
