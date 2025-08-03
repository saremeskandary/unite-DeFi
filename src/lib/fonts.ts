import localFont from 'next/font/local'

export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter-400.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-500.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-600.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-700.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
}) 