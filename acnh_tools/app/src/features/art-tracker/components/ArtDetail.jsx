import './ArtDetail.css'

export default function ArtDetail({ art, collected, onToggle }) {
  const realImg = art.texture_url || art.image_url;
  const fakeImg = art.fake_texture_url || art.fake_image_url;

  return (
    <div className="art-detail">
      <div className="art-detail-header">
        <h3 className="art-detail-name">{art.name}</h3>
        <span className="art-detail-type">{art.art_type}</span>
      </div>

      <div className="art-detail-meta">
        <div className="art-meta-row">
          <span className="art-meta-label">Real Title</span>
          <span className="art-meta-value">{art.art_name}</span>
        </div>
        <div className="art-meta-row">
          <span className="art-meta-label">Artist</span>
          <span className="art-meta-value">{art.author}</span>
        </div>
        <div className="art-meta-row">
          <span className="art-meta-label">Year</span>
          <span className="art-meta-value">{art.year}</span>
        </div>
        <div className="art-meta-row">
          <span className="art-meta-label">Style</span>
          <span className="art-meta-value">{art.art_style}</span>
        </div>
      </div>

      <div className="art-detail-images">
        <div className="art-img-panel">
          <h4>✅ Genuine</h4>
          <img src={realImg} alt={`${art.name} — genuine`} className="art-detail-img" />
        </div>
        {art.has_fake ? (
          <div className="art-img-panel fake">
            <h4>❌ Fake</h4>
            <img src={fakeImg} alt={`${art.name} — fake`} className="art-detail-img" />
          </div>
        ) : (
          <div className="art-img-panel no-fake">
            <h4>No Fake</h4>
            <p>This piece is always genuine — buy with confidence!</p>
          </div>
        )}
      </div>

      {art.has_fake && art.authenticity && (
        <div className="art-authenticity">
          <h4>🔍 How to Spot the Fake</h4>
          <p>{art.authenticity}</p>
        </div>
      )}

      {art.description && (
        <div className="art-description">
          <p>{art.description}</p>
        </div>
      )}

      <div className="art-detail-actions">
        <button
          className={`art-collect-btn ${collected ? 'active' : ''}`}
          onClick={onToggle}
        >
          {collected ? '✓ In Museum' : '🖼️ Mark as Donated'}
        </button>
      </div>
    </div>
  );
}
