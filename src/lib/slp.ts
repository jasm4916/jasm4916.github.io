// Build-time encoder for the capstone's seed_link_proto frames (see seed_link_proto.h):
// ver u8 | type u8 | seq u8 | flags u8 | len u16 LE | payload | crc16 LE (CRC-16/CCITT-FALSE over header + payload),
// then COBS-encoded and wrapped in 0x00 delimiters.
export function crc16(bytes: number[]) {
  let c = 0xffff;
  for (const x of bytes) {
    c ^= x << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c;
}
export function cobs(bytes: number[]) {
  const out = [0];
  let ci = 0, code = 1;
  for (const x of bytes) {
    if (x === 0) { out[ci] = code; ci = out.length; out.push(0); code = 1; }
    else { out.push(x); code++; if (code === 255) { out[ci] = code; ci = out.length; out.push(0); code = 1; } }
  }
  out[ci] = code;
  return out;
}
export const hex = (b: number[]) => b.map((x) => x.toString(16).padStart(2, '0')).join(' ');

/** SET_PARAMS (0x10) carrying one parameter: count u8, then id u16 LE, value i16 LE. */
export function setParamsExample(seq: number, id: number, value: number) {
  const payload = [1, id & 255, id >> 8, value & 255, (value >> 8) & 255];
  const header = [1, 0x10, seq, 0, payload.length, 0];
  const c = crc16([...header, ...payload]);
  const raw = [...header, ...payload, c & 255, c >> 8];
  return { header, payload, crc: [c & 255, c >> 8], raw, wire: [0, ...cobs(raw), 0] };
}
