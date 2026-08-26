from datetime import timedelta
from pathlib import Path
from fpdf import FPDF, XPos, YPos

BRAND_DARK   = (38,  33,  92)
BRAND_MID    = (83,  74, 183)
ORANGE       = (232, 119,  34)
WHITE        = (255, 255, 255)
LIGHT_BG     = (248, 248, 251)
BILL_BG      = (246, 244, 255)
GREY_LINE    = (222, 222, 228)
GREY_TEXT    = (128, 128, 142)
BLACK_TEXT   = (28,  28,  42)
GREEN        = (22,  163,  74)
GREEN_BG     = (220, 252, 231)
HEADER_MUTED = (162, 156, 208)

W        = 180   # content width (210 - 15*2)
LM       = 15    # left margin
HEADER_H = 60    # header band height
FONT_DIR = Path(__file__).parent / "fonts"


class InvoicePDF(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-13)
        self.set_draw_color(*GREY_LINE)
        self.set_line_width(0.25)
        self.line(LM, self.get_y(), LM + W, self.get_y())
        self.set_y(-11)
        self.set_font("Inter", "", 7.5)
        self.set_text_color(*GREY_TEXT)
        self.cell(0, 5,
            "hello@nepsaathi.com   ·   nepsaathi.com   ·   Australia",
            align="C")


