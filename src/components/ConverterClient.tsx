'use client';

import React from 'react';
import { useConverter } from '@/hooks/use-converter';
import { ConverterView } from '@/components/ConverterView';

interface ConverterClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

export default function ConverterClient({ user }: ConverterClientProps): React.JSX.Element {
  const converterState = useConverter();

  return (
    <ConverterView 
      user={user}
      {...converterState}
    />
  );
}
