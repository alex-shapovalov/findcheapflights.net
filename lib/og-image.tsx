import { ImageResponse } from 'next/og'

export const OG_IMAGE_SIZE = { width: 1200, height: 630 }

export function createOgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#071018',
        color: '#e8eef2',
        padding: 72,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          color: '#e8b84a',
          fontSize: 28,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        findcheapflights.ai
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            fontSize: 78,
            lineHeight: 1.05,
            fontWeight: 600,
            letterSpacing: -2,
          }}
        >
          Find cheap flights.
        </div>
        <div style={{ fontSize: 42, color: '#e8b84a' }}>
          Lock-in the best deals.
        </div>
      </div>
      <div style={{ fontSize: 24, color: '#8aa0b2' }}>
        Nearby airports. Flexible dates. Live public fares.
      </div>
    </div>,
    OG_IMAGE_SIZE,
  )
}
