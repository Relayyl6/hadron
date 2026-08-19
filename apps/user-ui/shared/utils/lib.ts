import * as z from 'zod'

export const NAV_LINKS = [
  { label: 'Shops', href: '/shops' },
  { label: 'Offers', href: '/offers' },
  { label: 'Products', href: '/producs' },
  { label: 'Become a Seller', href: '/seller' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 1. DATA VALDATION CONTRACT SCHEMAS (ZOD)
// ─────────────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.email('Please provide a valid email identity.'),
  password: z.string().min(1, 'Password field tracking is required.'),
  rememberMe: z.boolean()
})

export const forgotPasswordSchema = z.object({
  email: z.email('Please provide a valid email identity.')
})

export const passwordResetSchema = z.object({
  newPassword: z.string().min(8, 'Password parameters must be at least 8 characters.'),
  confirmPassword: z.string().min(1, 'Confirmation field tracking is required.')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetFormValues = z.infer<typeof passwordResetSchema>

// ─────────────────────────────────────────────────────────────────────────────
// 1. DATA CONTRACTS & CONDITIONAL SCHEMAS (ZOD)
// ─────────────────────────────────────────────────────────────────────────────
export const registrationSchema = z.object({
  role: z.enum(['CUSTOMER', 'SELLER']),
  // Step 1: Core Credentials
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email identity.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  
  // Step 2 & 3: Conditional Profile Objects
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  gender: z.string(),
  
  businessName: z.string().optional(),
  businessType: z.string(),
  taxId: z.string().optional(),
  
  marketingConsent: z.boolean(),
  pushNotifications: z.boolean(),
}).superRefine((data, ctx) => {
  // Enforce customer profiles runtime validation shapes
  if (data.role === 'CUSTOMER') {
    if (!data.phoneNumber || data.phoneNumber.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['phoneNumber'], message: 'Phone number is required.' })
    }
    if (!data.address || data.address.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['address'], message: 'Physical address is required.' })
    }
  }
  // Enforce merchant profile runtime validation shapes
  if (data.role === 'SELLER') {
    if (!data.businessName || data.businessName.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['businessName'], message: 'Business name is required.' })
    }
    if (data.businessType === 'SOLE_PROPRIETOR' && (!data.taxId || data.taxId.trim() === '')) {
      ctx.addIssue({ code: 'custom', path: ['taxId'], message: 'Tax ID is required for registered corporations.' })
    }
  }
})

