/**
 * Sums Graphic Control Extension delay times to approximate one full GIF cycle.
 * Returns milliseconds, or null if the buffer can't be parsed.
 */
export function parseGifDurationMs(buffer) {
  const bytes = new Uint8Array(buffer)
  const dv = new DataView(buffer)
  const len = bytes.length
  if (len < 13) return null
  if (bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) return null // GIF
  const ver = String.fromCharCode(bytes[3], bytes[4], bytes[5])
  if (ver !== '87a' && ver !== '89a') return null

  let i = 13
  const packed = bytes[10]
  const hasGct = !!(packed & 0x80)
  const gctBits = (packed & 7) + 1
  if (hasGct) {
    i += 3 * (1 << gctBits)
  }

  let totalCs = 0
  let steps = 0

  const skipSubBlocks = (start) => {
    let p = start
    while (p < len) {
      if (++steps > 200000) return len
      const size = bytes[p++]
      if (size === 0) break
      p += size
    }
    return p
  }

  while (i < len) {
    if (++steps > 200000) return null
    const b = bytes[i]
    if (b === 0x3b) break // trailer

    // Extension
    if (b === 0x21) {
      if (i + 2 >= len) return null
      const label = bytes[i + 1]
      if (label === 0xf9) {
        const blockSize = bytes[i + 2]
        // Packed(1) + Delay(2) + Transparent(1)
        if (blockSize >= 4 && i + 6 < len) {
          const delay = dv.getUint16(i + 4, true) // in centiseconds
          totalCs += delay === 0 ? 10 : delay // browsers often treat 0 as 10cs
        }
        i += 2 + 1 + blockSize + 1
      } else {
        i += 2
        i = skipSubBlocks(i)
      }
      continue
    }

    // Image Descriptor
    if (b === 0x2c) {
      if (i + 10 > len) return null
      const descPacked = bytes[i + 9]
      i += 10
      // Local Color Table (optional)
      if (descPacked & 0x80) {
        const lctBits = (descPacked & 7) + 1
        i += 3 * (1 << lctBits)
      }
      if (i >= len) return null
      // LZW Minimum Code Size + data sub-blocks
      i += 1
      i = skipSubBlocks(i)
      continue
    }

    return null
  }

  const ms = Math.round(totalCs * 10)
  return ms > 0 ? ms : null
}

