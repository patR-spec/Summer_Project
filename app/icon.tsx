import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  const logoBuffer = readFileSync(join(process.cwd(), 'public', 'logo.png'))
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1d3a5a',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Scale up past the container to crop the whitespace in the source image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={90} height={90} style={{ objectFit: 'contain' }} alt="" />
      </div>
    ),
    { ...size }
  )
}
