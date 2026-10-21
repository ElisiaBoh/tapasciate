import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { navigate } from './useRoute'
import { clearSavedZonePath, getSavedZonePath, initialRedirect, saveZonePath } from '../utils/savedZone'

export interface SavedZone {
  savedPath: string | null
  saveZone: (path: string) => void
}

export function useSavedZone(pathname: string, zoneNotFound: boolean): SavedZone {
  const [savedPath, setSavedPath] = useState(getSavedZonePath)

  const redirectRef = useRef(initialRedirect(pathname, savedPath))
  useLayoutEffect(() => {
    if (redirectRef.current) navigate(redirectRef.current, { replace: true })
  }, [])

  useEffect(() => {
    if (zoneNotFound && pathname === savedPath) {
      clearSavedZonePath()
      setSavedPath(null)
    }
  }, [zoneNotFound, pathname, savedPath])

  const saveZone = useCallback((path: string) => {
    saveZonePath(path)
    setSavedPath(path)
  }, [])

  return { savedPath, saveZone }
}
