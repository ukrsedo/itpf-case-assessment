import json
import re
from pathlib import Path

p = Path('worker.js')
s = p.read_text()

briefing = '''Opportunity cost is the value of the best alternative forgone when a decision is made. In sourcing, this means considering not only the direct cost of each option, but also the economic benefits that may be lost by choosing one alternative instead of another.

In 2016, British Airways outsourced more than 700 UK-based IT roles.

For this exercise, assume BA was comparing two sourcing alternatives over a five-year period:
- Keep the IT activities in-house: £720 million five-year TCO.
- Outsource the IT activities: £540 million five-year TCO.

In 2017, BA experienced a major IT disruption affecting approximately 75,000 passengers, with reported losses of nearly £150 million. For this exercise, assume that retaining stronger internal IT capability would have prevented this loss.

Also assume that each of the 700 internal IT employees supports £350,000 of company revenue per year and that BA operates at a 5% profit margin. Revenue itself should not be compared directly with sourcing savings, so any economic comparison should use the profit contribution associated with that revenue.

Your task is to compare the sourcing alternatives using TCO, opportunity cost, retained capability and business continuity rather than supplier cost alone.'''

questions = [
    'Compare the economic opportunity costs of the two sourcing options using the information provided. Show your calculations.',
    'Which sourcing option appears economically preferable over five years, and why?',
    'What assumptions or risks could change that conclusion?'
]

guidance = '''Opportunity cost is the value of the best alternative forgone when a decision is made.

For this exercise, compare two five-year sourcing alternatives:
- In-house TCO: £720 million.
- Outsourced TCO: £540 million.

The opportunity cost of choosing in-house is the £180 million five-year TCO advantage forgone by not outsourcing.

For the outsourcing alternative, use the student-facing assumptions to value benefits forgone by not retaining internal capability:
- 700 FTE x £350,000 revenue supported per year x 5% profit margin x 5 years = £61.25 million five-year profit contribution.
- The case instructs students to assume that retaining stronger internal IT capability would have prevented the £150 million disruption loss.
- Under those explicit exercise assumptions, the quantified benefits forgone by outsourcing total £211.25 million.

Do not compare revenue directly with savings; apply the 5% profit margin first.

Under the stated assumptions, the economic comparison is £180 million versus £211.25 million, a £31.25 million advantage for insourcing. The third question should test the assumptions, especially whether insourcing really would have prevented the full disruption loss and whether revenue-supported-per-FTE is a valid proxy for economic value.

Score the student's reasoning against the three student questions. A different sourcing recommendation can still receive full credit if the student explicitly challenges an assumption and explains how that changes the economics.'''

cstart = s.index('"CASE-02"')
cend = s.index('"CASE-03"', cstart)
block = s[cstart:cend]

block, n1 = re.subn(r'"authoritativeCaseContent"\s*:\s*"(?:\\.|[^"\\])*"', '"authoritativeCaseContent":' + json.dumps(briefing, ensure_ascii=False), block, count=1, flags=re.S)
block, n2 = re.subn(r'"studentQuestions"\s*:\s*\[.*?\]', '"studentQuestions":' + json.dumps(questions, ensure_ascii=False), block, count=1, flags=re.S)
block, n3 = re.subn(r'"embeddedCourseGuidance"\s*:\s*.*?(?=,"source"\s*:)', '"embeddedCourseGuidance":' + json.dumps(guidance, ensure_ascii=False), block, count=1, flags=re.S)

if not (n1 and n2 and n3):
    raise RuntimeError(f'Patch failed: authoritative={n1}, questions={n2}, guidance={n3}')

s = s[:cstart] + block + s[cend:]

old = 'CASE-02 SPECIAL RULE: Never require, infer, or score against the £62.5 million opportunity-cost calculation. It is not a required student calculation. Assess the opportunity-cost question conceptually using the case information available to the student. A student can receive 5/5 without providing a numerical opportunity-cost figure.'
new = 'CASE-02 SPECIAL RULE: Use only the current student-facing Case 2 assumptions and questions. Require the numerical opportunity-cost comparison requested in Question 1. Do not use or mention the obsolete £62.5 million tutor calculation. Apply the stated 5% profit margin before converting revenue-supported-per-FTE into economic value.'
if old in s:
    s = s.replace(old, new)

p.write_text(s)
