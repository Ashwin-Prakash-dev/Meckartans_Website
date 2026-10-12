// Support Us (brief p.10). Nothing here was provided yet except the structure: every null renders as
// "To be added". Fill these in before launch; never put placeholder bank details here.

export const CROWDFUNDING = {
  cfrVideoUrl: null as string | null, // Team CFR video (YouTube embed URL or /media/... file)
  campaignUrl: null as string | null, // crowdfunding website link
  pitch:
    "Every MK vehicle is designed, fabricated and tested by students. Backing the team funds materials, tooling, testing and travel to national competitions.",
}

export const BANK: { label: string; value: string | null }[] = [
  { label: "Account name", value: null },
  { label: "Account number", value: null },
  { label: "IFSC", value: null },
  { label: "Bank & branch", value: null },
  { label: "UPI ID", value: null },
]

export const SPONSORSHIP = {
  wing: [
    { role: "Sponsorship lead", name: null as string | null, phone: null as string | null, email: null as string | null },
  ],
  brochureUrl: null as string | null, // put the PDF in public/media/ and reference it here
  mailSubject: "Sponsorship enquiry: Team Meckartans",
  history: [] as { name: string; logo?: string; seasons?: string }[],
}
