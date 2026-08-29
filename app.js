const app=document.getElementById('app');
let state={case:null,result:null,submissionAttempted:false};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const button=(text,fn,cls='')=>{const b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;return b};
function set(html){app.innerHTML=html;window.scrollTo({top:0,behavior:'smooth'})}
function questionProgress(current,total){
  return `<div class="question-progress"><span>Question ${current} of ${total}</span><div class="progress-track"><i style="width:${Math.round((current/total)*100)}%"></i></div></div>`;
}
function scoreBand(score){
  const n=Number(score);
  if(n>=5)return'Excellent';
  if(n>=4)return'Strong';
  if(n>=3)return'Solid';
  if(n>=2)return'Developing';
  return'Needs work';
}
function showCases(){
  state={case:null,result:null,submissionAttempted:false};
  set(`<div class="screen-head"><p class="section-kicker">Case assessment</p><h2>Select a case</h2><p>Choose one of the course cases. Each assessment is scored out of 5 and can be recorded against your course profile.</p></div><div class="case-grid">${window.CASES.map((c,i)=>`<button class="case-card" data-id="${c.caseId}"><span class="case-no">${String(i+1).padStart(2,'0')}</span><span class="case-id">${esc(c.caseId)}</span><strong>${esc(c.title)}</strong><span class="case-cta">Open case →</span></button>`).join('')}</div>`);
  app.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>showCase(b.dataset.id));
}
function showCase(id){
  const c=window.CASES.find(x=>x.caseId===id);
  state={case:c,result:null,submissionAttempted:false};
  set(`<div class="screen-head"><p class="section-kicker">${esc(c.caseId)}</p><h2>${esc(c.title)}</h2><p>Read the case, review the questions, then start the assessment when ready.</p></div>
    <section class="case-brief"><h3>Case briefing</h3><div class="case-text">${esc(c.authoritativeCaseContent)}</div></section>
    <section class="question-preview"><h3>Assessment questions</h3><ol>${c.studentQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol></section>
    <div class="start-card"><div><strong>Ready to answer?</strong><p>Use short bullet points. Focus on course concepts and the facts in the case.</p></div><div class="actions" id="caseActions"></div></div>`);
  const a=document.getElementById('caseActions');
  a.append(button('Start assessment',showAnswerForm,'primary'));
  a.append(button('Back to cases',showCases,'secondary'));
}
function showAnswerForm(){
  const c=state.case,total=c.studentQuestions.length;
  set(`<div class="screen-head"><p class="section-kicker">${esc(c.caseId)}</p><h2>${esc(c.title)}</h2><p>Answer every question using concise bullet points.</p></div>
    <form id="answerForm">${c.studentQuestions.map((q,i)=>`<section class="question-card">${questionProgress(i+1,total)}<label for="a${i}">${esc(q)}</label><textarea id="a${i}" placeholder="• Enter short bullet points"></textarea></section>`).join('')}
    <div id="formMessage"></div><div class="actions"><button type="submit" class="primary">Assess my answer</button><button type="button" id="back" class="secondary">Back to case</button></div></form>`);
  document.getElementById('answerForm').onsubmit=submitAssessment;
  document.getElementById('back').onclick=()=>showCase(c.caseId);
}
async function submitAssessment(e){e.preventDefault();const answers=state.case.studentQuestions.map((_,i)=>document.getElementById(`a${i}`).value.trim());const msg=document.getElementById('formMessage');if(answers.some(x=>!x)){msg.innerHTML='<p class="notice error">Please answer all questions.</p>';return}await callAssessment({caseId:state.case.caseId,answers})}
async function callAssessment(payload){const url=window.PORTAL_CONFIG?.assessCaseUrl;if(!url||url.includes('YOUR-WORKER')){set('<p class="notice error">The case assessment Worker URL is not configured in config.js.</p><div class="actions" id="retry"></div>');document.getElementById('retry').append(button('Back',showAnswerForm,'secondary'));return}set('<div class="loading"><span class="spinner"></span><strong>Assessing your response against the course material…</strong></div>');try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({message:`Assessment failed (${r.status}).`}));if(!r.ok)throw new Error(data.message||`Assessment failed (${r.status}).`);state.result=data;renderResult()}catch(err){set(`<p class="notice error">${esc(err.message)}</p><div class="actions" id="retry"></div>`);document.getElementById('retry').append(button('Try again',showAnswerForm));document.getElementById('retry').append(button('Choose another case',showCases,'secondary'))}}
function renderResult(){
  const r=state.result,band=scoreBand(r.score);
  set(`<section class="result-hero"><p class="section-kicker">Assessment complete</p><div class="result-score-row"><div><h2>${band}</h2><p>Your answer has been assessed against the course material.</p></div><div class="score-badge"><strong>${esc(r.score)}</strong><span>/5</span></div></div></section>
    <div class="result-summary-grid">
      <section class="summary-card correct"><span>What you got right</span><ul>${(r.correctPoints||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>No material correct point was identified.</li>'}</ul></section>
      <section class="summary-card gap"><span>Main gap</span><p>${esc(r.missingPoint)}</p></section>
      <section class="summary-card stronger"><span>Stronger answer</span><ul>${(r.strongerAnswer||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
    </div>
    <section class="feedback-section"><h3>Feedback by question</h3>${(r.questionFeedback||[]).map((x,i)=>`<details class="feedback-detail"${i===0?' open':''}><summary><span>Question ${i+1}</span>${esc(x.question)}</summary><div>${esc(x.assessment)}</div></details>`).join('')}</section>
    ${recordHtml()}<div class="actions" id="resultActions"></div>`);
  bindRecordButtons();
  document.getElementById('resultActions').append(button('Choose another case',showCases,'secondary'));
}
function recordHtml(){return `<section class="record-card"><div><p class="section-kicker">Course assessment</p><h3>Course score: ${esc(state.result.score)}/5</h3><p>Record this result against ${esc(state.case.caseId)}, or leave it unrecorded.</p></div><div id="recordButtons" class="actions"></div></section>`}
function bindRecordButtons(){const x=document.getElementById('recordButtons');if(!x)return;x.append(button('Record my score',showSubmit,'primary'));x.append(button('Do not record',showCases,'secondary'))}
function showSubmit(){
  set(`<div class="submit-screen"><p class="section-kicker">Course assessment</p><h2>Record your score</h2><div class="submit-score"><span>Assessment</span><strong>${esc(state.case.caseId)}</strong><span>Score</span><strong>${esc(state.result.score)}/5</strong></div><label class="field-label">Student ID<input id="sid" placeholder="YYMMDD-##" autocomplete="off"></label><div id="submitMessage"></div><div class="actions" id="submitActions"></div></div>`);
  const a=document.getElementById('submitActions');
  a.append(button('Submit score',submitScore,'primary'));
  a.append(button('Back to result',renderResult,'secondary'));
}
async function submitScore(){
  const sid=document.getElementById('sid').value.trim(),msg=document.getElementById('submitMessage');
  if(!/^\d{6}-\d{2}$/.test(sid)){msg.innerHTML='<p class="notice error">Student ID format is invalid.</p>';return}
  if(state.submissionAttempted){msg.innerHTML='<p class="notice">This result has already been recorded for this assessment.</p>';return}
  const url=window.PORTAL_CONFIG?.submitAssessmentUrl;
  if(!url){msg.innerHTML='<p class="notice error">Score submission is temporarily unavailable.</p>';return}
  const submitButton=document.querySelector('#submitActions .primary');if(submitButton){submitButton.disabled=true;submitButton.textContent='Submitting…'}
  try{
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({StudentID:sid,AssessmentID:state.case.caseId,Score:Number(state.result.score)})});
    const text=await r.text();let body;try{body=text?JSON.parse(text):{}}catch{body=text}
    if(r.ok){
      state.submissionAttempted=true;
      const progress=body?.CompletedAssessments!==undefined&&body?.RequiredAssessments!==undefined?` Course progress: ${body.CompletedAssessments}/${body.RequiredAssessments} assessments completed${body?.TotalScore!==undefined?`, total score ${body.TotalScore}/100`:''}.`:'';
      msg.innerHTML=`<p class="notice success">Score successfully recorded.${esc(progress)}</p>`;
    }else{
      const message=body?.message||body||`Submission failed (${r.status}).`,duplicate=r.status===409||/already/i.test(String(message));
      if(duplicate)state.submissionAttempted=true;
      msg.innerHTML=`<p class="notice ${duplicate?'':'error'}">${esc(String(message))}</p>`;
    }
  }catch(e){
    msg.innerHTML='<p class="notice error">The score could not be submitted. Please try again.</p>';
  }finally{
    if(submitButton&&!state.submissionAttempted){submitButton.disabled=false;submitButton.textContent='Submit score'}
  }
}
async function getStudentResults(){
  const sid=document.getElementById('resultsStudentId').value.trim(),msg=document.getElementById('studentResultsMessage'),output=document.getElementById('studentResultsOutput');
  output.innerHTML='';
  if(!/^\d{6}-\d{2}$/.test(sid)){msg.innerHTML='<p class="notice error">Student ID format is invalid.</p>';return}
  const url=window.PORTAL_CONFIG?.getStudentResultsUrl;if(!url){msg.innerHTML='<p class="notice error">Student results are temporarily unavailable.</p>';return}
  msg.innerHTML='<div class="loading"><span class="spinner"></span><strong>Loading course progress…</strong></div>';
  try{
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({StudentID:sid})});
    const text=await response.text();let data;try{data=text?JSON.parse(text):{}}catch{data=text}
    if(!response.ok)throw new Error(data?.message||data||`Request failed (${response.status}).`);
    const raw=Array.isArray(data)?data:(data?.results||data?.value||data?.body||[]);
    const rows=(Array.isArray(raw)?raw:[]).map(normalizeResult);
    const totalRaw=Number(data?.TotalScore??data?.totalScore),total=Number.isFinite(totalRaw)?totalRaw:rows.reduce((s,x)=>s+x.score,0);
    const completedRaw=Number(data?.CompletedAssessments??data?.completedAssessments),requiredRaw=Number(data?.RequiredAssessments??data?.requiredAssessments),remainingRaw=Number(data?.AssessmentsRemaining??data?.assessmentsRemaining),bonusRaw=Number(data?.CompletionBonusIncluded??data?.completionBonusIncluded);
    const completed=Number.isFinite(completedRaw)?completedRaw:rows.length,required=Number.isFinite(requiredRaw)?requiredRaw:null,remaining=Number.isFinite(remainingRaw)?remainingRaw:(required!==null?Math.max(required-completed,0):null),bonus=Number.isFinite(bonusRaw)?bonusRaw:0;
    msg.innerHTML='';
    if(!rows.length&&!Number.isFinite(totalRaw)){output.innerHTML='<p class="notice">No recorded results were found.</p>';return}
    output.innerHTML=`<div class="course-progress"><div class="progress-score"><span>Course score</span><strong>${total}<small>/100</small></strong></div><div class="progress-facts"><span><b>${completed}${required!==null?` / ${required}`:''}</b> assessments completed</span>${remaining!==null?`<span><b>${remaining}</b> remaining</span>`:''}<span><b>${bonus?`+${bonus}`:'Not yet earned'}</b> completion bonus</span></div></div>${rows.length?`<div class="table-wrap"><table class="history"><thead><tr><th>Assessment</th><th>Score</th><th>Date</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.assessment)}</td><td>${esc(x.scoreDisplay)}</td><td>${esc(x.date)}</td></tr>`).join('')}</tbody></table></div>`:''}`;
  }catch(e){msg.innerHTML=`<p class="notice error">${esc(e.message)}</p>`}
}
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

  const rawDate =
    x.Date ??
    x.Created ??
    x.SubmittedAt ??
    x.createdAt ??
    '';

  let formattedDate = '';

  if (rawDate) {
    const parsedDate = new Date(rawDate);

    formattedDate = Number.isNaN(parsedDate.getTime())
      ? String(rawDate)
      : parsedDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
  }

  return {
    assessment,
    score: Number.isFinite(score) ? score : 0,
    scoreDisplay: Number.isFinite(score)
      ? String(score)
      : String(rawScore ?? ''),
    date: formattedDate
  };
}
document.getElementById('getResultsButton').onclick=getStudentResults;showCases();
