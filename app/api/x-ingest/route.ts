import { NextRequest, NextResponse } from 'next/server';

/**
 * X API Ingestion endpoint
 * 
 * This endpoint would:
 * 1. Listen for tweets with #complaints_gov hashtag
 * 2. Extract text and metadata from tweets
 * 3. Run NLP to classify as complaint or not
 * 4. Extract location entities (NER)
 * 5. Determine urgency level
 * 6. Route to appropriate department
 * 7. Store in grievances table
 */

interface XPost {
  id: string;
  author_id: string;
  author_handle: string;
  content: string;
  created_at: string;
  hashtags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook from X
    if (!validateXWebhook(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tweets: XPost[] = body.tweets || [];

    console.log(`[v0] Processing ${tweets.length} tweets from X`);

    const processed = tweets.map((tweet) => {
      // Step 1: Check if it matches complaint hashtag
      const isComplaint = tweet.hashtags?.includes('complaints_gov') || 
                         tweet.content.includes('#complaints_gov');

      if (!isComplaint) {
        return { status: 'skipped', id: tweet.id, reason: 'No complaint hashtag' };
      }

      // Step 2: Extract location using NER (Named Entity Recognition)
      const locationMatch = extractLocation(tweet.content);

      // Step 3: Classify complaint category
      const category = classifyCategory(tweet.content);

      // Step 4: Determine urgency
      const urgency = determineUrgency(tweet.content);

      // Step 5: Route to department
      const department = routeToDepartment(category);

      // Step 6: Generate AI summary
      const summary = generateSummary(tweet.content);

      return {
        status: 'processed',
        id: tweet.id,
        location: locationMatch,
        category,
        urgency,
        department,
        summary,
        confidence: Math.random() * 30 + 70,
      };
    });

    const successful = processed.filter((p) => p.status === 'processed');
    const skipped = processed.filter((p) => p.status === 'skipped');

    console.log(`[v0] Successfully processed ${successful.length} grievances`);
    console.log(`[v0] Skipped ${skipped.length} non-complaint posts`);

    return NextResponse.json({
      success: true,
      processed: successful.length,
      skipped: skipped.length,
      data: processed,
    });
  } catch (error) {
    console.error('[v0] Error processing X ingest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process tweets' },
      { status: 500 }
    );
  }
}

// Mock utility functions - would use real ML models in production
function validateXWebhook(request: NextRequest): boolean {
  // In production, verify X's webhook signature
  return true;
}

function extractLocation(text: string): string {
  // Would use spaCy NER in production
  const locations = ['Area 51', 'Sector 5', 'Downtown', 'Main St', 'Mosque'];
  const found = locations.find((loc) => text.includes(loc));
  return found || 'Unknown location';
}

function classifyCategory(text: string): string {
  // Would use scikit-learn classifier in production
  const lowerText = text.toLowerCase();

  if (lowerText.includes('pothole') || lowerText.includes('road') || lowerText.includes('street')) {
    return 'Infrastructure';
  }
  if (lowerText.includes('water') || lowerText.includes('tap')) {
    return 'Water';
  }
  if (lowerText.includes('light') || lowerText.includes('electricity')) {
    return 'Utilities';
  }
  if (lowerText.includes('garbage') || lowerText.includes('waste')) {
    return 'Sanitation';
  }
  if (lowerText.includes('health') || lowerText.includes('hospital')) {
    return 'Health';
  }

  return 'General';
}

function determineUrgency(text: string): string {
  // Would use hybrid rules + ML in production
  const lowerText = text.toLowerCase();
  const urgent = ['critical', 'emergency', 'urgent', 'danger', 'dangerous', 'broken', 'blocked'];
  const medium = ['issue', 'problem', 'complaint', 'broken'];

  const hasUrgent = urgent.some((word) => lowerText.includes(word));
  if (hasUrgent) return 'HIGH';

  const hasMedium = medium.some((word) => lowerText.includes(word));
  if (hasMedium) return 'MEDIUM';

  return 'LOW';
}

function routeToDepartment(category: string): string {
  const mapping: Record<string, string> = {
    Infrastructure: 'Public Works & Development',
    Water: 'Water Supply',
    Utilities: 'Utilities',
    Sanitation: 'Sanitation',
    Health: 'Health',
  };

  return mapping[category] || 'General Services';
}

function generateSummary(text: string): string {
  // Would use OpenAI or Hugging Face in production
  // For now, just return first 100 characters
  return text.substring(0, 100) + (text.length > 100 ? '...' : '');
}

export async function GET() {
  return NextResponse.json({
    message: 'X Ingest endpoint is running',
    hashtag: '#complaints_gov',
    status: 'ready',
  });
}
