import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/dashboard-data';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: getDashboardStats(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
