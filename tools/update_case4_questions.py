from pathlib import Path
import json

replacements = {
    "What negotiation strategy would you recommend?": "What negotiation strategy would you recommend for the contract renewal?",
    "Should procurement challenge the SLA and staffing assumptions?": "What information should procurement obtain or validate before entering the negotiation?",
    "How should informal agreements be handled?": "What are the main risks if the company renews the contract without resolving the current issues?"
}

for filename in ['cases.js', 'worker.js']:
    p = Path(filename)
    s = p.read_text(encoding='utf-8')
    for old, new in replacements.items():
        count = s.count(old)
        if count != 1:
            raise SystemExit(f'{filename}: expected exactly one occurrence of {old!r}, found {count}')
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')

p = Path('assessment-rules.json')
data = json.loads(p.read_text(encoding='utf-8'))
data['caseSpecificRules']['CASE-04'] = [
    "Question 1 should recommend an integrated renewal negotiation strategy using only the supplied facts. A strong answer should address the current 90% within 20 seconds Business SLA versus the 80% legal minimum, Tier 4 demand and staffing, rates and extra charges, and the informal contractual deviations.",
    "Question 1 should not assume that the Business SLA must be reduced to the legal minimum; students should test whether the 90%/20-second requirement remains justified by business need and customer impact.",
    "Question 2 is an information-gap question, not a repeat of the negotiation strategy. Credit students for identifying evidence procurement should obtain or validate before negotiation, especially actual transaction volumes, actual SLA performance, staffing utilisation/productivity, whether Tier 4 remains the correct tier, the basis and benchmark for rates, the justification for extra charges, and the scope/status of informal agreements.",
    "Question 2 does not require students to invent missing data or calculate a specific staffing reduction or saving.",
    "Question 3 should identify risks evidenced by the case if renewal proceeds without resolving the issues: overpaying for unnecessary capacity or an unnecessarily demanding SLA, accepting unsupported supplier charges, remaining in an incorrect pricing tier or staffing model, contract leakage and ambiguity from informal agreements, and weakened buyer control caused by the close end-user/supplier relationship.",
    "For Question 3, accept equivalent risk wording where it is clearly tied to the supplied case facts; do not require detailed governance mechanisms that the case does not provide enough information to design.",
    "Do not require a specific SLA reduction, staffing cut, target tier or saving amount unless the student explicitly states an assumption."
]
p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# trigger workflow v2
