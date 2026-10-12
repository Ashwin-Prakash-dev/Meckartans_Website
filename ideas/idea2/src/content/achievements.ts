// Achievements. FKDC results: the brief's "FKDC Achievements" board (p.9), transcribed exactly.
// Earlier competitions: the official MK-series spec slides. SAE eBAJA: the brief's About text.
// Vehicle links: from the spec slides (S1, S3-S5) or photo evidence (S7, S8, marked "confirm").
//
// NOTE(team): the spec slides and the FKDC board disagree for three seasons. This page follows the board:
//   S3  slide (MK10): 2nd Business Plan, 2nd Design & CAE   | board: AIR 1 Business Plan, AIR 2 Design & CAE
//   S4  slide (MK11): 3rd Overall, 2nd Endurance (+ others) | board: AIR 2 Cost, Acceleration, Autocross; no overall
//   S5  slide (MK12A): 3rd Overall                          | board: AIR 2 Overall

export type Result = { rank: 1 | 2 | 3; event: string }

export type Entry = {
  id: string
  title: string
  when: string | null
  vehicles?: string[] // vehicle slugs
  results?: Result[]
  notes?: string[] // non-ranked outcomes ("Cleared technical inspection")
  major?: boolean // featured on the home page
}

export const FKDC_FULL = "Formula Kart Design Challenge"

export const TIMELINE: Entry[] = [
  { id: "fkdc-9", title: "FKDC Season 9", when: null, results: [{ rank: 2, event: "Cost" }, { rank: 3, event: "Design and CAE" }] },
  {
    id: "sae-ebaja", title: "SAE eBAJA India", when: null,
    notes: ["Cleared the Mechanical Technical Inspection", "Cleared the Electrical Technical Inspection"], major: true,
  },
  {
    id: "fkdc-8", title: "FKDC Season 8", when: null, vehicles: ["mke1", "mk14"], major: true,
    results: [{ rank: 1, event: "EV Skidpad" }, { rank: 2, event: "EV Autocross" }, { rank: 3, event: "Design and CAE (IC)" }],
  },
  {
    id: "fkdc-7", title: "FKDC Season 7", when: null, vehicles: ["mk13"], major: true,
    results: [{ rank: 2, event: "Overall" }, { rank: 1, event: "Design and CAE" }, { rank: 2, event: "Autocross" }],
  },
  {
    id: "fkdc-6", title: "FKDC Season 6", when: null, major: true,
    results: [{ rank: 1, event: "Design and CAE" }, { rank: 1, event: "Business Plan" }],
  },
  { id: "fkdc-5", title: "FKDC Season 5", when: "Online", vehicles: ["mk12a"], major: true, results: [{ rank: 2, event: "Overall" }] },
  {
    id: "fkdc-4", title: "FKDC Season 4", when: "Kari, Coimbatore", vehicles: ["mk11"],
    results: [
      { rank: 1, event: "Design and CAE" }, { rank: 1, event: "Business Plan" },
      { rank: 2, event: "Cost" }, { rank: 2, event: "Acceleration Test" }, { rank: 2, event: "Autocross" },
    ],
  },
  { id: "fkdc-3", title: "FKDC Season 3", when: "Pune", vehicles: ["mk10"], results: [{ rank: 1, event: "Business Plan" }, { rank: 2, event: "Design and CAE" }] },
  { id: "fkdc-2", title: "FKDC Season 2", when: null, results: [{ rank: 1, event: "Business Plan" }, { rank: 2, event: "Cost" }] },
  {
    id: "fkdc-1", title: "FKDC Season 1", when: "2017", vehicles: ["mk6"], major: true,
    results: [{ rank: 2, event: "Overall" }, { rank: 2, event: "Business Plan" }, { rank: 2, event: "Acceleration Test" }],
  },
  { id: "dkc-2016", title: "DKC 2016", when: "Greater Noida", vehicles: ["mk4"], results: [{ rank: 1, event: "Autocross" }, { rank: 2, event: "Skidpad" }] },
  { id: "nkrc-2016", title: "NKRC 2016", when: "2016", vehicles: ["mk5"], notes: ["Completed Autocross and Skidpad"] },
  {
    id: "ikr-2015", title: "IKR 2015 by ISIE", when: "2015", vehicles: ["mk3"],
    notes: ["Passed technical inspection"], results: [{ rank: 2, event: "Skidpad" }, { rank: 3, event: "Autocross" }],
  },
  { id: "nkrc-2014", title: "NKRC 2014 by ISNEE", when: "2014", vehicles: ["mk2"], notes: ["Qualified prelims", "Competed in static events"] },
  { id: "isnee-2013", title: "ISNEE Kolhapur 2013", when: "2013", vehicles: ["mk1"], notes: ["Cleared first round"] },
]

/** Counts derived from the timeline (FKDC board + slides), used in stat strips. */
export const STATS = (() => {
  const fkdc = TIMELINE.filter((e) => e.id.startsWith("fkdc"))
  const all = fkdc.flatMap((e) => e.results ?? [])
  return {
    fkdcSeasons: fkdc.length,
    air1: all.filter((r) => r.rank === 1).length,
    podiums: all.length,
  }
})()
