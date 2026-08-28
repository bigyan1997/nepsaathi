import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import {
  BackpackIcon, BankIcon, BooksIcon, BrainIcon, BriefcaseIcon,
  BuildingsIcon, CalculatorIcon, ClipboardTextIcon, CreditCardIcon,
  CurrencyDollarIcon, FileTextIcon, GraduationCapIcon, HandshakeIcon,
  HospitalIcon, HouseIcon, IdentificationCardIcon, LightbulbIcon,
  MegaphoneIcon, MoneyIcon, PillIcon, ReceiptIcon, ScalesIcon,
  ShieldCheckIcon, StethoscopeIcon, ToothIcon, TrendUpIcon, UserIcon,
  UsersThreeIcon, WarningIcon,
} from "@phosphor-icons/react";

const BANKING = [
  { id: "first-account", Icon: BankIcon, title: "Setting Up Your First Bank Account", summary: "Open an Australian bank account before you even land — most major banks allow it.", steps: ["Commonwealth Bank, ANZ, NAB and Westpac all allow overseas applicants to open an account online before arriving in Australia.", "You'll need your passport, visa grant letter, and an Australian address (your university or a friend's address works for initial setup).", "Activate the account at any branch within 6 months of arrival by showing your passport and visa.", "Student-friendly accounts with no monthly fees: CommBank Smart Access, ANZ Access Advantage, NAB Classic Banking.", "For new arrivals without a credit history, a basic debit card account is the quickest way to start — build credit history over time.", "Set up internet banking immediately — almost every employer in Australia pays by direct deposit (EFT)."], link: { label: "Compare money transfer rates to Nepal", url: "/send-money" }, tip: "Don't carry large amounts of cash after arrival. Get your debit card activated as your very first errand." },
  { id: "super", Icon: CurrencyDollarIcon, title: "Superannuation (Super)", summary: "Your employer must pay super on top of your salary — it's your retirement savings and you own it.", steps: ["Employers must contribute 11.5% (rising to 12% in July 2025) of your ordinary time earnings to a super fund — on top of your salary, not out of it.", "You can choose your own super fund. If you don't choose, your employer picks one (a 'default fund').", "Popular funds: Australian Super, Hostplus, REST, Aware Super — compare fees and insurance at moneysmart.gov.au.", "If you leave Australia permanently and your visa has expired, you can claim your super back as a Departing Australia Superannuation Payment (DASP).", "Tax on DASP is 35% for temporary residents — still worth claiming, as you can't access it otherwise.", "Use myGov to see all your super accounts. Many people accidentally have multiple accounts with fees eating into each."], link: { label: "Compare super funds — MoneySmart", url: "https://www.moneysmart.gov.au/superannuation-and-retirement/how-super-works/choosing-a-super-fund" }, tip: "Always give your employer your super fund details and TFN on day one. Without your TFN, super is taxed at 47% (the 'no-TFN tax')." },
  { id: "credit", Icon: CreditCardIcon, title: "Credit Cards and Personal Loans", summary: "Building a credit history in Australia takes time — start early and carefully.", steps: ["Australia has its own credit reporting system. Your credit history from Nepal does not transfer.", "To build credit: open a bank account, get a debit card, pay all bills on time, and after 6–12 months apply for a low-limit credit card.", "Good starter credit cards: ANZ First Visa, CommBank Low Rate Card — both designed for people with limited credit history.", "Never miss a repayment — even one late payment can affect your credit score for years.", "Check your credit score free at Equifax, Experian, or illion (all have free annual checks).", "Be wary of Buy Now Pay Later (BNPL) services like Afterpay — they don't build credit but missed payments harm it."], link: { label: "Check your credit score free — MoneySmart", url: "https://www.moneysmart.gov.au/borrowing-and-credit/credit-scores-and-credit-reports" }, tip: "Don't apply for multiple credit cards at once — each application shows on your credit file and too many applications lower your score." },
  { id: "home-loan", Icon: HouseIcon, title: "Home Loans for Migrants", summary: "Buying property in Australia as a migrant or temporary resident has specific rules.", steps: ["Temporary visa holders (e.g. student, 482) generally cannot buy established dwellings — you need FIRB (Foreign Investment Review Board) approval to buy new property only.", "Permanent residents and citizens can buy any property without FIRB approval.", "Most lenders require a minimum 20% deposit for non-citizens/non-PR holders. With less than 20%, you pay Lender's Mortgage Insurance (LMI).", "First Home Owner Grant (FHOG): available to PR holders and citizens buying a new home — amount varies by state (e.g. $10,000 in NSW, $30,000 in QLD).", "Stamp duty concessions for first home buyers also vary by state — check your state revenue office.", "Use a mortgage broker — they compare hundreds of lenders and their service is free (paid by the lender)."], link: { label: "FIRB rules for foreign buyers", url: "https://firb.gov.au/residential-land/temporary-residents" }, tip: "Don't buy before getting PR if you're on a temporary visa — the FIRB rules and higher deposit requirements make it significantly more expensive." },
  { id: "investing", Icon: TrendUpIcon, title: "Investing in Australia", summary: "Once you have stable income, investing is worth exploring — even small amounts compound significantly.", steps: ["Shares (stocks): you can invest in Australian or international shares through brokers like CommSec, SelfWealth, or Stake. Minimum amounts as low as $50.", "ETFs (Exchange Traded Funds) are a low-cost way to invest in hundreds of companies at once — Vanguard and iShares are popular in Australia.", "Investment income (dividends, capital gains) must be declared on your tax return — keep records of every transaction.", "Property investment: common among the Nepali community. Rental income is taxable but many expenses are deductible (interest, rates, depreciation).", "If you invest while on a temporary visa, be aware that capital gains tax rules differ for non-residents — get advice before selling.", "Super is already an investment — contribute extra (salary sacrifice) to boost tax-advantaged retirement savings."], link: { label: "Investing basics — MoneySmart", url: "https://www.moneysmart.gov.au/investing" }, tip: "Get financial advice from a licensed financial adviser (check ASIC's register at moneysmart.gov.au) before making large investment decisions." },
  { id: "remittance", Icon: MoneyIcon, title: "Sending Money to Nepal", summary: "Your bank's international transfer rate is almost never the best — use a specialist service.", steps: ["Bank wire transfers (SWIFT) typically charge $20–30 fee plus a poor exchange rate — costing you hundreds of dollars per year.", "Better alternatives: Wise (formerly TransferWise), Remitly, Western Union, IME Pay, Prabhu Money — all offer significantly better rates.", "Wise is best for transparency — it shows the real mid-market rate and exact fees before you send.", "IME Pay and Prabhu Money are popular in the Nepali community for direct bank-to-bank transfers in Nepal.", "Compare rates before every transfer — rates change daily and the gap between providers can be significant.", "For large amounts (AUD 10,000+), consider timing your transfer when AUD is strong against NPR."], link: { label: "Compare live remittance rates", url: "/send-money" }, tip: "Set up a rate alert on Wise or Remitly — they'll notify you when the AUD/NPR rate hits your target, so you don't have to watch it daily." },
  { id: "tfn-banking", Icon: ReceiptIcon, title: "Tax File Number and Banking", summary: "Your TFN connects your bank accounts and investments to the ATO for tax purposes.", steps: ["Provide your TFN to your bank when you open an account — without it, any interest earned is taxed at 47%.", "Provide your TFN to your super fund — without it, contributions are taxed at 47% instead of 15%.", "You are not legally required to give your TFN to a bank or super fund, but the tax penalty for not doing so is severe.", "Never give your TFN to anyone asking for it unexpectedly — it is a major target for identity theft.", "The ATO uses your TFN to pre-fill much of your tax return — making lodgement much easier.", "Apply for your TFN at ato.gov.au/tfn — it's free and takes 10–28 days to arrive by post."], link: { label: "Apply for a TFN — ATO", url: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn" }, tip: "Your TFN is yours for life — it doesn't change when you change visa status, employer, or become a citizen." },
];

const HEALTH = [
  { id: "medicare", Icon: HospitalIcon, title: "Medicare — What's Covered", summary: "Medicare is Australia's universal health system. Eligibility depends on your visa.", steps: ["Australian citizens, permanent residents, and citizens of eligible countries (Nepal is NOT on the list) are covered by Medicare.", "Eligible visa holders: 482 (TSS) and most sponsored work visas, student visas from reciprocal countries (not Nepal).", "Most Nepali migrants on temporary visas are NOT covered by Medicare — you need private health insurance or OSHC.", "To enrol in Medicare (if eligible), visit a Medicare centre with your passport, visa grant letter, and proof of address.", "Medicare covers: GP visits (bulk billed or with gap), hospital as a public patient, some allied health (with referral), most pathology and radiology.", "Medicare does NOT cover: dental, optical, most physiotherapy, ambulance, private hospital gap fees."], link: { label: "Check your Medicare eligibility — Services Australia", url: "https://www.servicesaustralia.gov.au/who-can-get-medicare" }, tip: "Even if you're eligible, you must actively enrol in Medicare — it doesn't happen automatically. Visit a service centre with your documents." },
  { id: "private-health", Icon: ShieldCheckIcon, title: "Private Health Insurance", summary: "Private health covers what Medicare doesn't, and is essential if you're not Medicare eligible.", steps: ["Private health has two components: hospital cover (private room, choice of specialist) and extras/ancillary cover (dental, optical, physio).", "If you're on a temporary visa without Medicare eligibility, hospital cover is legally required to avoid large out-of-pocket costs.", "Top private health insurers in Australia: Medibank, Bupa, HCF, nib, AHM — compare on privatehealth.gov.au.", "Waiting periods apply for most extras (2–12 months) and some hospital covers (12 months for pre-existing conditions).", "Lifetime Health Cover (LHC) loading: if you don't get hospital cover by age 31, you pay a 2% loading for every year you were without it when you do eventually take it out.", "Australian Resident cards (Medibank, BUPA) don't apply to temporary visa holders — you need a product specifically covering your visa type."], link: { label: "Compare health insurance — privatehealth.gov.au", url: "https://www.privatehealth.gov.au/healthinsurance/howitworks/comparetable.htm" }, tip: "When comparing, check the 'excess' (the amount you pay per hospital stay) and the specific list of hospitals your fund covers in your city." },
  { id: "oshc", Icon: GraduationCapIcon, title: "OSHC — Overseas Student Health Cover", summary: "Mandatory for international students — must be purchased before your visa is granted.", steps: ["OSHC (Overseas Student Health Cover) is a legal requirement for all student visa holders. Your university or college often arranges it for you.", "Approved OSHC providers: Medibank, Bupa, AHM, nib, CBHS Corporate Health — they all meet the same minimum benefit requirements.", "OSHC covers: doctor visits, some hospital treatment, limited pharmaceuticals (up to the PBS schedule).", "OSHC does NOT cover: dental (except emergency extractions), optical, physiotherapy, chiropractic — these need extras cover.", "OSHC covers your entire visa duration — if your visa is extended, extend your OSHC immediately to avoid a gap in cover.", "If your university arranged OSHC, check exactly what's covered — some institutional arrangements have lower benefit limits."], link: { label: "Understand OSHC coverage — OSHC World Care", url: "https://oshcworldcare.com.au/what-is-oshc/" }, tip: "You can switch OSHC providers during your course — you're not locked into the one your institution recommends. Compare and switch for better coverage." },
  { id: "gp", Icon: StethoscopeIcon, title: "Finding a Doctor (GP)", summary: "Your GP is your first point of contact for almost all health issues in Australia.", steps: ["GPs (General Practitioners) are your first contact — they refer you to specialists and manage ongoing conditions.", "Bulk billing means the GP charges Medicare directly — your cost is $0. Not all GPs bulk bill all patients.", "To find bulk billing GPs near you: use healthdirect.gov.au GP finder and filter by 'bulk billing'.", "Some Nepali community GPs speak Nepali — ask on the NepSaathi forum for recommendations in your city.", "For after-hours care: call 13SICK (13 7425) for a home visit, or visit a 24-hour medical centre.", "Telehealth: many GPs offer video/phone consultations — increasingly common and often bulk billed."], link: { label: "Find a GP near you — Healthdirect", url: "https://www.healthdirect.gov.au/australian-health-services" }, tip: "Register with one regular GP practice rather than going to different clinics each time — your GP builds your medical history and knows your background." },
  { id: "mental-health", Icon: BrainIcon, title: "Mental Health Support", summary: "Australia has strong mental health support — don't hesitate to seek help.", steps: ["Your GP can refer you to a psychologist under a Mental Health Treatment Plan — gives you 10 sessions per year significantly subsidised by Medicare.", "Without Medicare, psychologist costs are typically $150–$300 per session privately.", "Free national services: Lifeline 13 11 14 (24/7 crisis), Beyond Blue 1300 22 4636, Headspace (for under 25s).", "Many universities offer free counselling services for students — usually 3–6 sessions per semester.", "SANE Australia offers support specifically for complex mental illness — sane.org.", "Culture shock, homesickness, and migration stress are real — talking to a counsellor is a sign of strength, not weakness."], link: { label: "Find mental health support — Beyond Blue", url: "https://www.beyondblue.org.au/get-support/find-a-mental-health-professional" }, tip: "If you're struggling with homesickness or migration anxiety, you're not alone. The Nepali community in Australia is a strong support network — join local community groups." },
  { id: "dental-optical", Icon: ToothIcon, title: "Dental, Optical and Allied Health", summary: "Medicare doesn't cover these — plan ahead with extras insurance or savings.", steps: ["Dental: NOT covered by Medicare. A basic check-up and clean costs $150–$300. Fillings $150–$400. Emergency extraction $200+.", "Dental emergencies: Hospital emergency dental (public) is free but only for severe pain/swelling. Waiting lists for public dental can be years long.", "Student dental clinics at universities often offer discounted services performed by supervised final-year students.", "Optical: NOT covered by Medicare. Glasses frames $100–$600+. Lenses extra. Annual eye test (optometrist) is bulk billed by Medicare.", "Physiotherapy, chiropractic: NOT covered by Medicare unless specifically referred and under allied health plan.", "If you have private health extras cover, keep all receipts — most extras are refundable up to your annual limit."], link: { label: "Find a dentist — Australian Dental Association", url: "https://www.ada.org.au/find-a-dentist" }, tip: "Consider a health insurance policy with extras from day one — dental emergencies are common and very expensive without cover." },
  { id: "pharmacy", Icon: PillIcon, title: "Pharmacy and the PBS", summary: "Australia's Pharmaceutical Benefits Scheme (PBS) makes many medications highly affordable.", steps: ["PBS (Pharmaceutical Benefits Scheme) subsidises prescription medications for Medicare-eligible patients — co-payment is capped at around $7.70 (concessional) or $31.60 (general) per item.", "If you're not Medicare eligible, prescriptions are charged at the full price — often $50–$200 per item.", "Over-the-counter medications: available at pharmacies without prescription. Chemist Warehouse and Priceline are the most affordable chains.", "Bring any ongoing prescriptions from Nepal with a letter from your Nepali doctor — your Australian GP can review and re-prescribe locally.", "Some medications legal in Nepal are controlled substances in Australia — check the Therapeutic Goods Administration (TGA) before bringing them.", "Emergency contraception, antifungals, and many common medications are available over-the-counter (OTC) without prescription."], link: { label: "Check if a medication is on the PBS — PBS.gov.au", url: "https://www.pbs.gov.au/pbs/home" }, tip: "You don't need to go to the nearest pharmacy — prices vary significantly. Chemist Warehouse is almost always the cheapest option for over-the-counter items." },
];

const TAX = [
  { id: "tfn", Icon: IdentificationCardIcon, title: "Tax File Number (TFN)", summary: "Your TFN is your unique identifier with the Australian Tax Office — apply as soon as you arrive.", steps: ["A Tax File Number (TFN) is a 9-digit number the ATO uses to track your tax affairs. Every worker in Australia should have one.", "Apply online at ato.gov.au/tfn — takes about 10 minutes. You'll need your passport and visa details.", "Your TFN arrives by post to your Australian address in 10–28 days.", "Give your TFN to your employer on your first day — without it, you're taxed at the top rate (47%).", "Also give your TFN to your bank and super fund to avoid penalty tax rates on interest and contributions.", "Your TFN is yours for life. Keep it secret — sharing it unnecessarily risks identity theft."], link: { label: "Apply for a TFN — ATO", url: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn" }, tip: "Never pay anyone to get a TFN — it's free and takes 10 minutes online. If someone offers to 'arrange' it for a fee, it's a scam." },
  { id: "tax-return", Icon: ClipboardTextIcon, title: "Lodging Your Tax Return", summary: "The Australian financial year runs July 1 to June 30. Your return is due by October 31.", steps: ["The Australian financial year is 1 July to 30 June. Your tax return covers income in that period.", "Lodge your return online via myTax on myGov (ato.gov.au/mygov) — usually free and auto-filled from employer and bank data.", "The deadline is 31 October for self-lodgers. Using a registered tax agent gives you an extension (usually to May the following year).", "You'll need your group certificate (now called Income Statement) — your employer submits this to the ATO by 14 July.", "If you left Australia mid-year or were only here part of the year, you still need to lodge for the Australian-source income you earned.", "Most people get a refund — the average Australian tax refund is around $2,800."], link: { label: "Lodge via myTax — ATO", url: "https://www.ato.gov.au/individuals-and-families/lodging-your-tax-return/lodge-online-with-mytax" }, tip: "Link your myGov account to the ATO before 30 June — this pre-fills your return with employer, bank, and super data, making it much faster to lodge." },
  { id: "deductions", Icon: BriefcaseIcon, title: "Tax Deductions You Can Claim", summary: "Every legitimate deduction reduces your taxable income and increases your refund.", steps: ["Work-related expenses you can claim: work uniforms (if required), protective equipment, tools, professional subscriptions, union fees.", "Home office: if you work from home, you can claim a portion of electricity, internet, and phone costs.", "Self-education: if your course directly relates to your current job (not a new career), you can claim tuition and textbooks.", "Vehicle: if you use your own car for work (not commuting), you can claim 88 cents per kilometre (2024–25 rate).", "Charitable donations: donations of $2 or more to DGR (Deductible Gift Recipient) charities are deductible.", "Keep all receipts and records for 5 years — the ATO can audit any return in that period."], link: { label: "Deductions guide — ATO", url: "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim" }, tip: "You cannot claim the cost of commuting to and from work. 'Work-related' means while at work or between work sites, not travelling to work." },
  { id: "payslip", Icon: CalculatorIcon, title: "Understanding Your Payslip (PAYG)", summary: "PAYG withholding means your employer deducts tax from every pay — you reconcile at tax time.", steps: ["PAYG (Pay As You Go) withholding means your employer deducts estimated tax from each pay and sends it to the ATO.", "Your payslip should show: gross pay, tax withheld, super contribution (your employer's payment to your fund), and net pay.", "The tax withheld is based on your annual projected income. If your income varies, you may get a refund or owe more.", "Check your payslip every pay cycle: ensure your super is being paid and your tax rate looks correct for your income level.", "2024–25 tax rates: 0% on first $18,200 (tax-free threshold), 16% on $18,201–$45,000, 30% on $45,001–$135,000.", "Claim the tax-free threshold at only one employer — if you have two jobs, only claim it at the higher-paying one."], link: { label: "Income tax rates — ATO", url: "https://www.ato.gov.au/rates/individual-income-tax-rates/" }, tip: "Use the ATO's income tax calculator (ato.gov.au/calculators) to estimate your tax before lodging — it'll tell you if you'll get a refund or owe money." },
  { id: "abn", Icon: FileTextIcon, title: "ABN — Do You Need One?", summary: "An ABN is for businesses and the self-employed. You need one if you're contracting or running a business.", steps: ["ABN (Australian Business Number) is an 11-digit number for businesses and sole traders. It's free to apply at abr.gov.au.", "You need an ABN if you're running your own business, providing services as a contractor/freelancer, or driving for Uber/DiDi.", "Without an ABN, anyone paying you for business services must withhold 47% tax from your payment (top marginal rate).", "Registering for GST (Goods and Services Tax) is required if your business turnover is $75,000+ per year. If under $75,000, it's optional.", "ABN does NOT replace TFN — you use both. TFN is for personal income tax; ABN is for business tax obligations.", "Sole traders report business income on their personal tax return — there's no separate business tax return unless you operate as a company."], link: { label: "Apply for an ABN — ABR", url: "https://www.abr.gov.au/business-super-funds-charities/applying-for-an-abn" }, tip: "Don't register an ABN unless you're genuinely carrying on a business — the ATO cancels ABNs registered just to avoid tax withholding. Penalties apply." },
  { id: "gst", Icon: CurrencyDollarIcon, title: "GST and Business Tax", summary: "GST (Goods and Services Tax) is 10% on most goods and services sold in Australia.", steps: ["GST is 10% on most sales. If registered, you add GST to your prices, collect it from customers, and send it to the ATO.", "GST registered businesses can claim back the GST they pay on business purchases (input tax credits).", "Lodge a BAS (Business Activity Statement) quarterly or monthly to report and pay GST — available through myGov or your tax agent.", "Fringe benefits tax (FBT) applies if you provide non-cash benefits to employees (e.g. company car). Separate to income tax.", "Payroll tax is a state/territory tax on wages you pay employees — varies by state and threshold. Not paid to the ATO.", "Company tax rate is 25% for base rate entities (turnover under $50M) and 30% for larger companies."], link: { label: "GST explained — ATO", url: "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst" }, tip: "Keep business and personal expenses completely separate — use a dedicated business bank account and card from day one." },
  { id: "tax-agent", Icon: UserIcon, title: "Finding a Tax Agent", summary: "A registered tax agent handles your return, extends your deadline, and finds deductions you'd miss.", steps: ["Registered tax agents are licensed by the Tax Practitioners Board (TPB). Check the register at tpb.gov.au before engaging anyone.", "A tax agent's fee is itself tax deductible the following year — so their cost is partly offset.", "Using a registered tax agent gives you until May 15 the following year to lodge (instead of October 31).", "Accountants in the Nepali community often advertise in NepSaathi listings and the forum — searching 'Nepali accountant Sydney/Melbourne' gets results.", "Average cost for a simple individual tax return: $100–$250. Complex returns (investment property, multiple income sources) cost more.", "H&R Block, Etax.com.au, and Tax Return Sydney are online options for simpler returns at lower cost."], link: { label: "Find a registered tax agent — TPB", url: "https://www.tpb.gov.au/tax-agent-services/find-a-tax-practitioner" }, tip: "Never use an unregistered person to lodge your return — if they make mistakes, you're liable for the tax debt and penalties, not them." },
];

const WORK_RIGHTS = [
  { id: "visa-conditions", Icon: ClipboardTextIcon, title: "Your Visa Work Conditions", summary: "Your visa determines how many hours you can work — breaching conditions can cost you your visa.", steps: ["Student visa (subclass 500): 48 hours per fortnight during term. Unlimited hours during official university breaks.", "Graduate visa (subclass 485): full work rights, no hour restrictions.", "Skilled work visas (482 TSS, 186, 189, 190): full work rights, but typically tied to a specific employer and occupation.", "Visitor visa (subclass 600): generally NO work allowed, with limited exceptions.", "Working holiday visa (417/462): full work rights but limited to 6 months with any single employer.", "Check your exact conditions on your visa grant notice or at immi.homeaffairs.gov.au — conditions vary even within the same visa subclass."], link: { label: "Check your visa conditions — IMMI", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder" }, tip: "The 48-hour student visa fortnightly limit applies regardless of how many jobs you have — the total across all employers counts." },
  { id: "minimum-wage", Icon: CurrencyDollarIcon, title: "Minimum Wage and Pay Rates", summary: "The national minimum wage applies to every worker in Australia — regardless of visa or nationality.", steps: ["National minimum wage (2024–25): $24.10 per hour (updated 1 July each year by the Fair Work Commission).", "Casual employees receive a 25% casual loading on top of the minimum wage — compensating for no paid leave.", "Weekend and public holiday penalty rates apply in many industries. Check your Award at fairwork.gov.au.", "Modern Awards set industry-specific minimum rates — many are higher than the base minimum wage.", "Your employer CANNOT pay you less than the minimum wage, regardless of any agreement you signed.", "If paid in cash, you're still entitled to the minimum wage and super. Cash payment doesn't exempt employers from obligations."], link: { label: "Check the current minimum wage — Fair Work", url: "https://www.fairwork.gov.au/pay-and-wages/minimum-wages" }, tip: "Use the Fair Work Pay Calculator (fairwork.gov.au) to check exactly what you should be paid based on your industry, age, and employment type." },
  { id: "fair-work", Icon: ScalesIcon, title: "Fair Work Act — Your Rights", summary: "The Fair Work Act protects all workers in Australia, regardless of visa status.", steps: ["You are entitled to 10 National Employment Standards (NES) regardless of your contract, award, or visa.", "NES includes: maximum 38 ordinary hours per week, annual leave (4 weeks paid), personal/carer's leave (10 days paid), parental leave, public holidays.", "Casual employees don't get paid leave but accrue entitlements and may request conversion to permanent after 6–12 months.", "Your employer cannot take back wages already earned — attempting to do so is 'wage theft' and is a criminal offence in most states.", "You can check your employment status (employee vs independent contractor) using Fair Work's tools — misclassification as contractor to avoid entitlements is illegal.", "Unions in Australia are powerful and can provide free advice and representation — consider joining the relevant union for your industry."], link: { label: "Know your rights — Fair Work Ombudsman", url: "https://www.fairwork.gov.au/employee-entitlements/national-employment-standards" }, tip: "The Fair Work Ombudsman investigates complaints for free. You don't need a lawyer to lodge a complaint — and your immigration status does NOT disqualify you." },
  { id: "exploitation", Icon: WarningIcon, title: "Underpayment and Workplace Exploitation", summary: "Exploitation of migrant workers is a serious and prosecuted crime in Australia — report it.", steps: ["Common forms of exploitation: being paid below minimum wage, unpaid trial shifts, unlawful deductions, sham contracting, cash-in-hand with no super.", "Trial shifts: a 'working trial' of more than one hour is illegal without pay. Report extended unpaid trials immediately.", "Your employer cannot threaten to report your visa status in response to a pay dispute — this is illegal coercion and a serious criminal offence.", "The FWO (Fair Work Ombudsman) has a Migrant Worker Unit specifically for this — they work with interpreters and do not contact immigration without your consent.", "If you've been underpaid, you can recover back pay for up to 6 years. Keep payslips, bank statements, and any work records.", "Free legal help: Migrant Workers Centre, Community Legal Centres in each state, and Legal Aid all assist with wage theft cases."], link: { label: "Report underpayment anonymously — Fair Work", url: "https://www.fairwork.gov.au/about-us/contact-us/online-enquiries-and-complaints" }, tip: "Document everything: keep rosters, payslips, bank records, and any messages from your employer. This evidence is crucial for any underpayment claim." },
  { id: "safety", Icon: ShieldCheckIcon, title: "Workplace Health and Safety", summary: "Every worker has the right to a safe workplace. This is enforceable by law.", steps: ["Your employer must provide a safe working environment — this includes appropriate equipment, training, and protective gear at no cost to you.", "You have the right to refuse unsafe work without being penalised — document your refusal in writing.", "Workplace injuries must be reported to your employer immediately — delays can affect your workers' compensation claim.", "Workers' compensation covers medical costs and lost wages for work-related injuries — all employers must have this insurance.", "If injured, see a doctor immediately and get a certificate of capacity — this is required for your workers' comp claim.", "Safe Work Australia and state WHS regulators (WorkSafe Victoria, SafeWork NSW, etc.) investigate serious safety breaches."], link: { label: "Workers' rights & safety — Safe Work Australia", url: "https://www.safeworkaustralia.gov.au/workers" }, tip: "If you're asked to work in unsafe conditions, you can call Safe Work Australia's advisory line — they offer confidential guidance and don't immediately trigger an inspection." },
  { id: "super-rights", Icon: BriefcaseIcon, title: "Superannuation Entitlements", summary: "Super is part of your wages — your employer stealing super is a criminal offence.", steps: ["Your employer must pay 11.5% (2024–25) of your ordinary time earnings to your super fund — this is not optional.", "Super is due at least quarterly. If your employer is late paying, you're entitled to super guarantee charge (SGC) plus interest.", "Check your super contributions in myGov — go to ATO > Super to see all payments to your fund.", "If your employer hasn't been paying super, report it to the ATO — the ATO pursues super non-payment aggressively.", "Even if you're on a temporary visa and will leave Australia, you can claim your super back via DASP (Departing Australia Superannuation Payment).", "Super theft is a growing issue in hospitality and retail — common industries for Nepali workers. Check regularly."], link: { label: "Check super payments via myGov — ATO", url: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/check-your-super-account" }, tip: "Set a calendar reminder every quarter to log into myGov and verify your super contributions — catching non-payment early is much easier than chasing months of unpaid super." },
  { id: "dismissal", Icon: MegaphoneIcon, title: "Unfair Dismissal and Grievances", summary: "Australia has strong protections against unfair dismissal — act quickly if you're terminated unjustly.", steps: ["Unfair dismissal: if you've been employed for 6+ months (1 year for small businesses), you have the right to challenge a dismissal you believe was harsh, unjust, or unreasonable.", "You must file your unfair dismissal application within 21 days of termination — this deadline is strict.", "Applications are made to the Fair Work Commission online at fwc.gov.au. The fee is $79.90 and refunded if you win.", "General protections (adverse action): your employer cannot dismiss you for exercising a workplace right — e.g. making a complaint, taking sick leave, or joining a union.", "Redundancy: if your position is made redundant, you may be entitled to redundancy pay — calculated on years of service.", "HR complaints: start with your employer's internal grievance process, document everything, then escalate to Fair Work if unresolved."], link: { label: "Apply for unfair dismissal — Fair Work Commission", url: "https://www.fwc.gov.au/termination-employment/unfair-dismissal" }, tip: "Get advice before you resign under pressure — resigning may forfeit your unfair dismissal rights. Consult a union or employment lawyer first." },
];

const CHILDCARE = [
  { id: "childcare", Icon: BuildingsIcon, title: "Childcare and Early Learning", summary: "Australia's childcare system combines care with early education — starting from 6 weeks old.", steps: ["Types of care: long day care centres (0–5 years), family day care (home-based), out-of-school hours care (before/after school, vacation care).", "Childcare quality is rated by ACECQA (Australian Children's Education and Care Quality Authority) on a scale: Excellent, Meeting NQS, Working Towards NQS.", "Wait lists for popular childcare centres can be very long (6–24 months) — register when pregnant or as soon as you plan to use care.", "To find centres: use the Starting Blocks website (startingblocks.gov.au) to search by suburb, age, and care type.", "Most centres are privately run — fees vary significantly. Average long day care cost is around $120–$180 per day before the government subsidy.", "Preschool/kindy in the year before school is often offered by long day care centres and standalone kindergartens. Many states offer free or low-cost preschool."], link: { label: "Find childcare near you — Starting Blocks", url: "https://www.startingblocks.gov.au/find-child-care/" }, tip: "Join multiple waiting lists simultaneously — you can decline offers later. Getting on the list early is the only way to secure a spot at your preferred centre." },
  { id: "school", Icon: BooksIcon, title: "Enrolling Your Child in School", summary: "School enrolment is by residential zone — your address determines which public school your child attends.", steps: ["School starts between ages 4.5 and 6 depending on the state. Check your state's specific starting age requirements.", "Public schools are free (except for some activity fees). To enrol, contact your local public school — you'll need a birth certificate, immunisation records, and proof of address.", "International students on student visas must pay full school fees at public schools (around $5,000–$14,000/year depending on state) — unless a reciprocal arrangement applies.", "Children of 482 (TSS) visa holders generally attend public school for free — check your visa conditions and state government policy.", "Permanent residents and citizens: enrol at the local public school for free. You can also apply to a selective school or private school.", "Intensive English language programs are available at public schools for students with limited English — ask the school about ESL/EAL support."], link: { label: "School enrolment guide by state — Education.gov.au", url: "https://www.education.gov.au/australian-education-system/school-education" }, tip: "If your child has limited English, ask the school about EALD (English as an Additional Language or Dialect) support — most public schools have dedicated ESL programs and it's free." },
  { id: "ccs", Icon: CurrencyDollarIcon, title: "Child Care Subsidy (CCS)", summary: "The government pays most of your childcare fees directly to the provider — you only pay the gap.", steps: ["CCS (Child Care Subsidy) is the main government help with childcare costs. It's means-tested — the less you earn, the higher the subsidy.", "Eligibility: at least one parent must work, study, or be actively looking for work to qualify. Minimum 1 hour of work/activity per fortnight.", "CCS subsidises up to 90%+ of childcare fees for lower-income families. The maximum rate is 90% for families earning under $80,000.", "Apply through myGov — link your Centrelink account and complete the CCS application. Payments go directly to your childcare provider.", "Your child must be immunised (or have an approved exemption) and meet residency requirements for CCS.", "Higher Activity Test: the more hours you work/study, the more subsidised hours you receive (up to 100 hours per fortnight)."], link: { label: "Apply for CCS — Services Australia", url: "https://www.servicesaustralia.gov.au/child-care-subsidy" }, tip: "Apply for CCS before your child's first day — it takes 2–3 weeks to process and back-payments can be difficult to arrange. Apply as soon as you book your spot." },
  { id: "ftb", Icon: UsersThreeIcon, title: "Family Tax Benefit (FTB)", summary: "Family Tax Benefit is a fortnightly payment to help with the cost of raising children.", steps: ["FTB Part A: paid per child, based on family income. For families earning under $60,000, it's the full rate: around $220 per fortnight per child (under 12).", "FTB Part B: paid per family (not per child), especially for single income families or one parent who earns very little. Up to $194.60 per fortnight.", "Eligibility for both parts requires: child in your care, meeting income thresholds, child meeting immunisation requirements, and meeting residency requirements.", "Apply through myGov (Centrelink). You can also receive a lump sum at end of financial year if you prefer.", "Temporary visa holders are generally NOT eligible for FTB — it requires PR, citizenship, or specific humanitarian/protected visas.", "If your income changes, notify Centrelink immediately — overpayments must be repaid."], link: { label: "Family Tax Benefit — Services Australia", url: "https://www.servicesaustralia.gov.au/family-tax-benefit" }, tip: "Even if you think you earn too much, apply and check — the income thresholds are higher than many expect, and the cut-off phases in gradually rather than stopping abruptly." },
  { id: "child-health", Icon: HospitalIcon, title: "Child Health Checks", summary: "Australia has a comprehensive child health system — free health checks for children from birth.", steps: ["Maternal and child health services: provided free by local councils from birth. Includes regular weight and developmental checks for babies and toddlers.", "Immunisation schedule: Australia has a comprehensive free immunisation schedule from birth to 4 years, and teen boosters. Required for CCS and FTB.", "The Australian Immunisation Register (AIR) tracks all vaccinations — get your child's history from myGov or your GP.", "Healthy Kids Check: a free health check for 4-year-olds before starting school, through your GP (bulk billed by Medicare).", "School dental program: most states have free dental checks for school-age children — ask your school or council about the program in your area.", "If you're concerned about your child's development: ask your GP or MCH nurse for a referral to a paediatrician (Medicare subsidised)."], link: { label: "Child health and development — Raising Children Network", url: "https://raisingchildren.net.au/health" }, tip: "The Raising Children Network (raisingchildren.net.au) is the Australian government's parenting resource — it's available in multiple languages including Nepali." },
  { id: "holiday-programs", Icon: BackpackIcon, title: "School Holiday Programs", summary: "School holidays run 12 weeks per year — planned care is essential for working parents.", steps: ["Australia has four school terms with holidays in between: 6 weeks in summer (Dec–Jan), 2 weeks in April, 2 weeks in July, 2 weeks in September/October.", "Outside School Hours Care (OSHC) provides before school, after school, and vacation care — offered at or near most primary schools.", "CCS applies to OSHC vacation care as well as regular before/after school care — reducing costs significantly.", "Many councils, libraries, and community centres run free or low-cost holiday programs — check your local council website.", "Nepali community groups often organise holiday activities for children — cultural events, language classes, sports.", "Work with your employer ahead of time on flexibility during school holidays — especially for parents without family support networks in Australia."], link: { label: "Find out-of-school-hours care — Starting Blocks", url: "https://www.startingblocks.gov.au/child-care-and-early-learning/types-of-child-care/outside-school-hours-care/" }, tip: "Book vacation care spots well in advance — popular OSHC programs fill up within days of booking opening, especially for summer holidays." },
  { id: "family-support", Icon: HandshakeIcon, title: "Family Support Services", summary: "Australia has extensive support services for families — you don't need to navigate it alone.", steps: ["Parenting Line: call 1300 30 1300 for free parenting support and advice — available in most states.", "Family support services: offered through state governments, Headspace for teens, and community organisations.", "Domestic violence support: 1800RESPECT (1800 737 732) — confidential 24/7 support for domestic and family violence.", "Nepali community organisations in each major city: they run family support programs, cultural events, and can connect you with services in Nepali language.", "Settlement services for newly arrived migrants: AMES Australia, CatholicCare, Multicultural NSW, Settlement Services International — all offer free family support.", "Interpreter services: the Translating and Interpreting Service (TIS National) is free for interactions with most government services — call 131 450."], link: { label: "Family support services — DSS.gov.au", url: "https://www.dss.gov.au/families-and-children" }, tip: "The TIS (Translating and Interpreting Service) at 131 450 is free and available 24/7 for Nepali speakers — use it for any official appointment where language is a barrier." },
];

// ─── Guide configs ─────────────────────────────────────────────────────────────

const GUIDES = {
  banking: {
    label: "Banking & Finance",
    metaTitle: "Banking & Finance Guide for Nepalis in Australia",
    metaDesc: "Complete guide to banking, superannuation, home loans, investing and sending money to Nepal for Nepali migrants in Australia.",
    accent: "#1A6B3C", accentLight: "#E8F5EE", accentBorder: "#A7D7BC", accentDark: "#145530",
    gradient: "linear-gradient(135deg, #1A6B3C 0%, #15803D 60%, #16A34A 100%)",
    heroIcons: [BankIcon, CurrencyDollarIcon],
    heroTitle: "Banking & Finance in Australia",
    heroSubtitle: "Bank accounts, superannuation, home loans, investing and sending money home — everything Nepali migrants need to manage money in Australia.",
    heroLinks: [{ to: "/send-money", label: "Compare Remittance Rates" }, { to: "/new-to-australia", label: "New to Australia Guide" }],
    ctaTitle: "Have a finance question?",
    ctaBody: "Ask the NepSaathi community — Nepali accountants, mortgage brokers, and financial advisers are active on the forum.",
    sections: BANKING,
  },
  health: {
    label: "Health",
    metaTitle: "Health & Insurance Guide for Nepalis in Australia",
    metaDesc: "Complete guide to Medicare, private health insurance, OSHC, mental health, dental, optical, and finding a doctor for Nepali migrants in Australia.",
    accent: "#0369A1", accentLight: "#E0F2FE", accentBorder: "#7DD3FC", accentDark: "#025582",
    gradient: "linear-gradient(135deg, #0369A1 0%, #0284C7 60%, #0EA5E9 100%)",
    heroIcons: [HospitalIcon, ShieldCheckIcon],
    heroTitle: "Health & Insurance in Australia",
    heroSubtitle: "Medicare, private health insurance, OSHC for students, mental health, dental and finding a doctor — what every Nepali migrant needs to know.",
    heroLinks: [{ to: "/new-to-australia", label: "New to Australia Guide" }, { to: "/forum", label: "Ask the Community" }],
    ctaTitle: "Health question for the community?",
    ctaBody: "Nepali doctors, nurses, and healthcare professionals in Australia are active on the NepSaathi forum.",
    sections: HEALTH,
  },
  tax: {
    label: "Tax",
    metaTitle: "Tax & Accounting Guide for Nepalis in Australia",
    metaDesc: "Complete guide to TFN, tax returns, deductions, PAYG, ABN, GST and finding a tax agent for Nepali migrants in Australia.",
    accent: "#B45309", accentLight: "#FEF3C7", accentBorder: "#FCD34D", accentDark: "#92400E",
    gradient: "linear-gradient(135deg, #92400E 0%, #B45309 60%, #D97706 100%)",
    heroIcons: [ReceiptIcon, ClipboardTextIcon],
    heroTitle: "Tax & Accounting in Australia",
    heroSubtitle: "TFN, tax returns, deductions, PAYG, ABN and GST — everything Nepali migrants need to know about Australian tax obligations.",
    heroLinks: [{ to: "/new-to-australia", label: "New to Australia Guide" }, { to: "/forum", label: "Ask the Community" }],
    ctaTitle: "Tax question for the community?",
    ctaBody: "Nepali accountants and tax agents in Australia are active on the NepSaathi forum — get free advice from the community.",
    sections: TAX,
  },
  "work-rights": {
    label: "Work Rights",
    metaTitle: "Work Rights & Legal Guide for Nepalis in Australia",
    metaDesc: "Complete guide to visa work conditions, minimum wage, Fair Work rights, underpayment, workplace safety, superannuation, and unfair dismissal for Nepali migrants in Australia.",
    accent: "#6D28D9", accentLight: "#EDE9FE", accentBorder: "#C4B5FD", accentDark: "#4C1D95",
    gradient: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)",
    heroIcons: [ScalesIcon, ShieldCheckIcon],
    heroTitle: "Work Rights & Legal in Australia",
    heroSubtitle: "Visa work conditions, minimum wage, Fair Work rights, underpayment and exploitation — know your rights as a Nepali worker in Australia.",
    heroLinks: [{ href: "https://www.fairwork.gov.au", label: "Fair Work Ombudsman" }, { to: "/forum", label: "Ask the Community" }],
    ctaTitle: "Work rights question for the community?",
    ctaBody: "Nepali lawyers, migration agents, and HR professionals in Australia are active on the NepSaathi forum — get advice from the community.",
    sections: WORK_RIGHTS,
  },
  childcare: {
    label: "Childcare & Family",
    metaTitle: "Childcare & Family Guide for Nepalis in Australia",
    metaDesc: "Complete guide to childcare, school enrolment, Child Care Subsidy, Family Tax Benefit, child health, and family support services for Nepali families in Australia.",
    accent: "#BE185D", accentLight: "#FCE7F3", accentBorder: "#F9A8D4", accentDark: "#9D174D",
    gradient: "linear-gradient(135deg, #9D174D 0%, #BE185D 60%, #DB2777 100%)",
    heroIcons: [UsersThreeIcon, BuildingsIcon],
    heroTitle: "Childcare & Family in Australia",
    heroSubtitle: "Childcare, school enrolment, Child Care Subsidy, Family Tax Benefit, and family support services — everything Nepali families need to know in Australia.",
    heroLinks: [{ to: "/new-to-australia", label: "New to Australia Guide" }, { to: "/forum", label: "Ask the Community" }],
    ctaTitle: "Family question for the community?",
    ctaBody: "Connect with Nepali parents, childcare workers, and teachers in Australia on the NepSaathi forum.",
    sections: CHILDCARE,
  },
};

const TABS = [
  { key: "banking", label: "Banking & Finance" },
  { key: "health", label: "Health" },
  { key: "tax", label: "Tax" },
  { key: "work-rights", label: "Work Rights" },
  { key: "childcare", label: "Childcare & Family" },
];

// ─── GuideContent (remounts on tab switch via key prop) ───────────────────────

function GuideContent({ guide }) {
  const { accent, accentLight, accentBorder, accentDark, sections, ctaTitle, ctaBody } = guide;
  const [open, setOpen] = useState(null);
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const navRef = useRef(null);

  const toggle = (id) => setOpen((prev) => (prev === id ? null : id));

  useEffect(() => {
    const observers = [];
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(s.id); },
        { threshold: 0.2, rootMargin: "-100px 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  useEffect(() => {
    if (!navRef.current) return;
    const btn = navRef.current.querySelector(`[data-id="${activeSection}"]`);
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

  const scrollToSection = (id) => {
    setOpen(id);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 148;
      window.scrollTo({ top, behavior: "smooth" });
    }, 20);
  };

  return (
    <>
      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: "102px", zIndex: 88 }}>
        <style>{`.guide-snav::-webkit-scrollbar{display:none}`}</style>
        <div ref={navRef} className="guide-snav" style={{ display: "flex", maxWidth: "900px", margin: "0 auto", padding: "0 8px 2px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} data-id={s.id} onClick={() => scrollToSection(s.id)} style={{ background: "none", border: "none", boxShadow: isActive ? `inset 0 -2px 0 0 ${accent}` : "none", padding: "12px 12px", fontSize: "12px", fontWeight: 600, color: isActive ? accent : "#64748b", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s", display: "flex", alignItems: "center", gap: "5px" }}>
                {s.Icon && <s.Icon size={15} weight="duotone" color={isActive ? accent : "#64748b"} />}
                {s.title.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {sections.map((s) => {
            const isOpen = open === s.id;
            return (
              <div key={s.id} id={s.id} style={{ background: "#fff", border: `1.5px solid ${isOpen ? accent : "#e8eaf0"}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s" }}>
                <button onClick={() => toggle(s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ flexShrink: 0 }}>{s.Icon && <s.Icon size={28} weight="duotone" color={accent} />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "2px" }}>{s.title}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.4 }}>{s.summary}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 20px 20px" }}>
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                      <ol style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px" }}>
                        {s.steps.map((step, i) => <li key={i} style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>{step}</li>)}
                      </ol>
                      <div style={{ marginTop: "16px", background: accentLight, border: `1px solid ${accentBorder}`, borderRadius: "8px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <LightbulbIcon size={18} weight="fill" color={accent} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span style={{ fontSize: "13px", color: accent, lineHeight: 1.55 }}>{s.tip}</span>
                      </div>
                      {s.link.url.startsWith("/") ? (
                        <Link to={s.link.url} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "14px", fontSize: "13px", fontWeight: 600, color: accent, textDecoration: "none" }}>
                          {s.link.label}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </Link>
                      ) : (
                        <a href={s.link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "14px", fontSize: "13px", fontWeight: 600, color: accent, textDecoration: "none" }}>
                          {s.link.label}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "40px", background: `linear-gradient(135deg, ${accentDark}, ${accent})`, borderRadius: "16px", padding: "32px 24px", textAlign: "center", color: "#fff" }}>
          <HandshakeIcon size={40} weight="duotone" color="#fff" style={{ marginBottom: "12px", opacity: 0.85 }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>{ctaTitle}</h2>
          <p style={{ fontSize: "14px", opacity: 0.85, marginBottom: "20px", lineHeight: 1.6 }}>{ctaBody}</p>
          <Link to="/forum" style={{ display: "inline-block", background: "#fff", color: accent, borderRadius: "8px", padding: "12px 24px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>Ask on the Forum</Link>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GuidesPage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const activeKey = GUIDES[topic] ? topic : "banking";
  const guide = GUIDES[activeKey];

  usePageMeta(guide.metaTitle, guide.metaDesc);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: guide.gradient, padding: "48px 24px 40px", textAlign: "center", color: "#fff" }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "14px" }}>
          {guide.heroIcons.map((Icon, i) => <Icon key={i} size={38} weight="duotone" color="#fff" style={{ opacity: 0.9 }} />)}
        </div>
        <h1 style={{ fontSize: "clamp(22px,5vw,34px)", fontWeight: 800, marginBottom: "10px", letterSpacing: "-0.5px" }}>{guide.heroTitle}</h1>
        <p style={{ fontSize: "clamp(13px,2vw,16px)", opacity: 0.9, maxWidth: "500px", margin: "0 auto 20px", lineHeight: 1.6 }}>{guide.heroSubtitle}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {guide.heroLinks.map(({ to, href, label }) =>
            href ? (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>{label}</a>
            ) : (
              <Link key={label} to={to} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: "8px", padding: "10px 20px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>{label}</Link>
            )
          )}
        </div>
      </div>

      <div style={{ background: "#fff", borderBottom: "1px solid #e8eaf0", position: "sticky", top: "56px", zIndex: 90 }}>
        <style>{`.guide-tabs::-webkit-scrollbar{display:none}`}</style>
        <div className="guide-tabs" style={{ display: "flex", maxWidth: "900px", margin: "0 auto", padding: "0 8px", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {TABS.map(({ key, label }) => {
            const isActive = key === activeKey;
            return (
              <button key={key} onClick={() => navigate(`/guides/${key}`)} style={{ background: "none", border: "none", padding: "13px 14px", fontSize: "13px", fontWeight: isActive ? 700 : 500, color: isActive ? guide.accent : "#64748b", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: isActive ? `inset 0 -2px 0 0 ${guide.accent}` : "none", transition: "color 0.15s" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <GuideContent key={activeKey} guide={guide} />
    </div>
  );
}
