const state={data:null,selectedClass:"all",manufacturer:null,carId:null,track:null,search:"",favorites:new Set(JSON.parse(localStorage.getItem("gt7-car-favorites")||"[]")),view:"all"};
const $=s=>document.querySelector(s);

async function init(){
  const r=await fetch("../data/gt7-data.json");
  state.data=await r.json();
  renderStats();
  sync();
  render();
}

function cars(){
  const q=state.search.toLowerCase().trim();
  return state.data.cars.filter(c=>{
    const classOk=state.selectedClass==="all"||c.class===state.selectedClass;
    const favOk=state.view==="all"||state.favorites.has(c.id);
    const text=`${c.manufacturer} ${c.name} ${c.class} ${c.setups.map(s=>s.track).join(" ")}`.toLowerCase();
    return classOk&&favOk&&(!q||text.includes(q));
  });
}

function sync(){
  const list=cars();
  const makers=[...new Set(list.map(c=>c.manufacturer))].sort();
  if(!makers.includes(state.manufacturer))state.manufacturer=makers[0]||null;
  const makerCars=list.filter(c=>c.manufacturer===state.manufacturer);
  if(!makerCars.some(c=>c.id===state.carId))state.carId=makerCars[0]?.id||null;
  const car=state.data.cars.find(c=>c.id===state.carId);
  if(!car?.setups.some(s=>s.track===state.track))state.track=car?.setups[0]?.track||null;
}

function renderStats(){
  $("#carCount").textContent=state.data.cars.length;
  $("#setupCount").textContent=state.data.cars.reduce((n,c)=>n+c.setups.length,0);
  $("#manufacturerCount").textContent=new Set(state.data.cars.map(c=>c.manufacturer)).size;
  $("#favoriteCount").textContent=state.favorites.size;
}

function renderClasses(){
  const box=$("#classTabs");box.innerHTML="";
  ["all",...state.data.classes].forEach(cls=>{
    const b=document.createElement("button");
    b.className=`tab ${state.selectedClass===cls?"active":""}`;
    b.textContent=cls==="all"?"Alle Klassen":cls;
    b.onclick=()=>{state.selectedClass=cls;state.manufacturer=null;state.carId=null;state.track=null;sync();render()};
    box.appendChild(b);
  });
}

function renderManufacturers(){
  const box=$("#manufacturerList");box.innerHTML="";
  const makers=[...new Set(cars().map(c=>c.manufacturer))].sort();
  makers.forEach(m=>{
    const b=document.createElement("button");
    b.className=`db-btn ${state.manufacturer===m?"active":""}`;
    b.textContent=m;
    b.onclick=()=>{state.manufacturer=m;state.carId=null;state.track=null;sync();render()};
    box.appendChild(b);
  });
  if(!makers.length)box.textContent="Keine Hersteller gefunden.";
}

function renderCars(){
  const box=$("#carList");box.innerHTML="";
  const list=cars().filter(c=>c.manufacturer===state.manufacturer);
  list.forEach(c=>{
    const b=document.createElement("button");
    b.className=`db-btn ${state.carId===c.id?"active":""}`;
    b.textContent=`${state.favorites.has(c.id)?"★ ":""}${c.name}`;
    b.onclick=()=>{state.carId=c.id;state.track=c.setups[0]?.track||null;render()};
    box.appendChild(b);
  });
  if(!list.length)box.textContent="Keine Fahrzeuge gefunden.";
}

function renderDetails(){
  const car=state.data.cars.find(c=>c.id===state.carId);
  if(!car){$("#details").hidden=true;$("#detailsEmpty").hidden=false;return}
  $("#details").hidden=false;$("#detailsEmpty").hidden=true;
  $("#carClass").textContent=car.class;
  $("#carName").textContent=car.name;
  $("#carManufacturer").textContent=car.manufacturer;
  $("#favoriteCar").textContent=state.favorites.has(car.id)?"★":"☆";

  const tracks=$("#trackTabs");tracks.innerHTML="";
  car.setups.forEach(s=>{
    const b=document.createElement("button");
    b.className=`track-tab ${state.track===s.track?"active":""}`;
    b.textContent=s.track;
    b.onclick=()=>{state.track=s.track;renderDetails()};
    tracks.appendChild(b);
  });

  const setup=car.setups.find(s=>s.track===state.track);
  $("#setupDetails").innerHTML=`
    <div class="setup-row"><strong>Bremsbalance</strong><span>${setup.brakeBalance}</span></div>
    <div class="setup-row"><strong>TKS</strong><span>${setup.tcs}</span></div>
    <div class="setup-row"><strong>Reifen</strong><span>${setup.tires}</span></div>
    <p>${setup.tip}</p>`;
  const key=`gt7-note-${car.id}-${setup.track}`;
  $("#setupNote").value=localStorage.getItem(key)||"";
  $("#setupNote").dataset.key=key;
}

function render(){renderStats();renderClasses();renderManufacturers();renderCars();renderDetails()}

$("#searchInput").oninput=e=>{state.search=e.target.value;state.manufacturer=null;state.carId=null;state.track=null;sync();render()};
$("#viewFilter").onchange=e=>{state.view=e.target.value;state.manufacturer=null;state.carId=null;state.track=null;sync();render()};
$("#favoriteCar").onclick=()=>{
  const car=state.data.cars.find(c=>c.id===state.carId);if(!car)return;
  state.favorites.has(car.id)?state.favorites.delete(car.id):state.favorites.add(car.id);
  localStorage.setItem("gt7-car-favorites",JSON.stringify([...state.favorites]));
  render();
};
$("#saveNote").onclick=()=>{
  const key=$("#setupNote").dataset.key;if(!key)return;
  localStorage.setItem(key,$("#setupNote").value);
  $("#noteStatus").textContent="Notiz gespeichert.";
  setTimeout(()=>$("#noteStatus").textContent="",1600);
};
$("#exportButton").onclick=()=>{
  const backup={favorites:[...state.favorites],notes:{}};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith("gt7-note-"))backup.notes[k]=localStorage.getItem(k)}
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="gt7-backup.json";a.click();URL.revokeObjectURL(a.href);
};

init().catch(e=>{$("#detailsEmpty").textContent="GT7-Daten konnten nicht geladen werden.";console.error(e)});
