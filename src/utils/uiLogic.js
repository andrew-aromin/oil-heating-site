/**
 * Calculates the next slide index with wrap-around.
 * @param {number} currentIndex
 * @param {number} totalSlides
 * @returns {number}
 */
export function getNextSlideIndex(currentIndex, totalSlides) {
  if (totalSlides <= 0) return 0;
  return (currentIndex + 1) % totalSlides;
}

/**
 * Calculates the previous slide index with wrap-around.
 * @param {number} currentIndex
 * @param {number} totalSlides
 * @returns {number}
 */
export function getPrevSlideIndex(currentIndex, totalSlides) {
  if (totalSlides <= 0) return 0;
  return (currentIndex - 1 + totalSlides) % totalSlides;
}

/**
 * Determines horizontal swipe direction from touch coordinates.
 * @param {number} startX
 * @param {number} endX
 * @param {number} [threshold=40]
 * @returns {'next' | 'prev' | null}
 */
export function detectSwipeDirection(startX, endX, threshold = 40) {
  const deltaX = endX - startX;
  if (Math.abs(deltaX) < threshold) {
    return null;
  }
  return deltaX < 0 ? 'next' : 'prev';
}

/**
 * Validates customer quote / oil order form inputs.
 * @param {{ name?: string; email?: string; phone?: string; zip?: string; serviceType?: string; gallons?: number }} input
 * @returns {{ valid: boolean; errors: string[] }}
 */
export function validateQuoteRequest(input) {
  const errors = [];

  if (!input || !input.name || input.name.trim().length < 2) {
    errors.push('Please enter your full name.');
  }

  const emailClean = (input?.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
    errors.push('Please enter a valid email address.');
  }

  const digitsOnly = (input?.phone || '').replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    errors.push('Please enter a valid 10-digit phone number.');
  }

  const zipClean = (input?.zip || '').trim();
  if (!/^\d{5}(-\d{4})?$/.test(zipClean)) {
    errors.push('Please enter a valid 5-digit ZIP code.');
  }

  if (!input?.serviceType || input.serviceType.trim().length === 0) {
    errors.push('Please select a service type.');
  }

  if (input?.serviceType === 'delivery' && typeof input.gallons === 'number' && input.gallons < 100) {
    errors.push('Minimum heating oil delivery order is 100 gallons.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

const SERVICE_LABELS = {
  service: 'Oil Burner or Cooling Service & Repair',
  installation: 'Heating & Air Conditioning Installation',
  maintenance: 'Routine Service & Maintenance',
};

/**
 * Resolves a valid service category ('service' | 'installation' | 'maintenance')
 * from a data-service-link attribute or href string.
 * @param {string | null | undefined} value
 * @returns {'service' | 'installation' | 'maintenance' | null}
 */
export function resolveServiceType(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(SERVICE_LABELS, trimmed)) {
    return /** @type {'service' | 'installation' | 'maintenance'} */ (trimmed);
  }
  const match = trimmed.match(/service=([a-z]+)/i);
  if (match && Object.prototype.hasOwnProperty.call(SERVICE_LABELS, match[1])) {
    return /** @type {'service' | 'installation' | 'maintenance'} */ (match[1]);
  }
  return null;
}

/**
 * Builds the JSON payload for Web3Forms submission.
 * @param {{ name?: string; email?: string; phone?: string; zip?: string; serviceType?: string; botcheck?: boolean | string }} input
 * @param {string} accessKey
 */
export function buildWeb3FormsPayload(input, accessKey) {
  const cleanName = (input?.name || '').trim();
  const rawService = (input?.serviceType || '').trim();
  const serviceLabel = SERVICE_LABELS[rawService] || rawService;

  return {
    access_key: accessKey,
    subject: `New Quote Request: ${serviceLabel} - ${cleanName}`,
    from_name: 'Dan McKay Heating & Cooling Website',
    name: cleanName,
    email: (input?.email || '').trim(),
    phone: (input?.phone || '').trim(),
    zip: (input?.zip || '').trim(),
    serviceType: serviceLabel,
    botcheck: Boolean(input?.botcheck),
  };
}

/**
 * Submits a validated quote request to the Web3Forms API.
 * @param {Record<string, unknown>} payload
 * @param {typeof fetch} [fetchImpl=fetch]
 * @returns {Promise<{ ok: boolean; message: string }>}
 */
export async function submitQuoteToWeb3Forms(payload, fetchImpl = fetch) {
  try {
    const response = await fetchImpl('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success) {
      return { ok: true, message: data.message || 'Form submitted successfully.' };
    }
    return {
      ok: false,
      message: data.message || 'Unable to send your request right now. Please call us directly.',
    };
  } catch {
    return {
      ok: false,
      message: 'Network error while sending your request. Please call us directly.',
    };
  }
}

/**
 * Prefixes root-relative paths with the configured Astro base path.
 * @param {string} path
 * @param {string} [baseUrl='/']
 * @returns {string}
 */
export function withBase(path, baseUrl = '/') {
  if (!path || typeof path !== 'string') return '';
  if (!path.startsWith('/') || path.startsWith('//')) return path;

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  if (!cleanBase) return path;

  return `${cleanBase}${path}`;
}
