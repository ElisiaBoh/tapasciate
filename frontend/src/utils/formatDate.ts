const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
              'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return `${GIORNI[date.getDay()]} ${day} ${MESI[month - 1]}`
}

// "Domenica 4 ottobre 2026"
export function formatLongDate(dateString: string): string {
  const [year, month] = dateString.split('-').map(Number)
  const [weekday, day] = formatDate(dateString).split(' ')
  return `${weekday} ${day} ${MESI[month - 1].toLowerCase()} ${year}`
}
