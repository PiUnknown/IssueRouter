'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface GrievanceListProps {
  selectedId: string | null
  onSelect: (id: string) => void
  filterCategory: string
  filterUrgency: string
  filterDepartment: string
}

// Mock grievance data
const mockGrievances = [
  {
    id: '1',
    title: 'Pothole on Main Street',
    category: 'infrastructure',
    urgency: 'high',
    department: 'public-works',
    author: '@citizen_001',
    timestamp: '2 hours ago',
    status: 'pending',
    excerpt: 'Large pothole affecting traffic on Main St near downtown',
  },
  {
    id: '2',
    title: 'Water Main Break',
    category: 'utilities',
    urgency: 'critical',
    department: 'utilities',
    author: '@resident_42',
    timestamp: '30 minutes ago',
    status: 'urgent',
    excerpt: 'Water outage in downtown area, no water pressure',
  },
  {
    id: '3',
    title: 'Traffic Light Malfunction',
    category: 'safety',
    urgency: 'high',
    department: 'public-works',
    author: '@drive_safe',
    timestamp: '1 hour ago',
    status: 'in-progress',
    excerpt: 'Traffic light at 5th and Oak not working properly',
  },
  {
    id: '4',
    title: 'Illegal Parking Blocking Driveway',
    category: 'safety',
    urgency: 'medium',
    department: 'police',
    author: '@homeowner_23',
    timestamp: '4 hours ago',
    status: 'pending',
    excerpt: 'Car parked in no-parking zone blocking my driveway for 2 days',
  },
  {
    id: '5',
    title: 'Air Quality Alert',
    category: 'environment',
    urgency: 'high',
    department: 'health',
    author: '@green_activist',
    timestamp: '6 hours ago',
    status: 'pending',
    excerpt: 'Excessive air pollution near industrial area',
  },
  {
    id: '6',
    title: 'Streetlight Out',
    category: 'infrastructure',
    urgency: 'low',
    department: 'public-works',
    author: '@resident_007',
    timestamp: '8 hours ago',
    status: 'pending',
    excerpt: 'Streetlight on Oak Avenue has been out for weeks',
  },
]

const urgencyColors: Record<string, { badge: string; icon: string }> = {
  critical: { badge: 'bg-destructive/20 text-destructive border-destructive/30', icon: '🔴' },
  high: { badge: 'bg-chart-3/20 text-chart-3 border-chart-3/30', icon: '🟠' },
  medium: { badge: 'bg-chart-2/20 text-chart-2 border-chart-2/30', icon: '🟡' },
  low: { badge: 'bg-chart-5/20 text-chart-5 border-chart-5/30', icon: '🟢' },
}

export function GrievanceList({
  selectedId,
  onSelect,
  filterCategory,
  filterUrgency,
  filterDepartment,
}: GrievanceListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  const filteredGrievances = useMemo(() => {
    let result = mockGrievances

    if (filterCategory !== 'all') {
      result = result.filter(g => g.category === filterCategory)
    }
    if (filterUrgency !== 'all') {
      result = result.filter(g => g.urgency === filterUrgency)
    }
    if (filterDepartment !== 'all') {
      result = result.filter(g => g.department === filterDepartment)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(g => 
        g.title.toLowerCase().includes(term) || 
        g.excerpt.toLowerCase().includes(term)
      )
    }

    if (sortBy === 'urgent') {
      const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      result.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
    }

    return result
  }, [filterCategory, filterUrgency, filterDepartment, searchTerm, sortBy])

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search grievances..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button variant="outline" className="border-border hover:bg-secondary">
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Sort */}
      <div className="flex gap-2">
        <span className="text-xs text-muted-foreground py-2">Sort by:</span>
        <Button 
          size="sm"
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          onClick={() => setSortBy('recent')}
          className={sortBy === 'recent' ? 'bg-primary' : 'border-border'}
        >
          Recent
        </Button>
        <Button 
          size="sm"
          variant={sortBy === 'urgent' ? 'default' : 'outline'}
          onClick={() => setSortBy('urgent')}
          className={sortBy === 'urgent' ? 'bg-primary' : 'border-border'}
        >
          Urgent
        </Button>
      </div>

      {/* Grievance Cards */}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {filteredGrievances.map((grievance) => (
          <Card
            key={grievance.id}
            onClick={() => onSelect(grievance.id)}
            className={`p-4 border cursor-pointer transition-all hover:border-primary ${
              selectedId === grievance.id
                ? 'border-primary bg-card ring-2 ring-primary/20'
                : 'border-border hover:bg-secondary/50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground flex-1 leading-tight">
                  {grievance.title}
                </h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {grievance.timestamp}
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {grievance.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline"
                    className={`text-xs border ${urgencyColors[grievance.urgency].badge}`}
                  >
                    {urgencyColors[grievance.urgency].icon} {grievance.urgency}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {grievance.author}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-secondary rounded">
                  {grievance.department}
                </span>
                <span className="px-2 py-1 bg-secondary rounded">
                  {grievance.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredGrievances.length === 0 && (
        <Card className="p-8 text-center border-border bg-card/50">
          <p className="text-muted-foreground">No grievances match your filters</p>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-center py-2">
        Showing {filteredGrievances.length} of {mockGrievances.length} grievances
      </div>
    </div>
  )
}
