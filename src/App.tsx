import { useState } from 'react'
import { ImageGallery } from './features/product-gallery'
import { MOCK_PRODUCT_IMAGES } from './features/product-gallery/data'
import './App.css'

function App() {
  const [activeImage, setActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('EU 42')
  const [bagCount, setBagCount] = useState(0)
  const selectedImage = MOCK_PRODUCT_IMAGES[activeImage]
  const selectedViewName =
    selectedImage?.alt.replace(/ product view \d+$/, '') ?? 'Axiom 01'

  return (
    <div className="storefront">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Aurelia home">
          AURELIA
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#new">New arrivals</a>
          <a href="#women">Women</a>
          <a href="#men">Men</a>
          <a href="#objects">Objects</a>
        </nav>
        <div className="header-actions">
          <button type="button" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
          <button type="button" aria-label={`Shopping bag, ${bagCount} items`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            {bagCount > 0 && <span className="bag-count">{bagCount}</span>}
          </button>
        </div>
      </header>

      <main>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a><span>/</span><a href="#footwear">Footwear</a>
          <span>/</span><span aria-current="page">Axiom 01</span>
        </nav>

        <div className="product-layout">
          <div className="gallery-column">
            <span className="gallery-badge">Limited release</span>
            <ImageGallery
              images={MOCK_PRODUCT_IMAGES}
              activeIndex={activeImage}
              onActiveIndexChange={setActiveImage}
            />
          </div>

          <aside className="product-details">
            <p className="eyebrow" aria-live="polite">
              View {activeImage + 1} / {MOCK_PRODUCT_IMAGES.length}
            </p>
            <h1>{selectedViewName}</h1>
            <div className="price-row">
              <p className="price">$420</p>
              <p className="rating" aria-label="Rated 4.9 out of 5">
                ★★★★★ <span>4.9 · 128 reviews</span>
              </p>
            </div>
            <p className="description">
              A study in restraint. Hand-finished Italian leather meets a
              sculpted, featherweight sole engineered for all-day movement.
            </p>

            <div className="option-heading">
              <span>Bone / Chalk</span>
              <button type="button">Size guide</button>
            </div>
            <div className="swatches" aria-label="Select color">
              <button className="swatch swatch--bone swatch--active" type="button" aria-label="Bone" />
              <button className="swatch swatch--black" type="button" aria-label="Black" />
              <button className="swatch swatch--clay" type="button" aria-label="Clay" />
            </div>

            <fieldset className="size-picker">
              <legend>Select size</legend>
              <div>
                {['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={selectedSize === size ? 'selected' : ''}
                    aria-pressed={selectedSize === size}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              className="add-to-bag"
              type="button"
              onClick={() => setBagCount((count) => count + 1)}
            >
              <span>{bagCount > 0 ? 'Add another' : 'Add to bag'}</span>
              <span>$420</span>
            </button>
            <p className="bag-feedback" aria-live="polite">
              {bagCount > 0
                ? `${bagCount} ${bagCount === 1 ? 'item' : 'items'} in your bag`
                : ''}
            </p>
            <p className="availability">
              <span aria-hidden="true" /> In stock · Complimentary express delivery
            </p>

            <details open>
              <summary>Composition & care</summary>
              <p>Calf leather upper, recycled mesh lining and natural rubber outsole. Made in Italy.</p>
            </details>
            <details>
              <summary>Delivery & returns</summary>
              <p>Free express delivery and returns within 30 days.</p>
            </details>
          </aside>
        </div>

        <section className="collections" aria-labelledby="collections-title">
          <p className="eyebrow">Explore Aurelia</p>
          <h2 id="collections-title">Curated collections</h2>
          <div className="collection-grid">
            {[
              ['new', 'New arrivals', 'The latest atelier releases'],
              ['women', 'Women', 'Sculptural essentials'],
              ['men', 'Men', 'Refined everyday forms'],
              ['objects', 'Objects', 'Considered pieces for home'],
            ].map(([id, title, description], index) => (
              <article id={id} className={`collection-card collection-card--${index + 1}`} key={id}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <a href={`#${id}`} aria-label={`Explore ${title}`}>↗</a>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
