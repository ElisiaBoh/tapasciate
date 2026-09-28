import { test, expect, type Page } from '@playwright/test'

// --- Mock data ---

const mockEvents = [
  {
    id: 1,
    name: 'Tapasciata dei Colli',
    date: '2030-06-15',
    location: { city: 'Bergamo', province: 'BG', province_name: 'Bergamo', region: 'Lombardia' },
    poster: 'https://example.com/poster.pdf',
    organizer: 'CóR',
    distances: ['10', '21'],
    url: 'https://example.com/1',
    location_id: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Tapasciata del Lago',
    date: '2030-07-20',
    location: { city: 'Milano', province: 'MI', province_name: 'Milano', region: 'Lombardia' },
    poster: null,
    organizer: 'NuovaDot',
    distances: [],
    url: 'https://example.com/2',
    location_id: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

async function mockSupabase(page: Page, data: typeof mockEvents | []) {
  await page.route('**/rest/v1/events**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  )
}

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
    await expect(page.getByText('Tapasciata dei Colli')).toBeVisible()
    await expect(page.getByText('Tapasciata del Lago')).toBeVisible()
  })

  test('mostra il messaggio di errore se il fetch fallisce', async ({ page }) => {
    await page.route('**/rest/v1/events**', route => route.abort('failed'))
    await page.goto('/')
    await expect(page.getByText(/Errore nel caricamento degli eventi/)).toBeVisible()
  })

  test('mostra lo stato vuoto se non ci sono eventi', async ({ page }) => {
    await mockSupabase(page, [])
    await page.goto('/')
    await expect(page.getByText(/Nessun evento trovato per questa provincia/)).toBeVisible()
  })
})

test.describe('Filtro province', () => {
  test('mostra le province disponibili nel dropdown', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    const select = page.locator('.province-filter')
    await expect(select).toBeVisible()
    await expect(select.locator('option[value="BG"]')).toHaveText('Bergamo')
    await expect(select.locator('option[value="MI"]')).toHaveText('Milano')
  })

  test('la prima opzione è "Tutte le province"', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    const firstOption = page.locator('.province-filter option').first()
    await expect(firstOption).toHaveText('Tutte le province')
  })

  test('filtrare per provincia mostra solo gli eventi di quella provincia', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.waitForSelector('.province-filter')
    await page.selectOption('.province-filter', 'BG')
    await expect(page.getByText('Tapasciata dei Colli')).toBeVisible()
    await expect(page.getByText('Tapasciata del Lago')).not.toBeVisible()
  })

  test('tornare a "Tutte le province" mostra di nuovo tutti gli eventi', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.waitForSelector('.province-filter')
    await page.selectOption('.province-filter', 'BG')
    await page.selectOption('.province-filter', '')
    await expect(page.getByText('Tapasciata dei Colli')).toBeVisible()
    await expect(page.getByText('Tapasciata del Lago')).toBeVisible()
  })
})

test.describe('Scheda evento', () => {
  test('mostra le distanze dell\'evento', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await expect(page.getByText('km: 10 - 21')).toBeVisible()
  })

  test('mostra il pulsante dettagli su ogni evento', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'dettagli' })).toHaveCount(2)
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
  test('cliccando il titolo si apre il dettaglio', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.getByRole('link', { name: 'Tapasciata dei Colli' }).click()
    await expect(page).toHaveURL(/\/evento\/1-tapasciata-dei-colli$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciata dei Colli')
    await expect(page.getByText('Bergamo (BG)')).toBeVisible()
    await expect(page.getByText('1 / 2')).toBeVisible()
  })

  test('il pulsante dettagli apre il dettaglio con la locandina in pagina', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.getByRole('link', { name: 'dettagli' }).first().click()
    await expect(page).toHaveURL(/\/evento\/1-tapasciata-dei-colli$/)
    await expect(page.locator('.ev-poster object')).toHaveAttribute('data', 'https://example.com/poster.pdf')
    await expect(page.locator('.ev-info a')).toHaveCount(0)
  })

  test('le frecce scorrono gli eventi e "← lista" riporta alla home', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/')
    await page.getByRole('link', { name: 'Tapasciata dei Colli' }).click()
    await page.getByRole('button', { name: /successiva/i }).click()
    await expect(page).toHaveURL(/\/evento\/2-tapasciata-del-lago$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciata del Lago')
    await page.getByRole('link', { name: '← lista' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Tapasciata del Lago')).toBeVisible()
  })

  test('apertura diretta da URL', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/evento/2-tapasciata-del-lago')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tapasciata del Lago')
    await expect(page.getByRole('button', { name: /successiva/i })).toBeDisabled()
  })

  test('cambiando provincia passa al primo evento di quella provincia', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/evento/1-tapasciata-dei-colli')
    await page.waitForSelector('.province-filter')
    await page.selectOption('.province-filter', 'MI')
    await expect(page).toHaveURL(/\/evento\/2-tapasciata-del-lago$/)
  })

  test('evento inesistente mostra un messaggio', async ({ page }) => {
    await mockSupabase(page, mockEvents)
    await page.goto('/evento/999-non-esiste')
    await expect(page.getByText(/Tapasciata non trovata/)).toBeVisible()
  })
})
