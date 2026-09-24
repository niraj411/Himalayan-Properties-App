# 655 S Federal Blvd, Unit A. Leasing packet

Everything needed to market and lease Unit A (1,008 sf retail/office bay, NNN).
Numbers as of September 2026: $26/sf/yr base ($2,184/mo), est. NNN $1,074.53/mo,
3 to 5 year term, 3% annual increases. No tenant PII or building codes in this folder.

| File | What it is |
|---|---|
| `for-lease-sign-letter.html` / `.pdf` | 8.5x11 window sign with QR to the listing page |
| `for-lease-banner-24x36.html` / `.pdf` | 24x36 banner for a print shop (vinyl) |
| `fact-sheet.html` / `.pdf` | One-page spec sheet: photos, pricing, terms, uses, next steps |
| `application-checklist.html` / `.pdf` | What a prospect submits and what happens after |
| `LOI-template.docx` / `.pdf` | Letter of intent with blanks, non-binding |
| `listing-copy.md` | Paste-ready copy for Facebook, Craigslist, Nextdoor, LoopNet/Crexi, broker email, text replies |
| `photos/` | 8 photos from Dec 2025 (1600 px wide). Same set as the app listing |
| `assets/` | QR codes: `qr-listing.png` (listing page), `qr-apply.png` (application with Unit A preselected) |

Live counterparts in the app: the public listing at
`himalayanprop.cloud/listings/cmnwjd2140000l42moea5432x`, the in-app flyer
(Admin, Properties, 655 Federal, Unit A row menu, "Flyer PDF (this unit)"), and the
commercial application form at `/apply?propertyId=...&unitId=...`.

## Regenerate the PDFs

Edit the HTML, then from this folder:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in for-lease-sign-letter for-lease-banner-24x36 fact-sheet application-checklist; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$PWD/$f.pdf" "file://$PWD/$f.html"
done
```

QR codes: `python3 -c "import qrcode; qrcode.make('<url>').save('assets/qr-x.png')"`.

## When the numbers change

Update in this order so nothing drifts: Unit A in the app (rent = base, NNN field),
`fact-sheet.html`, `listing-copy.md`, the Facebook listing, then re-render the PDFs.
