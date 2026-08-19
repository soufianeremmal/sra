// STUB — Notion integration not yet approved by Nicolas.
// When the real Notion bot is provisioned:
//   1. Replace fetchBikesFromNotion() with a real API call to Notion's databases endpoint
//   2. Move the NOTION_API_KEY and DATABASE_ID to .env
//   3. Nothing else in the app changes — this interface is what the bikes module depends on.

export interface NotionBikeRow {
  sn: string;
  model: 'Fusion 1' | 'Fusion 1.5' | 'Fusion 2';
  status: 'Available' | 'In repair' | 'On demo' | 'On AO' | 'On salon';
  fifteenControlUrl?: string;
}

// Fake fleet — realistic-looking data for local dev, matching Fifteen's SN format (118xxx).
const STUB_BIKES: NotionBikeRow[] = [
  { sn: '118039', model: 'Fusion 2', status: 'Available', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118039' },
  { sn: '118147', model: 'Fusion 2', status: 'Available', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118147' },
  { sn: '118256', model: 'Fusion 2', status: 'Available', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118256' },
  { sn: '118384', model: 'Fusion 2', status: 'Available', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118384' },
  { sn: '118472', model: 'Fusion 2', status: 'On AO', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118472' },
  { sn: '118501', model: 'Fusion 2', status: 'On demo', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118501' },
  { sn: '118628', model: 'Fusion 2', status: 'In repair', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118628' },
  { sn: '118715', model: 'Fusion 1.5', status: 'Available', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118715' },
  { sn: '118842', model: 'Fusion 1.5', status: 'Available', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118842' },
  { sn: '118906', model: 'Fusion 1.5', status: 'On salon', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118906' },
  { sn: '118173', model: 'Fusion 1', status: 'In repair', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118173' },
  { sn: '118294', model: 'Fusion 1', status: 'In repair', fifteenControlUrl: 'https://control.fifteen.eu/bikes/118294' },
];

export async function fetchBikesFromNotion(): Promise<NotionBikeRow[]> {
  // Simulate a small network delay so behavior feels realistic
  await new Promise((r) => setTimeout(r, 150));
  return STUB_BIKES;
}