export const DEPARTMENTS_DATA = [
  {
    id: 'all-departments',
    label: 'All Departments',
    featured: { name: 'Sitewide Summer Clearance', href: '/categories/clearance', discount: 'Save up to 50%' },
    categories: [
      { name: 'Electronics & Gadgets', href: '/categories/electronics' },
      { name: 'Fashion & Apparel', href: '/categories/fashion' },
      { name: 'Home, Kitchen & Office', href: '/categories/home-kitchen' },
      { name: 'Beauty & Personal Care', href: '/categories/beauty' },
      { name: 'Sports & Outdoors', href: '/categories/sports' },
      { name: 'Toys & Games', href: '/categories/toys' },
      { name: 'Books & Media', href: '/categories/books' },
      { name: 'Automotive', href: '/categories/automotive' },
      { name: 'Health & Wellness', href: '/categories/health' },
      { name: 'Groceries & Food', href: '/categories/groceries' },
    ]
  },
  {
    id: 'electronics',
    label: 'Electronics & Gadgets',
    featured: { name: 'Smart Home Hubs', href: '/categories/electronics/smart-home', discount: 'Up to 20% off' },
    categories: [
      { 
        name: 'Computers & Laptops', 
        href: '/categories/electronics/computers',
        subcategories: [
          { 
            name: 'Laptops', 
            href: '/categories/electronics/computers/laptops',
            subcategories: [
              { name: 'Gaming Laptops', href: '/categories/electronics/computers/laptops/gaming' },
              { name: 'Ultrabooks', href: '/categories/electronics/computers/laptops/ultrabooks' },
              { name: 'Macbooks', href: '/categories/electronics/computers/laptops/macbooks' },
              { name: 'Chromebooks', href: '/categories/electronics/computers/laptops/chromebooks' },
              { name: '2-in-1 Laptops', href: '/categories/electronics/computers/laptops/2-in-1' },
              { name: 'Business Laptops', href: '/categories/electronics/computers/laptops/business' }
            ]
          },
          { 
            name: 'Desktops & Towers', 
            href: '/categories/electronics/computers/desktops',
            subcategories: [
              { name: 'Gaming Desktops', href: '/categories/electronics/computers/desktops/gaming' },
              { name: 'All-in-One PCs', href: '/categories/electronics/computers/desktops/all-in-one' },
              { name: 'Mini PCs', href: '/categories/electronics/computers/desktops/mini-pcs' },
              { name: 'Workstations', href: '/categories/electronics/computers/desktops/workstations' }
            ]
          },
          { 
            name: 'Monitors', 
            href: '/categories/electronics/computers/monitors',
            subcategories: [
              { name: 'Gaming Monitors', href: '/categories/electronics/computers/monitors/gaming' },
              { name: '4K Monitors', href: '/categories/electronics/computers/monitors/4k' },
              { name: 'Curved Monitors', href: '/categories/electronics/computers/monitors/curved' },
              { name: 'Portable Monitors', href: '/categories/electronics/computers/monitors/portable' }
            ]
          },
          { 
            name: 'Computer Accessories', 
            href: '/categories/electronics/computers/accessories',
            subcategories: [
              { name: 'Keyboards', href: '/categories/electronics/computers/accessories/keyboards' },
              { name: 'Mice & Trackpads', href: '/categories/electronics/computers/accessories/mice' },
              { name: 'Webcams', href: '/categories/electronics/computers/accessories/webcams' },
              { name: 'External Hard Drives', href: '/categories/electronics/computers/accessories/hard-drives' },
              { name: 'USB Hubs', href: '/categories/electronics/computers/accessories/usb-hubs' }
            ]
          }
        ]
      },
      { 
        name: 'Phones & Accessories', 
        href: '/categories/electronics/phones',
        subcategories: [
          { 
            name: 'Smartphones', 
            href: '/categories/electronics/phones/smartphones',
            subcategories: [
              { name: 'iPhone', href: '/categories/electronics/phones/smartphones/iphone' },
              { name: 'Samsung Galaxy', href: '/categories/electronics/phones/smartphones/galaxy' },
              { name: 'Google Pixel', href: '/categories/electronics/phones/smartphones/pixel' },
              { name: 'OnePlus', href: '/categories/electronics/phones/smartphones/oneplus' },
              { name: 'Budget Phones', href: '/categories/electronics/phones/smartphones/budget' }
            ]
          },
          { 
            name: 'Cases & Protection', 
            href: '/categories/electronics/phones/cases',
            subcategories: [
              { name: 'Rugged Cases', href: '/categories/electronics/phones/cases/rugged' },
              { name: 'Clear Cases', href: '/categories/electronics/phones/cases/clear' },
              { name: 'Leather Cases', href: '/categories/electronics/phones/cases/leather' },
              { name: 'Screen Protectors', href: '/categories/electronics/phones/cases/screen-protectors' }
            ]
          },
          { 
            name: 'Chargers & Cables', 
            href: '/categories/electronics/phones/chargers',
            subcategories: [
              { name: 'Wireless Chargers', href: '/categories/electronics/phones/chargers/wireless' },
              { name: 'USB-C Cables', href: '/categories/electronics/phones/chargers/usb-c' },
              { name: 'Car Chargers', href: '/categories/electronics/phones/chargers/car' },
              { name: 'Power Banks', href: '/categories/electronics/phones/chargers/power-banks' }
            ]
          },
          { 
            name: 'Phone Accessories', 
            href: '/categories/electronics/phones/accessories',
            subcategories: [
              { name: 'Phone Mounts', href: '/categories/electronics/phones/accessories/mounts' },
              { name: 'Selfie Sticks', href: '/categories/electronics/phones/accessories/selfie-sticks' },
              { name: 'Lens Attachments', href: '/categories/electronics/phones/accessories/lenses' }
            ]
          }
        ]
      },
      { 
        name: 'Audio & Headphones', 
        href: '/categories/electronics/audio',
        subcategories: [
          { 
            name: 'Wireless Earbuds', 
            href: '/categories/electronics/audio/earbuds',
            subcategories: [
              { name: 'AirPods', href: '/categories/electronics/audio/earbuds/airpods' },
              { name: 'Samsung Buds', href: '/categories/electronics/audio/earbuds/samsung' },
              { name: 'Sony Earbuds', href: '/categories/electronics/audio/earbuds/sony' },
              { name: 'Budget Earbuds', href: '/categories/electronics/audio/earbuds/budget' }
            ]
          },
          { 
            name: 'Over-Ear Headphones', 
            href: '/categories/electronics/audio/headphones',
            subcategories: [
              { name: 'Noise-Cancelling', href: '/categories/electronics/audio/headphones/noise-cancelling' },
              { name: 'Wireless', href: '/categories/electronics/audio/headphones/wireless' },
              { name: 'Gaming Headsets', href: '/categories/electronics/audio/headphones/gaming' },
              { name: 'Studio Monitors', href: '/categories/electronics/audio/headphones/studio' }
            ]
          },
          { 
            name: 'Bluetooth Speakers', 
            href: '/categories/electronics/audio/speakers',
            subcategories: [
              { name: 'Portable Speakers', href: '/categories/electronics/audio/speakers/portable' },
              { name: 'Smart Speakers', href: '/categories/electronics/audio/speakers/smart' },
              { name: 'Waterproof Speakers', href: '/categories/electronics/audio/speakers/waterproof' },
              { name: 'Party Speakers', href: '/categories/electronics/audio/speakers/party' }
            ]
          },
          { 
            name: 'Home Audio', 
            href: '/categories/electronics/audio/home',
            subcategories: [
              { name: 'Soundbars', href: '/categories/electronics/audio/home/soundbars' },
              { name: 'Stereo Systems', href: '/categories/electronics/audio/home/stereo' },
              { name: 'Subwoofers', href: '/categories/electronics/audio/home/subwoofers' }
            ]
          }
        ]
      },
      { 
        name: 'Cameras & Video', 
        href: '/categories/electronics/cameras',
        subcategories: [
          { 
            name: 'Digital Cameras', 
            href: '/categories/electronics/cameras/digital',
            subcategories: [
              { name: 'DSLR Cameras', href: '/categories/electronics/cameras/digital/dslr' },
              { name: 'Mirrorless Cameras', href: '/categories/electronics/cameras/digital/mirrorless' },
              { name: 'Point & Shoot', href: '/categories/electronics/cameras/digital/point-shoot' },
              { name: 'Action Cameras', href: '/categories/electronics/cameras/digital/action' }
            ]
          },
          { 
            name: 'Lenses & Filters', 
            href: '/categories/electronics/cameras/lenses',
            subcategories: [
              { name: 'Prime Lenses', href: '/categories/electronics/cameras/lenses/prime' },
              { name: 'Zoom Lenses', href: '/categories/electronics/cameras/lenses/zoom' },
              { name: 'Wide-Angle Lenses', href: '/categories/electronics/cameras/lenses/wide-angle' },
              { name: 'Camera Filters', href: '/categories/electronics/cameras/lenses/filters' }
            ]
          },
          { 
            name: 'Camera Accessories', 
            href: '/categories/electronics/cameras/accessories',
            subcategories: [
              { name: 'Tripods', href: '/categories/electronics/cameras/accessories/tripods' },
              { name: 'Camera Bags', href: '/categories/electronics/cameras/accessories/bags' },
              { name: 'Memory Cards', href: '/categories/electronics/cameras/accessories/memory-cards' },
              { name: 'Batteries', href: '/categories/electronics/cameras/accessories/batteries' }
            ]
          },
          { 
            name: 'Drones', 
            href: '/categories/electronics/cameras/drones',
            subcategories: [
              { name: 'Professional Drones', href: '/categories/electronics/cameras/drones/professional' },
              { name: 'Toy Drones', href: '/categories/electronics/cameras/drones/toy' },
              { name: 'Drone Accessories', href: '/categories/electronics/cameras/drones/accessories' }
            ]
          }
        ]
      },
      { 
        name: 'TVs & Home Theater', 
        href: '/categories/electronics/tvs',
        subcategories: [
          { 
            name: 'Smart TVs', 
            href: '/categories/electronics/tvs/smart',
            subcategories: [
              { name: 'LED TVs', href: '/categories/electronics/tvs/smart/led' },
              { name: 'OLED TVs', href: '/categories/electronics/tvs/smart/oled' },
              { name: 'QLED TVs', href: '/categories/electronics/tvs/smart/qled' },
              { name: '8K TVs', href: '/categories/electronics/tvs/smart/8k' }
            ]
          },
          { 
            name: 'TV Accessories', 
            href: '/categories/electronics/tvs/accessories',
            subcategories: [
              { name: 'TV Mounts', href: '/categories/electronics/tvs/accessories/mounts' },
              { name: 'Streaming Sticks', href: '/categories/electronics/tvs/accessories/streaming' },
              { name: 'HDMI Cables', href: '/categories/electronics/tvs/accessories/hdmi' }
            ]
          }
        ]
      },
      { 
        name: 'Smart Home', 
        href: '/categories/electronics/smart-home',
        subcategories: [
          { 
            name: 'Smart Speakers', 
            href: '/categories/electronics/smart-home/speakers',
            subcategories: [
              { name: 'Amazon Echo', href: '/categories/electronics/smart-home/speakers/echo' },
              { name: 'Google Home', href: '/categories/electronics/smart-home/speakers/google-home' },
              { name: 'Apple HomePod', href: '/categories/electronics/smart-home/speakers/homepod' }
            ]
          },
          { 
            name: 'Smart Lighting', 
            href: '/categories/electronics/smart-home/lighting',
            subcategories: [
              { name: 'Smart Bulbs', href: '/categories/electronics/smart-home/lighting/bulbs' },
              { name: 'Smart Strips', href: '/categories/electronics/smart-home/lighting/strips' },
              { name: 'Smart Switches', href: '/categories/electronics/smart-home/lighting/switches' }
            ]
          },
          { 
            name: 'Smart Security', 
            href: '/categories/electronics/smart-home/security',
            subcategories: [
              { name: 'Security Cameras', href: '/categories/electronics/smart-home/security/cameras' },
              { name: 'Video Doorbells', href: '/categories/electronics/smart-home/security/doorbells' },
              { name: 'Smart Locks', href: '/categories/electronics/smart-home/security/locks' }
            ]
          },
          { 
            name: 'Smart Plugs & Sensors', 
            href: '/categories/electronics/smart-home/plugs',
            subcategories: [
              { name: 'Smart Plugs', href: '/categories/electronics/smart-home/plugs/plugs' },
              { name: 'Motion Sensors', href: '/categories/electronics/smart-home/plugs/sensors' },
              { name: 'Temperature Sensors', href: '/categories/electronics/smart-home/plugs/temperature' }
            ]
          }
        ]
      },
      { 
        name: 'Gaming Consoles', 
        href: '/categories/electronics/gaming',
        subcategories: [
          { 
            name: 'Consoles', 
            href: '/categories/electronics/gaming/consoles',
            subcategories: [
              { name: 'PlayStation 5', href: '/categories/electronics/gaming/consoles/ps5' },
              { name: 'Xbox Series X/S', href: '/categories/electronics/gaming/consoles/xbox' },
              { name: 'Nintendo Switch', href: '/categories/electronics/gaming/consoles/switch' },
              { name: 'VR Headsets', href: '/categories/electronics/gaming/consoles/vr' }
            ]
          },
          { 
            name: 'Gaming Accessories', 
            href: '/categories/electronics/gaming/accessories',
            subcategories: [
              { name: 'Controllers', href: '/categories/electronics/gaming/accessories/controllers' },
              { name: 'Charging Stations', href: '/categories/electronics/gaming/accessories/charging' },
              { name: 'Game Cases', href: '/categories/electronics/gaming/accessories/cases' }
            ]
          }
        ]
      },
      { 
        name: 'Wearable Tech', 
        href: '/categories/electronics/wearables',
        subcategories: [
          { 
            name: 'Smartwatches', 
            href: '/categories/electronics/wearables/smartwatches',
            subcategories: [
              { name: 'Apple Watch', href: '/categories/electronics/wearables/smartwatches/apple' },
              { name: 'Samsung Watch', href: '/categories/electronics/wearables/smartwatches/samsung' },
              { name: 'Garmin', href: '/categories/electronics/wearables/smartwatches/garmin' }
            ]
          },
          { 
            name: 'Fitness Trackers', 
            href: '/categories/electronics/wearables/fitness',
            subcategories: [
              { name: 'Fitbit', href: '/categories/electronics/wearables/fitness/fitbit' },
              { name: 'Xiaomi Mi Band', href: '/categories/electronics/wearables/fitness/mi-band' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'fashion',
    label: 'Fashion & Apparel',
    featured: { name: 'Summer Collection', href: '/categories/fashion/summer-wear', discount: 'New Arrivals' },
    categories: [
      { 
        name: "Men's Clothing", 
        href: '/categories/fashion/mens',
        subcategories: [
          { 
            name: 'Tops & Shirts', 
            href: '/categories/fashion/mens/tops',
            subcategories: [
              { name: 'T-Shirts', href: '/categories/fashion/mens/tops/t-shirts' },
              { name: 'Casual Shirts', href: '/categories/fashion/mens/tops/casual-shirts' },
              { name: 'Polos', href: '/categories/fashion/mens/tops/polos' },
              { name: 'Button-Down Shirts', href: '/categories/fashion/mens/tops/button-down' },
              { name: 'Henley Shirts', href: '/categories/fashion/mens/tops/henley' },
              { name: 'Tank Tops', href: '/categories/fashion/mens/tops/tank-tops' }
            ]
          },
          { 
            name: 'Bottoms & Jeans', 
            href: '/categories/fashion/mens/bottoms',
            subcategories: [
              { name: 'Slim Fit Jeans', href: '/categories/fashion/mens/bottoms/slim-jeans' },
              { name: 'Straight Fit Jeans', href: '/categories/fashion/mens/bottoms/straight-jeans' },
              { name: 'Chinos', href: '/categories/fashion/mens/bottoms/chinos' },
              { name: 'Joggers', href: '/categories/fashion/mens/bottoms/joggers' },
              { name: 'Shorts', href: '/categories/fashion/mens/bottoms/shorts' },
              { name: 'Cargo Pants', href: '/categories/fashion/mens/bottoms/cargo' }
            ]
          },
          { 
            name: 'Outerwear & Jackets', 
            href: '/categories/fashion/mens/outerwear',
            subcategories: [
              { name: 'Denim Jackets', href: '/categories/fashion/mens/outerwear/denim' },
              { name: 'Leather Jackets', href: '/categories/fashion/mens/outerwear/leather' },
              { name: 'Bomber Jackets', href: '/categories/fashion/mens/outerwear/bomber' },
              { name: 'Raincoats', href: '/categories/fashion/mens/outerwear/raincoats' },
              { name: 'Windbreakers', href: '/categories/fashion/mens/outerwear/windbreakers' },
              { name: 'Blazers & Suits', href: '/categories/fashion/mens/outerwear/blazers' }
            ]
          },
          { 
            name: 'Activewear', 
            href: '/categories/fashion/mens/activewear',
            subcategories: [
              { name: 'Gym Shorts', href: '/categories/fashion/mens/activewear/shorts' },
              { name: 'Compression Wear', href: '/categories/fashion/mens/activewear/compression' },
              { name: 'Track Pants', href: '/categories/fashion/mens/activewear/track-pants' },
              { name: 'Hoodies', href: '/categories/fashion/mens/activewear/hoodies' }
            ]
          },
          { 
            name: 'Suits & Formal Wear', 
            href: '/categories/fashion/mens/suits',
            subcategories: [
              { name: 'Business Suits', href: '/categories/fashion/mens/suits/business' },
              { name: 'Tuxedos', href: '/categories/fashion/mens/suits/tuxedos' },
              { name: 'Vests', href: '/categories/fashion/mens/suits/vests' },
              { name: 'Dress Shirts', href: '/categories/fashion/mens/suits/dress-shirts' }
            ]
          },
          { 
            name: 'Underwear & Socks', 
            href: '/categories/fashion/mens/underwear',
            subcategories: [
              { name: 'Boxers', href: '/categories/fashion/mens/underwear/boxers' },
              { name: 'Briefs', href: '/categories/fashion/mens/underwear/briefs' },
              { name: 'Socks', href: '/categories/fashion/mens/underwear/socks' },
              { name: 'Thermals', href: '/categories/fashion/mens/underwear/thermals' }
            ]
          }
        ]
      },
      { 
        name: "Women's Clothing", 
        href: '/categories/fashion/womens',
        subcategories: [
          { 
            name: 'Dresses', 
            href: '/categories/fashion/womens/dresses',
            subcategories: [
              { name: 'Maxi Dresses', href: '/categories/fashion/womens/dresses/maxi' },
              { name: 'Midi Dresses', href: '/categories/fashion/womens/dresses/midi' },
              { name: 'Mini Dresses', href: '/categories/fashion/womens/dresses/mini' },
              { name: 'Evening Dresses', href: '/categories/fashion/womens/dresses/evening' },
              { name: 'Casual Dresses', href: '/categories/fashion/womens/dresses/casual' },
              { name: 'Formal Dresses', href: '/categories/fashion/womens/dresses/formal' }
            ]
          },
          { 
            name: 'Blouses & Tops', 
            href: '/categories/fashion/womens/tops',
            subcategories: [
              { name: 'T-Shirts', href: '/categories/fashion/womens/tops/t-shirts' },
              { name: 'Crop Tops', href: '/categories/fashion/womens/tops/crop' },
              { name: 'Tank Tops', href: '/categories/fashion/womens/tops/tank' },
              { name: 'Peplum Tops', href: '/categories/fashion/womens/tops/peplum' },
              { name: 'Sweaters', href: '/categories/fashion/womens/tops/sweaters' }
            ]
          },
          { 
            name: 'Activewear', 
            href: '/categories/fashion/womens/activewear',
            subcategories: [
              { name: 'Leggings', href: '/categories/fashion/womens/activewear/leggings' },
              { name: 'Sports Bras', href: '/categories/fashion/womens/activewear/sports-bras' },
              { name: 'Yoga Tops', href: '/categories/fashion/womens/activewear/yoga-tops' },
              { name: 'Athletic Shorts', href: '/categories/fashion/womens/activewear/shorts' },
              { name: 'Joggers', href: '/categories/fashion/womens/activewear/joggers' }
            ]
          },
          { 
            name: 'Bottoms', 
            href: '/categories/fashion/womens/bottoms',
            subcategories: [
              { name: 'Jeans', href: '/categories/fashion/womens/bottoms/jeans' },
              { name: 'Pants', href: '/categories/fashion/womens/bottoms/pants' },
              { name: 'Skirts', href: '/categories/fashion/womens/bottoms/skirts' },
              { name: 'Shorts', href: '/categories/fashion/womens/bottoms/shorts' },
              { name: 'Jumpsuits', href: '/categories/fashion/womens/bottoms/jumpsuits' }
            ]
          },
          { 
            name: 'Outerwear', 
            href: '/categories/fashion/womens/outerwear',
            subcategories: [
              { name: 'Coats', href: '/categories/fashion/womens/outerwear/coats' },
              { name: 'Jackets', href: '/categories/fashion/womens/outerwear/jackets' },
              { name: 'Cardigans', href: '/categories/fashion/womens/outerwear/cardigans' },
              { name: 'Blazers', href: '/categories/fashion/womens/outerwear/blazers' }
            ]
          },
          { 
            name: 'Intimates', 
            href: '/categories/fashion/womens/intimates',
            subcategories: [
              { name: 'Bras', href: '/categories/fashion/womens/intimates/bras' },
              { name: 'Panties', href: '/categories/fashion/womens/intimates/panties' },
              { name: 'Loungewear', href: '/categories/fashion/womens/intimates/loungewear' },
              { name: 'Sleepwear', href: '/categories/fashion/womens/intimates/sleepwear' }
            ]
          }
        ]
      },
      { 
        name: 'Footwear & Shoes', 
        href: '/categories/fashion/footwear',
        subcategories: [
          { 
            name: 'Sneakers', 
            href: '/categories/fashion/footwear/sneakers',
            subcategories: [
              { name: 'Running Shoes', href: '/categories/fashion/footwear/sneakers/running' },
              { name: 'Casual Sneakers', href: '/categories/fashion/footwear/sneakers/casual' },
              { name: 'High-Top Sneakers', href: '/categories/fashion/footwear/sneakers/high-top' },
              { name: 'Designer Sneakers', href: '/categories/fashion/footwear/sneakers/designer' }
            ]
          },
          { 
            name: 'Boots', 
            href: '/categories/fashion/footwear/boots',
            subcategories: [
              { name: 'Ankle Boots', href: '/categories/fashion/footwear/boots/ankle' },
              { name: 'Knee-High Boots', href: '/categories/fashion/footwear/boots/knee-high' },
              { name: 'Combat Boots', href: '/categories/fashion/footwear/boots/combat' },
              { name: 'Winter Boots', href: '/categories/fashion/footwear/boots/winter' },
              { name: 'Chelsea Boots', href: '/categories/fashion/footwear/boots/chelsea' }
            ]
          },
          { 
            name: 'Formal Shoes', 
            href: '/categories/fashion/footwear/formal',
            subcategories: [
              { name: 'Oxford Shoes', href: '/categories/fashion/footwear/formal/oxford' },
              { name: 'Loafers', href: '/categories/fashion/footwear/formal/loafers' },
              { name: 'Brogues', href: '/categories/fashion/footwear/formal/brogues' },
              { name: 'Pumps', href: '/categories/fashion/footwear/formal/pumps' },
              { name: 'Flats', href: '/categories/fashion/footwear/formal/flats' }
            ]
          },
          { 
            name: 'Sandals & Slides', 
            href: '/categories/fashion/footwear/sandals',
            subcategories: [
              { name: 'Flip Flops', href: '/categories/fashion/footwear/sandals/flip-flops' },
              { name: 'Slide Sandals', href: '/categories/fashion/footwear/sandals/slides' },
              { name: 'Strappy Sandals', href: '/categories/fashion/footwear/sandals/strappy' },
              { name: 'Athletic Sandals', href: '/categories/fashion/footwear/sandals/athletic' }
            ]
          },
          { 
            name: 'Shoe Accessories', 
            href: '/categories/fashion/footwear/accessories',
            subcategories: [
              { name: 'Shoe Insoles', href: '/categories/fashion/footwear/accessories/insoles' },
              { name: 'Shoe Laces', href: '/categories/fashion/footwear/accessories/laces' },
              { name: 'Shoe Care', href: '/categories/fashion/footwear/accessories/care' }
            ]
          }
        ]
      },
      { 
        name: 'Watches & Jewelry', 
        href: '/categories/fashion/accessories',
        subcategories: [
          { 
            name: 'Watches', 
            href: '/categories/fashion/accessories/watches',
            subcategories: [
              { name: 'Analog Watches', href: '/categories/fashion/accessories/watches/analog' },
              { name: 'Digital Watches', href: '/categories/fashion/accessories/watches/digital' },
              { name: 'Chronograph Watches', href: '/categories/fashion/accessories/watches/chronograph' },
              { name: 'Smartwatches', href: '/categories/fashion/accessories/watches/smart' },
              { name: 'Luxury Watches', href: '/categories/fashion/accessories/watches/luxury' }
            ]
          },
          { 
            name: 'Necklaces', 
            href: '/categories/fashion/accessories/necklaces',
            subcategories: [
              { name: 'Pendants', href: '/categories/fashion/accessories/necklaces/pendants' },
              { name: 'Chokers', href: '/categories/fashion/accessories/necklaces/chokers' },
              { name: 'Statement Necklaces', href: '/categories/fashion/accessories/necklaces/statement' },
              { name: 'Gold Chains', href: '/categories/fashion/accessories/necklaces/gold' }
            ]
          },
          { 
            name: 'Rings', 
            href: '/categories/fashion/accessories/rings',
            subcategories: [
              { name: 'Engagement Rings', href: '/categories/fashion/accessories/rings/engagement' },
              { name: 'Wedding Bands', href: '/categories/fashion/accessories/rings/wedding' },
              { name: 'Fashion Rings', href: '/categories/fashion/accessories/rings/fashion' },
              { name: 'Gemstone Rings', href: '/categories/fashion/accessories/rings/gemstone' }
            ]
          },
          { 
            name: 'Earrings', 
            href: '/categories/fashion/accessories/earrings',
            subcategories: [
              { name: 'Stud Earrings', href: '/categories/fashion/accessories/earrings/stud' },
              { name: 'Hoop Earrings', href: '/categories/fashion/accessories/earrings/hoop' },
              { name: 'Chandelier Earrings', href: '/categories/fashion/accessories/earrings/chandelier' },
              { name: 'Drop Earrings', href: '/categories/fashion/accessories/earrings/drop' }
            ]
          },
          { 
            name: 'Bracelets', 
            href: '/categories/fashion/accessories/bracelets',
            subcategories: [
              { name: 'Bangles', href: '/categories/fashion/accessories/bracelets/bangles' },
              { name: 'Chain Bracelets', href: '/categories/fashion/accessories/bracelets/chains' },
              { name: 'Leather Bracelets', href: '/categories/fashion/accessories/bracelets/leather' },
              { name: 'Beaded Bracelets', href: '/categories/fashion/accessories/bracelets/beaded' }
            ]
          },
          { 
            name: 'Handbags & Wallets', 
            href: '/categories/fashion/accessories/bags',
            subcategories: [
              { name: 'Tote Bags', href: '/categories/fashion/accessories/bags/totes' },
              { name: 'Crossbody Bags', href: '/categories/fashion/accessories/bags/crossbody' },
              { name: 'Clutches', href: '/categories/fashion/accessories/bags/clutches' },
              { name: 'Wallets', href: '/categories/fashion/accessories/bags/wallets' },
              { name: 'Backpacks', href: '/categories/fashion/accessories/bags/backpacks' }
            ]
          },
          { 
            name: 'Belts', 
            href: '/categories/fashion/accessories/belts',
            subcategories: [
              { name: 'Leather Belts', href: '/categories/fashion/accessories/belts/leather' },
              { name: 'Fabric Belts', href: '/categories/fashion/accessories/belts/fabric' },
              { name: 'Chain Belts', href: '/categories/fashion/accessories/belts/chain' },
              { name: 'Dress Belts', href: '/categories/fashion/accessories/belts/dress' }
            ]
          },
          { 
            name: 'Sunglasses', 
            href: '/categories/fashion/accessories/sunglasses',
            subcategories: [
              { name: 'Aviators', href: '/categories/fashion/accessories/sunglasses/aviators' },
              { name: 'Wayfarers', href: '/categories/fashion/accessories/sunglasses/wayfarers' },
              { name: 'Cat-Eye', href: '/categories/fashion/accessories/sunglasses/cat-eye' },
              { name: 'Round', href: '/categories/fashion/accessories/sunglasses/round' },
              { name: 'Sports Sunglasses', href: '/categories/fashion/accessories/sunglasses/sports' }
            ]
          },
          { 
            name: 'Hats & Headwear', 
            href: '/categories/fashion/accessories/hats',
            subcategories: [
              { name: 'Baseball Caps', href: '/categories/fashion/accessories/hats/baseball' },
              { name: 'Beanies', href: '/categories/fashion/accessories/hats/beanies' },
              { name: 'Fedoras', href: '/categories/fashion/accessories/hats/fedoras' },
              { name: 'Sun Hats', href: '/categories/fashion/accessories/hats/sun' },
              { name: 'Winter Hats', href: '/categories/fashion/accessories/hats/winter' }
            ]
          }
        ]
      },
      { 
        name: "Kids' Clothing", 
        href: '/categories/fashion/kids',
        subcategories: [
          { 
            name: "Boys' Clothing", 
            href: '/categories/fashion/kids/boys',
            subcategories: [
              { name: 'T-Shirts', href: '/categories/fashion/kids/boys/t-shirts' },
              { name: 'Pants & Jeans', href: '/categories/fashion/kids/boys/pants' },
              { name: 'Jackets', href: '/categories/fashion/kids/boys/jackets' },
              { name: 'Activewear', href: '/categories/fashion/kids/boys/activewear' }
            ]
          },
          { 
            name: "Girls' Clothing", 
            href: '/categories/fashion/kids/girls',
            subcategories: [
              { name: 'Dresses', href: '/categories/fashion/kids/girls/dresses' },
              { name: 'Tops', href: '/categories/fashion/kids/girls/tops' },
              { name: 'Leggings', href: '/categories/fashion/kids/girls/leggings' },
              { name: 'Jackets', href: '/categories/fashion/kids/girls/jackets' }
            ]
          },
          { 
            name: 'Infant & Toddler', 
            href: '/categories/fashion/kids/infant',
            subcategories: [
              { name: 'Onesies', href: '/categories/fashion/kids/infant/onesies' },
              { name: 'Sleepsuits', href: '/categories/fashion/kids/infant/sleepsuits' },
              { name: 'Toddler Sets', href: '/categories/fashion/kids/infant/sets' }
            ]
          },
          { 
            name: "Kids' Footwear", 
            href: '/categories/fashion/kids/footwear',
            subcategories: [
              { name: 'Sneakers', href: '/categories/fashion/kids/footwear/sneakers' },
              { name: 'Boots', href: '/categories/fashion/kids/footwear/boots' },
              { name: 'Sandals', href: '/categories/fashion/kids/footwear/sandals' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'home-kitchen',
    label: 'Home, Kitchen & Office',
    featured: { name: 'Ergonomic Office Chairs', href: '/categories/home-kitchen/furniture/office-chairs', discount: 'Free Shipping' },
    categories: [
      { 
        name: 'Furniture & Decor', 
        href: '/categories/home-kitchen/furniture',
        subcategories: [
          { 
            name: 'Living Room Furniture', 
            href: '/categories/home-kitchen/furniture/living-room',
            subcategories: [
              { name: 'Sofas & Couches', href: '/categories/home-kitchen/furniture/living-room/sofas' },
              { name: 'Coffee Tables', href: '/categories/home-kitchen/furniture/living-room/coffee-tables' },
              { name: 'TV Stands', href: '/categories/home-kitchen/furniture/living-room/tv-stands' },
              { name: 'Recliners', href: '/categories/home-kitchen/furniture/living-room/recliners' },
              { name: 'Accent Chairs', href: '/categories/home-kitchen/furniture/living-room/accent-chairs' }
            ]
          },
          { 
            name: 'Bedroom Furniture', 
            href: '/categories/home-kitchen/furniture/bedroom',
            subcategories: [
              { name: 'Beds & Mattresses', href: '/categories/home-kitchen/furniture/bedroom/beds' },
              { name: 'Dressers & Armoires', href: '/categories/home-kitchen/furniture/bedroom/dressers' },
              { name: 'Nightstands', href: '/categories/home-kitchen/furniture/bedroom/nightstands' },
              { name: 'Wardrobes', href: '/categories/home-kitchen/furniture/bedroom/wardrobes' }
            ]
          },
          { 
            name: 'Office Chairs & Desks', 
            href: '/categories/home-kitchen/furniture/office',
            subcategories: [
              { name: 'Ergonomic Chairs', href: '/categories/home-kitchen/furniture/office/ergonomic-chairs' },
              { name: 'Standing Desks', href: '/categories/home-kitchen/furniture/office/standing-desks' },
              { name: 'Office Desks', href: '/categories/home-kitchen/furniture/office/desks' },
              { name: 'Bookshelves', href: '/categories/home-kitchen/furniture/office/bookshelves' }
            ]
          },
          { 
            name: 'Home Decor', 
            href: '/categories/home-kitchen/furniture/decor',
            subcategories: [
              { name: 'Wall Art', href: '/categories/home-kitchen/furniture/decor/wall-art' },
              { name: 'Mirrors', href: '/categories/home-kitchen/furniture/decor/mirrors' },
              { name: 'Rugs', href: '/categories/home-kitchen/furniture/decor/rugs' },
              { name: 'Vases & Planters', href: '/categories/home-kitchen/furniture/decor/vases' },
              { name: 'Decorative Pillows', href: '/categories/home-kitchen/furniture/decor/pillows' }
            ]
          },
          { 
            name: 'Outdoor Furniture', 
            href: '/categories/home-kitchen/furniture/outdoor',
            subcategories: [
              { name: 'Patio Sets', href: '/categories/home-kitchen/furniture/outdoor/patio' },
              { name: 'Outdoor Chairs', href: '/categories/home-kitchen/furniture/outdoor/chairs' },
              { name: 'Grills & Smokers', href: '/categories/home-kitchen/furniture/outdoor/grills' },
              { name: 'Outdoor Decor', href: '/categories/home-kitchen/furniture/outdoor/decor' }
            ]
          }
        ]
      },
      { 
        name: 'Kitchen & Dining', 
        href: '/categories/home-kitchen/kitchen',
        subcategories: [
          { 
            name: 'Kitchen Appliances', 
            href: '/categories/home-kitchen/kitchen/appliances',
            subcategories: [
              { name: 'Coffee Makers', href: '/categories/home-kitchen/kitchen/appliances/coffee-makers' },
              { name: 'Blenders & Juicers', href: '/categories/home-kitchen/kitchen/appliances/blenders' },
              { name: 'Microwaves & Ovens', href: '/categories/home-kitchen/kitchen/appliances/microwaves' },
              { name: 'Air Fryers', href: '/categories/home-kitchen/kitchen/appliances/air-fryers' },
              { name: 'Slow Cookers', href: '/categories/home-kitchen/kitchen/appliances/slow-cookers' },
              { name: 'Stand Mixers', href: '/categories/home-kitchen/kitchen/appliances/mixers' },
              { name: 'Toasters', href: '/categories/home-kitchen/kitchen/appliances/toasters' },
              { name: 'Refrigerators', href: '/categories/home-kitchen/kitchen/appliances/refrigerators' }
            ]
          },
          { 
            name: 'Cookware', 
            href: '/categories/home-kitchen/kitchen/cookware',
            subcategories: [
              { name: 'Pots & Pans', href: '/categories/home-kitchen/kitchen/cookware/pots-pans' },
              { name: 'Bakeware', href: '/categories/home-kitchen/kitchen/cookware/bakeware' },
              { name: 'Knives & Cutlery', href: '/categories/home-kitchen/kitchen/cookware/knives' },
              { name: 'Cutting Boards', href: '/categories/home-kitchen/kitchen/cookware/cutting-boards' },
              { name: 'Cookware Sets', href: '/categories/home-kitchen/kitchen/cookware/sets' }
            ]
          },
          { 
            name: 'Tableware', 
            href: '/categories/home-kitchen/kitchen/tableware',
            subcategories: [
              { name: 'Dinnerware', href: '/categories/home-kitchen/kitchen/tableware/dinnerware' },
              { name: 'Glassware', href: '/categories/home-kitchen/kitchen/tableware/glassware' },
              { name: 'Flatware', href: '/categories/home-kitchen/kitchen/tableware/flatware' },
              { name: 'Serving Dishes', href: '/categories/home-kitchen/kitchen/tableware/serving' }
            ]
          },
          { 
            name: 'Food Storage', 
            href: '/categories/home-kitchen/kitchen/storage',
            subcategories: [
              { name: 'Containers', href: '/categories/home-kitchen/kitchen/storage/containers' },
              { name: 'Bottles & Jars', href: '/categories/home-kitchen/kitchen/storage/bottles' },
              { name: 'Food Wraps', href: '/categories/home-kitchen/kitchen/storage/wraps' }
            ]
          },
          { 
            name: 'Kitchen Linens', 
            href: '/categories/home-kitchen/kitchen/linens',
            subcategories: [
              { name: 'Aprons', href: '/categories/home-kitchen/kitchen/linens/aprons' },
              { name: 'Oven Mitts', href: '/categories/home-kitchen/kitchen/linens/oven-mitts' },
              { name: 'Kitchen Towels', href: '/categories/home-kitchen/kitchen/linens/towels' },
              { name: 'Tablecloths', href: '/categories/home-kitchen/kitchen/linens/tablecloths' }
            ]
          }
        ]
      },
      { 
        name: 'Bedding & Bath', 
        href: '/categories/home-kitchen/bedding-bath',
        subcategories: [
          { 
            name: 'Bedding', 
            href: '/categories/home-kitchen/bedding-bath/bedding',
            subcategories: [
              { name: 'Sheets', href: '/categories/home-kitchen/bedding-bath/bedding/sheets' },
              { name: 'Comforters', href: '/categories/home-kitchen/bedding-bath/bedding/comforters' },
              { name: 'Pillows', href: '/categories/home-kitchen/bedding-bath/bedding/pillows' },
              { name: 'Duvets', href: '/categories/home-kitchen/bedding-bath/bedding/duvets' },
              { name: 'Blankets & Throws', href: '/categories/home-kitchen/bedding-bath/bedding/blankets' },
              { name: 'Mattress Protectors', href: '/categories/home-kitchen/bedding-bath/bedding/mattress-protectors' }
            ]
          },
          { 
            name: 'Bath & Towels', 
            href: '/categories/home-kitchen/bedding-bath/bath',
            subcategories: [
              { name: 'Bath Towels', href: '/categories/home-kitchen/bedding-bath/bath/towels' },
              { name: 'Hand Towels', href: '/categories/home-kitchen/bedding-bath/bath/hand-towels' },
              { name: 'Bathroom Rugs', href: '/categories/home-kitchen/bedding-bath/bath/rugs' },
              { name: 'Shower Accessories', href: '/categories/home-kitchen/bedding-bath/bath/shower' },
              { name: 'Bathrobes', href: '/categories/home-kitchen/bedding-bath/bath/robes' }
            ]
          }
        ]
      },
      { 
        name: 'Lighting & Smart Home', 
        href: '/categories/home-kitchen/lighting',
        subcategories: [
          { 
            name: 'Lighting', 
            href: '/categories/home-kitchen/lighting/fixtures',
            subcategories: [
              { name: 'Ceiling Lights', href: '/categories/home-kitchen/lighting/fixtures/ceiling' },
              { name: 'Floor Lamps', href: '/categories/home-kitchen/lighting/fixtures/floor' },
              { name: 'Table Lamps', href: '/categories/home-kitchen/lighting/fixtures/table' },
              { name: 'Outdoor Lighting', href: '/categories/home-kitchen/lighting/fixtures/outdoor' }
            ]
          },
          { 
            name: 'Smart Lighting', 
            href: '/categories/home-kitchen/lighting/smart',
            subcategories: [
              { name: 'Smart Bulbs', href: '/categories/home-kitchen/lighting/smart/bulbs' },
              { name: 'Smart Strips', href: '/categories/home-kitchen/lighting/smart/strips' },
              { name: 'Smart Switches', href: '/categories/home-kitchen/lighting/smart/switches' }
            ]
          }
        ]
      },
      { 
        name: 'Cleaning & Household', 
        href: '/categories/home-kitchen/cleaning',
        subcategories: [
          { 
            name: 'Cleaning Tools', 
            href: '/categories/home-kitchen/cleaning/tools',
            subcategories: [
              { name: 'Brooms & Mops', href: '/categories/home-kitchen/cleaning/tools/brooms' },
              { name: 'Vacuums', href: '/categories/home-kitchen/cleaning/tools/vacuums' },
              { name: 'Dusters', href: '/categories/home-kitchen/cleaning/tools/dusters' },
              { name: 'Robot Vacuums', href: '/categories/home-kitchen/cleaning/tools/robot-vacuums' }
            ]
          },
          { 
            name: 'Laundry', 
            href: '/categories/home-kitchen/cleaning/laundry',
            subcategories: [
              { name: 'Laundry Detergent', href: '/categories/home-kitchen/cleaning/laundry/detergent' },
              { name: 'Fabric Softener', href: '/categories/home-kitchen/cleaning/laundry/softener' },
              { name: 'Stain Removers', href: '/categories/home-kitchen/cleaning/laundry/stain-removers' },
              { name: 'Laundry Baskets', href: '/categories/home-kitchen/cleaning/laundry/baskets' }
            ]
          },
          { 
            name: 'Storage & Organization', 
            href: '/categories/home-kitchen/cleaning/storage',
            subcategories: [
              { name: 'Shelving', href: '/categories/home-kitchen/cleaning/storage/shelving' },
              { name: 'Storage Bins', href: '/categories/home-kitchen/cleaning/storage/bins' },
              { name: 'Closet Organizers', href: '/categories/home-kitchen/cleaning/storage/closet' },
              { name: 'Garage Storage', href: '/categories/home-kitchen/cleaning/storage/garage' }
            ]
          }
        ]
      },
      { 
        name: 'Home Improvement', 
        href: '/categories/home-kitchen/improvement',
        subcategories: [
          { 
            name: 'Hardware & Tools', 
            href: '/categories/home-kitchen/improvement/tools',
            subcategories: [
              { name: 'Drills', href: '/categories/home-kitchen/improvement/tools/drills' },
              { name: 'Wrenches', href: '/categories/home-kitchen/improvement/tools/wrenches' },
              { name: 'Screwdrivers', href: '/categories/home-kitchen/improvement/tools/screwdrivers' },
              { name: 'Tool Sets', href: '/categories/home-kitchen/improvement/tools/sets' }
            ]
          },
          { 
            name: 'Painting', 
            href: '/categories/home-kitchen/improvement/painting',
            subcategories: [
              { name: 'Paint', href: '/categories/home-kitchen/improvement/painting/paint' },
              { name: 'Brushes & Rollers', href: '/categories/home-kitchen/improvement/painting/brushes' },
              { name: 'Tape & Dropcloths', href: '/categories/home-kitchen/improvement/painting/tape' }
            ]
          },
          { 
            name: 'Plumbing', 
            href: '/categories/home-kitchen/improvement/plumbing',
            subcategories: [
              { name: 'Faucets', href: '/categories/home-kitchen/improvement/plumbing/faucets' },
              { name: 'Showerheads', href: '/categories/home-kitchen/improvement/plumbing/showerheads' },
              { name: 'Plumbing Tools', href: '/categories/home-kitchen/improvement/plumbing/tools' }
            ]
          },
          { 
            name: 'Electrical', 
            href: '/categories/home-kitchen/improvement/electrical',
            subcategories: [
              { name: 'Light Bulbs', href: '/categories/home-kitchen/improvement/electrical/bulbs' },
              { name: 'Extension Cords', href: '/categories/home-kitchen/improvement/electrical/cords' },
              { name: 'Switches & Outlets', href: '/categories/home-kitchen/improvement/electrical/switches' }
            ]
          }
        ]
      },
      { 
        name: 'Garden & Lawn', 
        href: '/categories/home-kitchen/garden',
        subcategories: [
          { 
            name: 'Gardening Tools', 
            href: '/categories/home-kitchen/garden/tools',
            subcategories: [
              { name: 'Shovels & Spades', href: '/categories/home-kitchen/garden/tools/shovels' },
              { name: 'Pruners', href: '/categories/home-kitchen/garden/tools/pruners' },
              { name: 'Hoses & Nozzles', href: '/categories/home-kitchen/garden/tools/hoses' },
              { name: 'Watering Cans', href: '/categories/home-kitchen/garden/tools/watering' }
            ]
          },
          { 
            name: 'Plants & Seeds', 
            href: '/categories/home-kitchen/garden/plants',
            subcategories: [
              { name: 'Flowers', href: '/categories/home-kitchen/garden/plants/flowers' },
              { name: 'Vegetables', href: '/categories/home-kitchen/garden/plants/vegetables' },
              { name: 'Herbs', href: '/categories/home-kitchen/garden/plants/herbs' },
              { name: 'Tree Seeds', href: '/categories/home-kitchen/garden/plants/trees' }
            ]
          },
          { 
            name: 'Lawn Care', 
            href: '/categories/home-kitchen/garden/lawn',
            subcategories: [
              { name: 'Lawn Mowers', href: '/categories/home-kitchen/garden/lawn/mowers' },
              { name: 'Fertilizers', href: '/categories/home-kitchen/garden/lawn/fertilizers' },
              { name: 'Weed Control', href: '/categories/home-kitchen/garden/lawn/weed-control' },
              { name: 'Sprinklers', href: '/categories/home-kitchen/garden/lawn/sprinklers' }
            ]
          },
          { 
            name: 'Outdoor Decor', 
            href: '/categories/home-kitchen/garden/decor',
            subcategories: [
              { name: 'Garden Statues', href: '/categories/home-kitchen/garden/decor/statues' },
              { name: 'Outdoor Lights', href: '/categories/home-kitchen/garden/decor/lights' },
              { name: 'Bird Feeders', href: '/categories/home-kitchen/garden/decor/feeders' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'beauty',
    label: 'Beauty & Personal Care',
    featured: { name: 'Summer Skincare Essentials', href: '/categories/beauty/skincare', discount: 'Buy 2 Get 1 Free' },
    categories: [
      { 
        name: 'Skincare', 
        href: '/categories/beauty/skincare',
        subcategories: [
          { 
            name: 'Cleansers', 
            href: '/categories/beauty/skincare/cleansers',
            subcategories: [
              { name: 'Face Wash', href: '/categories/beauty/skincare/cleansers/face-wash' },
              { name: 'Micellar Water', href: '/categories/beauty/skincare/cleansers/micellar' },
              { name: 'Cleansing Oils', href: '/categories/beauty/skincare/cleansers/oils' },
              { name: 'Exfoliators', href: '/categories/beauty/skincare/cleansers/exfoliators' }
            ]
          },
          { 
            name: 'Moisturizers', 
            href: '/categories/beauty/skincare/moisturizers',
            subcategories: [
              { name: 'Face Creams', href: '/categories/beauty/skincare/moisturizers/creams' },
              { name: 'Gel Moisturizers', href: '/categories/beauty/skincare/moisturizers/gels' },
              { name: 'Night Creams', href: '/categories/beauty/skincare/moisturizers/night' },
              { name: 'Body Lotions', href: '/categories/beauty/skincare/moisturizers/lotions' }
            ]
          },
          { 
            name: 'Serums & Treatments', 
            href: '/categories/beauty/skincare/serums',
            subcategories: [
              { name: 'Vitamin C', href: '/categories/beauty/skincare/serums/vitamin-c' },
              { name: 'Hyaluronic Acid', href: '/categories/beauty/skincare/serums/hyaluronic' },
              { name: 'Retinol', href: '/categories/beauty/skincare/serums/retinol' },
              { name: 'Facial Oils', href: '/categories/beauty/skincare/serums/oils' }
            ]
          },
          { 
            name: 'Sunscreen', 
            href: '/categories/beauty/skincare/sunscreen',
            subcategories: [
              { name: 'Face Sunscreen', href: '/categories/beauty/skincare/sunscreen/face' },
              { name: 'Body Sunscreen', href: '/categories/beauty/skincare/sunscreen/body' },
              { name: 'Mineral Sunscreen', href: '/categories/beauty/skincare/sunscreen/mineral' },
              { name: 'Sport Sunscreen', href: '/categories/beauty/skincare/sunscreen/sport' }
            ]
          },
          { 
            name: 'Face Masks & Peels', 
            href: '/categories/beauty/skincare/masks',
            subcategories: [
              { name: 'Sheet Masks', href: '/categories/beauty/skincare/masks/sheet' },
              { name: 'Clay Masks', href: '/categories/beauty/skincare/masks/clay' },
              { name: 'Exfoliating Peels', href: '/categories/beauty/skincare/masks/peels' },
              { name: 'Overnight Masks', href: '/categories/beauty/skincare/masks/overnight' }
            ]
          }
        ]
      },
      { 
        name: 'Makeup', 
        href: '/categories/beauty/makeup',
        subcategories: [
          { 
            name: 'Foundation', 
            href: '/categories/beauty/makeup/foundation',
            subcategories: [
              { name: 'Liquid Foundation', href: '/categories/beauty/makeup/foundation/liquid' },
              { name: 'Powder Foundation', href: '/categories/beauty/makeup/foundation/powder' },
              { name: 'BB & CC Creams', href: '/categories/beauty/makeup/foundation/bb-cream' },
              { name: 'Concealer', href: '/categories/beauty/makeup/foundation/concealer' }
            ]
          },
          { 
            name: 'Eyes', 
            href: '/categories/beauty/makeup/eyes',
            subcategories: [
              { name: 'Eyeshadow Palettes', href: '/categories/beauty/makeup/eyes/palettes' },
              { name: 'Eyeliner', href: '/categories/beauty/makeup/eyes/eyeliner' },
              { name: 'Mascara', href: '/categories/beauty/makeup/eyes/mascara' },
              { name: 'Eyebrow Products', href: '/categories/beauty/makeup/eyes/brows' }
            ]
          },
          { 
            name: 'Lips', 
            href: '/categories/beauty/makeup/lips',
            subcategories: [
              { name: 'Lipstick', href: '/categories/beauty/makeup/lips/lipstick' },
              { name: 'Lip Gloss', href: '/categories/beauty/makeup/lips/gloss' },
              { name: 'Lip Liner', href: '/categories/beauty/makeup/lips/liner' },
              { name: 'Lip Balm', href: '/categories/beauty/makeup/lips/balm' }
            ]
          },
          { 
            name: 'Face', 
            href: '/categories/beauty/makeup/face',
            subcategories: [
              { name: 'Blush', href: '/categories/beauty/makeup/face/blush' },
              { name: 'Bronzer', href: '/categories/beauty/makeup/face/bronzer' },
              { name: 'Highlighter', href: '/categories/beauty/makeup/face/highlighter' },
              { name: 'Setting Powder', href: '/categories/beauty/makeup/face/powder' }
            ]
          },
          { 
            name: 'Makeup Tools', 
            href: '/categories/beauty/makeup/tools',
            subcategories: [
              { name: 'Brushes', href: '/categories/beauty/makeup/tools/brushes' },
              { name: 'Sponges', href: '/categories/beauty/makeup/tools/sponges' },
              { name: 'Mirrors', href: '/categories/beauty/makeup/tools/mirrors' },
              { name: 'Makeup Bags', href: '/categories/beauty/makeup/tools/bags' }
            ]
          }
        ]
      },
      { 
        name: 'Hair Care', 
        href: '/categories/beauty/hair',
        subcategories: [
          { 
            name: 'Shampoo & Conditioner', 
            href: '/categories/beauty/hair/shampoo',
            subcategories: [
              { name: 'Shampoo', href: '/categories/beauty/hair/shampoo/shampoo' },
              { name: 'Conditioner', href: '/categories/beauty/hair/shampoo/conditioner' },
              { name: '2-in-1', href: '/categories/beauty/hair/shampoo/2-in-1' },
              { name: 'Dry Shampoo', href: '/categories/beauty/hair/shampoo/dry' }
            ]
          },
          { 
            name: 'Hair Styling', 
            href: '/categories/beauty/hair/styling',
            subcategories: [
              { name: 'Hair Gels', href: '/categories/beauty/hair/styling/gels' },
              { name: 'Mousses', href: '/categories/beauty/hair/styling/mousses' },
              { name: 'Hairsprays', href: '/categories/beauty/hair/styling/hairsprays' },
              { name: 'Sea Salt Sprays', href: '/categories/beauty/hair/styling/salt-sprays' }
            ]
          },
          { 
            name: 'Hair Tools', 
            href: '/categories/beauty/hair/tools',
            subcategories: [
              { name: 'Hair Dryers', href: '/categories/beauty/hair/tools/dryers' },
              { name: 'Straighteners', href: '/categories/beauty/hair/tools/straighteners' },
              { name: 'Curling Irons', href: '/categories/beauty/hair/tools/curling-irons' },
              { name: 'Hair Brushes', href: '/categories/beauty/hair/tools/brushes' }
            ]
          },
          { 
            name: 'Hair Color', 
            href: '/categories/beauty/hair/color',
            subcategories: [
              { name: 'Hair Dye', href: '/categories/beauty/hair/color/dye' },
              { name: 'Highlighting Kits', href: '/categories/beauty/hair/color/highlights' },
              { name: 'Root Touch-Up', href: '/categories/beauty/hair/color/root' }
            ]
          }
        ]
      },
      { 
        name: 'Fragrance', 
        href: '/categories/beauty/fragrance',
        subcategories: [
          { 
            name: 'Perfumes', 
            href: '/categories/beauty/fragrance/perfumes',
            subcategories: [
              { name: 'Women\'s Perfume', href: '/categories/beauty/fragrance/perfumes/womens' },
              { name: 'Men\'s Cologne', href: '/categories/beauty/fragrance/perfumes/mens' },
              { name: 'Unisex Fragrance', href: '/categories/beauty/fragrance/perfumes/unisex' }
            ]
          },
          { 
            name: 'Body Sprays', 
            href: '/categories/beauty/fragrance/body-sprays',
            subcategories: [
              { name: 'Body Mists', href: '/categories/beauty/fragrance/body-sprays/mists' },
              { name: 'Deodorant', href: '/categories/beauty/fragrance/body-sprays/deodorant' },
              { name: 'Travel Size', href: '/categories/beauty/fragrance/body-sprays/travel' }
            ]
          }
        ]
      },
      { 
        name: 'Personal Care', 
        href: '/categories/beauty/personal-care',
        subcategories: [
          { 
            name: 'Oral Care', 
            href: '/categories/beauty/personal-care/oral',
            subcategories: [
              { name: 'Toothpaste', href: '/categories/beauty/personal-care/oral/toothpaste' },
              { name: 'Toothbrushes', href: '/categories/beauty/personal-care/oral/toothbrushes' },
              { name: 'Mouthwash', href: '/categories/beauty/personal-care/oral/mouthwash' },
              { name: 'Whitening Kits', href: '/categories/beauty/personal-care/oral/whitening' }
            ]
          },
          { 
            name: 'Bath & Body', 
            href: '/categories/beauty/personal-care/bath',
            subcategories: [
              { name: 'Body Wash', href: '/categories/beauty/personal-care/bath/body-wash' },
              { name: 'Body Scrubs', href: '/categories/beauty/personal-care/bath/scrubs' },
              { name: 'Bath Bombs', href: '/categories/beauty/personal-care/bath/bombs' },
              { name: 'Shower Gels', href: '/categories/beauty/personal-care/bath/shower-gels' }
            ]
          },
          { 
            name: 'Shaving & Grooming', 
            href: '/categories/beauty/personal-care/shaving',
            subcategories: [
              { name: 'Razors', href: '/categories/beauty/personal-care/shaving/razors' },
              { name: 'Shaving Creams', href: '/categories/beauty/personal-care/shaving/creams' },
              { name: 'After-Shave', href: '/categories/beauty/personal-care/shaving/after-shave' },
              { name: 'Trimmers', href: '/categories/beauty/personal-care/shaving/trimmers' }
            ]
          },
          { 
            name: 'Feminine Care', 
            href: '/categories/beauty/personal-care/feminine',
            subcategories: [
              { name: 'Pads & Liners', href: '/categories/beauty/personal-care/feminine/pads' },
              { name: 'Tampons', href: '/categories/beauty/personal-care/feminine/tampons' },
              { name: 'Cups', href: '/categories/beauty/personal-care/feminine/cups' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'sports',
    label: 'Sports & Outdoors',
    featured: { name: 'Summer Fitness Gear', href: '/categories/sports/fitness', discount: 'Up to 30% off' },
    categories: [
      { 
        name: 'Fitness Equipment', 
        href: '/categories/sports/fitness',
        subcategories: [
          { 
            name: 'Cardio Equipment', 
            href: '/categories/sports/fitness/cardio',
            subcategories: [
              { name: 'Treadmills', href: '/categories/sports/fitness/cardio/treadmills' },
              { name: 'Exercise Bikes', href: '/categories/sports/fitness/cardio/bikes' },
              { name: 'Ellipticals', href: '/categories/sports/fitness/cardio/ellipticals' },
              { name: 'Rowing Machines', href: '/categories/sports/fitness/cardio/rowing' }
            ]
          },
          { 
            name: 'Weights', 
            href: '/categories/sports/fitness/weights',
            subcategories: [
              { name: 'Dumbbells', href: '/categories/sports/fitness/weights/dumbbells' },
              { name: 'Barbells', href: '/categories/sports/fitness/weights/barbells' },
              { name: 'Kettlebells', href: '/categories/sports/fitness/weights/kettlebells' },
              { name: 'Weight Benches', href: '/categories/sports/fitness/weights/benches' }
            ]
          },
          { 
            name: 'Yoga & Pilates', 
            href: '/categories/sports/fitness/yoga',
            subcategories: [
              { name: 'Yoga Mats', href: '/categories/sports/fitness/yoga/mats' },
              { name: 'Yoga Blocks', href: '/categories/sports/fitness/yoga/blocks' },
              { name: 'Resistance Bands', href: '/categories/sports/fitness/yoga/bands' },
              { name: 'Pilates Rings', href: '/categories/sports/fitness/yoga/rings' }
            ]
          },
          { 
            name: 'Fitness Accessories', 
            href: '/categories/sports/fitness/accessories',
            subcategories: [
              { name: 'Water Bottles', href: '/categories/sports/fitness/accessories/bottles' },
              { name: 'Fitness Trackers', href: '/categories/sports/fitness/accessories/trackers' },
              { name: 'Gym Bags', href: '/categories/sports/fitness/accessories/bags' },
              { name: 'Jump Ropes', href: '/categories/sports/fitness/accessories/jump-ropes' }
            ]
          }
        ]
      },
      { 
        name: 'Outdoor Recreation', 
        href: '/categories/sports/outdoor',
        subcategories: [
          { 
            name: 'Camping', 
            href: '/categories/sports/outdoor/camping',
            subcategories: [
              { name: 'Tents', href: '/categories/sports/outdoor/camping/tents' },
              { name: 'Sleeping Bags', href: '/categories/sports/outdoor/camping/sleeping-bags' },
              { name: 'Camping Chairs', href: '/categories/sports/outdoor/camping/chairs' },
              { name: 'Coolers', href: '/categories/sports/outdoor/camping/coolers' },
              { name: 'Flashlights', href: '/categories/sports/outdoor/camping/flashlights' },
              { name: 'Camping Stoves', href: '/categories/sports/outdoor/camping/stoves' }
            ]
          },
          { 
            name: 'Hiking', 
            href: '/categories/sports/outdoor/hiking',
            subcategories: [
              { name: 'Hiking Boots', href: '/categories/sports/outdoor/hiking/boots' },
              { name: 'Backpacks', href: '/categories/sports/outdoor/hiking/backpacks' },
              { name: 'Trekking Poles', href: '/categories/sports/outdoor/hiking/poles' },
              { name: 'Hydration Packs', href: '/categories/sports/outdoor/hiking/hydration' }
            ]
          },
          { 
            name: 'Fishing', 
            href: '/categories/sports/outdoor/fishing',
            subcategories: [
              { name: 'Fishing Rods', href: '/categories/sports/outdoor/fishing/rods' },
              { name: 'Fishing Reels', href: '/categories/sports/outdoor/fishing/reels' },
              { name: 'Fishing Lures', href: '/categories/sports/outdoor/fishing/lures' },
              { name: 'Fishing Line', href: '/categories/sports/outdoor/fishing/line' }
            ]
          },
          { 
            name: 'Water Sports', 
            href: '/categories/sports/outdoor/water',
            subcategories: [
              { name: 'Kayaks', href: '/categories/sports/outdoor/water/kayaks' },
              { name: 'Paddleboards', href: '/categories/sports/outdoor/water/paddleboards' },
              { name: 'Life Jackets', href: '/categories/sports/outdoor/water/jackets' },
              { name: 'Snorkeling Gear', href: '/categories/sports/outdoor/water/snorkeling' }
            ]
          },
          { 
            name: 'Cycling', 
            href: '/categories/sports/outdoor/cycling',
            subcategories: [
              { name: 'Road Bikes', href: '/categories/sports/outdoor/cycling/road' },
              { name: 'Mountain Bikes', href: '/categories/sports/outdoor/cycling/mountain' },
              { name: 'Helmets', href: '/categories/sports/outdoor/cycling/helmets' },
              { name: 'Bike Accessories', href: '/categories/sports/outdoor/cycling/accessories' }
            ]
          }
        ]
      },
      { 
        name: 'Team Sports', 
        href: '/categories/sports/team',
        subcategories: [
          { 
            name: 'Basketball', 
            href: '/categories/sports/team/basketball',
            subcategories: [
              { name: 'Basketballs', href: '/categories/sports/team/basketball/balls' },
              { name: 'Hoops', href: '/categories/sports/team/basketball/hoops' },
              { name: 'Jerseys', href: '/categories/sports/team/basketball/jerseys' }
            ]
          },
          { 
            name: 'Soccer', 
            href: '/categories/sports/team/soccer',
            subcategories: [
              { name: 'Soccer Balls', href: '/categories/sports/team/soccer/balls' },
              { name: 'Cleats', href: '/categories/sports/team/soccer/cleats' },
              { name: 'Shin Guards', href: '/categories/sports/team/soccer/shin-guards' },
              { name: 'Goal Nets', href: '/categories/sports/team/soccer/goals' }
            ]
          },
          { 
            name: 'Baseball', 
            href: '/categories/sports/team/baseball',
            subcategories: [
              { name: 'Baseballs', href: '/categories/sports/team/baseball/balls' },
              { name: 'Bats', href: '/categories/sports/team/baseball/bats' },
              { name: 'Gloves', href: '/categories/sports/team/baseball/gloves' }
            ]
          },
          { 
            name: 'Volleyball', 
            href: '/categories/sports/team/volleyball',
            subcategories: [
              { name: 'Volleyballs', href: '/categories/sports/team/volleyball/balls' },
              { name: 'Nets', href: '/categories/sports/team/volleyball/nets' },
              { name: 'Knee Pads', href: '/categories/sports/team/volleyball/knee-pads' }
            ]
          }
        ]
      },
      { 
        name: 'Fan Gear', 
        href: '/categories/sports/fan-gear',
        subcategories: [
          { 
            name: 'Jerseys & Apparel', 
            href: '/categories/sports/fan-gear/jerseys',
            subcategories: [
              { name: 'Football Jerseys', href: '/categories/sports/fan-gear/jerseys/football' },
              { name: 'Basketball Jerseys', href: '/categories/sports/fan-gear/jerseys/basketball' },
              { name: 'Soccer Jerseys', href: '/categories/sports/fan-gear/jerseys/soccer' }
            ]
          },
          { 
            name: 'Collectibles', 
            href: '/categories/sports/fan-gear/collectibles',
            subcategories: [
              { name: 'Cards', href: '/categories/sports/fan-gear/collectibles/cards' },
              { name: 'Memorabilia', href: '/categories/sports/fan-gear/collectibles/memorabilia' },
              { name: 'Autographs', href: '/categories/sports/fan-gear/collectibles/autographs' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'toys',
    label: 'Toys & Games',
    featured: { name: 'Summer Toy Extravaganza', href: '/categories/toys/summer', discount: 'Buy 1 Get 1 50% Off' },
    categories: [
      { 
        name: 'Action Figures', 
        href: '/categories/toys/action-figures',
        subcategories: [
          { name: 'Superheroes', href: '/categories/toys/action-figures/superheroes' },
          { name: 'Movie Characters', href: '/categories/toys/action-figures/movies' },
          { name: 'Anime Figures', href: '/categories/toys/action-figures/anime' },
          { name: 'Collectibles', href: '/categories/toys/action-figures/collectibles' }
        ]
      },
      { 
        name: 'Board Games', 
        href: '/categories/toys/board-games',
        subcategories: [
          { name: 'Strategy Games', href: '/categories/toys/board-games/strategy' },
          { name: 'Party Games', href: '/categories/toys/board-games/party' },
          { name: 'Family Games', href: '/categories/toys/board-games/family' },
          { name: 'Card Games', href: '/categories/toys/board-games/card' },
          { name: 'Classic Games', href: '/categories/toys/board-games/classic' }
        ]
      },
      { 
        name: 'Puzzles', 
        href: '/categories/toys/puzzles',
        subcategories: [
          { name: 'Jigsaw Puzzles', href: '/categories/toys/puzzles/jigsaw' },
          { name: '3D Puzzles', href: '/categories/toys/puzzles/3d' },
          { name: 'Brain Teasers', href: '/categories/toys/puzzles/brain-teasers' },
          { name: 'Educational Puzzles', href: '/categories/toys/puzzles/educational' }
        ]
      },
      { 
        name: 'Building Sets', 
        href: '/categories/toys/building-sets',
        subcategories: [
          { name: 'LEGO', href: '/categories/toys/building-sets/lego' },
          { name: 'Magnetic Tiles', href: '/categories/toys/building-sets/magnetic' },
          { name: 'Blocks', href: '/categories/toys/building-sets/blocks' },
          { name: 'Construction Sets', href: '/categories/toys/building-sets/construction' }
        ]
      },
      { 
        name: "Kids' Electronics", 
        href: '/categories/toys/electronics',
        subcategories: [
          { name: 'Tablets', href: '/categories/toys/electronics/tablets' },
          { name: 'Learning Toys', href: '/categories/toys/electronics/learning' },
          { name: 'Robots', href: '/categories/toys/electronics/robots' },
          { name: 'Drones', href: '/categories/toys/electronics/drones' }
        ]
      },
      { 
        name: 'Outdoor Toys', 
        href: '/categories/toys/outdoor',
        subcategories: [
          { name: 'Bikes', href: '/categories/toys/outdoor/bikes' },
          { name: 'Scooters', href: '/categories/toys/outdoor/scooters' },
          { name: 'Playhouses', href: '/categories/toys/outdoor/playhouses' },
          { name: 'Water Toys', href: '/categories/toys/outdoor/water' },
          { name: 'Swing Sets', href: '/categories/toys/outdoor/swings' }
        ]
      },
      { 
        name: 'Dolls & Stuffed Animals', 
        href: '/categories/toys/dolls',
        subcategories: [
          { name: 'Fashion Dolls', href: '/categories/toys/dolls/fashion' },
          { name: 'Baby Dolls', href: '/categories/toys/dolls/baby' },
          { name: 'Stuffed Animals', href: '/categories/toys/dolls/stuffed' },
          { name: 'Plush Toys', href: '/categories/toys/dolls/plush' }
        ]
      },
      { 
        name: 'Arts & Crafts', 
        href: '/categories/toys/arts-crafts',
        subcategories: [
          { name: 'Drawing', href: '/categories/toys/arts-crafts/drawing' },
          { name: 'Painting', href: '/categories/toys/arts-crafts/painting' },
          { name: 'Sculpting', href: '/categories/toys/arts-crafts/sculpting' },
          { name: 'Jewelry Making', href: '/categories/toys/arts-crafts/jewelry' },
          { name: 'Paper Crafts', href: '/categories/toys/arts-crafts/paper' }
        ]
      }
    ]
  },
  {
    id: 'books',
    label: 'Books & Media',
    featured: { name: 'Summer Reading List', href: '/categories/books/summer-reads', discount: '20% Off Bestsellers' },
    categories: [
      { 
        name: 'Fiction', 
        href: '/categories/books/fiction',
        subcategories: [
          { name: 'Mystery & Thrillers', href: '/categories/books/fiction/mystery' },
          { name: 'Romance', href: '/categories/books/fiction/romance' },
          { name: 'Science Fiction', href: '/categories/books/fiction/sci-fi' },
          { name: 'Fantasy', href: '/categories/books/fiction/fantasy' },
          { name: 'Literary Fiction', href: '/categories/books/fiction/literary' },
          { name: 'Historical Fiction', href: '/categories/books/fiction/historical' },
          { name: 'Horror', href: '/categories/books/fiction/horror' }
        ]
      },
      { 
        name: 'Non-Fiction', 
        href: '/categories/books/non-fiction',
        subcategories: [
          { name: 'Biographies', href: '/categories/books/non-fiction/biographies' },
          { name: 'Self-Help', href: '/categories/books/non-fiction/self-help' },
          { name: 'Business & Finance', href: '/categories/books/non-fiction/business' },
          { name: 'History', href: '/categories/books/non-fiction/history' },
          { name: 'Science', href: '/categories/books/non-fiction/science' },
          { name: 'Travel', href: '/categories/books/non-fiction/travel' },
          { name: 'Cooking', href: '/categories/books/non-fiction/cooking' }
        ]
      },
      { 
        name: 'Children\'s Books', 
        href: '/categories/books/childrens',
        subcategories: [
          { name: 'Picture Books', href: '/categories/books/childrens/picture' },
          { name: 'Chapter Books', href: '/categories/books/childrens/chapter' },
          { name: 'Young Adult', href: '/categories/books/childrens/young-adult' },
          { name: 'Educational Books', href: '/categories/books/childrens/educational' },
          { name: 'Board Books', href: '/categories/books/childrens/board' }
        ]
      },
      { 
        name: 'Textbooks', 
        href: '/categories/books/textbooks',
        subcategories: [
          { name: 'Science', href: '/categories/books/textbooks/science' },
          { name: 'Math', href: '/categories/books/textbooks/math' },
          { name: 'Language Arts', href: '/categories/books/textbooks/language' },
          { name: 'Social Studies', href: '/categories/books/textbooks/social-studies' }
        ]
      },
      { 
        name: 'Audiobooks', 
        href: '/categories/books/audiobooks',
        subcategories: [
          { name: 'Fiction Audiobooks', href: '/categories/books/audiobooks/fiction' },
          { name: 'Non-Fiction Audiobooks', href: '/categories/books/audiobooks/non-fiction' },
          { name: 'Children\'s Audiobooks', href: '/categories/books/audiobooks/childrens' }
        ]
      },
      { 
        name: 'Movies & TV', 
        href: '/categories/books/movies',
        subcategories: [
          { name: 'New Releases', href: '/categories/books/movies/new' },
          { name: 'Classics', href: '/categories/books/movies/classics' },
          { name: 'Box Sets', href: '/categories/books/movies/box-sets' },
          { name: 'Documentaries', href: '/categories/books/movies/documentaries' }
        ]
      },
      { 
        name: 'Music', 
        href: '/categories/books/music',
        subcategories: [
          { name: 'Vinyl Records', href: '/categories/books/music/vinyl' },
          { name: 'CDs', href: '/categories/books/music/cds' },
          { name: 'Digital Downloads', href: '/categories/books/music/digital' }
        ]
      },
      { 
        name: 'Video Games', 
        href: '/categories/books/video-games',
        subcategories: [
          { name: 'PlayStation', href: '/categories/books/video-games/playstation' },
          { name: 'Xbox', href: '/categories/books/video-games/xbox' },
          { name: 'Nintendo', href: '/categories/books/video-games/nintendo' },
          { name: 'PC Games', href: '/categories/books/video-games/pc' }
        ]
      }
    ]
  },
  {
    id: 'automotive',
    label: 'Automotive',
    featured: { name: 'Summer Auto Care', href: '/categories/automotive/summer-care', discount: 'Save 15%' },
    categories: [
      { 
        name: 'Car Parts', 
        href: '/categories/automotive/parts',
        subcategories: [
          { 
            name: 'Engine Parts', 
            href: '/categories/automotive/parts/engine',
            subcategories: [
              { name: 'Filters', href: '/categories/automotive/parts/engine/filters' },
              { name: 'Batteries', href: '/categories/automotive/parts/engine/batteries' },
              { name: 'Belts', href: '/categories/automotive/parts/engine/belts' },
              { name: 'Hoses', href: '/categories/automotive/parts/engine/hoses' }
            ]
          },
          { 
            name: 'Brakes', 
            href: '/categories/automotive/parts/brakes',
            subcategories: [
              { name: 'Brake Pads', href: '/categories/automotive/parts/brakes/pads' },
              { name: 'Rotors', href: '/categories/automotive/parts/brakes/rotors' },
              { name: 'Calipers', href: '/categories/automotive/parts/brakes/calipers' }
            ]
          },
          { 
            name: 'Tires', 
            href: '/categories/automotive/parts/tires',
            subcategories: [
              { name: 'All-Season', href: '/categories/automotive/parts/tires/all-season' },
              { name: 'Winter Tires', href: '/categories/automotive/parts/tires/winter' },
              { name: 'Performance Tires', href: '/categories/automotive/parts/tires/performance' }
            ]
          },
          { 
            name: 'Lighting', 
            href: '/categories/automotive/parts/lighting',
            subcategories: [
              { name: 'Headlights', href: '/categories/automotive/parts/lighting/headlights' },
              { name: 'Tail Lights', href: '/categories/automotive/parts/lighting/tail' },
              { name: 'Turn Signals', href: '/categories/automotive/parts/lighting/turn-signals' }
            ]
          }
        ]
      },
      { 
        name: 'Car Accessories', 
        href: '/categories/automotive/accessories',
        subcategories: [
          { 
            name: 'Interior Accessories', 
            href: '/categories/automotive/accessories/interior',
            subcategories: [
              { name: 'Seat Covers', href: '/categories/automotive/accessories/interior/seat-covers' },
              { name: 'Floor Mats', href: '/categories/automotive/accessories/interior/mats' },
              { name: 'Air Fresheners', href: '/categories/automotive/accessories/interior/fresheners' },
              { name: 'Steering Wheel Covers', href: '/categories/automotive/accessories/interior/steering' }
            ]
          },
          { 
            name: 'Exterior Accessories', 
            href: '/categories/automotive/accessories/exterior',
            subcategories: [
              { name: 'Car Covers', href: '/categories/automotive/accessories/exterior/covers' },
              { name: 'Roof Racks', href: '/categories/automotive/accessories/exterior/roof-racks' },
              { name: 'Spoilers', href: '/categories/automotive/accessories/exterior/spoilers' },
              { name: 'Hood Protectors', href: '/categories/automotive/accessories/exterior/hood-protectors' }
            ]
          },
          { 
            name: 'Electronics', 
            href: '/categories/automotive/accessories/electronics',
            subcategories: [
              { name: 'Car Stereos', href: '/categories/automotive/accessories/electronics/stereos' },
              { name: 'Speakers', href: '/categories/automotive/accessories/electronics/speakers' },
              { name: 'Dash Cams', href: '/categories/automotive/accessories/electronics/dash-cams' },
              { name: 'GPS Navigation', href: '/categories/automotive/accessories/electronics/gps' }
            ]
          },
          { 
            name: 'Car Care', 
            href: '/categories/automotive/accessories/care',
            subcategories: [
              { name: 'Car Wash Soap', href: '/categories/automotive/accessories/care/wash' },
              { name: 'Wax', href: '/categories/automotive/accessories/care/wax' },
              { name: 'Interior Cleaners', href: '/categories/automotive/accessories/care/cleaners' },
              { name: 'Microfiber Cloths', href: '/categories/automotive/accessories/care/cloths' }
            ]
          }
        ]
      },
      { 
        name: 'Tools', 
        href: '/categories/automotive/tools',
        subcategories: [
          { name: 'Sockets & Wrenches', href: '/categories/automotive/tools/sockets' },
          { name: 'Jack Stands', href: '/categories/automotive/tools/jacks' },
          { name: 'Diagnostic Tools', href: '/categories/automotive/tools/diagnostic' },
          { name: 'Tire Inflators', href: '/categories/automotive/tools/inflators' }
        ]
      },
      { 
        name: 'Motorcycles', 
        href: '/categories/automotive/motorcycles',
        subcategories: [
          { name: 'Helmets', href: '/categories/automotive/motorcycles/helmets' },
          { name: 'Protective Gear', href: '/categories/automotive/motorcycles/gear' },
          { name: 'Parts', href: '/categories/automotive/motorcycles/parts' },
          { name: 'Accessories', href: '/categories/automotive/motorcycles/accessories' }
        ]
      }
    ]
  },
  {
    id: 'health',
    label: 'Health & Wellness',
    featured: { name: 'Wellness Month', href: '/categories/health/wellness', discount: '20% Off Vitamins' },
    categories: [
      { 
        name: 'Vitamins & Supplements', 
        href: '/categories/health/vitamins',
        subcategories: [
          { name: 'Multivitamins', href: '/categories/health/vitamins/multivitamins' },
          { name: 'Vitamin C', href: '/categories/health/vitamins/vitamin-c' },
          { name: 'Vitamin D', href: '/categories/health/vitamins/vitamin-d' },
          { name: 'Omega-3', href: '/categories/health/vitamins/omega-3' },
          { name: 'Probiotics', href: '/categories/health/vitamins/probiotics' },
          { name: 'Protein Powders', href: '/categories/health/vitamins/protein' },
          { name: 'Herbal Supplements', href: '/categories/health/vitamins/herbal' }
        ]
      },
      { 
        name: 'Health Devices', 
        href: '/categories/health/devices',
        subcategories: [
          { name: 'Blood Pressure Monitors', href: '/categories/health/devices/blood-pressure' },
          { name: 'Thermometers', href: '/categories/health/devices/thermometers' },
          { name: 'Pulse Oximeters', href: '/categories/health/devices/oximeters' },
          { name: 'Air Purifiers', href: '/categories/health/devices/air-purifiers' },
          { name: 'Humidifiers', href: '/categories/health/devices/humidifiers' }
        ]
      },
      { 
        name: 'First Aid', 
        href: '/categories/health/first-aid',
        subcategories: [
          { name: 'Bandages', href: '/categories/health/first-aid/bandages' },
          { name: 'Antiseptics', href: '/categories/health/first-aid/antiseptics' },
          { name: 'Pain Relievers', href: '/categories/health/first-aid/pain-relievers' },
          { name: 'First Aid Kits', href: '/categories/health/first-aid/kits' }
        ]
      },
      { 
        name: 'Personal Care', 
        href: '/categories/health/personal-care',
        subcategories: [
          { name: 'Oral Care', href: '/categories/health/personal-care/oral' },
          { name: 'Foot Care', href: '/categories/health/personal-care/foot' },
          { name: 'Eye Care', href: '/categories/health/personal-care/eye' },
          { name: 'Sleep Aids', href: '/categories/health/personal-care/sleep' }
        ]
      }
    ]
  },
  {
    id: 'groceries',
    label: 'Groceries & Food',
    featured: { name: 'Fresh Summer Produce', href: '/categories/groceries/produce', discount: 'Farm Fresh Deals' },
    categories: [
      { 
        name: 'Pantry Staples', 
        href: '/categories/groceries/pantry',
        subcategories: [
          { name: 'Pasta & Noodles', href: '/categories/groceries/pantry/pasta' },
          { name: 'Rice & Grains', href: '/categories/groceries/pantry/rice' },
          { name: 'Canned Goods', href: '/categories/groceries/pantry/canned' },
          { name: 'Baking Supplies', href: '/categories/groceries/pantry/baking' },
          { name: 'Cooking Oils', href: '/categories/groceries/pantry/oils' },
          { name: 'Spices & Herbs', href: '/categories/groceries/pantry/spices' }
        ]
      },
      { 
        name: 'Snacks & Sweets', 
        href: '/categories/groceries/snacks',
        subcategories: [
          { name: 'Chips & Crackers', href: '/categories/groceries/snacks/chips' },
          { name: 'Candy', href: '/categories/groceries/snacks/candy' },
          { name: 'Chocolate', href: '/categories/groceries/snacks/chocolate' },
          { name: 'Nuts & Seeds', href: '/categories/groceries/snacks/nuts' },
          { name: 'Cookies & Biscuits', href: '/categories/groceries/snacks/cookies' },
          { name: 'Popcorn', href: '/categories/groceries/snacks/popcorn' }
        ]
      },
      { 
        name: 'Beverages', 
        href: '/categories/groceries/beverages',
        subcategories: [
          { name: 'Coffee', href: '/categories/groceries/beverages/coffee' },
          { name: 'Tea', href: '/categories/groceries/beverages/tea' },
          { name: 'Juices', href: '/categories/groceries/beverages/juices' },
          { name: 'Sodas', href: '/categories/groceries/beverages/sodas' },
          { name: 'Energy Drinks', href: '/categories/groceries/beverages/energy' },
          { name: 'Water', href: '/categories/groceries/beverages/water' }
        ]
      },
      { 
        name: 'Frozen Foods', 
        href: '/categories/groceries/frozen',
        subcategories: [
          { name: 'Frozen Meals', href: '/categories/groceries/frozen/meals' },
          { name: 'Ice Cream', href: '/categories/groceries/frozen/ice-cream' },
          { name: 'Frozen Fruits', href: '/categories/groceries/frozen/fruits' },
          { name: 'Frozen Vegetables', href: '/categories/groceries/frozen/vegetables' }
        ]
      },
      { 
        name: 'Organic & Natural', 
        href: '/categories/groceries/organic',
        subcategories: [
          { name: 'Organic Produce', href: '/categories/groceries/organic/produce' },
          { name: 'Natural Snacks', href: '/categories/groceries/organic/snacks' },
          { name: 'Gluten-Free', href: '/categories/groceries/organic/gluten-free' },
          { name: 'Vegan Foods', href: '/categories/groceries/organic/vegan' }
        ]
      }
    ]
  }
];