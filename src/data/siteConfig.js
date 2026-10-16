export const siteConfig = {
  brandName: 'Dan\'s Heating and Oil',
  shortName: 'Dan\'s Heating',
  familyMotto: 'Family-Owned & Operated Since 1978',
  establishedYear: 1978,
  phoneDisplay: '(555) 234-5678',
  phoneHref: 'tel:+15552345678',
  web3FormsAccessKey: '89911d31-d3c5-4f46-8bdd-68e23d758358',

  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/#services' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/#contact' },
  ],

  about: {
    eyebrow: 'Our Family Story • Est. 1978',
    heading: "Meet the Family Behind Dan's Heating",
    image: '/images/img1.jpg',
    imageAlt: "Dan's Heating family and their dogs outside their home",
    imageCaption: 'The family and our four-legged dispatchers at home.',
    paragraphs: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.',
    ],
    ctaLabel: 'Get in touch with our family',
    ctaHref: '/#contact',
  },

  heroSlides: [
    {
      id: 'slide-delivery',
      headline: 'From Our Family to Yours Since 1978',
      subheadline: 'Dependable hometown heating oil delivery with a neighborly handshake.',
      image: '/images/img1.jpg',
      imageAlt: 'Family heating oil delivery truck placeholder photo',
      ctaLabel: 'Order Heating Oil',
      ctaHref: '#contact',
      serviceType: 'delivery',
    },
    {
      id: 'slide-emergency',
      headline: 'We Answer Our Own Phones, 24/7',
      subheadline: 'When your heat goes out on a freezing night, our family is on the way.',
      image: '/images/img2.jpg',
      imageAlt: '24/7 family burner service placeholder photo',
      ctaLabel: 'Request Burner Service',
      ctaHref: '#contact',
      serviceType: 'emergency',
    },
    {
      id: 'slide-installation',
      headline: 'Honest Work & Fair Hometown Prices',
      subheadline: 'Quality boiler care, oil tank replacements, and tune-ups you can trust.',
      image: '/images/img3.jpg',
      imageAlt: 'Boiler and oil tank installation placeholder photo',
      ctaLabel: 'Ask for an Estimate',
      ctaHref: '#contact',
      serviceType: 'installation',
    },
  ],

  services: [
    {
      id: 'delivery',
      title: 'Hometown Oil Delivery',
      description: 'Worry-free automatic refills or quick will-call delivery whenever your tank gets low.',
    },
    {
      id: 'emergency',
      title: '24/7 Family Burner Service',
      description: 'No answering services—call any hour and a Miller family technician will get your heat back on.',
    },
    {
      id: 'installation',
      title: 'Boilers, Tanks & Tune-Ups',
      description: 'Honest advice and tidy installations for boilers, furnaces, and replacement oil tanks.',
    },
  ],
};
