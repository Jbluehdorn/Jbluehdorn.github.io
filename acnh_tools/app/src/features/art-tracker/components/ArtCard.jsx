import './ArtCard.css'

export default function ArtCard({ art, collected, selected, onClick }) {
  return (
    <div
      className={`art-card ${collected ? 'collected' : ''} ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="art-card-img-wrap">
        <img src={art.image_url} alt={art.name} loading="lazy" className="art-card-img" />
        {collected && <div className="art-collected-badge">✓</div>}
        {!art.has_fake && <span className="art-genuine-tag">Always Real</span>}
      </div>
      <span className="art-card-name">{art.name}</span>
      <span className="art-card-artist">{art.author}</span>
    </div>
  );
}
