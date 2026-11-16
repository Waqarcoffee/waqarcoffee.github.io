export const WA_NUMBER = '201035477377';
export const PAYMENT_NUMBER = '01005599569';

export const menuCategories = [
  { id: 'turkish', ar: 'قهوة تركي', en: 'Turkish Coffee', items: [
    ['توليفة كلاسيك', 'Classic Blend', 25], ['توليفة سبيشيال', 'Special Blend', 30], ['توليفة وقار', 'Waqar Blend', 35],
    ['قهوة نوتيلا', 'Nutella Coffee', 70], ['قهوة لوتس', 'Lotus Coffee', 70], ['قهوة بستاشيو', 'Pistachio Coffee', 80],
  ] },
  { id: 'espresso', ar: 'إسبريسو بيز', en: 'Espresso Base', items: [
    ['إسبريسو سينجل', 'Espresso S', 40], ['إسبريسو دبل', 'Espresso D', 50], ['في 60', 'V60', 80],
    ['لاتيه', 'Latte', 70], ['سبانش لاتيه', 'Spanish Latte', 80], ['هازلنت لاتيه', 'Hazelnut Latte', 80],
    ['كابتشينو', 'Cappuccino', 70], ['فلات وايت', 'Flat White', 75], ['أمريكانو', 'Americano', 60],
    ['كورتادو', 'Cortado', 60], ['تريستينو', 'Triestino', 65], ['ماكياتو', 'Macchiato', 55],
    ['كراميل ماكياتو', 'Caramel Macchiato', 65], ['فرابتشينو', 'Frappuccino', 65], ['موكا', 'Mocha', 70], ['وايت موكا', 'White Mocha', 80],
  ] },
  { id: 'single', ar: 'قهوة أحادية المنشأ', en: 'Single Origin', items: [
    ['قهوة هندي', 'Indian Coffee', 30], ['قهوة برازيلي', 'Brazilian Coffee', 35], ['قهوة إثيوبي', 'Ethiopian Coffee', 35], ['قهوة كولومبي', 'Colombian Coffee', 40],
  ] },
  { id: 'iced', ar: 'آيس كوفي', en: 'Iced Coffee', items: [
    ['آيس لاتيه', 'Iced Latte', 75], ['آيس سبانش لاتيه', 'Iced Spanish Latte', 85], ['آيس هازلنت لاتيه', 'Iced Hazelnut Latte', 85],
    ['بستاشيو لاتيه', 'Pistachio Latte', 95], ['آيس أمريكانو', 'Iced Americano', 70], ['آيس كابتشينو', 'Iced Cappuccino', 75],
    ['آيس موكا', 'Iced Mocha', 80], ['آيس وايت موكا', 'Iced White Mocha', 90],
  ] },
  { id: 'frappe', ar: 'فرابيه', en: 'Frappe', items: [
    ['كراميل فرابيه', 'Caramel Frappe', 80], ['سولتد كراميل فرابيه', 'Salted Caramel', 80], ['موكا فرابيه', 'Mocha Frappe', 80],
    ['وايت موكا فرابيه', 'White Mocha', 80], ['بلوبيري فرابيه', 'Blueberry Frappe', 80], ['بستاشيو فرابيه', 'Pistachio Frappe', 100], ['نوتيلا فرابيه', 'Nutella Frappe', 90],
  ] },
  { id: 'mojito', ar: 'موهيتو', en: 'Mojito', items: [
    ['موهيتو أوريجنال', 'Original Mojito', 60], ['موهيتو فراولة', 'Strawberry Mojito', 75], ['موهيتو مانجو', 'Mango Mojito', 75],
    ['موهيتو بلوبيري', 'Blueberry Mojito', 75], ['موهيتو خوخ', 'Peach Mojito', 75], ['موهيتو باشن فروت', 'Passion Mojito', 75],
  ] },
  { id: 'hot', ar: 'مشروبات ساخنة', en: 'Hot Drinks', items: [
    ['شاي', 'Tea', 15], ['شاي أحمد', 'Ahmed Tea', 20], ['هوت شوكليت', 'Hot Chocolate', 65],
    ['نسكافيه', 'Nescafe', 60], ['قهوة فرنساوي', 'French Coffee', 60], ['أعشاب', 'Herbs', 20],
  ] },
  { id: 'soft', ar: 'مشروبات غازية', en: 'Soft Drinks', items: [
    ['صودا', 'Soda', 35], ['ريد بول', 'Red Bull', 80], ['مياه', 'Water', 10],
  ] },
  { id: 'extras', ar: 'إضافات', en: 'Extras', items: [
    ['شوت إضافي', 'Extra Shot', 25], ['سيرب إضافي', 'Extra Syrup', 15], ['صوص إضافي', 'Extra Sauce', 15],
  ] },
];

const sizesFrom125 = (price) => ({ '125g': price, '250g': price * 2, '500g': price * 4, '1kg': price * 8 });
const standardOptions = { roasts: ['فاتح', 'وسط'], types: ['سادة', 'محوّج'] };

