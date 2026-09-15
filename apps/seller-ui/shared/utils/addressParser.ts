export function parseAddressString(rawAddress?: string): StructuredAddress {
  // Default values
  const defaults: StructuredAddress = {
    street: 'Unspecified',
    city: 'Unspecified',
    state: 'Unspecified',
    country: 'Nigeria',
  };

  if (!rawAddress || !rawAddress.trim()) {
    return defaults;
  }

  // Clean and normalize
  const cleaned = rawAddress
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .trim();

  // Split by comma
  const parts = cleaned
    .split(',')
    .filter((p) => p.trim().length > 0)
    .map((p) => p.trim());

  let street = 'Unspecified';
  let city = 'Unspecified';
  let state = 'Unspecified';
  let country = 'Nigeria';
  let postalCode: string | undefined = undefined;

  // Known country names (case insensitive)
  const countryNames = [
    'nigeria',
    'ghana',
    'kenya',
    'south africa',
    'egypt',
    'morocco',
    'usa',
    'united states',
    'america',
    'canada',
    'uk',
    'united kingdom',
    'england',
    'france',
    'germany',
    'italy',
    'spain',
    'portugal',
    'netherlands',
    'belgium',
    'switzerland',
    'austria',
    'sweden',
    'norway',
    'denmark',
    'finland',
    'ireland',
    'china',
    'japan',
    'south korea',
    'india',
    'indonesia',
    'malaysia',
    'singapore',
    'thailand',
    'vietnam',
    'philippines',
    'pakistan',
    'bangladesh',
    'australia',
    'new zealand',
    'brazil',
    'argentina',
    'chile',
    'colombia',
    'peru',
    'venezuela',
    'uae',
    'united arab emirates',
    'saudi arabia',
    'israel',
    'turkey',
  ];

  // Known state/province names
  const stateNames = [
    // Nigerian states
    'fct',
    'abuja',
    'lagos',
    'rivers',
    'kano',
    'oyo',
    'kaduna',
    'enugu',
    'anambra',
    'imo',
    'akwa ibom',
    'benue',
    'plateau',
    'borno',
    'bauchi',
    'niger',
    'sokoto',
    'katsina',
    'jigawa',
    'yobe',
    'gombe',
    'adamawa',
    'taraba',
    'cross river',
    'delta',
    'edo',
    'ekiti',
    'kwara',
    'nassarawa',
    'ogun',
    'ondo',
    'osun',
    'zamfara',
    'kebbi',
    'kogi',
    'ebonyi',
    'bayelsa',

    // US States (abbreviations and full names)
    'dc',
    'alabama',
    'alaska',
    'arizona',
    'arkansas',
    'california',
    'colorado',
    'connecticut',
    'delaware',
    'florida',
    'georgia',
    'hawaii',
    'idaho',
    'illinois',
    'indiana',
    'iowa',
    'kansas',
    'kentucky',
    'louisiana',
    'maine',
    'maryland',
    'massachusetts',
    'michigan',
    'minnesota',
    'mississippi',
    'missouri',
    'montana',
    'nebraska',
    'nevada',
    'new hampshire',
    'new jersey',
    'new mexico',
    'new york',
    'north carolina',
    'north dakota',
    'ohio',
    'oklahoma',
    'oregon',
    'pennsylvania',
    'rhode island',
    'south carolina',
    'south dakota',
    'tennessee',
    'texas',
    'utah',
    'vermont',
    'virginia',
    'washington',
    'west virginia',
    'wisconsin',
    'wyoming',

    // Canadian provinces
    'alberta',
    'british columbia',
    'manitoba',
    'new brunswick',
    'newfoundland',
    'nova scotia',
    'ontario',
    'prince edward island',
    'quebec',
    'saskatchewan',
    'northwest territories',
    'nunavut',
    'yukon',

    // Australian states
    'new south wales',
    'victoria',
    'queensland',
    'western australia',
    'south australia',
    'tasmania',
    'australian capital territory',
    'northern territory',

    // Others
    'greater london',
    'western cape',
    'île-de-france',
    'sp',
    'ny',
    'ca',
    'tx',
  ];

  // Step 1: Extract postal code (must be at the end or near the end)
  if (parts.length > 0) {
    const lastIdx = parts.length - 1;
    const lastPart = parts[lastIdx];

    // Check if last part is a postal code
    const isPostalCode = (str: string): boolean => {
      const clean = str.replace(/\s/g, '');
      return (
        /^\d{4,7}$/.test(clean) || // 4-7 digits
        /^\d{5}(?:-\d{4})?$/.test(clean) || // US ZIP+4
        /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(clean) || // Canadian
        /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(clean) || // UK
        /^\d{3}-\d{3}$/.test(clean) || // Russian
        /^\d{5}-\d{3}$/.test(clean) || // Brazilian
        (/^[A-Z0-9\-]+$/i.test(clean) &&
          clean.length >= 4 &&
          clean.length <= 10)
      ); // Alphanumeric
    };

    if (isPostalCode(lastPart)) {
      postalCode = parts.pop();
    } else if (parts.length > 1) {
      // Check second-to-last part
      const secondLast = parts[parts.length - 1];
      if (isPostalCode(secondLast)) {
        postalCode = parts.splice(parts.length - 1, 1)[0];
      }
    }
  }

  // Step 2: Extract country (must be at the end or near the end)
  let countryIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toLowerCase();
    for (const countryName of countryNames) {
      if (
        part === countryName ||
        part.includes(countryName) ||
        countryName.includes(part)
      ) {
        countryIndex = i;
        break;
      }
    }
    if (countryIndex !== -1) break;
  }

  if (countryIndex !== -1) {
    country = parts.splice(countryIndex, 1)[0].trim();
    // Capitalize country name properly
    country = country
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Step 3: Handle special format "City-State" (e.g., "Abuja-FCT", "Ikeja-Lagos")
  const cityStateIndex = parts.findIndex(
    (p) => p.includes('-') || p.includes('/') || p.includes('–'),
  );

  if (cityStateIndex !== -1) {
    const combined = parts[cityStateIndex];
    const separator = combined.includes('-')
      ? '-'
      : combined.includes('/')
        ? '/'
        : '–';
    const [cityPart, statePart] = combined
      .split(separator)
      .map((s) => s.trim());

    if (cityPart && statePart) {
      city = cityPart;
      state = statePart;
      parts.splice(cityStateIndex, 1);
    }
  }

  // Step 4: Identify state if not already set
  if (state === 'Unspecified' && parts.length > 0) {
    // Check each part for state names
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      const stateMatch = stateNames.find(
        (sn) => part === sn || part.includes(sn) || sn.includes(part),
      );
      if (stateMatch) {
        state = parts[i];
        parts.splice(i, 1);
        break;
      }
    }
  }

  // Step 5: Identify city (usually the part before state or after street)
  if (city === 'Unspecified' && parts.length > 0) {
    // If we have state, city is usually before it
    // Or if we have only 1-2 parts left, the last one is likely city
    if (parts.length === 1) {
      city = parts.pop() || 'Unspecified';
    } else if (parts.length >= 2) {
      // Check if the last part looks like a city (not too long, no numbers)
      const lastPart = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];

      // If last part is short and doesn't have numbers, it's likely city
      if (lastPart.length < 30 && !/\d/.test(lastPart)) {
        city = parts.pop() || 'Unspecified';
      } else if (secondLast.length < 30 && !/\d/.test(secondLast)) {
        city = parts.pop() || 'Unspecified';
      } else {
        // Take the last part anyway
        city = parts.pop() || 'Unspecified';
      }
    }
  }

  // Step 6: All remaining parts form the street
  if (parts.length > 0) {
    street = parts.join(', ');
  }

  // Step 7: Edge case handling - if street is empty but we have city
  if (street === 'Unspecified' && city !== 'Unspecified') {
    street = city;
    city = 'Unspecified';
  }

  // Step 8: Handle specific test cases that fail
  // If street contains postal code-like patterns, fix it
  if (street && /^\d{4,7}$/.test(street.replace(/\s/g, ''))) {
    if (!postalCode) {
      postalCode = street;
      street = 'Unspecified';
    }
  }

  // If city looks like a postal code
  if (city && /^\d{4,7}$/.test(city.replace(/\s/g, ''))) {
    if (!postalCode) {
      postalCode = city;
      city = 'Unspecified';
    }
  }

  // If state is actually a country abbreviation
  if (state && state.length <= 3 && /^[A-Z]{2}$/i.test(state)) {
    const usStateMap: Record<string, string> = {
      AL: 'Alabama',
      AK: 'Alaska',
      AZ: 'Arizona',
      AR: 'Arkansas',
      CA: 'California',
      CO: 'Colorado',
      CT: 'Connecticut',
      DE: 'Delaware',
      FL: 'Florida',
      GA: 'Georgia',
      HI: 'Hawaii',
      ID: 'Idaho',
      IL: 'Illinois',
      IN: 'Indiana',
      IA: 'Iowa',
      KS: 'Kansas',
      KY: 'Kentucky',
      LA: 'Louisiana',
      ME: 'Maine',
      MD: 'Maryland',
      MA: 'Massachusetts',
      MI: 'Michigan',
      MN: 'Minnesota',
      MS: 'Mississippi',
      MO: 'Missouri',
      MT: 'Montana',
      NE: 'Nebraska',
      NV: 'Nevada',
      NH: 'New Hampshire',
      NJ: 'New Jersey',
      NM: 'New Mexico',
      NY: 'New York',
      NC: 'North Carolina',
      ND: 'North Dakota',
      OH: 'Ohio',
      OK: 'Oklahoma',
      OR: 'Oregon',
      PA: 'Pennsylvania',
      RI: 'Rhode Island',
      SC: 'South Carolina',
      SD: 'South Dakota',
      TN: 'Tennessee',
      TX: 'Texas',
      UT: 'Utah',
      VT: 'Vermont',
      VA: 'Virginia',
      WA: 'Washington',
      WV: 'West Virginia',
      WI: 'Wisconsin',
      WY: 'Wyoming',
      DC: 'District of Columbia',
    };

    const upperState = state.toUpperCase();
    if (usStateMap[upperState]) {
      state = usStateMap[upperState];
    }
  }

  // Clean up values
  const cleanValue = (value: string): string => {
    if (value === 'Unspecified' || !value) return 'Unspecified';
    return value.trim();
  };

  return {
    street: cleanValue(street),
    city: cleanValue(city),
    state: cleanValue(state),
    country: cleanValue(country) || 'Nigeria',
    ...(postalCode ? { postalCode: postalCode.trim() } : {}),
  };
}

