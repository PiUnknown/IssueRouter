-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- X posts/tweets table
CREATE TABLE IF NOT EXISTS x_posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_handle VARCHAR(255),
  author_name VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP,
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hashtag VARCHAR(50),
  is_complaint BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grievances table (main issue/complaint data)
CREATE TABLE IF NOT EXISTS grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_post_id TEXT REFERENCES x_posts(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'x',
  
  -- Location data
  location_raw TEXT,
  location_identified VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT,
  area_grid_id INT,
  
  -- Classification
  category VARCHAR(100),
  subcategory VARCHAR(100),
  assigned_department VARCHAR(100),
  
  -- Urgency/Priority
  urgency VARCHAR(50),
  priority_score INT,
  
  -- AI/ML scores
  classification_confidence FLOAT,
  extraction_confidence FLOAT,
  routing_confidence FLOAT,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'unassigned',
  assigned_to_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Metadata
  internal_notes TEXT,
  ai_summary TEXT,
  suggested_actions TEXT[]
);

-- Department routing rules
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category_mapping TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID REFERENCES grievances(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255),
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Heatmap data (aggregated complaints by area/grid)
CREATE TABLE IF NOT EXISTS heatmap_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_id INT NOT NULL,
  area_name VARCHAR(255),
  complaint_count INT DEFAULT 0,
  intensity FLOAT DEFAULT 0,
  last_24h_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(assigned_department);
CREATE INDEX IF NOT EXISTS idx_grievances_created ON grievances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grievances_urgency ON grievances(urgency);
CREATE INDEX IF NOT EXISTS idx_x_posts_processed ON x_posts(processed);
CREATE INDEX IF NOT EXISTS idx_x_posts_created ON x_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_heatmap_grid ON heatmap_data(grid_id);

-- Insert default departments
INSERT INTO departments (name, description, category_mapping) VALUES
  ('Public Works & Development', 'Roads, potholes, infrastructure', ARRAY['Infrastructure', 'Roads', 'Potholes']),
  ('Water Supply', 'Water tap, pipeline, supply issues', ARRAY['Water', 'Water Supply', 'Sanitation']),
  ('Health', 'Health services, clinics, hospitals', ARRAY['Health', 'Medical', 'Hospital']),
  ('Sanitation', 'Waste, cleaning, hygiene', ARRAY['Sanitation', 'Waste', 'Cleaning']),
  ('Urban Development', 'Planning, construction, zoning', ARRAY['Urban Planning', 'Construction', 'Development'])
ON CONFLICT (name) DO NOTHING;
