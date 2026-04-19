import { NextRequest, NextResponse } from 'next/server';
import { getGrievanceById, getGrievanceClusters } from '@/lib/dashboard-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const grievance = getGrievanceById(id);

      if (!grievance) {
        return NextResponse.json({ success: false, error: 'Cluster not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: grievance });
    }

    const data = getGrievanceClusters({
      location: searchParams.get('location') ?? 'all',
      department: searchParams.get('department') ?? 'all',
      searchQuery: searchParams.get('searchQuery') ?? '',
      minPeople: searchParams.get('minPeople') ?? 'all',
      dateWindow: searchParams.get('dateWindow') ?? 'all',
      volumeBand: searchParams.get('volumeBand') ?? 'all',
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error fetching grievance clusters:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch grievance clusters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json(
      {
        success: true,
        message: 'Backend intake scaffold created',
        received: body,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error creating grievance cluster:', error);
    return NextResponse.json({ success: false, error: 'Failed to receive cluster payload' }, { status: 500 });
  }
}
