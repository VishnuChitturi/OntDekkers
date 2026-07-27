export interface NavbarProps {
  /** Additional Tailwind classes for the outer <header> element */
  className?: string;
  /** Called when the user clicks the global search icon */
  onSearchOpen?: () => void;
}
