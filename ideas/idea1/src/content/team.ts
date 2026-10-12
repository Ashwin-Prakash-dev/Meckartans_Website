// Our Team (brief p.6): Executive Committee cards with Photo, Name, Position, LinkedIn.
// Names, roles and photos below are taken from the brief's reference images. LinkedIn URLs were not provided.
// TODO(team): the student committee shown is "24-25"; the slide was cropped after the first two members,
// so the rest of the committee (and the current season's) still needs to be supplied.

export type Member = { name: string; role: string; photo: string | null; linkedin: string | null }

export const FACULTY: Member[] = [
  { name: "Dr Gireesh Kumaran", role: "Faculty Advisor", photo: "/media/team/gireesh-kumaran.webp", linkedin: null },
  { name: "Dr Biju N", role: "Faculty Advisor", photo: "/media/team/biju-n.webp", linkedin: null },
  { name: "Priyadarshi Dutt", role: "Faculty Advisor", photo: "/media/team/priyadarshi-dutt.webp", linkedin: null },
]

export const COMMITTEE_SEASON = "2024–25"

export const COMMITTEE: Member[] = [
  { name: "Asif Ahammad H", role: "Captain", photo: "/media/team/asif-ahammad-h.webp", linkedin: null },
  { name: "Abhijith Mohan", role: "Vice Captain", photo: "/media/team/abhijith-mohan.webp", linkedin: null },
]

// Roles every committee normally has; rendered as "To be added" cards until filled in.
export const COMMITTEE_PENDING_ROLES = ["Team Manager", "Technical Head"]
