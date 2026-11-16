import { ArrowUpLeft, Instagram, MapPin, MessageCircle } from 'lucide-react';
import { socials as fallbackSocials, WA_NUMBER } from '../data/catalog';

export default function Footer({ settings = {}, socials = fallbackSocials }) {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-main shell">
        <div className="footer-brand">
          <p className="eyebrow light">خلّي القهوة تجمعنا</p>
          <h2>كل فنجان<br /><em>له حكاية.</em></h2>
          <a href={`https://wa.me/${settings.whatsapp || WA_NUMBER}`} target="_blank" rel="noreferrer">كلّمنا على واتساب <MessageCircle size={17} /></a>
        </div>
        <div className="footer-contact">
          <div><MapPin size={18} /><span><small>العنوان</small><strong>{settings.address || 'البحيرة — دمنهور، آخر الجمهورية'}</strong></span></div>
          <div><MessageCircle size={18} /><span><small>الطلبات</small><strong dir="ltr">01035 477 377</strong></span></div>
        </div>
        <div className="footer-social">
          <p>تابع وقار</p>
          {socials.map((social) => <a href={social.href} key={social.id || social.name} target="_blank" rel="noreferrer">{social.logo && <img className="footer-social-logo" src={social.logo} alt="" />}<span>{social.name}</span><ArrowUpLeft size={16} /></a>)}
        </div>
      </div>
      <div className="footer-bottom shell">
        <span>© {new Date().getFullYear()} WAQAR COFFEE</span>
        <span>ROASTED WITH INTENTION · SERVED WITH WAQAR</span>
        <a href="https://www.instagram.com/waqar.coffee/" target="_blank" rel="noreferrer"><Instagram size={15} /> @WAQAR.COFFEE</a>
      </div>
    </footer>
  );
}
