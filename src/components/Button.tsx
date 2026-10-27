import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger';
};
export default function Button({
  variant = 'outline',
  className = '',
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
