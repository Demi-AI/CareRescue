import type { SVGProps } from 'react';

export default function CareRescueLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 180 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <circle cx="53" cy="30" r="15" fill="currentColor" />
      <circle cx="105" cy="18" r="17" fill="currentColor" />
      <path
        d="M91 199C75 181 43 158 30 130C16 100 28 72 53 65C71 60 87 69 98 84"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M110 174C128 155 147 132 153 106C160 77 143 58 121 59C103 60 94 73 87 90"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
