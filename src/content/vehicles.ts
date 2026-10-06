// MK Garage. Names, years and categories: the brief (p.8).
// Specs, leadership and events for MK1–MK12A: the team's official "MK SERIES" slides (Meckartans_Gallery/MK*/...mkseries.jpg).
// Later vehicles have no spec sheet yet: their fields are null and render as "To be added".

export type Category = "ic" | "electric" | "atv"

export type Vehicle = {
  slug: string
  name: string
  year: string | null
  category: Category
  image: string | null // /media/vehicles/<slug>.webp
  imageKind?: "photo" | "slide" // "slide" = photo panel cropped from the official spec slide
  engine?: string | null
  chassis?: string | null
  weight?: string | null
  leadership?: { captain?: string; viceCaptain?: string; manager?: string; technicalHead?: string }
  events: { name: string; results?: string[] }[]
  fkdcSeason?: number // links to the season on the Achievements page
  galleryLabel?: string // matches gallery.json "label" for the photo strip
}

export const CATEGORY_LABEL: Record<Category, string> = { ic: "IC Karts", electric: "Electric Karts", atv: "ATV" }

const img = (slug: string) => `/media/vehicles/${slug}.webp`

export const VEHICLES: Vehicle[] = [
  {
    slug: "mk1", name: "MK1", year: "2013", category: "ic", image: img("mk1"), imageKind: "slide",
    engine: "Hero Honda Glamour 125 cc, rear mounted", chassis: "Mild steel · frog-leg suspension · collapsible steering", weight: "250 kg",
    leadership: { captain: "Karthik A S", viceCaptain: "Vikas Sharma B S", manager: "Praveen N", technicalHead: "Adarsh D S" },
    events: [{ name: "ISNEE Kolhapur 2013", results: ["Cleared first round"] }],
    galleryLabel: "MK1",
  },
  {
    slug: "mk2", name: "MK2", year: "2014", category: "ic", image: img("mk2"),
    engine: "Bajaj Discover 125 cc, rear mounted", chassis: "Stainless steel · PVC pipe bumper", weight: "160 kg",
    leadership: { captain: "Nithin Kumar", viceCaptain: "John Joe", manager: "Vikas Sharma B S", technicalHead: "Sethu Madhavan" },
    events: [{ name: "NKRC 2014 by ISNEE", results: ["Qualified prelims", "Competed in static events"] }],
    galleryLabel: "MK2",
  },
  {
    slug: "mk3", name: "MK3", year: "2015", category: "ic", image: img("mk3"), imageKind: "slide",
    engine: "Bajaj Discover 125 cc", chassis: "Stainless steel", weight: "150 kg",
    leadership: { captain: "John Joe", viceCaptain: "Yassir Hareed", manager: "Karthik Radhakrishnan", technicalHead: "Sethu Madhavan" },
    events: [{ name: "IKR 2015 by ISIE", results: ["Passed technical inspection", "2nd in Skidpad", "3rd in Autocross"] }],
  },
  {
    slug: "mk4", name: "MK4", year: "2016", category: "ic", image: img("mk4"),
    engine: "Bajaj Discover 125 cc", chassis: "Stainless steel", weight: "150 kg",
    leadership: { captain: "John Joe", viceCaptain: "Yasir Hareed", manager: "Karthik Radhakrishnan", technicalHead: "Mohammed Basil" },
    events: [{ name: "DKC 2016, Greater Noida", results: ["1st in Autocross", "2nd in Skidpad"] }],
    galleryLabel: "MK4",
  },
  {
    slug: "mk5", name: "MK5", year: "2016", category: "ic", image: img("mk5"),
    engine: "Bajaj Discover 125 cc", chassis: "Stainless steel SS 304", weight: "154 kg",
    leadership: { captain: "Yasir Hareed", viceCaptain: "Shefin Abdu", manager: "Aswanth", technicalHead: "Harikrishnan M R" },
    events: [{ name: "NKRC 2016", results: ["Completed Autocross", "Completed Skidpad"] }],
    galleryLabel: "MK5",
  },
  {
    slug: "mk6", name: "MK6", year: "2017", category: "ic", image: img("mk6"),
    engine: "Bajaj Discover 125 cc", chassis: "Stainless steel SS 304", weight: "154 kg",
    leadership: { captain: "Shefin Abdu", viceCaptain: "Harikrishnan S P", manager: "Gautham Vishnu", technicalHead: "Harikrishnan V S, Abhiram" },
    events: [{ name: "FKDC 2017", results: ["Overall Runners Up"] }],
    fkdcSeason: 1,
    galleryLabel: "MK6",
  },
  {
    slug: "mk7", name: "MK7", year: "2017", category: "ic", image: img("mk7"), imageKind: "slide",
    engine: "Bajaj Discover 125 cc", chassis: "Stainless steel SS 304", weight: "154 kg",
    leadership: { captain: "Harikrishnan S P", viceCaptain: "Abhijith Lal M", manager: "Siddharth Elamon", technicalHead: "Jukel Rajesh" },
    events: [{ name: "NKRC 2017, Bhopal" }],
  },
  {
    slug: "mk8", name: "MK8", year: "2017/18", category: "ic", image: img("mk8"),
    engine: "Bajaj Discover 125 cc", chassis: "Stainless steel SS 304", weight: "140 kg",
    leadership: { captain: "Harikrishnan S P", viceCaptain: "Abhijith Lal M", manager: "Siddharth Elamon", technicalHead: "Jukel Rajesh" },
    events: [{ name: "FKDC 2017, Bangalore" }],
    galleryLabel: "MK8",
  },
  {
    slug: "mk9", name: "MK9", year: "2018", category: "ic", image: img("mk9"),
    engine: "Bajaj Discover 125 cc", chassis: "Stainless steel SS 304", weight: "140 kg",
    leadership: { captain: "Harikrishnan S P", viceCaptain: "Abhijith Lal M", manager: "Siddharth Elamon", technicalHead: "Jukel Rakesh" },
    events: [{ name: "SKDC Season 2, Hyderabad" }],
    galleryLabel: "MK9",
  },
  {
    slug: "mk10", name: "MK10", year: "2019", category: "ic", image: img("mk10"),
    engine: "Honda Stunner 125 cc (side engine)", chassis: "AISI 4130 chromoly", weight: "90 kg",
    leadership: { captain: "Abhijith Lal M", viceCaptain: "Rayyan Rasheed", manager: "Siddharth Elamon", technicalHead: "Jukel Rakesh & Ashik A" },
    events: [{ name: "FKDC Season 3, Pune" }],
    fkdcSeason: 3,
    galleryLabel: "MK10",
  },
  {
    slug: "mk11", name: "MK11", year: "2019", category: "ic", image: img("mk11"),
    engine: "Honda Stunner 125 cc (chain tensioner added)", chassis: "AISI 4130 chromoly", weight: "90 kg",
    leadership: { captain: "Abhijith Lal", viceCaptain: "Rayyan Rasheed", manager: "Siddharth Elamon", technicalHead: "Ashik A" },
    events: [{ name: "FKDC Season 4, Kari, Coimbatore" }],
    fkdcSeason: 4,
    galleryLabel: "MK11",
  },
  {
    slug: "mk12a", name: "MK12A", year: "2020", category: "ic", image: img("mk12a"), imageKind: "slide",
    engine: null, chassis: null, weight: null,
    leadership: { captain: "Govind S Nair", manager: "Jyothish V", technicalHead: "Sayi Keshkar" },
    events: [{ name: "FKDC Season 5 (online)" }],
    fkdcSeason: 5,
  },
  {
    slug: "mk13", name: "MK13", year: "2023", category: "ic", image: img("mk13"),
    engine: null, chassis: null, weight: null,
    events: [{ name: "FKDC Season 7" }], // FKDC Season 7 programme photographed with MK13 (gallery #136)
    fkdcSeason: 7,
    galleryLabel: "MK13",
  },
  {
    slug: "mk14", name: "MK14", year: "2024", category: "ic", image: img("mk14"),
    engine: null, chassis: null, weight: null,
    events: [{ name: "FKDC Season 8" }], // photos dated Oct 2024 at the FKDC venue; confirm
    fkdcSeason: 8,
    galleryLabel: "MK14",
  },
  {
    slug: "mke1", name: "MKE1", year: "2024", category: "electric", image: img("mke1"),
    engine: null, chassis: null, weight: null,
    events: [{ name: "FKDC Season 8" }], // EV results that season (AIR 1 EV Skidpad); confirm
    fkdcSeason: 8,
    galleryLabel: "MKE1",
  },
  { slug: "mke2", name: "MKE2", year: "2025", category: "electric", image: null, engine: null, chassis: null, weight: null, events: [] },
  {
    slug: "mkx01", name: "MKX01", year: null, category: "atv", image: img("mkx01"), // brief: "Yr tbc" (photos are dated Dec 2021 – Jun 2022)
    engine: null, chassis: null, weight: null, events: [],
    galleryLabel: "MKX01",
  },
  { slug: "mkex1", name: "MKeX1", year: "2025", category: "atv", image: null, engine: null, chassis: null, weight: null, events: [] },
]
