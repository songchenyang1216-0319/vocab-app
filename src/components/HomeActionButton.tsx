import { Link } from "react-router-dom";

interface HomeActionButtonProps {
  to: string;
  title: string;
  description: string;
  variant?: "primary" | "secondary";
}

function HomeActionButton({
  to,
  title,
  description,
  variant = "secondary",
}: HomeActionButtonProps) {
  return (
    <Link className={`home-action home-action--${variant}`} to={to}>
      <span className="home-action__title">{title}</span>
      <span className="home-action__description">{description}</span>
    </Link>
  );
}

export default HomeActionButton;
