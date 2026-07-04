import type React from "react";

import { cn } from "./cn";
import styles from "./input.module.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    ref?: React.Ref<HTMLInputElement>;
}

export function Input({ className, ref, ...props }: InputProps) {
    return <input {...props} ref={ref} className={cn(styles.input, className)} />;
}
