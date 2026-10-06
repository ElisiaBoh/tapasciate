import { test, expect, type Page } from '@playwright/test'

// --- Mock data ---

function isoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

const TODAY = isoDate(new Date())

const lombardiaBG = { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' }
const lombardiaMI = { city: 'Milano', province: 'MI', province_name: 'Milano', region: 'Lombardia' }
const venetoVI = { city: 'Schio', province: 'VI', province_name: 'Vicenza', region: 'Veneto' }

function mockEvent(id: number, name: string, date: string, location: typeof lombardiaBG, extra: object = {}) {
  return {
    id,
    name,
    date,
    location,
    poster_pages: [],
    organizer: null,
    distances: [],
    url: `https://example.com/${id}`,
    location_id: id,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...extra,
  }
}

const mockEvents = [
  mockEvent(1, 'Tapasciata dei Colli', '2030-06-15', lombardiaBG, {
    poster_pages: [
      { url: 'https://example.com/poster-p1.webp', width: 1200, height: 1697 },
      { url: 'https://example.com/poster-p2.webp', width: 1200, height: 1697 },
    ],
    organizer: 'CóR',
    distances: ['10', '21'],
  }),
  mockEvent(2, 'Tapasciata del Lago', '2030-06-15', lombardiaMI),
  mockEvent(3, 'Marcia di Schio', '2030-07-20', venetoVI),
  mockEvent(4, 'Camminata di oggi', TODAY, lombardiaBG),
]

async function mockSupabase(page: Page, data: unknown[]) {
  await page.route('**/rest/v1/events**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  )
}

async function chooseZone(page: Page, region: string, option: string) {
  await page.getByRole('button', { name: /Cambia zona/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Scegli la zona' })
  await dialog.getByRole('button', { name: new RegExp(region) }).click()
  await dialog.getByRole('link', { name: new RegExp(`^${option}`) }).click()
}

const card = (page: Page, title: string) => page.getByRole('link', { name: new RegExp(title) })

// --- Tests ---

test.describe('Caricamento', () => {
  test('mostra gli skeleton durante il fetch', async ({ page }) => {
    await page.route('**/rest/v1/events**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockEvents) })
    })
    await page.goto('/')
    await expect(page.locator('.skeleton').first()).toBeVisible()
  })

  test('mostra gli eventi dopo il caricamento', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciate in Italia')
    await expect(page.getByText('4 in calendario')).toBeVisible()
    await expect(card(page, 'Tapasciata dei Colli')).toBeVisible()
    await expect(card(page, 'Marcia di Schio')).toBeVisible()
  })

  test('mostra il messaggio di errore se il fetch fallisce', async ({ page }) => {
    await page.route('**/rest/v1/events**', route => route.abort('failed'))
    await page.goto('/')
    await expect(page.getByText(/Errore nel caricamento degli eventi/)).toBeVisible()
  })

  test('mostra lo stato vuoto se non ci sono eventi', async ({ page }) => {
    await mockSupabase(page, [])
    await page.goto('/')
    await expect(page.getByText('Nessuna tapasciata in calendario in Italia')).toBeVisible()
  })
})

test.describe('Zona', () => {
  test('scegliendo una provincia si apre la sua pagina', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await chooseZone(page, 'Lombardia', 'Bergamo')
    await expect(page).toHaveURL(/\/lombardia\/bergamo$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciate in provincia di Bergamo')
    await expect(card(page, 'Tapasciata dei Colli')).toBeVisible()
    await expect(card(page, 'Tapasciata del Lago')).toHaveCount(0)
    await expect(page).toHaveTitle('Tapasciate in provincia di Bergamo — Tapasciate.it')
  })

  test('il selettore mostra regioni e province con i conteggi', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.getByRole('button', { name: /Cambia zona/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Scegli la zona' })
    await expect(dialog.getByRole('link', { name: /Tutta Italia/ })).toContainText('4')
    await expect(dialog.getByRole('button', { name: /Lombardia/ })).toContainText('3')
    await expect(dialog.getByRole('button', { name: /Veneto/ })).toContainText('1')
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  test('la zona scelta viene ricordata: "/" e il logo portano lì', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await chooseZone(page, 'Veneto', 'Tutto il Veneto')
    await expect(page).toHaveURL(/\/veneto$/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/veneto$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciate in Veneto')
    await expect(page.getByRole('link', { name: 'Tapasciate.it, home' })).toHaveAttribute('href', '/veneto')
  })

  test('scegliendo "Tutta Italia" la home torna a essere l\'Italia', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await chooseZone(page, 'Lombardia', 'Milano')
    await page.getByRole('button', { name: /Cambia zona/ }).click()
    await page.getByRole('dialog').getByRole('link', { name: /Tutta Italia/ }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
  })

  test('arrivando da un link a una regione la zona ricordata non cambia', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/lombardia')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciate in Lombardia')
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
  })

  test('zona inesistente', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/sardegna')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zona non trovata')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  })
})

test.describe('Periodo', () => {
  test('"Questa settimana" mostra solo gli eventi della settimana', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.getByRole('button', { name: 'Questa settimana' }).click()
    await expect(page.getByText('1 questa settimana · 4 in calendario')).toBeVisible()
    await expect(card(page, 'Camminata di oggi')).toBeVisible()
    await expect(card(page, 'Tapasciata dei Colli')).toHaveCount(0)
  })

  test('nessun risultato nel periodo', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/veneto')
    await page.getByRole('button', { name: 'Questa settimana' }).click()
    await expect(page.getByText('Nessuna tapasciata in Veneto questa settimana')).toBeVisible()
  })
})

