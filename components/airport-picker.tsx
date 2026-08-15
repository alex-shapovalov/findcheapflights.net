'use client'

import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type Airport,
  formatAirport,
  getAirport,
  searchAirports,
} from '@/lib/airports'
import { cn } from '@/lib/cn'

type Props = {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export function AirportPicker({ label, values, onChange, placeholder }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const results = useMemo(() => searchAirports(query, 8), [query])
  const inputId = `code-search-${label.replace(/\s+/g, '-').toLowerCase()}`
  const selected = values
    .map(code => getAirport(code))
    .filter((airport): airport is Airport => Boolean(airport))

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function add(airport: Airport) {
    if (values.includes(airport.iata)) return
    onChange([...values, airport.iata].slice(0, 12))
    setOpen(true)
  }

  function remove(iata: string) {
    onChange(values.filter(code => code !== iata))
  }

  return (
    <div ref={rootRef} className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-xs uppercase tracking-[0.18em] text-mute"
      >
        {label}
      </label>
      <div className="rounded-xl border border-line bg-panel-2 px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {selected.map(airport => (
            <button
              key={airport.iata}
              type="button"
              onClick={() => remove(airport.iata)}
              className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-sm text-gold"
            >
              {airport.iata}
              <X className="h-3 w-3" />
            </button>
          ))}
          <input
            id={inputId}
            type="search"
            name={`${inputId}-query`}
            value={query}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={`${inputId}-listbox`}
            data-1p-ignore=""
            data-lpignore="true"
            data-form-type="other"
            onChange={event => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? 'Search city or IATA'}
            className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>
      {open && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          className="max-h-60 overflow-auto rounded-xl border border-line bg-panel shadow-xl"
        >
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-mute">
              No matching airports
            </div>
          ) : (
            results.map(airport => (
              <button
                key={airport.iata}
                type="button"
                role="option"
                aria-selected={values.includes(airport.iata)}
                onClick={() => add(airport)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-panel-2',
                  values.includes(airport.iata) && 'text-mute',
                )}
              >
                <span>
                  <span className="font-medium text-gold">{airport.iata}</span>{' '}
                  {formatAirport(airport)}
                </span>
                <span className="text-xs text-mute">{airport.country}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
