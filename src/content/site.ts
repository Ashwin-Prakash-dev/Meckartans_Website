// Site-wide content. Source: "Meckartans Website.pdf" (website requirements brief) unless noted.
// `null` = not provided yet. Those render as a visible "To be added" marker (see components/pending.tsx),
// and CONTENT-NEEDED.md lists all of them.

export const SITE = {
  name: "Team Meckartans",
  college: "Sree Chitra Thirunal College of Engineering",
  collegeShort: "SCTCE",
  city: "Thiruvananthapuram",
  established: 2013,
  // TODO(team): tagline not given in the brief. This one is a working line from the design phase.
  tagline: "Built by hand. Run at speed.",
  intro:
    "The official student motorsport team of Sree Chitra Thirunal College of Engineering, Thiruvananthapuram. Since 2013 we have designed, manufactured and raced our own karts and all-terrain vehicles.",
  email: "teammeckartans@gmail.com",
}

export const NAV = [
  { label: "About", to: "/about", blurb: "Who we are and what we build" },
  { label: "Our Team", to: "/team", blurb: "The people behind every lap" },
  { label: "Gallery", to: "/gallery", blurb: "Vehicles, builds, tests and races" },
  { label: "MK Garage", to: "/garage", blurb: "Every vehicle since MK1" },
  { label: "Achievements", to: "/achievements", blurb: "Results, season by season" },
  { label: "Support Us", to: "/support", blurb: "Crowdfunding and sponsorship" },
  { label: "Contact", to: "#contact", blurb: "Reach the team" },
] as const

export const SOCIALS = {
  linktree: "https://linktr.ee/teammeckartans",
  instagram: "https://www.instagram.com/teammeckartans",
  linkedin: "https://in.linkedin.com/company/team-meckartans",
  youtube: "https://www.youtube.com/@teammeckartans",
  facebook: "https://www.facebook.com/teammeckartans",
  college: "https://www.sctce.ac.in/meckartans.php",
  whatsapp: null as string | null, // TODO(team): WhatsApp Community link (left blank in the brief)
}

// About page: the brief's "reference content", verbatim.
export const ABOUT = [
  "Team Meckartans is the official student motorsport team of Sree Chitra Thirunal College of Engineering (SCTCE), Thiruvananthapuram. Established in 2013, the team brings together passionate and dedicated students from various engineering disciplines to design, manufacture, and validate high-performance off-road vehicles. By combining technical knowledge with hands-on experience, Team Meckartans provides a platform where students transform classroom concepts into practical engineering solutions.",
  "Over the years, the team has actively participated in prestigious national-level competitions, including SAE eBAJA INDIA and the Formula Kart Design Challenge (FKDC). These experiences have strengthened our expertise in vehicle design, manufacturing, testing, project management, and teamwork. Our achievements, including successfully clearing the Mechanical and Electrical Technical Inspections at SAE eBAJA INDIA and securing top positions at FKDC, reflect our commitment to engineering excellence and continuous improvement.",
  "Beyond competitions, Team Meckartans is dedicated to fostering innovation, collaboration, and technical learning. Through workshops, outreach programs, and multidisciplinary projects, we empower students to develop industry-relevant skills while promoting sustainable engineering practices. With every project, we strive to inspire future engineers, represent SCTCE with pride, and push the boundaries of student-led motorsport engineering.",
]

// Footer contact block (brief: Captain, Manager, Faculty Advisor with numbers).
export const CONTACTS: { role: string; name: string | null; phone: string | null }[] = [
  { role: "Captain", name: "Asif Ahammad H", phone: null }, // name from the 2024-25 committee slide; confirm for the current season
  { role: "Manager", name: null, phone: null },
  { role: "Faculty Advisor", name: "Dr Gireesh Kumaran", phone: null }, // brief lists three faculty advisors; confirm who is the contact
]

export const LOCATION = {
  label: "Sree Chitra Thirunal College of Engineering, Pappanamcode, Thiruvananthapuram, Kerala",
  mapEmbed:
    "https://www.google.com/maps?q=Sree+Chitra+Thirunal+College+of+Engineering,+Pappanamcode,+Thiruvananthapuram&output=embed",
  mapLink: "https://www.google.com/maps/search/?api=1&query=Sree+Chitra+Thirunal+College+of+Engineering+Thiruvananthapuram",
}

// Workshops & events conducted by the team (brief p.11). Only names were provided.
export const WORKSHOPS: { name: string; summary: string | null; image: string | null; video?: string }[] = [
  { name: "Powerstroke", summary: null, image: null },
  { name: "GoKraft", summary: null, image: null }, // a "GO KRAFT 2.0" video exists in Meckartans_Gallery/Videos
  { name: "Dirtrix", summary: null, image: null },
  { name: "Other college events and expos", summary: null, image: "/media/gallery/61-l.webp" },
  // From the photo library (folder "FMAEBuggyINTERNSHIP2019"); not in the brief's list, so confirm before launch.
  { name: "FMAE Buggy Internship 2019", summary: null, image: "/media/gallery/23-l.webp" },
]
