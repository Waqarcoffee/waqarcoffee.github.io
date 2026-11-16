import { ArrowLeft } from 'lucide-react';
import logoImage from '../assets/waqar-logo.webp';

export default function BrandStory() {
  return (
    <section className="story section" id="story">
      <div className="story-layout shell">
        <div className="story-visual reveal-block">
          <img src={logoImage} alt="شعار وقار كوفي الذهبي" />
          <span className="story-index">01</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">حكاية وقار</p>
          <h2 className="display-title story-title">
            <span>التفاصيل الصغيرة</span>
            <span>هي اللي بتعمل</span>
            <em>فنجان كبير.</em>
          </h2>
          <p className="story-intro">وقار مش مجرد اسم على كيس بن. هي طريقتنا في اختيار كل حبة، وضبط كل تحميصة، وتقديم كل طلب بنفس الاهتمام.</p>
          <div className="story-points">
            <div><span>01</span><h3>اختيار واعي</h3><p>حبوب منتقاة وتوليفات متوازنة لطعم ثابت كل مرة.</p></div>
            <div><span>02</span><h3>تحميص محسوب</h3><p>درجات تحميص تناسب ذوقك وطريقتك في تحضير القهوة.</p></div>
          </div>
          <a className="text-link dark-link" href="#roastery">شوف توليفاتنا <ArrowLeft size={17} /></a>
        </div>
      </div>
    </section>
  );
}
