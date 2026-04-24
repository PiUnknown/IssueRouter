import { createContext, useContext, useState, useEffect } from 'react'
import { clusters as staticClusters } from '../data/Clusters'
import { fetchClusters, updateClusterStatus } from '../api/clusters'

const IssueContext = createContext(null)

export function IssueProvider({ children }) {
    // Mutable issues list — initialised from static data, then synced from API
    const [issues, setIssues] = useState(staticClusters)
    // Map of cluster_id → assigned officer object
    const [assignments, setAssignments] = useState({})
    // Set of discarded cluster_ids
    const [discarded, setDiscarded] = useState(new Set())

    // Bootstrap from backend on mount — so Progress sees real API status
    useEffect(() => {
        fetchClusters({ limit: 500 })
            .then(data => {
                if (data && data.length > 0) {
                    setIssues(data)
                }
            })
            .catch(() => {
                // Backend unreachable — silently fall back to static data
            })
    }, [])

    const assignOfficer = (clusterId, officer) => {
        // 1. Update local context immediately (optimistic)
        setAssignments(prev => ({ ...prev, [clusterId]: officer }))
        setIssues(prev =>
            prev.map(c =>
                c.cluster_id === clusterId ? { ...c, status: 'inprogress' } : c
            )
        )
        // 2. Persist to backend so API refetches return correct status
        updateClusterStatus(clusterId, 'inprogress').catch(() => {
            // Silent fail — context already updated, UX is not broken
        })
    }

    const discardIssue = (clusterId) => {
        setDiscarded(prev => new Set([...prev, clusterId]))
    }

    const value = { issues, assignments, discarded, assignOfficer, discardIssue }

    return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
}

export function useIssues() {
    return useContext(IssueContext)
}
