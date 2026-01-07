'use client';

import React, { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  innerRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const Editor = React.memo(({ value, onChange, className, placeholder, innerRef }: EditorProps): React.JSX.Element => {
  // We use a local state to handle the immediate typing for 0ms lag
  const [localValue, setLocalValue] = React.useState(value);

  // Sync with prop if it changes from outside (e.g. Reset or Upload)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <Textarea
      ref={innerRef}
      value={localValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      spellCheck={false} // Reduces background thread usage
    />
  );
});

Editor.displayName = 'Editor';
export default Editor;
