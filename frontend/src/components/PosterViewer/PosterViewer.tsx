import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type PhotoSwipe from 'photoswipe'
import 'photoswipe/dist/photoswipe.css'
import { isViewerHistoryState, posterSlides, withViewerHistoryState } from '../../utils/poster'
import type { Event } from '../../types'
import './PosterViewer.css'

interface Props {
  event: Event
  index: number
  // Holds the inline poster images: the viewer zooms out of them on open and back into them on close
  thumbnails: RefObject<HTMLElement | null>
  onClose: () => void
}

const CLOSE_ICON = '<svg aria-hidden="true" class="pswp__icn pv-close-icon" viewBox="0 0 24 24" width="22" height="22">'
  + '<path d="M6 6l12 12M18 6 6 18" /></svg>'

export default function PosterViewer({ event, index, thumbnails, onClose }: Props) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    let pswp: PhotoSwipe | undefined
    let unmounted = false

    // Android's back button (and the browser's) closes the viewer instead of leaving the event
    const onPopState = () => {
      if (!isViewerHistoryState(window.history.state)) pswp?.close()
    }

    import('photoswipe').then(({ default: PhotoSwipeLib }) => {
      if (unmounted) return
      const images = thumbnails.current?.querySelectorAll('img')
      pswp = new PhotoSwipeLib({
        dataSource: posterSlides(event).map((slide, i) => ({ ...slide, element: images?.[i] })),
        index,
        mainClass: 'pv',
        bgOpacity: 1,
        padding: { top: 64, bottom: 24, left: 0, right: 0 },
        wheelToZoom: true,
        tapAction: false,
        closeSVG: CLOSE_ICON,
        closeTitle: 'Chiudi la locandina',
        zoomTitle: 'Ingrandisci',
        arrowPrevTitle: 'Pagina precedente',
        arrowNextTitle: 'Pagina successiva',
        errorMsg: 'Impossibile caricare la locandina',
        indexIndicatorSep: ' / ',
      })
      pswp.on('destroy', () => {
        window.removeEventListener('popstate', onPopState)
        if (unmounted) return
        if (isViewerHistoryState(window.history.state)) window.history.back()
        onCloseRef.current()
      })
      pswp.init()
      pswp.element?.setAttribute('aria-label', `Locandina ${event.title}`)
      pswp.element?.setAttribute('aria-modal', 'true')
      window.history.pushState(withViewerHistoryState(window.history.state), '')
      window.addEventListener('popstate', onPopState)
    })

    return () => {
      unmounted = true
      window.removeEventListener('popstate', onPopState)
      pswp?.destroy()
    }
  // Opened once per mount: EventDetail remounts the viewer for another event or page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
