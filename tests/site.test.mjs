import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

describe('1. Mom & Pop Family Configuration & Minimal Content Model (siteConfig.js)', () => {
  it('exports family branding, established year, 3 nav links, 3 concise slides, and 3 minimal services without oilPrice', async () => {
    const { siteConfig } = await import('../src/data/siteConfig.js');

    assert.ok(siteConfig.brandName.length > 0, 'Brand name should be defined');
    assert.ok(siteConfig.familyMotto.includes('Family'), 'Family motto should reflect Mom & Pop family identity');
    assert.equal(siteConfig.establishedYear, 1978, 'Should include family established year');
    assert.match(siteConfig.phoneHref, /^tel:\+?\d+/, 'phoneHref should be a valid tel: link');
    assert.equal(
      siteConfig.web3FormsAccessKey,
      '89911d31-d3c5-4f46-8bdd-68e23d758358',
      'Should configure the Web3Forms access key'
    );
    assert.equal(siteConfig.oilPrice, undefined, 'oilPrice should be removed from siteConfig');

    // 4 Nav Links: Home, Services, About, Contact
    assert.equal(siteConfig.navLinks.length, 4, 'Should have 4 nav links including About');
    assert.deepEqual(
      siteConfig.navLinks.map((l) => l.label),
      ['Home', 'Services', 'About', 'Contact']
    );
    assert.deepEqual(
      siteConfig.navLinks.map((l) => l.href),
      ['/', '/#services', '/about', '/#contact']
    );

    // About section configuration
    assert.ok(siteConfig.about, 'Should include about section configuration');
    assert.equal(siteConfig.about.image, '/images/img1.jpg', 'About section should use /images/img1.jpg');
    assert.ok(siteConfig.about.paragraphs.length >= 2, 'About section should include filler bio paragraphs');
    assert.equal(siteConfig.about.ctaHref, '/#contact', 'About CTA should link back to /#contact');

    // Hero Carousel slides with short neighborly copy
    assert.equal(siteConfig.heroSlides.length, 3, 'Should have 3 hero carousel slides');
    for (const slide of siteConfig.heroSlides) {
      assert.match(slide.image, /^\/images\/.*\.(svg|jpg)$/, 'Slide should reference an image in /images/');
      assert.ok(slide.headline.length <= 55, 'Slide headline should be short and punchy');
      assert.ok(slide.subheadline.length <= 115, 'Slide subheadline should be a single short sentence');
      assert.ok(slide.ctaHref.startsWith('#contact'), 'Slide primary CTA should scroll to #contact');
    }

    // 3 Minimal Core Services
    assert.equal(siteConfig.services.length, 3, 'Should include the 3 core heating services');
    const serviceIds = siteConfig.services.map((s) => s.id);
    assert.deepEqual(serviceIds, ['delivery', 'emergency', 'installation']);
  });
});

