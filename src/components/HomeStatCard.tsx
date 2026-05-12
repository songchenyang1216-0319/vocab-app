interface HomeStatCardProps {
  label: string;
  value: number;
}

function HomeStatCard({ label, value }: HomeStatCardProps) {
  return (
    <article className="home-stat-card">
      <span className="home-stat-card__label">{label}</span>
      <strong className="home-stat-card__value">{value}</strong>
    </article>
  );
}

export default HomeStatCard;
