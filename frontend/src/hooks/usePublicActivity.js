import { useEffect, useRef, useCallback } from 'react'
import { usePostActivityMutation } from '../api/apiSlice'
import { useAuth } from '../contexts/AuthContext'

const SESSION_KEY = 'plot-activity-session'

function getSessionId() {
  if (typeof window === 'undefined') return ''
  let s = localStorage.getItem(SESSION_KEY)
  if (!s) {
    s = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, s)
  }
  return s
}

/**
 * Anonymous session activity for public map (page_view, plot_select | unit_select, filter_change).
 * @param {string|number|undefined} layoutId
 * @param {'plot'|'building'} layoutKind
 */
export function usePublicActivity(layoutId, layoutKind = 'plot') {
  const { user, loading } = useAuth()
  const sessionIdRef = useRef(getSessionId())
  const plotTimer = useRef(null)
  const filterTimer = useRef(null)
  const trackedLayoutRef = useRef(null)
  const [postActivity] = usePostActivityMutation()

  useEffect(() => {
    if (!layoutId) return
    if (loading) return // Wait until auth state is fully loaded
    if (user) return // Do not track activity for logged-in builders/admins
    if (trackedLayoutRef.current === layoutId) return // Prevent double tracking in StrictMode

    trackedLayoutRef.current = layoutId
    postActivity({
      layoutId,
      sessionId: sessionIdRef.current,
      eventType: 'page_view',
      payload: { path: typeof window !== 'undefined' ? window.location.pathname : '' },
    })
  }, [layoutId, postActivity, user, loading])



  const logPlotSelect = useCallback(
    (plot) => {
      if (!layoutId) return
      if (loading) return
      if (user) return
      
      if (plotTimer.current) clearTimeout(plotTimer.current)
      const selectEvent = layoutKind === 'building' ? 'unit_select' : 'plot_select'
      plotTimer.current = setTimeout(() => {
        postActivity({
          layoutId,
          sessionId: sessionIdRef.current,
          eventType: selectEvent,
          payload: plot
            ? {
                plotId: plot.id ?? plot.number,
                number: plot.number,
                floor: plot.floor ?? null,
                tower: plot.tower ?? null,
              }
            : { cleared: true },
        })
      }, 400)
    },
    [layoutId, layoutKind, postActivity, user, loading]
  )

  const logFilterChange = useCallback((filters) => {
    if (!layoutId) return
    if (loading) return
    if (user) return

    if (filterTimer.current) clearTimeout(filterTimer.current)
    filterTimer.current = setTimeout(() => {
      postActivity({
        layoutId,
        sessionId: sessionIdRef.current,
        eventType: 'filter_change',
        payload: { filters },
      })
    }, 800)
  }, [layoutId, postActivity, user, loading])

  return { logPlotSelect, logFilterChange }
}