describe('2. Interactive Carousel, Touch-Swipe & Quote Form Logic (uiLogic.js)', () => {
  it('wraps slide indices accurately for next and previous navigation', async () => {
    const { getNextSlideIndex, getPrevSlideIndex } = await import('../src/utils/uiLogic.js');

    assert.equal(getNextSlideIndex(0, 3), 1);
    assert.equal(getNextSlideIndex(1, 3), 2);
    assert.equal(getNextSlideIndex(2, 3), 0, 'Next from last slide should wrap to 0');

    assert.equal(getPrevSlideIndex(0, 3), 2, 'Prev from first slide should wrap to last slide');
    assert.equal(getPrevSlideIndex(2, 3), 1);
  });

  it('detects mobile horizontal touch-swipe direction with threshold filtering', async () => {
    const { detectSwipeDirection } = await import('../src/utils/uiLogic.js');

    assert.equal(detectSwipeDirection(250, 150, 40), 'next');
    assert.equal(detectSwipeDirection(120, 220, 40), 'prev');
    assert.equal(detectSwipeDirection(200, 180, 40), null);
  });

  it('resolves carousel CTA service types cleanly for contact form selection', async () => {
    const { resolveServiceType } = await import('../src/utils/uiLogic.js');
    const { siteConfig } = await import('../src/data/siteConfig.js');

    assert.equal(resolveServiceType('delivery'), 'delivery');
    assert.equal(resolveServiceType('emergency'), 'emergency');
    assert.equal(resolveServiceType('installation'), 'installation');
    assert.equal(resolveServiceType('#contact?service=delivery'), 'delivery');
    assert.equal(resolveServiceType('invalid'), null);
    assert.equal(resolveServiceType(null), null);

    assert.deepEqual(
      siteConfig.heroSlides.map((s) => ({ ctaHref: s.ctaHref, serviceType: resolveServiceType(s.serviceType) })),
      [
        { ctaHref: '#contact', serviceType: 'delivery' },
        { ctaHref: '#contact', serviceType: 'emergency' },
        { ctaHref: '#contact', serviceType: 'installation' },
      ]
    );
  });

  it('validates the quote and oil order form including email address', async () => {
    const { validateQuoteRequest } = await import('../src/utils/uiLogic.js');

    const invalidResult = validateQuoteRequest({
      name: '',
      email: 'not-an-email',
      phone: '123',
      zip: '12',
      serviceType: '',
    });
    assert.equal(invalidResult.valid, false);
    assert.ok(invalidResult.errors.length >= 4);

    const validResult = validateQuoteRequest({
      name: 'Jane Homeowner',
      email: 'jane@example.com',
      phone: '(555) 234-5678',
      zip: '02115',
      serviceType: 'delivery',
    });
    assert.equal(validResult.valid, true);
    assert.equal(validResult.errors.length, 0);
  });

  it('builds Web3Forms payload with dynamic subject, from_name, email, and botcheck honeypot', async () => {
    const { buildWeb3FormsPayload, submitQuoteToWeb3Forms } = await import('../src/utils/uiLogic.js');

    const payload = buildWeb3FormsPayload(
      {
        name: '  Jane Homeowner ',
        email: ' jane@example.com ',
        phone: '(555) 234-5678',
        zip: '01701',
        serviceType: 'emergency',
        botcheck: false,
      },
      '89911d31-d3c5-4f46-8bdd-68e23d758358'
    );

    assert.deepEqual(payload, {
      access_key: '89911d31-d3c5-4f46-8bdd-68e23d758358',
      subject: 'New Quote Request: 24/7 Emergency Burner Repair - Jane Homeowner',
      from_name: "Dan's Heating Website",
      name: 'Jane Homeowner',
      email: 'jane@example.com',
      phone: '(555) 234-5678',
      zip: '01701',
      serviceType: '24/7 Emergency Burner Repair',
      botcheck: false,
    });

    const successResult = await submitQuoteToWeb3Forms(payload, async (url, options) => {
      assert.equal(url, 'https://api.web3forms.com/submit');
      assert.equal(options.method, 'POST');
      return {
        ok: true,
        json: async () => ({ success: true, message: 'Email sent!' }),
      };
    });
    assert.equal(successResult.ok, true);
    assert.equal(successResult.message, 'Email sent!');

    const failureResult = await submitQuoteToWeb3Forms(payload, async () => ({
      ok: false,
      json: async () => ({ success: false, message: 'Invalid access key' }),
    }));
    assert.equal(failureResult.ok, false);
    assert.equal(failureResult.message, 'Invalid access key');
  });

  it('prefixes root-relative image and navigation paths with baseUrl via withBase()', async () => {
    const { withBase } = await import('../src/utils/uiLogic.js');

    assert.equal(withBase('/images/img1.jpg', '/oil-heating-site'), '/oil-heating-site/images/img1.jpg');
    assert.equal(withBase('/images/img1.jpg', '/oil-heating-site/'), '/oil-heating-site/images/img1.jpg');
    assert.equal(withBase('/about', '/oil-heating-site'), '/oil-heating-site/about');
    assert.equal(withBase('/#services', '/oil-heating-site'), '/oil-heating-site/#services');
    assert.equal(withBase('/', '/oil-heating-site'), '/oil-heating-site/');
    assert.equal(withBase('/images/img1.jpg', '/'), '/images/img1.jpg');
    assert.equal(withBase('#contact', '/oil-heating-site'), '#contact');
    assert.equal(withBase('tel:+15552345678', '/oil-heating-site'), 'tel:+15552345678');
  });
});

