const app=document.getElementById('app');
let state={case:null,result:null,challengeAnswers:[],submissionAttempted:false};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const button=(text,fn,cls='')=>{const b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;return b};
function set(html){app.innerHTML=html;window.scrollTo({top:0,behavior:'smooth'})}
function showCases(){state={case:null,result:null,challengeAnswers:[],submissionAttempted:false};set(`<h2>Select a case</h2><div class="case-grid">${window.CASES.map(c=>`<button class="case-button" data-id="${c.caseId}"><span>${c.caseId}</span>${esc(c.title)}</button>`).join('')}</div>`);app.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>showCase(b.dataset.id))}
function showCase(id){const c=window.CASES.find(x=>x.caseId===id);state={case:c,result:null,challengeAnswers:[],submissionAttempted:false};set(`<h2>${esc(c.title)}</h2><div class="case-text">${esc(c.authoritativeCaseContent)}</div><h3>Student questions</h3><ol>${c.studentQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><p class="notice">Ready to answer? Please provide short bullet points only.</p><div class="actions" id="caseActions"></div>`);const a=document.getElementById('caseActions');a.append(button('Answer this case',showAnswerForm));a.append(button('Back to cases',showCases,'secondary'))}
function showAnswerForm(){const c=state.case;set(`<h2>${esc(c.title)}</h2><form id="answerForm">${c.studentQuestions.map((q,i)=>`<div class="question"><label for="a${i}">${i+1}. ${esc(q)}</label><textarea id="a${i}" placeholder="Enter short bullet points"></textarea></div>`).join('')}<div id="formMessage"></div><div class="actions"><button type="submit">Assess answer</button><button type="button" id="back" class="secondary">Back to case</button></div></form>`);document.getElementById('answerForm').onsubmit=submitAssessment;document.getElementById('back').onclick=()=>showCase(c.caseId)}
async function submitAssessment(e){e.preventDefault();const answers=state.case.studentQuestions.map((_,i)=>document.getElementById(`a${i}`).value.trim());const msg=document.getElementById('formMessage');if(answers.some(x=>!x)){msg.innerHTML='<p class="notice error">Please answer all questions.</p>';return}await callAssessment({caseId:state.case.caseId,answers,challengeAnswers:[]})}
async function callAssessment(payload){const url=window.PORTAL_CONFIG?.assessCaseUrl;if(!url||url.includes('YOUR-WORKER')){set('<p class="notice error">The case assessment Worker URL is not configured in config.js.</p><div class="actions" id="retry"></div>');document.getElementById('retry').append(button('Back',showAnswerForm,'secondary'));return}set('<div class="loading"><span class="spinner"></span><strong>Assessing your response against the course material…</strong></div>');try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({message:`Assessment failed (${r.status}).`}));if(!r.ok)throw new Error(data.message||`Assessment failed (${r.status}).`);state.result=data;renderResult()}catch(err){set(`<p class="notice error">${esc(err.message)}</p><div class="actions" id="retry"></div>`);document.getElementById('retry').append(button('Try again',showAnswerForm));document.getElementById('retry').append(button('Choose another case',showCases,'secondary'))}}
function renderResult(){const r=state.result;set(`<h2>Assessment result</h2><p class="score">${esc(r.score)}/5</p><div class="feedback-card"><h3>What is correct</h3><ul>${(r.correctPoints||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>No material correct point was identified.</li>'}</ul></div><div class="feedback-card"><h3>Most important missing point</h3><p>${esc(r.missingPoint)}</p></div><div class="feedback-card"><h3>Stronger answer</h3><ul>${(r.strongerAnswer||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>${r.challengeRequired&&r.challengeQuestions?.length?challengeHtml(r.challengeQuestions):recordHtml()}<div class="actions" id="resultActions"></div>`);const a=document.getElementById('resultActions');if(r.challengeRequired&&r.challengeQuestions?.length)a.append(button('Answer challenge question',showChallengeForm));else bindRecordButtons();a.append(button('Choose another case',showCases,'secondary'))}
function challengeHtml(qs){return `<div class="challenge-box"><h3>Challenge question${qs.length>1?'s':''}</h3><ol>${qs.map(q=>`<li>${esc(q)}</li>`).join('')}</ol></div>`}
function recordHtml(){return `<div class="feedback-card"><h3>Record score</h3><p>Would you like to record your score for this course?</p><div id="recordButtons" class="actions"></div></div>`}
function bindRecordButtons(){const x=document.getElementById('recordButtons');if(!x)return;x.append(button('YES',showSubmit));x.append(button('NO',showCases,'secondary'))}
function showChallengeForm(){const qs=state.result.challengeQuestions;set(`<h2>Challenge question${qs.length>1?'s':''}</h2><form id="challengeForm">${qs.map((q,i)=>`<div class="question"><label for="c${i}">${i+1}. ${esc(q)}</label><textarea id="c${i}" placeholder="Enter short bullet points"></textarea></div>`).join('')}<div id="challengeMessage"></div><div class="actions"><button type="submit">Submit challenge response</button></div></form>`);document.getElementById('challengeForm').onsubmit=async e=>{e.preventDefault();const vals=qs.map((_,i)=>document.getElementById(`c${i}`).value.trim());if(vals.some(v=>!v)){document.getElementById('challengeMessage').innerHTML='<p class="notice error">Please answer all challenge questions.</p>';return}state.challengeAnswers=vals;await callAssessment({caseId:state.case.caseId,answers:[],challengeAnswers:vals,previousAssessment:state.result})}}
function showSubmit(){set(`<h2>Record score</h2><p>Assessment: <strong>${state.case.caseId}</strong></p><p>Score: <strong>${state.result.score}/5</strong></p><label>Student ID <input id="sid" placeholder="YYMMDD-##"></label><div id="submitMessage"></div><div class="actions" id="submitActions"></div>`);const a=document.getElementById('submitActions');a.append(button('Submit score',submitScore));a.append(button('Do not record',showCases,'secondary'))}
async function submitScore(){const sid=document.getElementById('sid').value.trim(),msg=document.getElementById('submitMessage');if(!/^\d{6}-\d{2}$/.test(sid)){msg.innerHTML='<p class="notice error">Student ID format is invalid.</p>';return}if(state.submissionAttempted){msg.innerHTML='<p class="notice error">This result has already been submitted, or submission was already attempted.</p>';return}const url=window.PORTAL_CONFIG?.submitAssessmentUrl;if(!url){msg.innerHTML='<p class="notice error">Score submission URL is not configured.</p>';return}state.submissionAttempted=true;try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({StudentID:sid,AssessmentID:state.case.caseId,Score:Number(state.result.score)})});let body;try{body=await r.json()}catch{body=await r.text()}msg.innerHTML=`<p class="notice ${r.ok?'':'error'}">${r.ok?'Score successfully recorded.':esc(body?.message||body||`Submission failed (${r.status}).`)}</p>`}catch(e){msg.innerHTML=`<p class="notice error">${esc(e.message)}</p>`}}
async function getStudentResults(){const sid=document.getElementById('resultsStudentId').value.trim(),msg=document.getElementById('studentResultsMessage'),output=document.getElementById('studentResultsOutput');output.innerHTML='';if(!/^\d{6}-\d{2}$/.test(sid)){msg.innerHTML='<p class="notice error">Student ID format is invalid.</p>';return}const url=window.PORTAL_CONFIG?.getStudentResultsUrl;if(!url){msg.innerHTML='<p class="notice error">Student results URL is not configured.</p>';return}msg.innerHTML='<p class="notice">Loading results…</p>';try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({StudentID:sid})});let data;try{data=await response.json()}catch{data=await response.text()}if(!response.ok)throw new Error(data?.message||data||`Request failed (${response.status}).`);const raw=Array.isArray(data)?data:(data?.results||data?.value||data?.body||[]);const rows=(Array.isArray(raw)?raw:[]).map(normalizeResult);msg.innerHTML='';if(!rows.length){output.innerHTML='<p class="notice">No recorded results were found.</p>';return}const total=rows.reduce((s,x)=>s+x.score,0);output.innerHTML=`<p class="notice"><strong>Total recorded score:</strong> ${total}</p><table class="history"><thead><tr><th>Assessment</th><th>Score</th><th>Date</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.assessment)}</td><td>${esc(x.scoreDisplay)}</td><td>${esc(x.date)}</td></tr>`).join('')}</tbody></table>`}catch(e){msg.innerHTML=`<p class="notice error">${esc(e.message)}</p>`}}
function normalizeResult(x) {
  const rawScore =
    x.Score ??
    x.score ??
    x.Points ??
    x.points ??
    x.Result ??
    x.result;

  const score = Number(rawScore);

  const rawAssessment =
    x.AssessmentID ??
    x.assessmentId ??
    x.Assessment ??
    x.Title ??
    'Assessment';

  const assessment =
    typeof rawAssessment === 'object' && rawAssessment !== null
      ? rawAssessment.Value ??
        rawAssessment.value ??
        rawAssessment.Title ??
        rawAssessment.LookupValue ??
        rawAssessment.Id ??
        'Assessment'
      : rawAssessment;

  return {
    assessment,
    score: Number.isFinite(score) ? score : 0,
    scoreDisplay: Number.isFinite(score)
      ? String(score)
      : String(rawScore ?? ''),
    date:
      x.Date ??
      x.Created ??
      x.SubmittedAt ??
      x.createdAt ??
      ''
  };
}
document.getElementById('getResultsButton').onclick=getStudentResults;showCases();
