import { useEffect, useRef, useState } from 'react'
import { clusters } from '../data/Clusters'
import { MapPin, Layers, List, TrendingUp, Building2, AlertCircle } from 'lucide-react'

// ── Real Delhi coordinates for each cluster ───────────────────
const CLUSTER_COORDS = {
  'CLU-0047': [28.6089, 77.2952], // Mayur Vihar Phase 1
  'CLU-0031': [28.7041, 77.1025], // Rohini Sector 14
  'CLU-0052': [28.5665, 77.2433], // Lajpat Nagar
  'CLU-0038': [28.5921, 77.0460], // Dwarka Sector 6
  'CLU-0061': [28.6219, 77.0878], // Janakpuri
  'CLU-0044': [28.6315, 77.2167], // Connaught Place
  'CLU-0057': [28.5244, 77.2090], // Saket
  'CLU-0029': [28.6731, 77.2882], // Shahdara
  'CLU-0073': [28.6210, 77.0588], // Uttam Nagar
  'CLU-0066': [28.5196, 77.1553], // Vasant Kunj
}

const PRIORITY_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#6366f1', 4: '#9ca3af' }
const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  inprogress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-green-50 text-green-700',
}
const STATUS_LABELS = { pending: 'Pending', inprogress: 'In progress', resolved: 'Resolved' }

// ── Leaflet SVG pin icon factory ──────────────────────────────
function makeIcon(L, color) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:28px;height:28px;border-radius:50% 50% 50% 0;
        background:${color};border:2px solid white;
        transform:rotate(-45deg);
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

// ── Popup HTML for a cluster ──────────────────────────────────
function popupHTML(c) {
  const color = PRIORITY_COLORS[c.priority]
  return `
    <div style="font-family:system-ui,sans-serif;min-width:220px;max-width:260px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
        <span style="font-size:12px;font-weight:600;color:#1f2937;line-height:1.3;">${c.problem}</span>
      </div>
      <div style="font-size:11px;color:#6b7280;margin-bottom:10px;line-height:1.5;">${c.summary.slice(0, 90)}…</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">Complaints</div>
          <div style="font-size:15px;font-weight:600;color:#1f2937;">${c.complaint_count}</div>
        </div>
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">RT reach</div>
          <div style="font-size:15px;font-weight:600;color:#1f2937;">${c.rt_reach.toLocaleString()}</div>
        </div>
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">Department</div>
          <div style="font-size:13px;font-weight:500;color:#1f2937;">${c.department}</div>
        </div>
        <div style="background:#f3f4f6;border-radius:6px;padding:6px 8px;">
          <div style="font-size:10px;color:#9ca3af;">Priority</div>
          <div style="font-size:13px;font-weight:500;color:${color};">P${c.priority}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#374151;background:#fef9ec;border:1px solid #fde68a;border-radius:6px;padding:6px 8px;line-height:1.5;">
        <span style="font-weight:600;">Recommended:</span> ${c.recommended_action.slice(0, 80)}…
      </div>
    </div>`
}

// ── Map component ─────────────────────────────────────────────
function LeafletMap({ mode }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)
  const heatRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!window.L || instanceRef.current) return

    const L = window.L
    const map = L.map(mapRef.current, {
      center: [28.6139, 77.1500],
      zoom: 11,
      zoomControl: true,
    })
    instanceRef.current = map

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Add markers for every cluster
    clusters.forEach((c) => {
      const coords = CLUSTER_COORDS[c.cluster_id]
      if (!coords) return
      const marker = L.marker(coords, { icon: makeIcon(L, PRIORITY_COLORS[c.priority]) })
        .bindPopup(popupHTML(c), { maxWidth: 280, className: 'cluster-popup' })
        .addTo(map)
      markersRef.current.push(marker)
    })

    // Heatmap layer (leaflet.heat)
    if (window.L.heatLayer) {
      const heatData = clusters.map((c) => {
        const coords = CLUSTER_COORDS[c.cluster_id]
        return coords ? [...coords, Math.min(c.complaint_count / 100, 1.0)] : null
      }).filter(Boolean)

      heatRef.current = window.L.heatLayer(heatData, {
        radius: 45,
        blur: 30,
        maxZoom: 13,
        max: 1.0,
        gradient: { 0.2: '#6366f1', 0.5: '#f97316', 0.8: '#ef4444' },
      })
    }

    return () => { map.remove(); instanceRef.current = null }
  }, [])

  // Toggle heatmap / pins based on mode prop
  useEffect(() => {
    const map = instanceRef.current
    const heat = heatRef.current
    if (!map) return

    if (mode === 'heatmap') {
      markersRef.current.forEach((m) => map.removeLayer(m))
      if (heat) heat.addTo(map)
    } else if (mode === 'pins') {
      if (heat) map.removeLayer(heat)
      markersRef.current.forEach((m) => m.addTo(map))
    } else {
      // both
      markersRef.current.forEach((m) => m.addTo(map))
      if (heat) heat.addTo(map)
    }
  }, [mode])

  return <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />
}