describe('3. Mom & Pop Minimal Mobile-First Astro Components & Assets', () => {
  it('has family and heating photos in public/images/ and applies withBase() for GitHub Pages base path', () => {
    const expectedFiles = [
      'public/images/img1.jpg',
      'public/images/img2.jpg',
      'public/images/img3.jpg',
    ];
    for (const relPath of expectedFiles) {
      const fullPath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Expected image ${relPath} to exist`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `${relPath} should not be empty`);
    }

    const hero = fs.readFileSync(path.join(rootDir, 'src/components/HeroCarousel.astro'), 'utf-8');
    const about = fs.readFileSync(path.join(rootDir, 'src/components/About.astro'), 'utf-8');
    assert.ok(hero.includes('withBase(slide.image'), 'HeroCarousel should wrap slide.image with withBase');
    assert.ok(about.includes('withBase(about.image'), 'About should wrap about.image with withBase');
  });

  it('implements warm Mom & Pop Navbar with serif brand, 3 links, mobile collapse, and NO oil price badge anywhere', () => {
    const navbarPath = path.join(rootDir, 'src/components/Navbar.astro');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    assert.ok(content.includes('sticky top-0'), 'Navbar should be sticky at top');
    assert.ok(content.includes('font-serif'), 'Navbar should use warm serif typography for family brand');
    assert.ok(content.includes('mobile-menu-toggle'), 'Navbar should include mobile hamburger toggle');
    assert.ok(content.includes('navbar-collapse'), 'Navbar should include collapsible mobile drawer');
    assert.ok(!content.includes('oilPrice') && !content.includes('/gal'), 'Navbar should not contain any oil price badge');

    const contact = fs.readFileSync(path.join(rootDir, 'src/components/ContactQuote.astro'), 'utf-8');
    const layout = fs.readFileSync(path.join(rootDir, 'src/layouts/Layout.astro'), 'utf-8');
    assert.ok(!contact.includes('oilPrice') && !contact.includes('/gal'), 'ContactQuote should not contain oil price');
    assert.ok(!layout.includes('oilPrice') && !layout.includes('/gal'), 'Layout should not contain oil price');
  });

  it('implements centered minimal HeroCarousel Jumbotron with serif headline, 1 CTA per slide, and indicator dots', () => {
    const heroPath = path.join(rootDir, 'src/components/HeroCarousel.astro');
    const content = fs.readFileSync(heroPath, 'utf-8');

    assert.ok(content.includes('data-carousel'), 'HeroCarousel should have carousel container attribute');
    assert.ok(content.includes('text-center'), 'HeroCarousel overlay should be centered');
    assert.ok(content.includes('font-serif'), 'HeroCarousel headline should use warm serif font');
    assert.ok(content.includes('bg-red-800'), 'HeroCarousel CTA should use Heritage Barn Red');
    assert.ok(content.includes('data-carousel-indicator'), 'HeroCarousel should render bottom indicator dots');
    assert.ok(content.includes('hidden md:flex'), 'Prev/Next arrow buttons should be hidden on mobile and flex on md+');
    assert.ok(!content.includes('secondaryLabel'), 'HeroCarousel should only have 1 primary CTA per slide');
  });

  it('implements minimal Services, centered single-column ContactQuote with email field, and compact single-bar Footer', () => {
    const services = fs.readFileSync(path.join(rootDir, 'src/components/Services.astro'), 'utf-8');
    assert.ok(services.includes('grid-cols-1') && services.includes('md:grid-cols-3'), 'Services should stack 1-col on mobile and 3-col on md+');
    assert.ok(!services.includes('<ul'), 'Minimal Services cards should not contain cluttered bullet lists');

    const contact = fs.readFileSync(path.join(rootDir, 'src/components/ContactQuote.astro'), 'utf-8');
    assert.ok(contact.includes('id="quote-form"'), 'ContactQuote should include interactive form');
    assert.ok(contact.includes('max-w-xl mx-auto'), 'ContactQuote should be a centered single-column container');
    assert.ok(contact.includes('id="customer-email"') && contact.includes('name="email"'), 'ContactQuote should include email input field');
    assert.ok(!contact.includes('id="customer-address"'), 'ContactQuote should not include address field');
    assert.ok(!contact.includes('customer-notes'), 'ContactQuote should not include notes field');
    assert.ok(contact.includes('name="access_key"'), 'ContactQuote should include Web3Forms access_key field');
    assert.ok(contact.includes('name="botcheck"'), 'ContactQuote should include Web3Forms honeypot field');
    assert.ok(contact.includes('submitQuoteToWeb3Forms'), 'ContactQuote should submit via Web3Forms helper');

    const footer = fs.readFileSync(path.join(rootDir, 'src/components/Footer.astro'), 'utf-8');
    assert.ok(
      footer.includes('flex-col') && footer.includes('md:flex-row'),
      'Footer should stack cleanly on mobile and form a single compact bar on desktop'
    );
  });

  it('wires index.astro without About and renders About on its own /about page (about.astro)', () => {
    const indexPage = fs.readFileSync(path.join(rootDir, 'src/pages/index.astro'), 'utf-8');
    assert.ok(indexPage.includes('<HeroCarousel />'), 'index.astro should render HeroCarousel');
    assert.ok(indexPage.includes('<Services />'), 'index.astro should render Services');
    assert.ok(indexPage.includes('<ContactQuote />'), 'index.astro should render ContactQuote');
    assert.ok(!indexPage.includes('<About />'), 'index.astro should not render About directly');

    const aboutPage = fs.readFileSync(path.join(rootDir, 'src/pages/about.astro'), 'utf-8');
    assert.ok(aboutPage.includes('<Layout'), 'about.astro should use Layout');
    assert.ok(aboutPage.includes('<About />'), 'about.astro should render About component');

    const aboutComponent = fs.readFileSync(path.join(rootDir, 'src/components/About.astro'), 'utf-8');
    assert.ok(aboutComponent.includes('id="about"'), 'About.astro should have id="about"');
    assert.ok(aboutComponent.includes('lg:grid-cols-12'), 'About.astro should use a two-column split grid on desktop');
    assert.ok(aboutComponent.includes('<figcaption'), 'About.astro should render a photo caption');
    assert.ok(aboutComponent.includes('max-w-prose'), 'About.astro should constrain line width for easy reading');
  });
});
