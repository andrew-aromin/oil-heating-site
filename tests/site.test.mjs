import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

describe('1. Dan McKay Heating & Cooling Configuration & Flyer Content Model (siteConfig.js)', () => {
  it('exports Dan McKay branding, logo, phone number, flyer wording, 4 nav links, 3 slides, and 3 HVAC/oil burner services', async () => {
    const { siteConfig } = await import('../src/data/siteConfig.js');

    assert.equal(siteConfig.brandName, 'Dan McKay Heating & Cooling', 'Brand name should match base.jpeg');
    assert.equal(siteConfig.logo, '/images/logo.jpg', 'Logo should reference /images/logo.jpg');
    assert.equal(siteConfig.phoneDisplay, '774-238-0557', 'Phone display should match base.jpeg');
    assert.equal(siteConfig.phoneHref, 'tel:+17742380557', 'phoneHref should be a valid tel: link');
    assert.equal(siteConfig.businessHours, 'Mon–Fri: 8:30am – 5:00pm', 'Should configure business hours');
    assert.ok(siteConfig.familyMotto.includes('family'), 'Family motto should reflect treating customers like family');
    assert.ok(
      siteConfig.valueProposition.highlight.includes('No service fees - just our hourly rate.'),
      'Should include the flyer highlight copy'
    );
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
    assert.equal(siteConfig.about.experienceBadge, 'Over 30 Years Of Experience', 'About section should include experience badge');
    assert.ok(siteConfig.about.paragraphs[0].includes('over 30 years'), 'About lead paragraph should emphasize 30+ years experience');
    assert.ok(siteConfig.about.paragraphs.length >= 2, 'About section should include filler bio paragraphs');
    assert.equal(siteConfig.about.ctaHref, '/#contact', 'About CTA should link back to /#contact');

    // Hero Carousel slides with flyer copy
    assert.equal(siteConfig.heroSlides.length, 3, 'Should have 3 hero carousel slides');
    for (const slide of siteConfig.heroSlides) {
      assert.match(slide.image, /^\/images\/.*\.(svg|jpg)$/, 'Slide should reference an image in /images/');
      assert.ok(slide.headline.length <= 55, 'Slide headline should be short and punchy');
      assert.ok(slide.subheadline.length <= 115, 'Slide subheadline should be a single short sentence');
      assert.ok(slide.ctaHref.startsWith('#contact'), 'Slide primary CTA should scroll to #contact');
    }

    // 3 Core Heating & Cooling Services
    assert.equal(siteConfig.services.length, 3, 'Should include the 3 core heating & cooling services');
    const serviceIds = siteConfig.services.map((s) => s.id);
    assert.deepEqual(serviceIds, ['service', 'installation', 'maintenance']);

    // After-Hours / Emergency Service Fee Disclaimer & Asterisks
    assert.equal(siteConfig.serviceFeeDisclaimer.title, 'After-Hours / Emergency Service Fee');
    assert.ok(
      siteConfig.serviceFeeDisclaimer.body.includes('An additional service fee applies to service calls requested outside our regular business hours'),
      'Should include the after-hours service fee disclaimer body'
    );
    assert.equal(siteConfig.heroSlides[1].headline, 'No Service Fees - Just Our Hourly Rate*');
    assert.ok(siteConfig.services[0].description.includes('No service fees - just our hourly rate.*'));
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

    assert.equal(resolveServiceType('service'), 'service');
    assert.equal(resolveServiceType('installation'), 'installation');
    assert.equal(resolveServiceType('maintenance'), 'maintenance');
    assert.equal(resolveServiceType('#contact?service=service'), 'service');
    assert.equal(resolveServiceType('invalid'), null);
    assert.equal(resolveServiceType(null), null);

    assert.deepEqual(
      siteConfig.heroSlides.map((s) => ({ ctaHref: s.ctaHref, serviceType: resolveServiceType(s.serviceType) })),
      [
        { ctaHref: '#contact', serviceType: 'service' },
        { ctaHref: '#contact', serviceType: 'maintenance' },
        { ctaHref: '#contact', serviceType: 'installation' },
      ]
    );
  });

  it('formats phone numbers into ###-###-#### format', async () => {
    const { formatPhoneNumber } = await import('../src/utils/uiLogic.js');

    assert.equal(formatPhoneNumber(''), '');
    assert.equal(formatPhoneNumber('774'), '774');
    assert.equal(formatPhoneNumber('774238'), '774-238');
    assert.equal(formatPhoneNumber('7742380557'), '774-238-0557');
    assert.equal(formatPhoneNumber('(774) 238-0557'), '774-238-0557');
    assert.equal(formatPhoneNumber('77423805579999'), '774-238-0557');
  });

  it('sanitizes zip codes to 5 numeric digits', async () => {
    const { sanitizeZip } = await import('../src/utils/uiLogic.js');

    assert.equal(sanitizeZip(''), '');
    assert.equal(sanitizeZip('02760'), '02760');
    assert.equal(sanitizeZip('02760-1234'), '02760');
    assert.equal(sanitizeZip('abc02760xyz'), '02760');
  });

  it('validates individual form fields correctly via validateField', async () => {
    const { validateField } = await import('../src/utils/uiLogic.js');

    assert.equal(validateField('name', 'J'), 'Please enter your full name.');
    assert.equal(validateField('name', 'Jane'), null);
    assert.equal(validateField('email', 'bad'), 'Please enter a valid email address.');
    assert.equal(validateField('email', 'jane@example.com'), null);
    assert.equal(validateField('phone', '123'), 'Please enter a valid 10-digit phone number.');
    assert.equal(validateField('phone', '774-238-0557'), null);
    assert.equal(validateField('zip', '027'), 'Please enter a valid 5-digit ZIP code.');
    assert.equal(validateField('zip', '02760'), null);
    assert.equal(validateField('serviceType', ''), 'Please select a service type.');
    assert.equal(validateField('serviceType', 'service'), null);
  });

  it('evaluates quote form completeness and validity for submit button state', async () => {
    const { isQuoteFormCompleteAndValid } = await import('../src/utils/uiLogic.js');

    assert.equal(isQuoteFormCompleteAndValid(null), false);
    assert.equal(
      isQuoteFormCompleteAndValid({
        name: '',
        email: 'jane@example.com',
        phone: '774-238-0557',
        zip: '02760',
        serviceType: 'service',
      }),
      false
    );
    assert.equal(
      isQuoteFormCompleteAndValid({
        name: 'Jane Homeowner',
        email: 'invalid-email',
        phone: '774-238-0557',
        zip: '02760',
        serviceType: 'service',
      }),
      false
    );
    assert.equal(
      isQuoteFormCompleteAndValid({
        name: 'Jane Homeowner',
        email: 'jane@example.com',
        phone: '774-238-0557',
        zip: '02760',
        serviceType: 'service',
      }),
      true
    );
  });

  it('validates the quote request form including email address and returns fieldErrors', async () => {
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
    assert.ok(invalidResult.fieldErrors.name);
    assert.ok(invalidResult.fieldErrors.email);
    assert.ok(invalidResult.fieldErrors.phone);
    assert.ok(invalidResult.fieldErrors.zip);
    assert.ok(invalidResult.fieldErrors.serviceType);

    const validResult = validateQuoteRequest({
      name: 'Jane Homeowner',
      email: 'jane@example.com',
      phone: '774-238-0557',
      zip: '02760',
      serviceType: 'service',
    });
    assert.equal(validResult.valid, true);
    assert.equal(validResult.errors.length, 0);
    assert.deepEqual(validResult.fieldErrors, {});
  });

  it('builds Web3Forms payload with dynamic subject, from_name, email, and botcheck honeypot', async () => {
    const { buildWeb3FormsPayload, submitQuoteToWeb3Forms } = await import('../src/utils/uiLogic.js');

    const payload = buildWeb3FormsPayload(
      {
        name: '  Jane Homeowner ',
        email: ' jane@example.com ',
        phone: '774-238-0557',
        zip: '02760',
        serviceType: 'service',
        botcheck: false,
      },
      '89911d31-d3c5-4f46-8bdd-68e23d758358'
    );

    assert.deepEqual(payload, {
      access_key: '89911d31-d3c5-4f46-8bdd-68e23d758358',
      subject: 'New Quote Request: Oil Burner or Cooling Service & Repair - Jane Homeowner',
      from_name: 'Dan McKay Heating & Cooling Website',
      name: 'Jane Homeowner',
      email: 'jane@example.com',
      phone: '774-238-0557',
      zip: '02760',
      serviceType: 'Oil Burner or Cooling Service & Repair',
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

    assert.equal(withBase('/images/img1.jpg', '/dmckaycomfort'), '/dmckaycomfort/images/img1.jpg');
    assert.equal(withBase('/images/img1.jpg', '/dmckaycomfort/'), '/dmckaycomfort/images/img1.jpg');
    assert.equal(withBase('/about', '/dmckaycomfort'), '/dmckaycomfort/about');
    assert.equal(withBase('/#services', '/dmckaycomfort'), '/dmckaycomfort/#services');
    assert.equal(withBase('/', '/dmckaycomfort'), '/dmckaycomfort/');
    assert.equal(withBase('/images/img1.jpg', '/'), '/images/img1.jpg');
    assert.equal(withBase('#contact', '/dmckaycomfort'), '#contact');
    assert.equal(withBase('tel:+17742380557', '/dmckaycomfort'), 'tel:+17742380557');
  });
});

describe('3. Dan McKay Heating & Cooling Astro Components & Assets', () => {
  it('has logo and heating photos in public/images/ and applies withBase() for GitHub Pages base path', () => {
    const expectedFiles = [
      'public/images/logo.jpg',
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

    const navbar = fs.readFileSync(path.join(rootDir, 'src/components/Navbar.astro'), 'utf-8');
    const hero = fs.readFileSync(path.join(rootDir, 'src/components/HeroCarousel.astro'), 'utf-8');
    const about = fs.readFileSync(path.join(rootDir, 'src/components/About.astro'), 'utf-8');
    assert.ok(navbar.includes('withBase(siteConfig.logo'), 'Navbar should wrap siteConfig.logo with withBase');
    assert.ok(hero.includes('withBase(slide.image'), 'HeroCarousel should wrap slide.image with withBase');
    assert.ok(about.includes('withBase(about.image'), 'About should wrap about.image with withBase');
  });

  it('implements black Navbar with logo, cyan/orange accents, mobile collapse, and NO oil price badge anywhere', () => {
    const navbarPath = path.join(rootDir, 'src/components/Navbar.astro');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    assert.ok(content.includes('sticky top-0'), 'Navbar should be sticky at top');
    assert.ok(content.includes('bg-black'), 'Navbar should use black background matching base.jpeg');
    assert.ok(content.includes('#1ba1e2'), 'Navbar should include cyan accent color');
    assert.ok(content.includes('#e06336'), 'Navbar should include orange CTA color');
    assert.ok(content.includes('mobile-menu-toggle'), 'Navbar should include mobile hamburger toggle');
    assert.ok(content.includes('navbar-collapse'), 'Navbar should include collapsible mobile drawer');
    assert.ok(!content.includes('oilPrice') && !content.includes('/gal'), 'Navbar should not contain any oil price badge');

    const contact = fs.readFileSync(path.join(rootDir, 'src/components/ContactQuote.astro'), 'utf-8');
    const layout = fs.readFileSync(path.join(rootDir, 'src/layouts/Layout.astro'), 'utf-8');
    assert.ok(!contact.includes('oilPrice') && !contact.includes('/gal'), 'ContactQuote should not contain oil price');
    assert.ok(!layout.includes('oilPrice') && !layout.includes('/gal'), 'Layout should not contain oil price');
  });

  it('implements centered HeroCarousel with cyan script comfortable, orange CTA, and cyan indicator dots', () => {
    const heroPath = path.join(rootDir, 'src/components/HeroCarousel.astro');
    const content = fs.readFileSync(heroPath, 'utf-8');

    assert.ok(content.includes('data-carousel'), 'HeroCarousel should have carousel container attribute');
    assert.ok(content.includes('text-center'), 'HeroCarousel overlay should be centered');
    assert.ok(content.includes('font-script'), 'HeroCarousel headline should use script font for comfortable');
    assert.ok(content.includes('bg-[#e06336]'), 'HeroCarousel CTA should use flyer orange (#e06336)');
    assert.ok(content.includes('bg-[#1ba1e2]'), 'HeroCarousel active indicator should use flyer cyan (#1ba1e2)');
    assert.ok(content.includes('data-carousel-indicator'), 'HeroCarousel should render bottom indicator dots');
    assert.ok(content.includes('hidden md:flex'), 'Prev/Next arrow buttons should be hidden on mobile and flex on md+');
    assert.ok(!content.includes('secondaryLabel'), 'HeroCarousel should only have 1 primary CTA per slide');
  });

  it('implements Services with orange banner & flyer wording, ContactQuote with email field, and black Footer', () => {
    const services = fs.readFileSync(path.join(rootDir, 'src/components/Services.astro'), 'utf-8');
    assert.ok(services.includes('grid-cols-1') && services.includes('md:grid-cols-3'), 'Services should stack 1-col on mobile and 3-col on md+');
    assert.ok(services.includes('bg-[#e06336]'), 'Services should include the flyer orange service strip');
    assert.ok(services.includes('family.') && services.includes('comfort'), 'Services should include the bottom flyer tagline');
    assert.ok(services.includes('siteConfig.serviceFeeDisclaimer'), 'Services should render the service fee disclaimer footnote');
    assert.ok(!services.includes('<ul'), 'Minimal Services cards should not contain cluttered bullet lists');

    const contact = fs.readFileSync(path.join(rootDir, 'src/components/ContactQuote.astro'), 'utf-8');
    assert.ok(contact.includes('No service fees - just our hourly rate.*'), 'ContactQuote should include asterisk on service fee highlight');
    assert.ok(contact.includes('siteConfig.serviceFeeDisclaimer'), 'ContactQuote should render the service fee disclaimer footnote');
    assert.ok(contact.includes('id="quote-form"'), 'ContactQuote should include interactive form');
    assert.ok(contact.includes('max-w-xl mx-auto'), 'ContactQuote should be a centered single-column container');
    assert.ok(contact.includes('id="customer-email"') && contact.includes('name="email"'), 'ContactQuote should include email input field');
    assert.ok(!contact.includes('id="customer-address"'), 'ContactQuote should not include address field');
    assert.ok(!contact.includes('customer-notes'), 'ContactQuote should not include notes field');
    assert.ok(contact.includes('name="access_key"'), 'ContactQuote should include Web3Forms access_key field');
    assert.ok(contact.includes('name="botcheck"'), 'ContactQuote should include Web3Forms honeypot field');
    assert.ok(contact.includes('submitQuoteToWeb3Forms'), 'ContactQuote should submit via Web3Forms helper');
    assert.ok(contact.includes('id="customer-name-error"'), 'ContactQuote should include inline error element for name');
    assert.ok(contact.includes('id="customer-email-error"'), 'ContactQuote should include inline error element for email');
    assert.ok(contact.includes('id="customer-phone-error"'), 'ContactQuote should include inline error element for phone');
    assert.ok(contact.includes('id="customer-zip-error"'), 'ContactQuote should include inline error element for zip');
    assert.ok(contact.includes('id="service-type-error"'), 'ContactQuote should include inline error element for service type');
    assert.ok(contact.includes('aria-describedby="customer-name-error"'), 'ContactQuote should bind aria-describedby to name input');
    assert.ok(contact.includes('quote-submit-btn') && contact.includes('disabled'), 'ContactQuote submit button should start disabled');

    const footer = fs.readFileSync(path.join(rootDir, 'src/components/Footer.astro'), 'utf-8');
    assert.ok(
      footer.includes('flex-col') && footer.includes('md:flex-row'),
      'Footer should stack cleanly on mobile and form a single compact bar on desktop'
    );
    assert.ok(footer.includes('siteConfig.businessHours'), 'Footer should render business hours');
    assert.ok(footer.includes('bg-black'), 'Footer should use black background');
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
    assert.ok(aboutComponent.includes('about.experienceBadge'), 'About.astro should render the experience badge');
    assert.ok(aboutComponent.includes('bg-[#e06336]'), 'About.astro should style the experience badge with brand orange');
  });
});
