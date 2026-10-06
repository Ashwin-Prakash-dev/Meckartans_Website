# Content needed from Team Meckartans

The site is built to the requirements brief. Everything below was **not in the brief or the photo library**, so the
site shows a dashed **"To be added"** marker in its place. Nothing has been invented: no phone numbers, bank details or
results were made up. Each item names the file to edit.

## 1. Must have before launch

| What | Where it shows | File |
|---|---|---|
| Phone numbers: Captain, Manager, Faculty Advisor | Footer (every page) | `src/content/site.ts` → `CONTACTS` |
| Manager's name; which Faculty Advisor is the contact | Footer | `src/content/site.ts` → `CONTACTS` |
| Bank details: account name, number, IFSC, bank & branch, UPI | Support Us | `src/content/support.ts` → `BANK` |
| Crowdfunding website link | Support Us | `src/content/support.ts` → `CROWDFUNDING.campaignUrl` |
| Team CFR video (YouTube embed URL or MP4) | Support Us | `src/content/support.ts` → `CROWDFUNDING.cfrVideoUrl` |
| Sponsorship wing contact(s): name, phone, email | Support Us | `src/content/support.ts` → `SPONSORSHIP.wing` |
| Sponsorship brochure (PDF) | Support Us | put in `public/media/`, set `SPONSORSHIP.brochureUrl` |
| Sponsor history (names, logos, seasons) | Support Us | `src/content/support.ts` → `SPONSORSHIP.history` |
| Logo as SVG / AI, or PNG ≥ 1000 px | Header, footer, home | the PDF's logo is only 200 px; replace `public/media/brand/logo-light.png` |

## 2. Our Team

- The brief's committee image is **2024–25** and was cropped after the first two members (Asif Ahammad H, Captain;
  Abhijith Mohan, Vice Captain). Send the **full current committee**: name, position, photo.
- **LinkedIn URLs** for every card (faculty and students). File: `src/content/team.ts`.
- Optional: the subsystem structure (the brief's reference site shows one).

## 3. Results to confirm (sources disagree)

The FKDC board in the brief and the official MK-series spec slides give different results for three seasons.
The site currently follows the **board**:

| Season | Spec slide says | Board (used on site) says |
|---|---|---|
| FKDC S3 (MK10) | 2nd Business Plan, 2nd Design & CAE | AIR 1 Business Plan, AIR 2 Design & CAE |
| FKDC S4 (MK11) | 3rd Overall, 1st Design & CAE, 1st Business Plan, 2nd Endurance, 2nd Acceleration | AIR 1 Design & CAE, Business Plan; AIR 2 Cost, Acceleration, Autocross (no overall) |
| FKDC S5 (MK12A) | 3rd Overall | AIR 2 Overall |

Also please confirm:
- **Years** for each FKDC season (only Season 1 = 2017 is stated anywhere).
- Which vehicle ran **Seasons 2, 6 and 9**, and confirm the inferred ones: S7 → MK13, S8 → MK14 + MKE1 (from photo dates
  and the FKDC Season 7 programme).
- **SAE eBAJA India**: year and vehicle (MKeX1?). The library's `Buggy/MKX02` folder has "first ever SAE BAJA physical
  event" photos; which vehicle is that?

File: `src/content/achievements.ts`.

## 4. MK Garage

- **Specs, leadership and events** for MK12A (specs only), MK13, MK14, MKE1, MKE2, MKX01, MKeX1. MK1–MK11 come from the
  MK-series slides.
- **Photos** for MKE2 and MKeX1 (their cards show a blueprint placeholder). MK1, MK3, MK7 and MK12A use the photo panel
  from their spec slide; real photos would be better.
- **MKX01 year** (brief says "Yr tbc"; its photos are dated Dec 2021 to Jun 2022).
- The photo library has an **MK12B** folder (frame fabrication, 2021) that isn't in the brief's vehicle list. Should it be?

File: `src/content/vehicles.ts`.

## 5. Workshops & socials

- Short description + photos for **Powerstroke, GoKraft, Dirtrix** and other events/expos.
- Confirm listing the **FMAE Buggy Internship 2019** (it's in the photo library, not in the brief).
- **WhatsApp Community** link (blank in the brief).

File: `src/content/site.ts` → `WORKSHOPS`, `SOCIALS`.

## 6. Nice to have

- The **tagline**: "Built by hand. Run at speed." is a working line (`SITE.tagline`).
- More **Events / Workshops** photos for the gallery (5 and 12 photos today vs 66 competition shots).
- Higher-quality footage for the home video; the gallery reel is cut from the clips in `Meckartans_Gallery/Videos`.
