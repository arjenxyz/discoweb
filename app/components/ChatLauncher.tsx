'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuMessageCircle } from 'react-icons/lu';

export default function ChatLauncher() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const onClick = () => {
    router.push('/chat');
  };

  return (
      <button
        aria-label="Open chat"
        onClick={onClick}
        className="fixed z-50 bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:scale-105 transition-transform"
      >
        <LuMessageCircle className="h-6 w-6" />
      </button>
  );
}