// ── Main page ─────────────────────────────────────────────────
export default function Maps() {
  const [mode, setMode] = useState('pins')
  const [scriptsReady, setScriptsReady] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Load Leaflet + leaflet.heat from CDN
  useEffect(() => {
    if (window.L?.heatLayer) { setScriptsReady(true); return }

    const leafletCSS = document.createElement('link')
    leafletCSS.rel = 'stylesheet'
    leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(leafletCSS)

    const loadScript = (src) => new Promise((res) => {
      const s = document.createElement('script')
      s.src = src; s.async = false
      s.onload = res
      document.head.appendChild(s)
    })

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js')
      .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js'))
      .then(() => setScriptsReady(true))
  }, [])

  const sorted = [...clusters].sort((a, b) => b.complaint_count - a.complaint_count)

  return (
    <div className="space-y-4">

      {/* ── Page header ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Complaint hotspot map
          </h2>
          <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-0.5">
            Select a location to inspect complaints, department ownership, and response urgency
          </p>
        </div>

        {/* Map mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 self-start flex-shrink-0">
          {[
            { key: 'pins', label: 'Pins', icon: MapPin },
            { key: 'heatmap', label: 'Heatmap', icon: Layers },
            { key: 'both', label: 'Both', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors
                ${mode === key
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }
              `}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map + sidebar layout ──────────────── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Map */}
        <div className="flex-1 min-h-[320px] h-[45vw] lg:h-[520px] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {scriptsReady
            ? <LeafletMap mode={mode} />
            : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-[13px] text-gray-400 animate-pulse">Loading map...</p>
              </div>
            )
          }
        </div>

        {/* Cluster list sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <List size={14} className="text-gray-400" />
            <span className="text-[12px] font-medium text-gray-600 dark:text-gray-300">
              Clusters by complaint count
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] lg:max-h-[488px] pr-0.5">
            {sorted.map((c, i) => {
              const color = PRIORITY_COLORS[c.priority]
              const isSelected = selectedId === c.cluster_id
              return (
                <button
                  key={c.cluster_id}
                  onClick={() => setSelectedId(isSelected ? null : c.cluster_id)}
                  className={`
                    w-full text-left rounded-xl border p-3 transition-all
                    ${isSelected
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: color + '20', color }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[12px] font-medium text-gray-800 dark:text-gray-100 leading-snug flex-1">
                      {c.problem}
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 mt-2 pl-7">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <MapPin size={10} />
                      {c.location.split(',')[0]}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <Building2 size={10} />
                      {c.department}
                    </span>
                  </div>

                  {/* Count + status */}
                  <div className="flex items-center justify-between mt-2 pl-7">
                    <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color }}>
                      <AlertCircle size={10} />
                      {c.complaint_count} complaints
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800 pl-7 space-y-1.5">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        {c.summary}
                      </p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 leading-relaxed">
                        <span className="font-medium">Action: </span>
                        {c.recommended_action}
                      </p>
                      <div className="flex gap-3 pt-1">
                        <span className="text-[11px] text-gray-400">
                          RT reach: <span className="font-medium text-gray-700 dark:text-gray-200">{c.rt_reach.toLocaleString()}</span>
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Trend: <span className={`font-medium ${c.trend === 'up' ? 'text-red-500' : c.trend === 'down' ? 'text-green-600' : 'text-gray-500'}`}>
                            {c.trend === 'up' ? '↑ Rising' : c.trend === 'down' ? '↓ Falling' : '→ Stable'}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}