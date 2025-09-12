import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      fill="currentColor"
      {...props}
    >
      <path
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z"
        opacity="0.2"
      />
      <path d="M168 88H88a8 8 0 0 0-8 8v80a8 8 0 0 0 8 8h80a8 8 0 0 0 8-8V96a8 8 0 0 0-8-8Zm-8 80h-64V104h64Z" />
      <path d="M151.21 88a8 8 0 0 0-7.37 5.11l-32 80a8 8 0 0 0 14.74 5.78l32-80a8 8 0 0 0-7.37-10.89Z" />
      <path d="M184 128a56 56 0 1 0-56 56a56.06 56.06 0 0 0 56-56Zm-8 0a48 48 0 1 1-48-48a48.05 48.05 0 0 1 48 48Z" />
    </svg>
  );
}
