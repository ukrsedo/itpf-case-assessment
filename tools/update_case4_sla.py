from pathlib import Path
import json

old_case = """Case #4: Contact Center Renewal Negotiations\n\nBackground:\nState-owned company. \nBalancing strict Business SLA with cost-efficiency goals.\nThe end-user (Customer Service) established tight bonds with the supplier and implemented a few informal agreements (deviating from the contract).\nTiered pricing is based on resources/rates. Present consumption is at Tier 4.\nSLA compliance: 80% response rate mandated by the law.\nSupplier sought to recover account acquisition investments through extra charges.\n\nTier 4"""

new_case = """Case #4: Contact Center Renewal Negotiations\n\nBackground:\nState-owned company.\nBalancing strict Business SLA with cost-efficiency goals.\nThe end-user (Customer Service) established tight bonds with the supplier and implemented a few informal agreements (deviating from the contract).\nTiered pricing is based on resources/rates. Present consumption is at Tier 4.\nCurrent Business SLA: daily 90% within 20 seconds for all lines of business.\nLegal minimum: 80% response rate mandated by law.\nSupplier sought to recover account acquisition investments through extra charges.\n\nCurrent Tier 4 basis:\n- 4,501–5,500 transactions per day.\n- 85 agents at a rate of 7,500.\n- 6 team leaders at a rate of 9,200.\n- 4 quality-assurance resources at a rate of 8,500."""

old_js = json.dumps(old_case, ensure_ascii=False)
new_js = json.dumps(new_case, ensure_ascii=False)

p = Path('cases.js')
s = p.read_text()
if old_js not in s:
    raise SystemExit('CASE-04 target not found in cases.js')
p.write_text(s.replace(old_js, new_js, 1))

p = Path('worker.js')
s = p.read_text()
if old_js not in s:
    raise SystemExit('CASE-04 authoritative content not found in worker.js')
s = s.replace(old_js, new_js, 1)
old_guidance = old_case + "\n\nWhat will be your negotiation strategy?\n\nSLA\nContract compliance (Tier allocation)\nResource allocation\nRates."
new_guidance = new_case + "\n\nWhat will be your negotiation strategy?\n\nSLA\nContract compliance (Tier allocation)\nResource allocation\nRates."
old_g = json.dumps(old_guidance, ensure_ascii=False)
new_g = json.dumps(new_guidance, ensure_ascii=False)
if old_g not in s:
    raise SystemExit('CASE-04 guidance not found in worker.js')
p.write_text(s.replace(old_g, new_g, 1))

p = Path('assessment-rules.json')
data = json.loads(p.read_text())
data.setdefault('caseSpecificRules', {})['CASE-04'] = [
    'Question 1 should recommend a negotiation strategy across SLA, contract compliance/tier allocation, resource allocation, rates and extra charges using only the supplied case facts.',
    'Recognize that the current Business SLA is daily 90% within 20 seconds for all lines of business, while the legal minimum is an 80% response rate.',
    'A strong answer should challenge whether the 90%/20-second Business SLA is still justified by business need and customer impact; do not assume that the SLA should automatically be reduced to the 80% legal minimum.',
    'For staffing and tier allocation, use the supplied Tier 4 basis: 4,501–5,500 transactions per day, 85 agents, 6 team leaders and 4 quality-assurance resources. Students should test whether actual demand still supports Tier 4 and its resource mix.',
    "For rates, challenge the stated rate structure and supplier extra charges, including the supplier's attempt to recover account-acquisition investment; do not accept those charges merely because the supplier incurred them.",
    'For informal agreements, require the student to identify the governance and contract-compliance risk and recommend that any necessary arrangement be formally reviewed, approved and incorporated into the contract rather than left as an informal side agreement.',
    'Do not require a specific SLA reduction, staffing cut or saving amount unless the student explicitly states an assumption; the case does not provide actual performance data or observed transaction volumes beyond the current Tier 4 basis.'
]
p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

# trigger run