// Test function
function testAddresses() {
  const testAddresses = [
    'No 50, Kuchiko Layout, Bwari, Abuja-FCT, Nigeria, 901101',
    '42 Lagos Street, Ikeja, Lagos, Nigeria, 100001',
    '15 Ahmadu Bello Way, Kaduna, Kaduna, Nigeria, 800001',
    '7B Oduduwa Road, GRA, Ikeja, Lagos, 101233, Nigeria',
    '1600 Pennsylvania Avenue NW, Washington, DC, 20500, USA',
    '221B Baker Street, London, Greater London, UK, NW1 6XE',
    '1 Apple Park Way, Cupertino, California, USA, 95014',
    '101 Rue de Rivoli, Paris, Île-de-France, France, 75001',
    'Alexanderplatz 1, Berlin, Germany, 10178',
    '1-1-1 Marunouchi, Chiyoda-ku, Tokyo, Japan, 100-0005',
    '101, 102 Avenue, Edmonton, Alberta, Canada, T5J 0A1',
    '110 Yonge Street, Toronto, Ontario, Canada, M5C 1T4',
    '1 Sydney Harbour Bridge, Sydney, New South Wales, Australia, 2000',
    '5 Collins Street, Melbourne, Victoria, Australia, 3000',
    'Avenida Paulista, 1578, São Paulo, SP, Brazil, 01310-200',
    '1 Adderley Street, Cape Town, Western Cape, South Africa, 8000',
    '42 Lagos Street, Ikeja, Lagos',
    'Kuchiko Layout, Bwari, Abuja-FCT',
    'No 50 Kuchiko Layout, Bwari, Abuja-FCT, 901101',
    '15 Ahmadu Bello Way, Kaduna, Kaduna',
    '123 Main Street',
    'New York, NY, 10001',
    'London, UK',
    '',
    '   ',
    'Single Street, 12345',
  ];

  testAddresses.forEach((address, index) => {
    const result = parseAddressString(address);
    console.log(`\nTest ${index + 1}: "${address}"`);
    console.log('Result:', JSON.stringify(result, null, 2));
  });
}

// Run tests
testAddresses();
