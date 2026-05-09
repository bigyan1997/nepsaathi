from datetime import timedelta
from fpdf import FPDF, XPos, YPos


BRAND_DARK   = (38, 33, 92)
BRAND_MID    = (83, 74, 183)
ORANGE       = (232, 119, 34)
WHITE        = (255, 255, 255)
LIGHT_BG     = (248, 248, 250)
GREY_LINE    = (220, 220, 225)
GREY_TEXT    = (140, 140, 150)
BLACK_TEXT   = (40, 40, 50)
GREEN        = (27, 158, 117)
GREEN_BG     = (225, 245, 238)
HEADER_MUTED = (170, 165, 210)

# Page content width = 210 - 15 (left) - 15 (right) = 180
W        = 180
LM       = 15
HEADER_H = 58   # height of the full-width dark header band


class InvoicePDF(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-13)
        self.set_draw_color(*GREY_LINE)
        self.set_line_width(0.25)
        self.line(LM, self.get_y(), LM + W, self.get_y())
        self.set_y(-11)
        self.set_font('Helvetica', '', 7.5)
        self.set_text_color(*GREY_TEXT)
        self.cell(0, 5,
            'hello@nepsaathi.com   |   nepsaathi.com   |   Australia',
            align='C')


def generate_invoice_pdf(payment) -> bytes:
    listing        = payment.listing
    invoice_num    = f"INV-{payment.id:05d}"
    date_paid      = payment.completed_at.strftime('%d/%m/%Y')
    amount_aud     = payment.amount_paid / 100
    gst_amount     = round(amount_aud / 11, 2)
    excl_gst       = round(amount_aud - gst_amount, 2)
    featured_until = (payment.completed_at + timedelta(days=payment.duration_days)).strftime('%d %B %Y')
    user           = payment.user
    full_name      = f"{user.first_name} {user.last_name}".strip() or user.email
    listing_title  = listing.title[:50] + ('...' if len(listing.title) > 50 else '')

    pdf = InvoicePDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    pdf.set_margins(LM, LM, LM)

    # ── Full-width dark header band ───────────────────────────
    pdf.set_fill_color(*BRAND_DARK)
    pdf.rect(0, 0, 210, HEADER_H, style='F')

    # Logo circles (left side of header)
    r   = 5
    cy  = 18
    cx1 = LM + r           # center x of orange circle  = 20
    cx2 = LM + r * 2.7     # center x of purple circle  = 28.5

    pdf.set_fill_color(*ORANGE)
    pdf.ellipse(cx1 - r, cy - r, r * 2, r * 2, style='F')
    pdf.set_fill_color(*BRAND_MID)
    pdf.ellipse(cx2 - r, cy - r, r * 2, r * 2, style='F')

    # Wordmark
    pdf.set_font('Helvetica', 'B', 20)
    nep_w  = pdf.get_string_width('Nep')
    saat_w = pdf.get_string_width('Saathi')
    wm_x = cx2 + r + 3    # start of wordmark text
    pdf.set_xy(wm_x, cy - 6)
    pdf.set_text_color(*ORANGE)
    pdf.cell(nep_w, 9, 'Nep', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.set_text_color(*WHITE)
    pdf.cell(saat_w, 9, 'Saathi', new_x=XPos.RIGHT, new_y=YPos.TOP)

    # Tagline
    pdf.set_xy(LM, cy + 6)
    pdf.set_font('Helvetica', '', 7.5)
    pdf.set_text_color(*HEADER_MUTED)
    pdf.cell(90, 4.5, 'your Nepali friend, wherever you are')

    # Contact info
    pdf.set_xy(LM, cy + 13)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*HEADER_MUTED)
    pdf.cell(90, 5, 'hello@nepsaathi.com  |  nepsaathi.com')
    pdf.set_xy(LM, cy + 20)
    pdf.cell(90, 5, 'Australia')

    # "INVOICE" label (right side of header)
    pdf.set_xy(105, 8)
    pdf.set_font('Helvetica', 'B', 30)
    pdf.set_text_color(*WHITE)
    pdf.cell(90, 14, 'INVOICE', align='R')

    # Invoice details rows (right side)
    # label: x=105 width=42  |  value: x=147 width=48  (total=90, ends at 195)
    def hdr_detail(label, value, y):
        pdf.set_xy(105, y)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(*HEADER_MUTED)
        pdf.cell(42, 5.5, label, align='R')
        pdf.set_font('Helvetica', 'B', 8)
        pdf.set_text_color(*WHITE)
        pdf.cell(48, 5.5, value, align='R')

    hdr_detail('Invoice No :', invoice_num, 28)
    hdr_detail('Date :', date_paid, 35)
    hdr_detail('Amount Due :', f'AUD ${amount_aud:.2f}', 42)

    # ── Bill To section ───────────────────────────────────────
    bill_y = HEADER_H + 9

    pdf.set_xy(LM, bill_y)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*ORANGE)
    pdf.cell(90, 5, 'BILL TO')

    pdf.set_xy(LM, bill_y + 7)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*BRAND_DARK)
    pdf.cell(90, 7, full_name)

    pdf.set_xy(LM, bill_y + 15.5)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(90, 5, user.email)

    # Divider
    div_y = bill_y + 25
    pdf.set_draw_color(*GREY_LINE)
    pdf.set_line_width(0.3)
    pdf.line(LM, div_y, LM + W, div_y)

    # ── Table ─────────────────────────────────────────────────
    # Columns: Description=90, Price=30, Qty=20, Total=40 => 180 total
    COLS  = [90, 30, 20, 40]
    HEADS = ['DESCRIPTION', 'PRICE', 'QTY', 'TOTAL']
    table_y = div_y + 7

    pdf.set_xy(LM, table_y)
    pdf.set_fill_color(*BRAND_DARK)
    pdf.set_text_color(*WHITE)
    pdf.set_font('Helvetica', 'B', 8.5)
    for i, (cw, label) in enumerate(zip(COLS, HEADS)):
        align = 'L' if i == 0 else 'R'
        txt   = ('  ' + label) if i == 0 else label
        pdf.cell(cw, 9, txt, fill=True, border=0, align=align,
                 new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.ln(9)

    # Item row
    row_y = pdf.get_y()
    pdf.set_fill_color(*LIGHT_BG)
    pdf.set_xy(LM, row_y)
    vals = [f'  Featured Listing - {payment.duration_days} days',
            f'${excl_gst:.2f}', '1', f'${excl_gst:.2f}']
    for i, (cw, val) in enumerate(zip(COLS, vals)):
        pdf.set_font('Helvetica', 'B' if i == 0 else '', 9)
        pdf.set_text_color(*BLACK_TEXT)
        pdf.cell(cw, 8.5, val, fill=True, border=0,
                 align='L' if i == 0 else 'R',
                 new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.ln(8.5)

    # Sub-row: listing title
    pdf.set_xy(LM, pdf.get_y())
    pdf.set_fill_color(*LIGHT_BG)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(COLS[0], 6, f'  {listing_title}', fill=True, border=0,
             new_x=XPos.RIGHT, new_y=YPos.TOP)
    for cw in COLS[1:]:
        pdf.cell(cw, 6, '', fill=True, border=0,
                 new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.ln(6)

    # Table bottom line
    pdf.set_draw_color(*GREY_LINE)
    pdf.set_line_width(0.25)
    pdf.line(LM, pdf.get_y(), LM + W, pdf.get_y())
    pdf.ln(5)

    # ── Subtotals ─────────────────────────────────────────────
    def amount_row(label, value, bold=False):
        pdf.set_x(LM)
        pdf.set_font('Helvetica', 'B' if bold else '', 9)
        clr = BLACK_TEXT if bold else GREY_TEXT
        pdf.set_text_color(*clr)
        pdf.cell(W - 45, 6, label, align='R')
        pdf.set_text_color(*BLACK_TEXT)
        pdf.cell(45, 6, value, align='R')
        pdf.ln(6)

    amount_row('Subtotal (excl. GST)', f'AUD ${excl_gst:.2f}')
    amount_row('GST (10%)', f'AUD ${gst_amount:.2f}')
    pdf.ln(2)

    # Grand total banner
    pdf.set_x(LM)
    pdf.set_fill_color(*BRAND_DARK)
    pdf.set_text_color(*WHITE)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(W - 70, 10, '', fill=True, border=0)
    pdf.cell(70, 10, f'  GRAND TOTAL    AUD ${amount_aud:.2f}  ',
             fill=True, border=0, align='R')
    pdf.ln(16)

    # ── Bottom: Payment method (left) + Thank you (right) ─────
    bot_y = pdf.get_y()

    # Left — Payment method
    pdf.set_xy(LM, bot_y)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*BRAND_DARK)
    pdf.cell(90, 6, 'PAYMENT METHOD')

    pdf.set_xy(LM, bot_y + 8)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(22, 5, 'Provider :')
    pdf.set_text_color(*BLACK_TEXT)
    pdf.cell(68, 5, 'Stripe (Credit / Debit Card)')

    pdf.set_xy(LM, bot_y + 14)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(22, 5, 'Reference :')
    pdf.set_text_color(*BLACK_TEXT)
    ref = payment.stripe_session_id[:26] + '...'
    pdf.cell(68, 5, ref)

    # PAID badge
    pdf.set_xy(LM, bot_y + 22)
    pdf.set_fill_color(*GREEN_BG)
    pdf.set_draw_color(*GREEN)
    pdf.set_line_width(0.4)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*GREEN)
    pdf.cell(24, 8, 'PAID', border=1, fill=True, align='C')

    # Right — THANK YOU
    pdf.set_xy(LM + 95, bot_y)
    pdf.set_font('Helvetica', 'B', 28)
    pdf.set_text_color(*BRAND_DARK)
    pdf.cell(85, 14, 'THANK', align='R')
    pdf.set_xy(LM + 95, bot_y + 14)
    pdf.cell(85, 14, 'YOU.', align='R')

    pdf.set_xy(LM + 95, bot_y + 30)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*GREY_TEXT)
    pdf.cell(85, 5, f'Featured until {featured_until}', align='R')

    return bytes(pdf.output())
