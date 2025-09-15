import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width="1em"
        height="1em"
        fill="none"
        {...props}
    >
        <path
        fill="hsl(var(--primary))"
        d="M36.19 95.83h27.62c17.38 0 31.5-14.12 31.5-31.5V36.19c0-17.38-14.12-31.5-31.5-31.5H36.19c-17.38 0-31.5 14.12-31.5 31.5v27.62c0 17.81 14.56 32 31.5 32Z"
        />
        <path
        fill="hsl(var(--primary-foreground))"
        d="M62.66 43.1v-6.38H50.5v-12.3h-6.8v12.3H31.55v6.37h12.16v12.15h6.8V43.1h12.15Z"
        />
        <path
        fill="hsl(var(--primary-foreground))"
        d="M74.82 74.82H50.5V62.66h12.16v-6.97h6.8v6.97h11.8v12.16h-6.44Z"
        />
        <path
        fill="hsl(var(--primary-foreground))"
        d="M44.12 68.45H31.55V50.5h12.57v-6.2h-19v30.54h19V68.45Z"
        />
    </svg>
  );
}
