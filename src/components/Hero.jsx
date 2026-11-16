import { ArrowDownLeft, ArrowLeft } from 'lucide-react';
import heroImage from '../assets/coffee-origin.webp';

export default function Hero({ settings = {} }) {
  return (
    <section className="hero" id="top" style={{ '--hero-image': `url("${heroImage}")` }}>
      <div className="hero-shade" />
      <div className="hero-content shell">
        <div className="hero-copy">
          <p className="eyebrow light">محمصة وقهوة مختصة · البحيرة</p>
          <h1>
            <span>{settings.hero_title_1 || 'قهوة تُصنع بهدوء،'}</span>
            <em>{settings.hero_title_2 || 'وتُشرب بوقار.'}</em>
          </h1>
          <p className="hero-lead">من اختيار الحبة للتحميص والتقديم — بنقدملك فنجان له شخصية، وتوليفة معمولة علشان ترجع لها.</p>
          <div className="hero-actions">
            <a className="button button-gold" href="#menu">اكتشف المنيو <ArrowLeft size={17} /></a>
            <a className="text-link light-link" href="#roastery">تسوّق البن <span>↙</span></a>
          </div>
        </div>
        <div className="hero-aside" aria-hidden="true">
          <span>EST.</span>
          <strong>2026</strong>
          <i />
          <span>EL BEHEIRA · EG</span>
        </div>
      </div>
      <a className="scroll-cue" href="#story" aria-label="انتقل إلى القصة">
        <span>اكتشف</span><ArrowDownLeft size={18} />
      </a>
    </section>
  );
}
