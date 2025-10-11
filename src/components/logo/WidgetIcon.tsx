
'use client';

import { cn } from '@/lib/utils';

export const WidgetIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-5 w-5", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 2H4C2.89543 2 2 2.89543 2 4V11H11V2ZM11 6H8V8H11V6ZM6 6H8V8H6V6ZM6 4H8V6H6V4ZM8 4H11V6H8V4ZM4 6H6V8H4V6ZM4 4H6V6H4V4Z"
    />
    <path d="M13 2H20C21.1046 2 22 2.89543 22 4V11H13V2Z" />
    <path d="M11 13H4C2.89543 13 2 13.8954 2 15V20C2 21.1046 2.89543 22 4 22H11V13Z" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13 13H20C21.1046 13 22 13.8954 22 15V20C22 21.1046 21.1046 22 20 22H13V13ZM17.5 14.5C15.8431 14.5 14.5 15.8431 14.5 17.5C14.5 19.1569 15.8431 20.5 17.5 20.5C19.1569 20.5 20.5 19.1569 20.5 17.5C20.5 15.8431 19.1569 14.5 17.5 14.5ZM18.25 17.5V16C18.25 15.5858 17.9142 15.25 17.5 15.25C17.0858 15.25 16.75 15.5858 16.75 16V17.5C16.75 17.9142 17.0858 18.25 17.5 18.25H18.5C18.9142 18.25 19.25 17.9142 19.25 17.5C19.25 17.0858 18.9142 16.75 18.5 16.75H17.5V17.5Z"
    />
  </svg>
);
