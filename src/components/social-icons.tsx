import type { SVGProps } from "react"

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function FarcasterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  )
}

export function NostrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v3m0 12v3" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 12h3m12 0h3" />
      <path d="M18.364 5.636l-2.121 2.121m-8.486 8.486l-2.121 2.121" />
      <path d="M5.636 5.636l2.121 2.121m8.486 8.486l2.121 2.121" />
    </svg>
  )
}

export function StackOverflowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 20.002V15.002H20V22.002H3V15.002H5V20.002H18Z" />
      <path d="M7.5 14.002L16.5 16.002L17 14.002L8 12.002L7.5 14.002Z" />
      <path d="M8.5 10.002L17 13.002L17.5 11.002L9.5 8.00195L8.5 10.002Z" />
      <path d="M10 6.00195L18 10.002L19 8.00195L11 4.00195L10 6.00195Z" />
      <path d="M12.5 2.00195L19.5 7.00195L21 5.00195L14 0.00195312L12.5 2.00195Z" />
    </svg>
  )
}
