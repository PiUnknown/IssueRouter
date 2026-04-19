'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FilterPanelProps {
  onCategoryChange: (value: string) => void
  onUrgencyChange: (value: string) => void
  onDepartmentChange: (value: string) => void
}

const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'safety', label: 'Safety' },
  { id: 'environment', label: 'Environment' },
]

const urgencyLevels = [
  { id: 'all', label: 'All Urgency' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

const departments = [
  { id: 'all', label: 'All Departments' },
  { id: 'public-works', label: 'Public Works' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'police', label: 'Police' },
  { id: 'health', label: 'Health' },
  { id: 'planning', label: 'Planning' },
]

export function FilterPanel({
  onCategoryChange,
  onUrgencyChange,
  onDepartmentChange,
}: FilterPanelProps) {
  return (
    <Card className="p-4 border border-border bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Filters</h3>
      
      <div className="space-y-4">
        {/* Category Filter */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Category
          </label>
          <div className="space-y-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                onClick={() => onCategoryChange(cat.id)}
                className="w-full justify-start text-left text-sm border-border hover:bg-secondary"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Urgency Filter */}
        <div className="pt-4 border-t border-border">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Urgency
          </label>
          <div className="space-y-2">
            {urgencyLevels.map((level) => (
              <Button
                key={level.id}
                variant="outline"
                onClick={() => onUrgencyChange(level.id)}
                className="w-full justify-start text-left text-sm border-border hover:bg-secondary"
              >
                {level.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Department Filter */}
        <div className="pt-4 border-t border-border">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Department
          </label>
          <div className="space-y-2">
            {departments.map((dept) => (
              <Button
                key={dept.id}
                variant="outline"
                onClick={() => onDepartmentChange(dept.id)}
                className="w-full justify-start text-left text-sm border-border hover:bg-secondary"
              >
                {dept.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
