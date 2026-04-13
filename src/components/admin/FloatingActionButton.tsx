import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface FABProps {
  to: string;
  label?: string;
}

const FloatingActionButton = ({ to, label = "Add" }: FABProps) => (
  <Link
    to={to}
    className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform md:hidden"
    aria-label={label}
  >
    <Plus className="h-6 w-6" />
  </Link>
);

export default FloatingActionButton;