def generate_invoice_pdf(payment) -> bytes:
    listing        = payment.listing
    invoice_num    = f"INV-{payment.id:05d}"
    date_paid      = payment.completed_at.strftime("%d %b %Y")
    amount_aud     = payment.amount_paid / 100
    gst_amount     = round(amount_aud / 11, 2)
    excl_gst       = round(amount_aud - gst_amount, 2)
    featured_until = (payment.completed_at + timedelta(days=payment.duration_days)).strftime("%d %B %Y")
    user           = payment.user
    full_name      = f"{user.first_name} {user.last_name}".strip() or user.email
    listing_title  = listing.title[:52] + ("…" if len(listing.title) > 52 else "")

    pdf = InvoicePDF()
    pdf.add_font("Inter",  "",  str(FONT_DIR / "Inter-Regular.ttf"))
    pdf.add_font("Inter",  "B", str(FONT_DIR / "Inter-Bold.ttf"))
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    pdf.set_margins(LM, LM, LM)

    # ── Header band ──────────────────────────────────────────────────────────
    pdf.set_fill_color(*BRAND_DARK)
    pdf.rect(0, 0, 210, HEADER_H, style="F")

    # Orange top accent stripe
    pdf.set_fill_color(*ORANGE)
    pdf.rect(0, 0, 210, 3, style="F")

    # Logo circles
    r   = 5.5
    cy  = 23
    cx1 = LM + r
    cx2 = LM + r * 2.6
    pdf.set_fill_color(*ORANGE)
    pdf.ellipse(cx1 - r, cy - r, r * 2, r * 2, style="F")
    pdf.set_fill_color(*BRAND_MID)
    pdf.ellipse(cx2 - r, cy - r, r * 2, r * 2, style="F")

    # Wordmark — "Nep" orange, "Saathi" white
    pdf.set_font("Inter", "B", 21)
    wm_x = cx2 + r + 4
    pdf.set_xy(wm_x, cy - 6)
    pdf.set_text_color(*ORANGE)
    nep_w = pdf.get_string_width("Nep")
    pdf.cell(nep_w, 9, "Nep", new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.set_text_color(*WHITE)
    pdf.cell(pdf.get_string_width("Saathi"), 9, "Saathi", new_x=XPos.RIGHT, new_y=YPos.TOP)

    # Tagline + contact
    pdf.set_font("Inter", "", 7.5)
    pdf.set_text_color(*HEADER_MUTED)
    pdf.set_xy(LM, cy + 7)
    pdf.cell(90, 4.5, "your Nepali friend, wherever you are")
    pdf.set_xy(LM, cy + 13.5)
    pdf.cell(90, 4.5, "hello@nepsaathi.com  ·  nepsaathi.com  ·  Australia")

    # INVOICE title (right)
    pdf.set_xy(105, 10)
    pdf.set_font("Inter", "B", 27)
    pdf.set_text_color(*WHITE)
    pdf.cell(90, 12, "INVOICE", align="R")

    # Header detail rows
    def hdr_row(label, value, y):
        pdf.set_xy(105, y)
        pdf.set_font("Inter", "", 7.5)
        pdf.set_text_color(*HEADER_MUTED)
        pdf.cell(38, 5, label, align="R")
        pdf.set_font("Inter", "B", 7.5)
        pdf.set_text_color(*WHITE)
        pdf.cell(52, 5, value, align="R")

    hdr_row("Invoice No", invoice_num, 33)
    hdr_row("Date", date_paid, 39.5)
    hdr_row("Amount", f"AUD ${amount_aud:.2f}", 46)

    # ── Orange left accent stripe (body) ─────────────────────────────────────
    pdf.set_fill_color(*ORANGE)
    pdf.rect(0, HEADER_H, 3.5, 220, style="F")

    # ── Bill To ───────────────────────────────────────────────────────────────
    bill_y = HEADER_H + 12

    # Light tint box
    pdf.set_fill_color(*BILL_BG)
    pdf.rect(LM, bill_y - 4, 88, 31, style="F")

    pdf.set_xy(LM + 4, bill_y)
    pdf.set_font("Inter", "B", 7)
    pdf.set_text_color(*BRAND_MID)
    pdf.cell(80, 4.5, "BILL TO")

    pdf.set_xy(LM + 4, bill_y + 8)
    pdf.set_font("Inter", "B", 12)
    pdf.set_text_color(*BRAND_DARK)
    pdf.cell(80, 7, full_name)

    pdf.set_xy(LM + 4, bill_y + 17)
    pdf.set_font("Inter", "", 9)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(80, 5, user.email)

    # Thin divider
    div_y = bill_y + 36
    pdf.set_draw_color(*GREY_LINE)
    pdf.set_line_width(0.3)
    pdf.line(LM, div_y, LM + W, div_y)

    # ── Line items table ──────────────────────────────────────────────────────
    COLS  = [90, 30, 20, 40]
    HEADS = ["DESCRIPTION", "PRICE", "QTY", "TOTAL"]
    table_y = div_y + 8

    # Table header row
    pdf.set_xy(LM, table_y)
    pdf.set_fill_color(*BRAND_DARK)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Inter", "B", 8)
    for i, (cw, label) in enumerate(zip(COLS, HEADS)):
        pad = "   " if i == 0 else ""
        pdf.cell(cw, 9.5, pad + label, fill=True, border=0,
                 align="L" if i == 0 else "R",
                 new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.ln(9.5)

    # Item main row
    row_y = pdf.get_y()
    pdf.set_fill_color(*LIGHT_BG)
    pdf.set_xy(LM, row_y)
    vals = [
        f"   Featured Listing · {payment.duration_days} days",
        f"${excl_gst:.2f}", "1", f"${excl_gst:.2f}",
    ]
    for i, (cw, val) in enumerate(zip(COLS, vals)):
        pdf.set_font("Inter", "B" if i == 0 else "", 9)
        pdf.set_text_color(*BLACK_TEXT)
        pdf.cell(cw, 9, val, fill=True, border=0,
                 align="L" if i == 0 else "R",
                 new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.ln(9)

    # Item sub-row (listing title)
    pdf.set_xy(LM, pdf.get_y())
    pdf.set_fill_color(*LIGHT_BG)
    pdf.set_font("Inter", "", 8)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(COLS[0], 6.5, f"   {listing_title}", fill=True, border=0,
             new_x=XPos.RIGHT, new_y=YPos.TOP)
    for cw in COLS[1:]:
        pdf.cell(cw, 6.5, "", fill=True, border=0,
                 new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.ln(6.5)

    # Bottom border of table
    pdf.set_draw_color(*GREY_LINE)
    pdf.set_line_width(0.25)
    pdf.line(LM, pdf.get_y(), LM + W, pdf.get_y())
    pdf.ln(7)

    # ── Subtotals ─────────────────────────────────────────────────────────────
    def amount_row(label, value, bold=False):
        pdf.set_x(LM)
        pdf.set_font("Inter", "B" if bold else "", 9)
        pdf.set_text_color(*(BLACK_TEXT if bold else GREY_TEXT))
        pdf.cell(W - 52, 6.5, label, align="R")
        pdf.set_text_color(*BLACK_TEXT)
        pdf.cell(52, 6.5, value, align="R")
        pdf.ln(6.5)

    amount_row("Subtotal (excl. GST)", f"AUD  ${excl_gst:.2f}")
    amount_row("GST (10%)", f"AUD  ${gst_amount:.2f}")
    pdf.ln(3)

    # Grand total banner — right-aligned dark block
    pdf.set_x(LM)
    pdf.set_fill_color(*BRAND_DARK)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Inter", "B", 10)
    pdf.cell(W - 82, 11.5, "", fill=True, border=0)
    pdf.cell(82, 11.5,
             f"GRAND TOTAL   AUD ${amount_aud:.2f}   ",
             fill=True, border=0, align="R")
    pdf.ln(20)

    # ── Payment method + Thank You ────────────────────────────────────────────
    bot_y = pdf.get_y()

    # Payment method (left column)
    pdf.set_xy(LM, bot_y)
    pdf.set_font("Inter", "B", 8)
    pdf.set_text_color(*BRAND_DARK)
    pdf.cell(90, 5.5, "PAYMENT METHOD")

    def pay_row(label, value, y_off):
        pdf.set_xy(LM, bot_y + y_off)
        pdf.set_font("Inter", "", 8.5)
        pdf.set_text_color(*GREY_TEXT)
        pdf.cell(26, 5, label)
        pdf.set_text_color(*BLACK_TEXT)
        pdf.cell(64, 5, value)

    pay_row("Provider", "Stripe (Credit / Debit Card)", 9)
    pay_row("Reference", payment.stripe_session_id[:26] + "…", 16)

    # PAID badge
    pdf.set_xy(LM, bot_y + 27)
    pdf.set_fill_color(*GREEN_BG)
    pdf.set_draw_color(*GREEN)
    pdf.set_line_width(0.5)
    pdf.set_font("Inter", "B", 8.5)
    pdf.set_text_color(*GREEN)
    pdf.cell(30, 9, "PAID", border=1, fill=True, align="C")

    # Thank You (right column)
    pdf.set_xy(LM + 88, bot_y)
    pdf.set_font("Inter", "B", 26)
    pdf.set_text_color(*BRAND_DARK)
    pdf.cell(92, 13, "THANK", align="R")
    pdf.set_xy(LM + 88, bot_y + 13)
    pdf.set_text_color(*ORANGE)
    pdf.cell(92, 13, "YOU.", align="R")

    pdf.set_xy(LM + 88, bot_y + 28)
    pdf.set_font("Inter", "", 8)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(92, 5, f"Featured until {featured_until}", align="R")

    return bytes(pdf.output())
