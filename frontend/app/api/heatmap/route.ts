import { NextResponse } from 'next/server';
import { getHeatmapSummary } from '@/lib/dashboard-data';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: getHeatmapSummary(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching heatmap summary:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch heatmap data' }, { status: 500 });
  }
}
