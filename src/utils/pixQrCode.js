const crc16 = (str) => {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
    crc &= 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const emv = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`;

const clean = (str, max) =>
  (str ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .substring(0, max) || '?';

export const gerarPixPayload = ({ chave, nome, cidade, valor, txid }) => {
  const gui     = emv('00', 'br.gov.bcb.pix');
  const chaveId = emv('01', chave);
  const merch   = emv('26', gui + chaveId);
  const ref     = (txid ?? 'delivery').replace(/\W/g, '').substring(0, 25) || 'delivery';
  const addit   = emv('62', emv('05', ref));

  let payload =
    emv('00', '01') +
    merch +
    emv('52', '0000') +
    emv('53', '986') +
    (valor ? emv('54', Number(valor).toFixed(2)) : '') +
    emv('58', 'BR') +
    emv('59', clean(nome, 25)) +
    emv('60', clean(cidade ?? 'BRASIL', 15)) +
    addit +
    '6304';

  return payload + crc16(payload);
};

export const qrCodeUrl = (payload, size = 280) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&qzone=1`;
