
function tyreChip(name){
 const map={Soft:'tyre-soft',Medium:'tyre-medium',Hard:'tyre-hard',Intermediate:'tyre-inter',Wet:'tyre-wet'};
 let key='Hard';
 const t=(name||'').toLowerCase();
 if(t.includes('soft')) key='Soft';
 else if(t.includes('medium')) key='Medium';
 else if(t.includes('hard')) key='Hard';
 else if(t.includes('inter')) key='Intermediate';
 else if(t.includes('wet')) key='Wet';
 return `<span class="tyre-chip ${map[key]}">${name}</span>`;
}
const state = {
  tracks: [],
  trackId: localStorage.getItem("f1-last-track") || "australia",
  mode: localStorage.getItem("f1-last-mode") || "5-laps",
  search: "",
  favoriteFilter: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("f1-track-favorites") || "[]"))
};
const $ = selector => document.querySelector(selector);
const modes = [
  ["qualifying","Qualifying"],["5-laps","5 Runden"],["25","25 %"],
  ["50","50 %"],["100","100 %"],["rain","Regen"]
];
function stars(value=0){const n=Math.max(0,Math.min(5,Number(value)||0));return "★".repeat(n)+"☆".repeat(5-n)}
function row(label,value,suffix=""){return `<div class="f1-row"><span>${label}</span><strong>${value}${suffix}</strong></div>`}
async function init(){
  const response=await fetch("../data/f1/tracks.json");
  if(!response.ok) throw new Error(`F1-Daten konnten nicht geladen werden (${response.status})`);
  state.tracks=await response.json();
  if(!state.tracks.some(t=>t.id===state.trackId)) state.trackId=state.tracks[0]?.id;
  render();
}
function filteredTracks(){
  const q=state.search.toLowerCase().trim();
  return state.tracks.filter(track=>{
    const favoriteOk=state.favoriteFilter==="all"||state.favorites.has(track.id);
    const searchOk=!q||`${track.name} ${track.circuit}`.toLowerCase().includes(q);
    return favoriteOk&&searchOk;
  });
}
function selectedTrack(){return state.tracks.find(t=>t.id===state.trackId)}
function selectedSetup(){return selectedTrack()?.setups?.[state.mode]}
function renderTrackList(){
  const box=$("#f1TrackList"); box.innerHTML="";
  const list=filteredTracks();
  $("#f1ResultText").textContent=`${list.length} Strecken gefunden`;
  list.forEach(track=>{
    const button=document.createElement("button");
    button.className=`f1-track-button ${track.id===state.trackId?"active":""}`;
    button.innerHTML=`<span>${track.flag}</span><span>${track.name}</span>${state.favorites.has(track.id)?"<b>★</b>":""}`;
    button.onclick=()=>{state.trackId=track.id;localStorage.setItem("f1-last-track",track.id);render()};
    box.appendChild(button);
  });
  if(!list.length) box.innerHTML='<p class="f1-empty">Keine Strecke gefunden.</p>';
}
function renderModes(){
  const box=$("#f1ModeTabs"); box.innerHTML="";
  modes.forEach(([id,label])=>{
    const button=document.createElement("button");
    button.className=`f1-mode-tab ${state.mode===id?"active":""}`;
    button.textContent=label;
    button.onclick=()=>{state.mode=id;localStorage.setItem("f1-last-mode",id);renderDetails()};
    box.appendChild(button);
  });
}
function renderDetails(){
  const track=selectedTrack(),setup=selectedSetup(); if(!track||!setup)return;
  $("#f1Flag").textContent=track.flag; $("#f1Circuit").textContent=track.circuit; $("#f1TrackName").textContent=track.name;
  $("#favoriteTrack").textContent=state.favorites.has(track.id)?"★":"☆";
  renderModes();
  $("#f1Aero").innerHTML=row("Frontflügel",setup.aero.frontWing)+row("Heckflügel",setup.aero.rearWing);
  $("#f1Transmission").innerHTML=row("Differenzial On",setup.transmission.onThrottle," %")+row("Differenzial Off",setup.transmission.offThrottle," %")+row("Motorbremse",setup.transmission.engineBraking," %");
  $("#f1Geometry").innerHTML=row("Sturz vorne",setup.geometry.frontCamber,"°")+row("Sturz hinten",setup.geometry.rearCamber,"°")+row("Spur vorne",setup.geometry.frontToe,"°")+row("Spur hinten",setup.geometry.rearToe,"°");
  $("#f1Suspension").innerHTML=row("Federung vorne",setup.suspension.frontSuspension)+row("Federung hinten",setup.suspension.rearSuspension)+row("Stabi vorne",setup.suspension.frontAntiRollBar)+row("Stabi hinten",setup.suspension.rearAntiRollBar)+row("Bodenfreiheit vorne",setup.suspension.frontRideHeight)+row("Bodenfreiheit hinten",setup.suspension.rearRideHeight);
  $("#f1Brakes").innerHTML=row("Bremsdruck",setup.brakes.pressure," %")+row("Bremsbalance vorne",setup.brakes.frontBias," %");
  $("#f1Tyres").innerHTML=row("Vorne links",setup.tyres.frontLeft," psi")+row("Vorne rechts",setup.tyres.frontRight," psi")+row("Hinten links",setup.tyres.rearLeft," psi")+row("Hinten rechts",setup.tyres.rearRight," psi");
  $("#f1StartTyre").textContent=setup.strategy.start; $("#f1Stops").textContent=setup.strategy.stops; const raceLapText=setup.strategy.raceLaps?` (${setup.strategy.raceLaps} Runden)`:""; $("#f1Window").textContent=`${setup.strategy.window}${raceLapText}`; $("#f1Ers").textContent=setup.strategy.ers; $("#f1StrategyTip").textContent=setup.strategy.tip;
const flow=$("#f1TyreFlow");
if(flow){
 const start=setup.strategy.start||"Medium";
 const w=setup.strategy.window||"";
 let next="Finish";
 if(w.includes("Kein")) flow.innerHTML=tyreChip(start);
 else{
   if(start.toLowerCase().includes("medium")) next="Hard";
   else if(start.toLowerCase().includes("hard")) next="Medium";
   else if(start.toLowerCase().includes("soft")) next="Medium";
   else next=start;
   flow.innerHTML=`${tyreChip(start)} <span class="flow-arrow">⬇ ${w}</span> ${tyreChip(next)}`;
 }
}
  $("#f1RatingStability").textContent=stars(setup.ratings.stability); $("#f1RatingTurnIn").textContent=stars(setup.ratings.turnIn); $("#f1RatingTraction").textContent=stars(setup.ratings.traction); $("#f1RatingWear").textContent=stars(setup.ratings.tireWear); $("#f1RatingController").textContent=stars(setup.ratings.controller);
  const key=`f1-note-${track.id}-${state.mode}`; $("#f1Note").value=localStorage.getItem(key)||""; $("#f1Note").dataset.key=key;
}
function render(){
  $("#f1TrackCount").textContent=state.tracks.length; $("#f1FavoriteCount").textContent=state.favorites.size;
  renderTrackList(); renderDetails();
}
$("#f1Search").addEventListener("input",e=>{state.search=e.target.value;renderTrackList()});
$("#f1FavoriteFilter").addEventListener("change",e=>{state.favoriteFilter=e.target.value;renderTrackList()});
$("#favoriteTrack").addEventListener("click",()=>{
  const track=selectedTrack(); if(!track)return;
  state.favorites.has(track.id)?state.favorites.delete(track.id):state.favorites.add(track.id);
  localStorage.setItem("f1-track-favorites",JSON.stringify([...state.favorites])); render();
});
$("#saveF1Note").addEventListener("click",()=>{
  const key=$("#f1Note").dataset.key; if(!key)return;
  localStorage.setItem(key,$("#f1Note").value); $("#f1NoteStatus").textContent="Notiz gespeichert.";
  setTimeout(()=>$("#f1NoteStatus").textContent="",1600);
});
$("#copySetup").addEventListener("click",async()=>{
  const track=selectedTrack(),s=selectedSetup(); if(!track||!s)return;
  const text=`${track.name} – ${s.label}\n\nAerodynamik\nFrontflügel: ${s.aero.frontWing}\nHeckflügel: ${s.aero.rearWing}\n\nGetriebe\nDifferenzial On: ${s.transmission.onThrottle}%\nDifferenzial Off: ${s.transmission.offThrottle}%\nMotorbremse: ${s.transmission.engineBraking}%\n\nRadgeometrie\nSturz v/h: ${s.geometry.frontCamber} / ${s.geometry.rearCamber}\nSpur v/h: ${s.geometry.frontToe} / ${s.geometry.rearToe}\n\nFahrwerk\nFederung v/h: ${s.suspension.frontSuspension} / ${s.suspension.rearSuspension}\nStabi v/h: ${s.suspension.frontAntiRollBar} / ${s.suspension.rearAntiRollBar}\nBodenfreiheit v/h: ${s.suspension.frontRideHeight} / ${s.suspension.rearRideHeight}\n\nBremsen\nBremsdruck: ${s.brakes.pressure}%\nBremsbalance: ${s.brakes.frontBias}%\n\nReifendruck\nVL/VR: ${s.tyres.frontLeft} / ${s.tyres.frontRight} psi\nHL/HR: ${s.tyres.rearLeft} / ${s.tyres.rearRight} psi`;
  try{await navigator.clipboard.writeText(text);$("#copyStatus").textContent="Setup kopiert."}catch{$("#copyStatus").textContent="Kopieren nicht möglich."}
  setTimeout(()=>$("#copyStatus").textContent="",1800);
});
init().catch(error=>{console.error(error);document.body.innerHTML='<p style="padding:30px;color:white">F1-Daten konnten nicht geladen werden.</p>'});
