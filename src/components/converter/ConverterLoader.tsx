'use client';

import dynamic from 'next/dynamic';

const ConverterClient = dynamic(
  () => import('./ConverterClient'),
  { ssr: false }
);

export default ConverterClient;