test.describe('Scheda evento', () => {
  test('mostra località e distanze; tutta la card porta al dettaglio', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    const colli = card(page, 'Tapasciata dei Colli')
    await expect(colli).toContainText('Bergamo (BG)')
    await expect(colli).toContainText('10 - 21 km')
    await expect(colli).toHaveAttribute('href', '/evento/1-tapasciata-dei-colli')
  })
})

test.describe('Header', () => {
  test('l\'header non ha la classe scrolled all\'avvio', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await expect(page.locator('header')).not.toHaveClass(/header--scrolled/)
  })

  test('l\'header riceve la classe scrolled dopo lo scroll', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.waitForSelector('.event-card')
    // Rende la pagina abbastanza alta da poter scrollare, poi scrolla
    await page.evaluate(() => {
      document.documentElement.style.minHeight = '3000px'
      window.scrollBy(0, 300)
    })
    await expect(page.locator('header')).toHaveClass(/header--scrolled/)
  })
})

test.describe('Pagina evento', () => {
  test('cliccando la card si apre il dettaglio', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await card(page, 'Tapasciata dei Colli').click()
    await expect(page).toHaveURL(/\/evento\/1-tapasciata-dei-colli$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciata dei Colli')
    await expect(page.getByText('Bergamo (BG)')).toBeVisible()
    await expect(page.getByText('Tutta Italia · 1 di 2')).toBeVisible()
    await expect(page.locator('.ev-poster img')).toHaveCount(2)
  })

  test('le frecce scorrono gli eventi della stessa data e "Torna a" riporta alla lista', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await card(page, 'Tapasciata dei Colli').click()
    await page.getByRole('button', { name: /successiva/i }).click()
    await expect(page).toHaveURL(/\/evento\/2-tapasciata-del-lago$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciata del Lago')
    await expect(page.getByRole('button', { name: /successiva/i })).toBeDisabled()
    await page.getByRole('link', { name: 'Torna a Tutta Italia' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(card(page, 'Tapasciata del Lago')).toBeVisible()
  })

  test('dal dettaglio di una provincia si scorre e si torna nella provincia', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/lombardia/bergamo')
    await card(page, 'Tapasciata dei Colli').click()
    await expect(page.getByText('Bergamo · 1 di 1')).toBeVisible()
    await expect(page.getByRole('button', { name: /successiva/i })).toBeDisabled()
    await page.getByRole('link', { name: 'Torna a Bergamo' }).click()
    await expect(page).toHaveURL(/\/lombardia\/bergamo$/)
  })

  test('apertura diretta da URL usa la provincia dell\'evento', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/evento/2-tapasciata-del-lago')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciata del Lago')
    await expect(page.getByText('Milano · 1 di 1')).toBeVisible()
    await page.getByRole('link', { name: 'Torna a Milano' }).click()
    await expect(page).toHaveURL(/\/lombardia\/milano$/)
  })

  test('la locandina si apre a schermo intero', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/evento/1-tapasciata-dei-colli')
    await page.getByRole('button', { name: 'Apri la locandina a schermo intero' }).click()
    await expect(page.getByRole('dialog', { name: 'Locandina Tapasciata dei Colli' })).toBeVisible()
    await page.getByRole('button', { name: 'Chiudi la locandina' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('offre calendario e mappa', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/evento/1-tapasciata-dei-colli')
    await expect(page.getByRole('link', { name: 'Calendario' })).toHaveAttribute('download', 'tapasciata-dei-colli.ics')
    await expect(page.getByRole('link', { name: 'Mappa' })).toHaveAttribute('href', /google\.com\/maps/)
  })

  test('evento inesistente mostra un messaggio', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/evento/999-non-esiste')
    await expect(page.getByText(/Tapasciata non trovata/)).toBeVisible()
  })
})