export const products = [
  { id: 'classic', group: 'blends', name: 'Classic Blend', arName: 'توليفة كلاسيك', note: 'Balanced & Familiar', desc: 'قهوة تركي كلاسيك بطعم أصيل وقوام مضبوط، ريحة قوية ونكهة متوازنة تخلي كل فنجان له مزاجه الخاص.', sizes: sizesFrom125(70), accent: '01', ...standardOptions },
  { id: 'special', group: 'blends', name: 'Special Blend', arName: 'توليفة سبيشيال', note: 'Rich & Layered', desc: 'توليفة سبيشيال بطبقات نكهة غنية وتوازن فاخر، تجربة قهوة استثنائية لعشاق التميز.', sizes: sizesFrom125(80), accent: '02', ...standardOptions },
  { id: 'waqar', group: 'blends', name: 'Waqar Blend', arName: 'توليفة وقار', note: 'Signature Blend', desc: 'قهوة تركي ناعمة بطعم هادئ وحموضة لطيفة، ورائحة مميزة لعشاق القهوة الرايقة.', sizes: sizesFrom125(100), accent: '03', ...standardOptions },
  { id: 'waqar-royal', group: 'blends', name: 'Waqar Royal Blend', arName: 'توليفة وقار رويال', note: 'Royal Selection', desc: 'توليفة وقار رويال المختارة لفنجان غني ومتوازن بطابع فاخر.', sizes: sizesFrom125(125), accent: '04', ...standardOptions },
  { id: 'dark', group: 'blends', name: 'Dark Blend', arName: 'توليفة دارك', note: 'Bold & Intense', desc: 'قهوة تركي تقيلة بكافيين عالٍ وقوام قوي، بطعم مركز وصحوة واضحة من أول فنجان.', sizes: sizesFrom125(80), accent: '05', ...standardOptions },
  { id: 'espresso', group: 'blends', name: 'Espresso', arName: 'إسبريسو', note: 'Clean & Silky', desc: 'قهوة فاخرة بطعم نقي وناعم جدًا، ريحة غنية وتجربة مميزة لعشاق القهوة الفخمة.', sizes: sizesFrom125(100), accent: '06', ...standardOptions },
  { id: 'brazilian-rio', group: 'single', name: 'Brazilian Rio', arName: 'بن برازيلي ريو', note: 'Single Origin', desc: 'قهوة أحادية المنشأ من البرازيل بطابع هادئ وقوام غني.', sizes: sizesFrom125(100), accent: '07', ...standardOptions },
  { id: 'brazilian-santos', group: 'single', name: 'Brazilian Santos', arName: 'بن برازيلي سانتوس', note: 'Single Origin', desc: 'قهوة سانتوس البرازيلية المتوازنة بنكهة ناعمة وقوام مريح.', sizes: sizesFrom125(135), accent: '08', ...standardOptions },
  { id: 'colombian', group: 'single', name: 'Colombian', arName: 'بن كولومبي', note: 'Single Origin', desc: 'قهوة أحادية المنشأ من كولومبيا، متوازنة وناعمة بلمسة حلاوة طبيعية.', sizes: sizesFrom125(125), accent: '09', ...standardOptions },
  { id: 'guatemalan', group: 'single', name: 'Guatemalan', arName: 'بن جواتيمالي', note: 'Single Origin', desc: 'قهوة أحادية المنشأ من جواتيمالا بطابع عطري ونكهة واضحة.', sizes: sizesFrom125(130), accent: '10', ...standardOptions },
  { id: 'ethiopian-lekempti', group: 'single', name: 'Ethiopian Lekempti', arName: 'بن حبشي لقمتي', note: 'Single Origin', desc: 'قهوة أحادية المنشأ من إثيوبيا، عطرية وملفتة بطبقات نكهة نابضة.', sizes: sizesFrom125(100), accent: '11', ...standardOptions },
  { id: 'indian-plantation', group: 'single', name: 'Indian Plantation', arName: 'بن هندي بلانتيشن', note: 'Single Origin', desc: 'قهوة أحادية المنشأ من الهند بقوام غني ونكهة ثابتة.', sizes: sizesFrom125(135), accent: '12', ...standardOptions },
  { id: 'yemeni', group: 'single', name: 'Yemeni', arName: 'بن يمني', note: 'Single Origin', desc: 'قهوة يمنية مميزة بطابع عميق وتعقيد عطري أصيل.', sizes: sizesFrom125(150), accent: '13', ...standardOptions },
];

export const socials = [
  { name: 'Instagram', href: 'https://www.instagram.com/waqar.coffee/' },
  { name: 'Facebook', href: 'https://www.facebook.com/WaqarCoffee' },
  { name: 'TikTok', href: 'https://www.tiktok.com/@waqar_coffee' },
  { name: 'WhatsApp', href: `https://wa.me/${WA_NUMBER}` },
];
