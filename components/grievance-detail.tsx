'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, AlertCircle, MessageSquare, MapPin, Users } from 'lucide-react'

interface GrievanceDetailProps {
  grievanceId: string
}

// Mock detailed data
const mockDetails: Record<string, any> = {
  '1': {
    id: '1',
    title: 'Pothole on Main Street',
    category: 'infrastructure',
    urgency: 'high',
    department: 'public-works',
    author: '@citizen_001',
    timestamp: '2 hours ago',
    status: 'pending',
    confidence: 0.94,
    extractedLocation: '123 Main Street, Downtown',
    extractedIssue: 'Large pothole affecting traffic',
    fullText: 'There\'s a huge pothole on Main Street near the downtown area. It\'s been there for weeks and is getting bigger. Cars are swerving to avoid it, creating a hazard for other drivers.',
    suggestedActions: [
      'Send inspection team',
      'Schedule repair',
      'Add safety markers',
    ],
    notes: [],
  },
  '2': {
    id: '2',
    title: 'Water Main Break',
    category: 'utilities',
    urgency: 'critical',
    department: 'utilities',
    author: '@resident_42',
    timestamp: '30 minutes ago',
    status: 'urgent',
    confidence: 0.98,
    extractedLocation: 'Downtown District',
    extractedIssue: 'Water outage, no water pressure',
    fullText: 'Water outage in downtown area affecting multiple blocks. No water pressure for 8+ hours. Residents unable to use basic utilities.',
    suggestedActions: [
      'Deploy emergency response team immediately',
      'Issue public alert',
      'Assess damage extent',
    ],
    notes: [],
  },
}

export function GrievanceDetail({ grievanceId }: GrievanceDetailProps) {
  const detail = mockDetails[grievanceId] || mockDetails['1']
  const [notes, setNotes] = useState(detail.notes)
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote])
      setNewNote('')
      setIsAddingNote(false)
    }
  }

  const urgencyColors: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'bg-destructive/20', text: 'text-destructive' },
    high: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
    medium: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
    low: { bg: 'bg-green-500/20', text: 'text-green-500' },
  }

  return (
    <Card className="border border-border bg-card h-full flex flex-col overflow-hidden">
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-foreground">{detail.title}</h2>
            <Badge 
              className={`${urgencyColors[detail.urgency].bg} ${urgencyColors[detail.urgency].text} border-0`}
            >
              {detail.urgency}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{detail.author} • {detail.timestamp}</p>
        </div>

        <Separator className="bg-border" />

        {/* AI Extraction Stats */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">AI Confidence</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all"
                style={{ width: `${detail.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-foreground">{(detail.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Extracted Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Extracted Data</h3>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm text-foreground">{detail.extractedLocation}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Issue</p>
                <p className="text-sm text-foreground">{detail.extractedIssue}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm text-foreground capitalize">{detail.department.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Full Text */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Original Post</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {detail.fullText}
          </p>
        </div>

        {/* Suggested Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Suggested Actions</h3>
          <div className="space-y-2">
            {detail.suggestedActions.map((action: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded bg-secondary/50">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{action}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Notes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes ({notes.length})
          </h3>
          
          {notes.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notes.map((note: string, idx: number) => (
                <div key={idx} className="p-2 rounded bg-secondary/30 text-sm text-foreground">
                  {note}
                </div>
              ))}
            </div>
          )}

          {isAddingNote ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="bg-secondary border-border text-sm min-h-20 resize-none"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={handleAddNote}
                  className="bg-primary hover:bg-primary/90"
                >
                  Save
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingNote(false)
                    setNewNote('')
                  }}
                  className="border-border"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setIsAddingNote(true)}
              className="w-full border-border hover:bg-secondary"
            >
              Add Note
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-border space-y-2">
        <Button className="w-full bg-primary hover:bg-primary/90">
          Assign to Department
        </Button>
        <Button variant="outline" className="w-full border-border hover:bg-secondary">
          Mark as Resolved
        </Button>
      </div>
    </Card>
  )
}
