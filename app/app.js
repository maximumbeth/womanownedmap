(function(){
"use strict";
var C = window.WO_CONFIG || {};
var PH = C.photos || window.WO_PHOTOS || {};   /* community photos, built into the page */
/* Community photos shuffle on every visit: the hero gets two, the collage further down gets the next three,
   so no photo shows twice on the home page. Add more by adding keys to WO_PHOTOS (alt text below). */
var PH_ALT = {corazon:"Wanderful members at a woman-owned cafe", pretexto:"Beth Santos with the owner of El Pretexto in Puerto Rico",
  bookcover:"Beth Santos outside The Book & Cover in Chattanooga", marginnotes:"An owner behind the bar at Margin Notes Bookbar in El Paso", meetup:"A Wanderful hub meetup"};
var _comm=null;
/* Community photos: the ones built into this block plus any from the optional photos Code Block (window.WO_PHOTOS_MORE).
   Shuffled once per visit. Trip photos (keys starting trip_) are kept for the trips band. */
function more(){ return window.WO_PHOTOS_MORE || {}; }
function comm(){
  if (_comm) return _comm;
  var a=Object.keys(PH).filter(function(k){ return /^data:image|^https?:/.test(PH[k]); }).map(function(k){ return {src:PH[k], alt:PH_ALT[k]||"Women at a woman-owned business"}; });
  var m=more(); Object.keys(m).forEach(function(k){ if (!/^trip_/.test(k) && m[k] && m[k].src) a.push(m[k]); });
  _comm=a.map(function(x){ return [Math.random(), x]; }).sort(function(x,y){ return x[0]-y[0]; }).map(function(p){ return p[1]; });
  return _comm;
}
function tripPhotos(){ var m=more(); return Object.keys(m).filter(function(k){ return /^trip_/.test(k); }).map(function(k){ return m[k]; }); }
/* a hub banner uses that city's own meetup photo when there is one */
var CITY_PHOTO={boston:"boston", denver:"denver_group", tucson:"tucson", "new-york-city":"nyc", madrid:"madrid_cafe"};
function hubPhoto(slug){ var m=more(), k=CITY_PHOTO[slug]; if (k && m[k]) return m[k]; if (PH.meetup) return {src:PH.meetup, alt:"A Wanderful hub meetup"}; return comm()[0]||null; }
var root = document.getElementById("wo-app");
if (!root) return;

/* ================= constants ================= */
var CATS = {
  "Stays":               {c:"var(--c-stays)", i:"bed",     short:"Stays"},
  "Food and drink":      {c:"var(--c-food)",  i:"cup",     short:"Eat and drink"},
  "Shops":               {c:"var(--c-shops)", i:"bag",     short:"Shops"},
  "Things to do":        {c:"var(--c-todo)",  i:"star",    short:"Things to do"},
  "Wellness and beauty": {c:"var(--c-well)",  i:"leaf",    short:"Wellness"},
  "Tours and activities":{c:"var(--c-tours)", i:"flag",    short:"Tours"},
  "Experiences":         {c:"var(--c-tours)", i:"flag",    short:"Experiences"},
  "Trip companies":      {c:"var(--c-online)",i:"globe",   short:"Trip companies"},
  "Planners":            {c:"var(--c-online)",i:"compass", short:"Planners"},
  "Products":            {c:"var(--c-shops)", i:"bag",     short:"Products"},
  "Communities":         {c:"var(--c-online)",i:"people",  short:"Communities"}
};
var PLACE_CATS = ["Stays","Food and drink","Shops","Things to do","Wellness and beauty","Tours and activities"];
var TYPES = [
  {id:"places", label:"Places", test:function(r){return r.listing_type==="Place";}},
  {id:"tours", label:"Tours and experiences", test:function(r){return r.listing_type==="Tour" || r.category==="Experiences";}},
  {id:"trips", label:"Trip companies", test:function(r){return r.listing_type==="Online" && r.category==="Trip companies";}},
  {id:"planners", label:"Planners", test:function(r){return r.listing_type==="Online" && r.category==="Planners";}},
  {id:"products", label:"Products", test:function(r){return r.listing_type==="Online" && r.category==="Products";}},
  {id:"communities", label:"Communities", test:function(r){return r.listing_type==="Online" && (r.category==="Communities" || r.category==="Stays");}}
];
var CITY_SECTIONS = [
  {id:"tours", title:"Walking tours and experiences", test:function(r){return r.listing_type==="Tour" || r.category==="Tours and activities" || r.category==="Experiences";}},
  {id:"todo",  title:"Places to visit", test:function(r){return r.category==="Things to do";}},
  {id:"food",  title:"Eat and drink", test:function(r){return r.category==="Food and drink";}},
  {id:"shops", title:"Shops", test:function(r){return r.category==="Shops";}},
  {id:"stays", title:"Places to stay", test:function(r){return r.category==="Stays";}},
  {id:"well",  title:"Wellness and beauty", test:function(r){return r.category==="Wellness and beauty";}}
];
var CITY_COLORS = ["var(--c-stays)","var(--c-tours)","var(--c-food)","var(--teal-deep)","var(--c-well)"];
var P = {
  bed:'<path d="M3 18V7M3 14h18v4M21 18v-4a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11" r="1.6"/>',
  cup:'<path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2 2 0 0 1 0 4H16M8 3.5v2M12 3.5v2"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  star:'<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.5l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  leaf:'<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14c2.7.2 4.5 2.2 4.5 5"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  pin:'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  near:'<path d="M3 11l18-8-8 18-2-8z"/>',
  shuffle:'<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>',
  city:'<path d="M4 21V9l5-3v15M9 21V4l7 3v14M16 21v-9l4 2v7M3 21h18"/>',
  ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
function ico(n,cls){return '<svg class="'+(cls||"wo-ico")+'" viewBox="0 0 24 24" aria-hidden="true">'+(P[n]||"")+'</svg>';}

/* ================= state ================= */
var DATA=[], BYID={}, CITIES={}, CITYLIST=[], TIPS={}, GPHOTO={};
var S = {view:"home", city:"", q:"", type:"places", cats:{}, badges:{}, deal:false, member:false, sort:"featured",
         shown:24, me:null, saved:[], mode:"walking", cityq:"", lastView:"home"};
var maps = {};

/* ================= helpers ================= */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function url(u){u=String(u||"").trim(); if(!u) return ""; if(!/^https?:\/\//i.test(u)) u="https://"+u.replace(/^\/+/,""); return u;}
function list(s){return String(s||"").split(/\s*[,;]\s*/).filter(Boolean);}
function hash(s){var h=2166136261; s=String(s); for(var i=0;i<s.length;i++){h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0;}
function seeded(arr, seed){var a=arr.slice(), x=seed||1; for(var i=a.length-1;i>0;i--){x=(Math.imul(x,1103515245)+12345)>>>0; var j=x%(i+1); var t=a[i]; a[i]=a[j]; a[j]=t;} return a;}
function mediaUrl(u){
  u=String(u||"").trim(); if(!u) return "";
  var m=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/); if(m) return "https://lh3.googleusercontent.com/d/"+m[1]+"=w1000";
  if(/dropbox\.com/.test(u)) return u.replace(/[?&]dl=0/,"").replace("www.dropbox.com","dl.dropboxusercontent.com");
  return u;
}
function q4(r){return [r.name, r.address, r.city, r.region, r.country].filter(Boolean).join(", ");}
function gmaps(r){
  if (r.google_maps_link) return url(r.google_maps_link);
  return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q4(r))+(r.google_place_id?"&query_place_id="+encodeURIComponent(r.google_place_id):"");
}
function gdir(r){return "https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(q4(r))+(r.google_place_id?"&destination_place_id="+encodeURIComponent(r.google_place_id):"");}
var useMiles = /^(US|GB|LR|MM)$/.test(((navigator.language||"en-US").split("-")[1]||"US").toUpperCase());
function km(a,b,c,d){var R=6371,t=Math.PI/180,x=Math.sin((c-a)*t/2),y=Math.sin((d-b)*t/2); return 2*R*Math.asin(Math.sqrt(x*x+Math.cos(a*t)*Math.cos(c*t)*y*y));}
function fmtDist(k){var v=useMiles?k*0.621371:k; return (v<10?v.toFixed(1):Math.round(v).toLocaleString())+(useMiles?" mi":" km");}
function geo(r){return isFinite(r.lat)&&isFinite(r.lng)&&!(r.lat===0&&r.lng===0);}
function cat(r){return CATS[r.category]||CATS["Things to do"];}
function cityName(g){return (CITIES[g]&&CITIES[g].display_name)||String(g||"").replace(/-/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});}
function cityColor(g){return CITY_COLORS[hash(g)%CITY_COLORS.length];}
function where(r){
  if (r.listing_type==="Online") return r.city ? r.city+(r.country?", "+r.country:"") : "Online and worldwide";
  if (r.listing_type==="Tour") return "Meets near "+(r.meets_near||r.city||"");
  return [r.city, r.region && r.region!==r.city ? r.region : "", r.country && r.country!=="US" ? r.country : ""].filter(Boolean).join(", ");
}
function stored(k,v){try{ if(v===undefined) return JSON.parse(localStorage.getItem(k)||"null"); localStorage.setItem(k,JSON.stringify(v)); }catch(e){ return null; }}
function toast(msg){
  var t=root.querySelector(".wo-toast"); if(!t){t=document.createElement("div"); t.className="wo-toast"; t.setAttribute("role","status"); root.appendChild(t);}
  t.innerHTML=msg; t.classList.add("on"); clearTimeout(t._t); t._t=setTimeout(function(){t.classList.remove("on");},2200);
}
function copy(text){
  var done=function(){toast(ico("link")+" Link copied");};
  try{ navigator.clipboard.writeText(text).then(done,function(){prompt2(text);}); }catch(e){prompt2(text);}
}
function prompt2(text){toast('Copy this link: <span style="user-select:all">'+esc(text)+'</span>');}

/* ================= stamp art ================= */
function pattern(seed){
  var k=seed%5, s='<svg class="pat" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6">', i, j;
  if (k===0){ for(i=-150;i<200;i+=13) s+='<path d="M'+i+' 150L'+(i+150)+' 0"/>'; }
  else if (k===1){ s+='</g><g fill="currentColor">'; for(i=6;i<200;i+=17) for(j=6;j<150;j+=17) s+='<circle cx="'+(i+(j%34?8:0))+'" cy="'+j+'" r="2.4"/>'; }
  else if (k===2){ for(j=8;j<160;j+=14){ s+='<path d="M-10 '+j; for(i=-10;i<220;i+=30) s+=' q7.5 -8 15 0 t15 0'; s+='"/>'; } }
  else if (k===3){ for(i=0;i<36;i++){ var a=i*Math.PI/18; s+='<path d="M100 75L'+(100+160*Math.cos(a)).toFixed(1)+' '+(75+160*Math.sin(a)).toFixed(1)+'"/>'; } }
  else { var cx=(seed%160)+20, cy=(seed%110)+20; for(i=10;i<260;i+=14) s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+i+'"/>'; }
  return s+'</g></svg>';
}
function mapArt(seed, labels, opt){
  opt=opt||{}; var W=1200,H=560, rnd=(function(x){return function(){x=(Math.imul(x,1103515245)+12345)>>>0; return x/4294967296;};})(seed*7919+13);
  var o='<svg class="wo-topo" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  // graticule
  o+='<g class="grid" stroke="currentColor" stroke-width="0.6" opacity="0.18">';
  for (var gx=0; gx<=W; gx+=100) o+='<path d="M'+gx+' 0V'+H+'"/>';
  for (var gy=0; gy<=H; gy+=100) o+='<path d="M0 '+gy+'H'+W+'"/>';
  if (opt.labels===false) o+='</g><g style="display:none">'; o+='</g><g class="coords lbl" fill="currentColor" opacity="0.5" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1">';
  var lat=Math.round(20+rnd()*30), lon=Math.round(60+rnd()*60);
  for (gx=100; gx<W; gx+=200) o+='<text x="'+(gx+4)+'" y="14">'+(lon-gx/100)+'\u00b0W</text>';
  for (gy=100; gy<H; gy+=200) o+='<text x="6" y="'+(gy-4)+'">'+(lat+3-gy/100)+'\u00b0N</text>';
  o+='</g>';
  // contours
  o+='<g fill="none" stroke="currentColor" stroke-width="1">';
  [[W*0.8,H*0.25],[W*0.2,H*0.8],[W*0.55,H*1.05]].forEach(function(c,ci){
    for (var k=1;k<12;k++){ var r=k*24, d="";
      for (var a=0;a<=60;a++){ var t=a/60*Math.PI*2, w=1+0.16*Math.sin(t*3+seed+ci)+0.09*Math.sin(t*5+k*0.4+ci*2);
        d+=(a?"L":"M")+(c[0]+Math.cos(t)*r*w*1.35).toFixed(1)+" "+(c[1]+Math.sin(t)*r*w).toFixed(1); }
      o+='<path d="'+d+'Z" opacity="'+(k%4===0?0.5:0.22)+'"/>'; }
  });
  o+='</g>';
  // river
  var ry=H*(0.35+rnd()*0.3), rv="M-20 "+ry.toFixed(0);
  for (var x=0;x<=W+40;x+=120){ rv+=" Q"+(x+60)+" "+(ry+(rnd()-0.5)*160).toFixed(0)+" "+(x+120)+" "+(ry+(rnd()-0.5)*90).toFixed(0); }
  o+='<path d="'+rv+'" fill="none" stroke="var(--water)" stroke-width="22" stroke-linecap="round" opacity="0.55"/>';
  // roads
  o+='<g fill="none" stroke="var(--road)" stroke-linecap="round">';
  for (var n=0;n<5;n++){
    var y0=rnd()*H, y1=rnd()*H, cx=rnd()*W;
    o+='<path d="M-10 '+y0.toFixed(0)+' C'+cx.toFixed(0)+' '+(y0+(rnd()-0.5)*300).toFixed(0)+' '+(W-cx).toFixed(0)+' '+(y1+(rnd()-0.5)*300).toFixed(0)+' '+(W+10)+' '+y1.toFixed(0)+'" stroke-width="'+(n<2?3:1.6)+'" '+(n>2?'stroke-dasharray="6 6"':'')+' opacity="'+(n<2?0.7:0.45)+'"/>';
  }
  for (n=0;n<3;n++){ var x0=rnd()*W; o+='<path d="M'+x0.toFixed(0)+' -10 C'+(x0+(rnd()-0.5)*300).toFixed(0)+' '+(H*0.4).toFixed(0)+' '+(rnd()*W).toFixed(0)+' '+(H*0.6).toFixed(0)+' '+(rnd()*W).toFixed(0)+' '+(H+10)+'" stroke-width="1.6" opacity="0.45"/>'; }
  o+='</g>';
  // pins + labels (real places)
  (labels||[]).slice(0,7).forEach(function(lb,li){
    var px, py;
    if (opt.left){ px=W*0.52+rnd()*W*0.42; py=60+rnd()*(H-140); }
    else { var slots=[[0.05,0.15],[0.22,0.12],[0.40,0.16],[0.53,0.10],[0.12,0.97],[0.33,0.98],[0.50,0.93]]; var sl=slots[li%slots.length]; px=W*sl[0]+rnd()*30; py=H*sl[1]; }
    o+='<g class="lbl" transform="translate('+px.toFixed(0)+' '+py.toFixed(0)+')"><path d="M0 0c-6-8-9-12-9-16a9 9 0 0 1 18 0c0 4-3 8-9 16z" fill="var(--pin)" opacity="0.9"/><circle cx="0" cy="-16" r="3.2" fill="var(--night)"/>'+
      (opt.labels===false?'':'<text x="14" y="-12" fill="currentColor" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="1.5" opacity="0.85">'+esc(String(lb).toUpperCase())+'</text>')+'</g>';
  });
  // compass + scale
  o+='<g class="lbl" transform="translate('+(W-70)+' '+(H-80)+')" fill="none" stroke="currentColor" opacity="0.6"><circle r="26"/><circle r="18" stroke-dasharray="2 4"/><path d="M0 -34L5 0 0 34 -5 0Z" fill="var(--pin)" stroke="none"/><text y="-40" text-anchor="middle" fill="currentColor" stroke="none" font-family="IBM Plex Mono, monospace" font-size="11">N</text></g>';
  o+='<g class="lbl" transform="translate('+(W-230)+' '+(H-24)+')" fill="currentColor" opacity="0.6" font-family="IBM Plex Mono, monospace" font-size="10"><rect width="40" height="4"/><rect x="40" width="40" height="4" fill="none" stroke="currentColor"/><rect x="80" width="40" height="4"/>'+(opt.labels===false?'':'<text y="-6">0</text><text x="112" y="-6">5 MI</text>')+'</g>';
  return o+'</svg>';
}

function gPhotoOn(where){ return !!(C.googleKey && (C.googlePhotos||"detail")!=="off" && (where==="detail" || C.googlePhotos==="cards")); }
function loadGPhoto(r){
  if (!r.google_place_id || !C.googleKey) return Promise.resolve(null);
  if (GPHOTO[r.listing_id]!==undefined) return Promise.resolve(GPHOTO[r.listing_id]);
  return fetch("https://places.googleapis.com/v1/places/"+encodeURIComponent(r.google_place_id)+"?fields=photos&key="+encodeURIComponent(C.googleKey))
    .then(function(x){return x.ok?x.json():{};}).then(function(j){
      var p=j.photos&&j.photos[0]; if(!p){GPHOTO[r.listing_id]=null; return null;}
      var a=(p.authorAttributions&&p.authorAttributions[0])||{};
      var out={src:"https://places.googleapis.com/v1/"+p.name+"/media?maxWidthPx=800&key="+encodeURIComponent(C.googleKey), by:a.displayName||"", byUrl:a.uri||""};
      GPHOTO[r.listing_id]=out; return out;
    }).catch(function(){ GPHOTO[r.listing_id]=null; return null; });
}
/* Google photo in the detail panel only when this place has a Google ID and no photo of its own.
   Google's terms: no Google content next to a non-Google map, so the mini map is skipped then. */
function useG(r){ return gPhotoOn("detail") && !!r.google_place_id && !r.photo_url; }
function fillGPhoto(el, r){
  loadGPhoto(r).then(function(g){ if(!g||!el.isConnected) return;
    var st=el.querySelector(".wo-stamp"); if(!st) return;
    st.insertAdjacentHTML("beforeend",'<img src="'+esc(g.src)+'" alt="" loading="lazy"><span class="wo-gattr">'+(g.by?'Photo: '+(g.byUrl?'<a href="'+esc(g.byUrl)+'" target="_blank" rel="noopener">'+esc(g.by)+'</a>':esc(g.by))+' \u00b7 ':'')+'Google Maps</span>');
  });
}
var gObs=null;
function watchPhotos(){
  if (!gPhotoOn("cards") || !("IntersectionObserver" in window)) return;
  if (!gObs) gObs=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; gObs.unobserve(e.target); var r=BYID[e.target.getAttribute("data-open")]; if(r) fillGPhoto(e.target,r); }); },{rootMargin:"200px"});
  root.querySelectorAll(".wo-card[data-gp]").forEach(function(c){ gObs.observe(c); });
}
function stamp(r, opt){
  opt=opt||{}; var c=cat(r), photo=mediaUrl(r.photo_url), pm=(r.city||r.meets_near||(r.listing_type==="Online"?"Worldwide":"")).toUpperCase();
  if (r.country && r.country!=="US" && r.city) pm+=" \u00b7 "+String(r.country).toUpperCase();
  return '<div class="wo-stamp" style="--cc:'+c.c+'">'+pattern(hash(r.name))+
    '<div class="medal">'+ico(c.i,"")+'</div>'+(photo?'<img src="'+esc(photo)+'" alt="" loading="lazy">':'')+
    (opt.nopm||!pm?'':'<span class="pm">'+esc(pm)+'</span>')+'</div>';
}

/* ================= data ================= */
function parseCsv(text){
  text=String(text||"").replace(/^\ufeff/,"");
  var rows=[], row=[], f="", q=false;
  for (var i=0;i<text.length;i++){
    var ch=text[i];
    if (q){ if (ch==='"'){ if (text[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=ch; }
    else if (ch==='"') q=true;
    else if (ch===','){ row.push(f); f=""; }
    else if (ch==='\n'||ch==='\r'){ if (ch==='\r'&&text[i+1]==='\n') i++; row.push(f); rows.push(row); row=[]; f=""; }
    else f+=ch;
  }
  if (f!==""||row.length){ row.push(f); rows.push(row); }
  var head=(rows.shift()||[]).map(function(h){return h.trim();});
  return rows.filter(function(r){return r.some(function(v){return v!=="";});}).map(function(r){var o={}; head.forEach(function(h,j){o[h]=r[j]==null?"":r[j];}); return o;});
}
function badUrl(u){return !u || /^PASTE_/.test(u);}
function prep(rows){
  return rows.filter(function(r){return r.name && /^approved/i.test(r.approval||"Approved");}).map(function(r){
    r.lat=parseFloat(r.lat); r.lng=parseFloat(r.lng);
    r.isMember=/^member/i.test(r.member_status||"");
    r.badgeList=list(r.ownership_badges);
    r.ver=/^y/i.test(r.verified_woman_owned||""); r.owner=/^y/i.test(r.owner_verified||"");
    r.hay=norm([r.name,r.city,r.region,r.country,r.category,cat(r).short,r.short_description,r.founder,r.ownership_badges,cityName(r.city_guide)].join(" "));
    BYID[r.listing_id]=r; return r;
  });
}
function load(){
  if (!C.listings && badUrl(C.listingsCsvUrl)) return Promise.reject(new Error("setup"));
  var a = C.listings ? Promise.resolve(C.listings) : fetch(C.listingsCsvUrl).then(function(x){if(!x.ok) throw new Error("http "+x.status); return x.text();}).then(function(t){
    if (/^\s*</.test(t)) throw new Error("notcsv"); var rows=parseCsv(t); if(!rows.length || !("name" in rows[0])) throw new Error("columns"); return rows; });
  var b = C.cities ? Promise.resolve(C.cities) : (!badUrl(C.citiesCsvUrl) ? fetch(C.citiesCsvUrl).then(function(x){return x.ok?x.text():"";}).then(parseCsv).catch(function(){return [];}) : Promise.resolve([]));
  var tp = C.tips ? Promise.resolve(C.tips) : (!badUrl(C.tipsCsvUrl) ? fetch(C.tipsCsvUrl).then(function(x){return x.ok?x.text():"";}).then(parseCsv).catch(function(){return [];}) : Promise.resolve([]));
  tp.then(function(rows){ rows.forEach(function(t){ if(!t.listing_id||(!t.tip&&!mediaUrl(t.photo_url))) return; (TIPS[t.listing_id]=TIPS[t.listing_id]||[]).push(t); }); });
  return Promise.all([a,b,tp]).then(function(res){
    res[1].forEach(function(c){ if(c.city_guide) CITIES[c.city_guide]=c; });
    DATA=prep(res[0]);
    var counts={}; DATA.forEach(function(r){ if(r.city_guide && r.listing_type!=="Online") counts[r.city_guide]=(counts[r.city_guide]||0)+1; });
    CITYLIST=Object.keys(counts).filter(function(g){return counts[g]>=2;}).map(function(g){
      var rows=DATA.filter(function(r){return r.city_guide===g && r.listing_type!=="Online";}), cc={};
      rows.forEach(function(r){var k=r.country||""; cc[k]=(cc[k]||0)+1;});
      var country=Object.keys(cc).sort(function(x,y){return cc[y]-cc[x];})[0]||"";
      return {slug:g, name:cityName(g), n:counts[g], country:country, region:(rows[0]&&rows[0].region)||""};
    }).sort(function(x,y){return y.n-x.n;});
  });
}
function saveList(){ stored("wo-saved", S.saved); updateBadge(); }
function isSaved(id){return S.saved.indexOf(id)>=0;}
function toggleSave(id, btn){
  var i=S.saved.indexOf(id);
  if (i>=0){ S.saved.splice(i,1); toast("Removed from your list"); }
  else { S.saved.push(id); toast(ico("heart")+" Saved to your list"); if (S.saved.length===3) setTimeout(listNudge,700); }
  saveList();
  root.querySelectorAll('[data-heart="'+id+'"]').forEach(function(b){ b.setAttribute("aria-pressed",String(isSaved(id))); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
  if (S.view==="saved" && !root.querySelector(".wo-sheet.on")) render();
}

/* ================= building blocks ================= */
function heart(r){return '<button class="wo-heart" type="button" data-heart="'+esc(r.listing_id)+'" aria-pressed="'+isSaved(r.listing_id)+'" aria-label="Save '+esc(r.name)+'">'+ico("heart","")+'</button>';}
function pills(r, max){
  var p=[];
  if (r._d!=null && isFinite(r._d) && S.me) p.push('<span class="wo-pill dist">'+fmtDist(r._d)+'</span>');
  if (r.member_deal) p.push('<span class="wo-pill deal">Member deal</span>');
  if (r.owner) p.push('<span class="wo-pill ver">'+ico("check","wo-i12")+' Owner verified</span>');
  if (r.ver) p.push('<span class="wo-pill ver">Certified woman-owned</span>');
  r.badgeList.forEach(function(b){p.push('<span class="wo-pill own">'+esc(b)+'</span>');});
  if (/temporarily/i.test(r.approval)) p.push('<span class="wo-pill closed">Temporarily closed</span>');
  return p.slice(0,max||4).join("");
}
function card(r){
  var c=cat(r);
  return '<article class="wo-card'+(r.isMember?' member':'')+'" style="--cc:'+c.c+'" data-open="'+esc(r.listing_id)+'"'+(r.google_place_id&&!r.photo_url&&gPhotoOn("cards")?' data-gp="1"':'')+' tabindex="0" role="button" aria-label="'+esc(r.name)+'">'+
    heart(r)+'<div class="wo-perf">'+stamp(r)+'</div>'+
    (r.isMember ? (r.headshot_url?'<img class="hs" src="'+esc(mediaUrl(r.headshot_url))+'" alt="" loading="lazy">':'<span class="hs" aria-hidden="true">'+esc(r.name.charAt(0))+'</span>') : '')+
    '<div class="body">'+(r.isMember?'<span class="wo-hosttag">'+(C.logoUrl?'<img src="'+esc(C.logoUrl)+'" alt="">':'')+'Member Host</span>':'')+
    '<span class="cat">'+esc(c.short)+'</span><h4>'+esc(r.name)+'</h4><span class="where">'+esc(where(r))+'</span>'+
    (r.founder?'<span class="owner">'+ico("user")+'Owned by '+esc(r.founder)+'</span>':'')+
    (r.short_description?'<p class="desc">'+esc(r.short_description)+'</p>':'')+
    (r.member_deal?'<span class="wo-carddeal">'+ico("tag")+'<span><b>Member deal:</b> '+esc(r.member_deal)+'</span></span>':'')+'</div>'+
    '<div class="meta">'+pills(r)+'</div></article>';
}
function row(r, extra){
  return '<div class="wo-row" data-open="'+esc(r.listing_id)+'" role="button" tabindex="0">'+stamp(r,{nopm:1})+
    '<div style="min-width:0"><b>'+esc(r.name)+'</b><span>'+esc(cat(r).short)+' \u00b7 '+esc(where(r))+(r._d!=null&&S.me&&isFinite(r._d)?' \u00b7 '+fmtDist(r._d):'')+'</span></div>'+(extra||heart(r).replace("wo-heart","wo-heart wo-inl"))+'</div>';
}
function carousel(id, rows){
  return '<div class="wo-car"><div class="wo-track" id="'+id+'">'+rows.map(card).join("")+'</div></div>';
}
function arrows(id){return '<div class="wo-arrows"><button class="wo-arrow" type="button" data-scroll="'+id+'" data-dir="-1" aria-label="Scroll back">'+ico("left")+'</button><button class="wo-arrow" type="button" data-scroll="'+id+'" data-dir="1" aria-label="Scroll forward">'+ico("right")+'</button></div>';}
function sechead(eyebrow, title, sub, right){
  return '<div class="wo-sechead"><div><span class="wo-eyebrow">'+eyebrow+'</span><h2>'+title+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+(right||'')+'</div>';
}
/* City cover photo from hero_photo_url on the City guides tab, with a shade so white text stays readable. */
function coverImg(u){ return '<img class="wo-cover" src="'+esc(u)+'" alt="" loading="lazy" referrerpolicy="no-referrer"><i class="wo-shade"></i>'; }
function citycard(cy){
  var c=CITIES[cy.slug]||{}, color=cityColor(cy.slug), intro=(c.intro||"").split(". ")[0];
  var rows=DATA.filter(function(r){return r.city_guide===cy.slug;}), counts={};
  rows.forEach(function(r){var k=cat(r).short; counts[k]=(counts[k]||0)+1;});
  var top=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];}).slice(0,3);
  return '<button class="wo-citycard" type="button" data-city="'+esc(cy.slug)+'" style="--cc:'+color+'">'+
    '<div class="top'+(c.hero_photo_url?' hasimg':'')+'">'+(c.hero_photo_url?coverImg(c.hero_photo_url):pattern(hash(cy.slug)+2))+'<span class="ring"><b class="n">'+cy.n+'</b>PLACES</span><span>'+esc(cy.country==="US"?(cy.region||"United States"):cy.country)+'</span><b>'+esc(cy.name)+'</b></div>'+
    '<div class="bot">'+top.map(function(k){return '<span class="wo-pill">'+counts[k]+' '+esc(k)+'</span>';}).join("")+'</div></button>';
}

/* ================= shell ================= */
function shell(){
  root.innerHTML =
   '<nav class="wo-nav" aria-label="Woman-Owned directory"><div class="wo-in">'+
     '<button class="wo-brand" type="button" data-go="">'+(C.logoUrl?'<img src="'+esc(C.logoUrl)+'" alt="">':'')+'<span><b>Woman-Owned</b><small>by Wanderful</small></span></button>'+
     navbtn("home","home","Home")+navbtn("browse","search","Browse")+navbtn("map","map","Map")+navbtn("cities","city","Cities")+navbtn("deals","tag","Deals")+'<a class="wo-navbtn" href="'+esc(C.tripsDirectoryUrl||"https://sheswanderful.com/woman-owned-trips")+'">'+ico("compass")+'<span>Trips</span></a>'+
     navbtn("saved","heart","My list",'<span class="wo-badge" id="wo-savedn" hidden>0</span>')+
     '<button class="wo-navbtn wo-add" type="button" data-go="add">'+ico("plus")+'<span>Add<span class="lg"> a place</span></span></button>'+
   '</div></nav><main id="wo-view"><div class="wo-loading">Loading woman-owned places\u2026</div></main>'+
   '<div class="wo-scrim" hidden></div><aside class="wo-sheet" role="dialog" aria-modal="true" aria-label="Place details" hidden></aside>';
  updateBadge();
}
function navbtn(v,i,label,extra){return '<button class="wo-navbtn" type="button" data-go="'+(v==="home"?"":v)+'" data-nav="'+v+'">'+ico(i)+'<span>'+label+'</span>'+(extra||"")+'</button>';}
function updateBadge(){var b=root.querySelector("#wo-savedn"); if(!b) return; b.textContent=S.saved.length; b.hidden=!S.saved.length;}
function setNav(){root.querySelectorAll("[data-nav]").forEach(function(b){ var v=b.getAttribute("data-nav"); if((S.view===v)||(v==="cities"&&S.view==="city")) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });}

/* ================= views ================= */
/* Home hero. Place of the week rotates weekly and prefers listings with a real photo.
   The two cards beside it: real listing photos once 20+ listings have one, otherwise community photos (always looks full).
   featuredIds in the Code Block overrides: first id = Place of the week, next two = the side cards. */
function hasPhoto(r){ return !!mediaUrl(r.photo_url); }
function featured(){
  var week=Math.floor(Date.now()/6048e5);
  var pins=(C.featuredIds||[]).map(function(i){return BYID[i];}).filter(Boolean);
  var pool=DATA.filter(function(r){return r.listing_type==="Place" && (r.short_description||"").length>60;});
  var withPh=pool.filter(function(r){ return hasPhoto(r) || (gPhotoOn("detail") && r.google_place_id); });
  var spot=pins[0]||seeded(withPh.length?withPh:pool, week)[0];
  var sides=pins.slice(1,3);
  var photoListings=DATA.filter(function(r){return r.listing_type!=="Online" && hasPhoto(r) && r!==spot;});
  if (sides.length<2 && photoListings.length>=20) sides=sides.concat(seeded(photoListings.filter(function(r){return sides.indexOf(r)<0;}), week+7).slice(0,2-sides.length));
  return {spot:spot, sides:sides};
}
function heroCards(f){
  var card=function(r){return '<div class="f wo-perf" data-open="'+esc(r.listing_id)+'" title="'+esc(r.name)+'">'+stamp(r)+'</div>';};
  var cm=comm().slice(0,2), out=[];
  for (var i=0;i<2;i++){
    if (f.sides[i]) out.push(card(f.sides[i]));
    else if (cm[i]) out.push('<div class="f wo-perf ph"><div class="wo-stamp" style="--cc:var(--teal)"><img src="'+cm[i].src+'" alt="'+esc(cm[i].alt)+'"></div></div>');
  }
  if (f.spot) out.push(card(f.spot).replace('class="f wo-perf"','class="f wo-perf" id="wo-spotcard"'));
  return out.join("");
}
function viewHome(){
  var f=featured(), spot=f.spot, places=DATA.filter(function(r){return r.listing_type==="Place";});
  var countries=new Set(places.map(function(r){return r.country;}).filter(Boolean)).size;
  var day=Math.floor(Date.now()/864e5);
  var stays=DATA.filter(function(r){return r.category==="Stays" && r.listing_type!=="Online";});
  stays.sort(function(a,b){return (b.isMember-a.isMember)||((b.short_description?1:0)-(a.short_description?1:0));});
  var food=seeded(DATA.filter(function(r){return r.category==="Food and drink" && r.short_description;}), day).slice(0,16);
  var recent=DATA.filter(function(r){return r.listing_type!=="Online" && r.date_added;}).sort(function(a,b){return b.date_added.localeCompare(a.date_added);}).slice(0,14);
  var deals=DATA.filter(function(r){return r.member_deal;});
  var h='';
  h+='<section class="wo-night wo-homehero">'+mapArt(7, CITYLIST.slice(0,6).map(function(c){return c.name;}), {labels:false})+'<div class="wo-in"><div class="wo-hero"><div>'+
     '<span class="wo-eyebrow wo-mark">'+ico("pin")+'Woman-Owned \u00b7 by Wanderful</span>'+
     '<h1>Go where <em class="t">women own the place</em>.</h1>'+
     '<p class="lead">'+esc(C.intro||"Hotels, cafes, bookstores, breweries and walking tours, all owned by women. Search a city, save the places you love, and turn your list into a walking route.")+'</p>'+
     '<div class="wo-searchbox"><label class="wo-search">'+ico("search")+'<input id="wo-hq" type="search" autocomplete="off" placeholder="Try Boston, bookstores or a hotel name" aria-label="Search woman-owned places"><button class="wo-btn wo-pri wo-sm" type="button" id="wo-hgo">Search</button></label><div class="wo-suggest" id="wo-sug" hidden></div></div>'+
     '<div class="wo-quick"><button class="wo-btn wo-sm" type="button" data-act="near">'+ico("near")+' Near me</button><button class="wo-btn wo-sm" type="button" data-act="surprise">'+ico("shuffle")+' Surprise me</button><button class="wo-btn wo-sm" type="button" data-go="map">'+ico("map")+' Open the map</button></div>'+
     '<div class="wo-stats"><div><b>'+places.length.toLocaleString()+'</b><span>places to visit</span></div><div><b>'+countries+'</b><span>countries</span></div><div><b>'+CITYLIST.length+'</b><span>city guides</span></div><div><b>'+DATA.filter(function(r){return r.listing_type!=="Place";}).length+'</b><span>tours, trips and brands</span></div></div>'+
   '</div><div class="wo-feature">'+
     '<div class="wo-passport"><div class="wo-pphead"><span class="wo-eyebrow">Passport \u00b7 this week</span><span class="wo-postmark">'+esc(new Date().toLocaleDateString(undefined,{month:"short",year:"numeric"}).toUpperCase())+'</span></div>'+
     '<div class="wo-fan">'+heroCards(f)+'</div>'+
     (spot?'<div class="wo-spot" style="--cc:'+cat(spot).c+'"><span class="wo-eyebrow">Place of the week</span><h3>'+esc(spot.name)+'</h3><span class="wo-mono">'+esc(cat(spot).short+" \u00b7 "+where(spot))+'</span>'+(spot.short_description?'<p>'+esc(spot.short_description)+'</p>':'')+
       '<div class="wo-quick" style="margin-top:6px"><button class="wo-btn wo-pri wo-sm" type="button" data-open="'+esc(spot.listing_id)+'">See this place</button><button class="wo-btn wo-sm" type="button" data-heart="'+esc(spot.listing_id)+'" aria-pressed="'+isSaved(spot.listing_id)+'">'+ico("heart")+' Save</button></div></div>':'')+
   '</div></div></div></div></section><div class="wo-in">';

  h+='<section class="wo-sec">'+sechead("Browse by type","What are you looking for?")+'<div class="wo-cols">'+PLACE_CATS.map(function(k){
      var n=DATA.filter(function(r){return r.category===k && r.listing_type!=="Online";}).length;
      return '<button class="wo-col" type="button" data-cat="'+esc(k)+'" style="--cc:'+CATS[k].c+'"><i>'+ico(CATS[k].i,"")+'</i><b>'+esc(CATS[k].short)+'</b><span>'+n.toLocaleString()+' places</span></button>';
    }).join("")+'</div></section>';
  var pins=DATA.filter(function(r){return geo(r) && r.listing_type!=="Online";}).length;
  h+='<section class="wo-sec">'+sechead("The map","See every place at once",pins.toLocaleString()+" woman-owned places with a pin. Tap a cluster to zoom in, or tap a pin for details.",'<button class="wo-btn wo-sm" type="button" data-go="map">'+ico("map")+' Open the full map</button>')+
     '<div class="wo-homemap"><div class="wo-map" id="wo-homemap"></div></div></section>';

  if (S.me){
    var near=nearest(DATA.filter(function(r){return r.listing_type!=="Online";}),12);
    h+='<section class="wo-sec">'+sechead("Near "+esc(S.meLabel||"you"),"Woman-owned, close by","Sorted by distance from "+(S.meLabel&&S.meLabel!=="you"?"the center of "+esc(S.meLabel):"where you are now")+".",arrows("wo-c-near"))+carousel("wo-c-near",near)+'</section>';
  }

  h+='<section class="wo-sec">'+sechead("City guides","Pick a city, see who runs it","Each guide starts with walking tours and local tips, then the places to eat, shop and stay.",'<div class="wo-headright"><button class="wo-arrowlink" type="button" data-go="cities">All '+CITYLIST.length+' city guides \u2192</button>'+arrows("wo-c-cities")+'</div>')+
     '<div class="wo-car"><div class="wo-track" id="wo-c-cities">'+CITYLIST.slice(0,12).map(citycard).join("")+'</div></div></section></div>';

  h+='<section class="wo-band"><div class="wo-in">'+sechead("Places to stay","Sleep somewhere a woman built","Boutique hotels, inns, hostels and farm stays, from Puerto Rico to Panama.",arrows("wo-c-stays"))+carousel("wo-c-stays",stays.slice(0,16))+'</div></section>';

  h+='<div class="wo-in"><section class="wo-sec">'+sechead("Eat and drink","Eat your way around","Bakeries, chef-owned restaurants, cideries and coffee. A new mix every day.",arrows("wo-c-food"))+carousel("wo-c-food",food)+'</section>';
  h+='<section class="wo-sec">'+sechead("Just added","Recently added","The newest woman-owned businesses on the map.",arrows("wo-c-new"))+carousel("wo-c-new",recent)+'</section>';
  if (deals.length) h+='<section class="wo-sec">'+sechead("Member deals","Deals for Wanderful members","Every business marked Member deal has an offer for Wanderful members. Codes live in the member community.",arrows("wo-c-deals"))+carousel("wo-c-deals",deals.slice(0,16))+'</section>';

  h+='<section class="wo-sec">'+sechead("Beyond the map","Plan the whole trip with women","Tour operators, trip companies, travel planners, products and communities, all founded by women.")+'<div class="wo-tiles">'+
     TYPES.slice(1).map(function(t){var n=DATA.filter(t.test).length, k={tours:"Tours and activities",trips:"Trip companies",planners:"Planners",products:"Products",communities:"Communities"}[t.id];
       var sub={tours:"Walking tours, food tours and cooking classes led by women.",trips:"Small-group and women-only trips, many with set departures.",planners:"Advisors and planners who build the trip for you.",products:"Bags, apparel and travel gear from women-owned brands.",communities:"Groups and nonprofits for women who travel."}[t.id];
       return '<button class="wo-tile" type="button" data-type="'+t.id+'" style="--cc:'+CATS[k].c+'"><em>'+n+' listings</em><b>'+esc(t.label)+'</b><span>'+sub+'</span></button>';}).join("")+
     (C.tripsDirectoryUrl?'<a class="wo-tile" href="'+esc(C.tripsDirectoryUrl)+'" style="--cc:var(--c-stays);text-decoration:none;color:inherit"><em>Dated trips</em><b>Woman-owned trips</b><span>Group trips with dates and member savings.</span></a>':'')+
     '</div></section>';

  var col=comm().length>4?comm().slice(2,5):comm().slice(-3), img=function(x,cl){ return x?'<img class="'+cl+'" src="'+x.src+'" alt="'+esc(x.alt)+'" loading="lazy">':''; };
  if (col.length) h+='<section class="wo-sec wo-people"><div class="wo-collage">'+img(col[0],'a')+img(col[1],'b')+img(col[2],'c')+'</div>'+
     '<div class="txt"><span class="wo-eyebrow">Who\u2019s behind the map</span><h2>Made by women who travel</h2>'+
     '<p>Wanderful has connected women who travel since 2009. Our members meet up in local hubs around the world, and a lot of those meetups happen at the places on this map. Every listing was added by an owner, recommended by a traveler or checked by our team.</p>'+
     '<div class="wo-quick">'+(C.joinUrl?'<a class="wo-btn wo-pri" href="'+esc(C.joinUrl)+'" target="_blank" rel="noopener">Become a member</a>':'')+'<button class="wo-btn" type="button" data-go="cities">Find a city guide</button></div></div></section>';

  h+='<section class="wo-sec">'+sechead("How it works","Find it, save it, go")+'<div class="wo-steps">'+
     '<div class="wo-step"><b>Find a place you love</b><p>Search a city or a type of place, or tap Near me when you\u2019re already out exploring.</p></div>'+
     '<div class="wo-step"><b>Save it to your list</b><p>Tap the heart. Your list groups places by city and turns them into a walking or transit route in Google Maps.</p></div>'+
     '<div class="wo-step"><b>Unlock the member deal</b><p>Some owners offer a deal for Wanderful members. Look for the Member deal badge and find the codes in the community.</p></div></div></section>';

  h+=tripsBand()+'<div id="wo-stories"></div>';
  h+='<section class="wo-sec">'+sechead("Add to the map","Know a woman-owned spot?","Listing is free. Owners can add an optional deal for Wanderful members, and Entrepreneur members get a bigger listing.")+'<div class="wo-offer">'+
     '<div><span class="wo-eyebrow">Free listing</span><h3>Recommend or list a business</h3><ul><li>A card in the directory and its city guide</li><li>A pin on the map, with directions</li><li>Optional member deal and Member deal badge</li></ul><div class="wo-quick">'+
       (C.submitUrl?'<a class="wo-btn wo-pri" href="'+esc(C.submitUrl)+'" target="_blank" rel="noopener">List my business</a>':'')+(C.recommendUrl?'<a class="wo-btn" href="'+esc(C.recommendUrl)+'" target="_blank" rel="noopener">Recommend a place</a>':'')+'</div></div>'+
     '<div class="m"><span class="wo-eyebrow">Entrepreneur members</span><h3>Become a Member Host</h3><ul><li>Large card with your headshot and story</li><li>Member Host badge and top placement</li><li>Featured as Place of the week and in our newsletter</li></ul><div class="wo-quick">'+
       (C.joinUrl?'<a class="wo-btn wo-pri" href="'+esc(C.joinUrl)+'" target="_blank" rel="noopener">Become a member</a>':'')+(C.updateUrl?'<a class="wo-btn wo-ghost" href="'+esc(C.updateUrl)+'" target="_blank" rel="noopener">Update a listing</a>':'')+'</div></div></div></section></div>';

  h+=partnersBand();
  var FAQ=[
    ["What is this?","Woman-Owned by Wanderful is a free directory of women-owned places to visit: hotels, cafes, restaurants, shops, bookstores, breweries, wellness spaces and walking tours, plus women-founded trip companies, planners and brands. Search a city, save the places you love, and turn your list into a route."],
    ["Why does it exist?","Where you spend money on a trip matters. Women own a growing share of small businesses but still get a fraction of the attention and funding. Wanderful has connected women who travel since 2009, and this directory makes it easy to put travel spending behind the women building places worth visiting."],
    ["What counts as woman-owned?","A business is listed when it is at least 50% owned by one or more women. That includes businesses co-owned equally with a partner. Brick-and-mortar places need a location travelers can visit."],
    ["Who adds the listings?","Owners list their own businesses, travelers recommend places they love, and the Wanderful team reviews every submission before it goes live. Listing is always free."],
    ["What do the badges mean?","Owner verified means the owner submitted or confirmed the listing herself. Certified woman-owned means the business holds a woman-owned certification or is marked women-owned on Google. Badges like Black-owned or LGBTQ+-owned come from owners or the people who nominated them. Member deal means the owner offers something special to Wanderful members."],
    ["Something is wrong or a place closed. What do I do?","Open the place and tap Report a problem. Our team checks every report and updates the listing, usually within a few days."],
    ["Can I share my photos?","Yes, please. Open any place and add a photo with your tip. Our team looks at every photo before it appears."]];
  h+='<section class="wo-sec">'+sechead("Questions","Good to know")+'<div class="wo-faq">'+FAQ.map(function(q){return '<details><summary>'+esc(q[0])+'</summary><p>'+esc(q[1])+'</p></details>';}).join("")+'</div></section>';
  return h;
}

function filteredBrowse(){
  var t=TYPES.filter(function(x){return x.id===S.type;})[0]||TYPES[0];
  var q=norm(S.q).split(/\s+/).filter(Boolean), cats=Object.keys(S.cats).filter(function(k){return S.cats[k];}), bad=Object.keys(S.badges).filter(function(k){return S.badges[k];});
  var out=DATA.filter(function(r){
    if (!t.test(r)) return false;
    for (var i=0;i<q.length;i++) if (r.hay.indexOf(q[i])<0) return false;
    if (cats.length && cats.indexOf(r.category)<0) return false;
    if (bad.length && !bad.some(function(b){return r.badgeList.indexOf(b)>=0;})) return false;
    if (S.deal && !r.member_deal) return false;
    if (S.member && !r.isMember) return false;
    if (S.ownerv && !r.owner) return false;
    return true;
  });
  return sortRows(out);
}
function sortRows(out){
  if (S.me) out.forEach(function(r){ r._d=geo(r)?km(S.me.lat,S.me.lng,r.lat,r.lng):Infinity; });
  var s=S.sort;
  if (s==="near" && S.me) out.sort(function(a,b){return a._d-b._d;});
  else if (s==="new") out.sort(function(a,b){return String(b.date_added).localeCompare(String(a.date_added));});
  else if (s==="az") out.sort(function(a,b){return a.name.localeCompare(b.name);});
  else out.sort(function(a,b){return (b.isMember-a.isMember)||((!!b.member_deal)-(!!a.member_deal))||((b.short_description?1:0)-(a.short_description?1:0))||a.name.localeCompare(b.name);});
  return out;
}
function nearest(rows,n){ rows.forEach(function(r){ r._d=geo(r)?km(S.me.lat,S.me.lng,r.lat,r.lng):Infinity; }); return rows.filter(function(r){return isFinite(r._d);}).sort(function(a,b){return a._d-b._d;}).slice(0,n); }

function viewBrowse(){
  var t=TYPES.filter(function(x){return x.id===S.type;})[0]||TYPES[0];
  var rows=filteredBrowse(), pool=DATA.filter(t.test);
  var cats=PLACE_CATS.filter(function(k){return S.type==="places" && pool.some(function(r){return r.category===k;});});
  var badges={}; pool.forEach(function(r){r.badgeList.forEach(function(b){badges[b]=1;});});
  var h='<div class="wo-in"><header class="wo-browsehead"><span class="wo-eyebrow">The index</span><h1>Every woman-owned place, <em class="t">in one search</em></h1></header>'+
   '<div class="wo-toolbar"><div class="wo-toolrow"><label class="wo-search">'+ico("search")+'<input id="wo-bq" type="search" value="'+esc(S.q)+'" placeholder="Search name, city, country or type" aria-label="Search the directory"></label>'+
     '<select class="wo-select" id="wo-sort" aria-label="Sort"><option value="featured">Featured first</option><option value="new">Newest</option><option value="az">A to Z</option><option value="near">Nearest to me</option></select>'+
     '<button class="wo-btn wo-sm" type="button" data-act="near" aria-pressed="'+(!!S.me)+'">'+ico("near")+' Near me</button>'+
     (S.type==="places"||S.type==="tours"?'<button class="wo-btn wo-sm wo-dark" type="button" data-go="map">'+ico("map")+' Show on map</button>':'')+'</div>'+
   '<div class="wo-types" role="tablist">'+TYPES.map(function(x){return '<button class="wo-type" type="button" role="tab" data-type="'+x.id+'" aria-selected="'+(x.id===S.type)+'">'+esc(x.label)+'<small>'+DATA.filter(x.test).length+'</small></button>';}).join("")+'</div>'+
   '<div class="wo-chips">'+cats.map(function(k){return '<button class="wo-chip" type="button" data-fcat="'+esc(k)+'" aria-pressed="'+!!S.cats[k]+'" style="--cc:'+CATS[k].c+'"><span class="dot"></span>'+esc(CATS[k].short)+'</button>';}).join("")+
     (pool.some(function(r){return r.member_deal;})?'<button class="wo-chip" type="button" data-flag="deal" aria-pressed="'+S.deal+'">'+ico("tag")+' Member deal</button>':'')+
     (pool.some(function(r){return r.owner;})?'<button class="wo-chip" type="button" data-flag="ownerv" aria-pressed="'+!!S.ownerv+'">'+ico("check")+' Owner verified</button>':'')+
     (pool.some(function(r){return r.isMember;})?'<button class="wo-chip" type="button" data-flag="member" aria-pressed="'+S.member+'">Member Hosts</button>':'')+
     Object.keys(badges).sort().map(function(b){return '<button class="wo-chip" type="button" data-badge="'+esc(b)+'" aria-pressed="'+!!S.badges[b]+'">'+esc(b)+'</button>';}).join("")+
   '</div></div>'+
   '<div class="wo-result"><span><b>'+rows.length.toLocaleString()+'</b> '+(rows.length===1?"result":"results")+(S.q?' for \u201c'+esc(S.q)+'\u201d':'')+'</span>'+
     ((S.q||Object.keys(S.cats).some(function(k){return S.cats[k];})||S.deal||S.member||Object.keys(S.badges).some(function(k){return S.badges[k];}))?'<button class="wo-btn wo-sm" type="button" data-act="clear">Clear filters</button>':'')+'</div>';
  if (!rows.length) h+='<div class="wo-empty"><h3>Nothing here yet</h3><p>Try a different word or clear a filter. Know a woman-owned business that should be here?</p>'+(C.recommendUrl?'<a class="wo-btn wo-pri" href="'+esc(C.recommendUrl)+'" target="_blank" rel="noopener">Recommend it</a>':'')+'</div>';
  else h+='<div class="wo-grid">'+rows.slice(0,S.shown).map(card).join("")+'</div>'+(rows.length>S.shown?'<div class="wo-more"><button class="wo-btn" type="button" data-act="more">Show more ('+(rows.length-S.shown).toLocaleString()+' left)</button></div>':'');
  return h+'</div>';
}

function viewMap(){
  return '<div class="wo-in"><div class="wo-mapview"><div class="wo-mapbox"><div class="wo-map" id="wo-bigmap"></div><div class="wo-mapchips">'+
    PLACE_CATS.map(function(k){return '<button class="wo-chip" type="button" data-fcat="'+esc(k)+'" aria-pressed="'+!!S.cats[k]+'" style="--cc:'+CATS[k].c+'"><span class="dot"></span>'+esc(CATS[k].short)+'</button>';}).join("")+
    '</div></div><div class="wo-mapside" id="wo-mapside" aria-label="Places in view"></div></div></div>';
}
function mapPool(){
  var q=norm(S.q).split(/\s+/).filter(Boolean), cats=Object.keys(S.cats).filter(function(k){return S.cats[k];});
  return DATA.filter(function(r){
    if (!geo(r) || r.listing_type==="Online") return false;
    for (var i=0;i<q.length;i++) if (r.hay.indexOf(q[i])<0) return false;
    if (cats.length && cats.indexOf(r.category)<0) return false;
    return true;
  });
}
function makeMap(id, opts){
  if (!window.L){ setTimeout(function(){ if(window.L && document.getElementById(id)){ if(id==="wo-bigmap") drawBigMap(); else if(id==="wo-citymap") drawCityMap(); else if(id==="wo-homemap") drawHomeMap(); } },800); return null; }
  if (maps[id]) { try{ maps[id].remove(); }catch(e){} }
  var el=document.getElementById(id); if(!el) return null;
  var m=L.map(el,Object.assign({scrollWheelZoom:false,worldCopyJump:true,zoomControl:true},opts||{})).setView([32,-40],2);
  /* CARTO needs a free key since Sept 2026 (carto.com/basemaps/apikey). Without it tiles say "API key required". */
  L.tileLayer(C.tileUrl||("https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"+(C.cartoKey&&!/^PASTE_/.test(C.cartoKey)?"?key="+encodeURIComponent(C.cartoKey):"")),{maxZoom:19,subdomains:"abcd",
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}).addTo(m);
  m.on("focus",function(){m.scrollWheelZoom.enable();}); m.on("blur",function(){m.scrollWheelZoom.disable();});
  maps[id]=m; return m;
}
function pin(r){
  return L.divIcon({className:"",html:'<div class="wo-pin'+(r.isMember?' mem':'')+'" style="--cc:'+cat(r).c+'"></div>',iconSize:r.isMember?[24,24]:[18,18]});
}
function popup(r){return '<div class="wo-pop"><b>'+esc(r.name)+'</b><span>'+esc(cat(r).short+" \u00b7 "+(r.city||""))+'</span>'+(r.member_deal?'<span>Member deal available</span>':'')+'<button type="button" data-open="'+esc(r.listing_id)+'">See details</button></div>';}
function clusterIcon(c){var n=c.getChildCount(),s=n<10?34:n<100?42:52;return L.divIcon({html:'<div class="wo-cluster" style="width:'+s+'px;height:'+s+'px">'+n+'</div>',className:"",iconSize:[s,s]});}
/* Home page map: every pin, clustered. On phones one finger scrolls the page, so dragging is off; tap clusters to zoom. */
function drawHomeMap(){
  if (!document.getElementById("wo-homemap")) return;
  var m=makeMap("wo-homemap",{dragging:!(window.L&&L.Browser.mobile),tap:true}); if(!m) return;
  var cl=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,iconCreateFunction:clusterIcon});
  var pool=DATA.filter(function(r){return geo(r) && r.listing_type!=="Online";});
  pool.forEach(function(r){ var x=L.marker([r.lat,r.lng],{icon:pin(r),title:r.name}); x.bindPopup(popup(r)); cl.addLayer(x); });
  m.addLayer(cl);
  if (S.me) m.setView([S.me.lat,S.me.lng],11);
  else m.setView([25,0], m.getSize().x<700?1:2);
  setTimeout(function(){m.invalidateSize();},50);
}
function drawBigMap(){
  var m=makeMap("wo-bigmap"); if(!m) return;
  var cl=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:46,iconCreateFunction:function(c){var n=c.getChildCount(),s=n<10?34:n<100?42:52;return L.divIcon({html:'<div class="wo-cluster" style="width:'+s+'px;height:'+s+'px">'+n+'</div>',className:"",iconSize:[s,s]});}});
  var pool=mapPool(), mk={};
  pool.forEach(function(r){ var x=L.marker([r.lat,r.lng],{icon:pin(r),title:r.name}); x.bindPopup(popup(r)); x._wo=r; mk[r.listing_id]=x; cl.addLayer(x); });
  m.addLayer(cl);
  if (S.me){ L.marker([S.me.lat,S.me.lng],{icon:L.divIcon({className:"",html:'<div class="wo-pin you"></div>',iconSize:[18,18]}),title:"You are here"}).addTo(m); m.setView([S.me.lat,S.me.lng],13); }
  else if (pool.length) m.fitBounds(L.latLngBounds(pool.map(function(r){return [r.lat,r.lng];})).pad(0.08),{maxZoom:13});
  function side(){
    var b=m.getBounds(), inview=pool.filter(function(r){return b.contains([r.lat,r.lng]);});
    var c=m.getCenter(); inview.forEach(function(r){r._c=km(c.lat,c.lng,r.lat,r.lng);}); inview.sort(function(a,b){return (b.isMember-a.isMember)||a._c-b._c;});
    var el=document.getElementById("wo-mapside"); if(!el) return;
    el.innerHTML='<div class="wo-mono" style="padding:4px 2px">'+inview.length.toLocaleString()+' places in view'+(inview.length>40?' \u00b7 zoom in to see them all':'')+'</div>'+inview.slice(0,40).map(function(r){return row(r);}).join("");
  }
  m.on("moveend",side); side();
  root.querySelector("#wo-mapside").onmouseover=function(e){var rr=e.target.closest(".wo-row"); if(!rr) return; var x=mk[rr.getAttribute("data-open")]; if(x&&cl.getVisibleParent(x)===x) x.openPopup();};
  setTimeout(function(){m.invalidateSize();},50);
}

function viewCities(){
  var q=norm(S.cityq), list=CITYLIST.filter(function(c){return !q || norm(c.name+" "+c.region+" "+c.country).indexOf(q)>=0;});
  var us=list.filter(function(c){return c.country==="US";}), world=list.filter(function(c){return c.country!=="US";});
  var h='<div class="wo-in"><header class="wo-browsehead"><span class="wo-eyebrow">City guides</span><h1>'+CITYLIST.length+' cities, <em class="t">mapped by women</em></h1>'+
    '<label class="wo-search" style="max-width:520px">'+ico("search")+'<input id="wo-cq" type="search" value="'+esc(S.cityq)+'" placeholder="Find a city" aria-label="Find a city"></label></header>';
  if (us.length) h+='<section class="wo-sec" style="padding-top:20px">'+sechead("United States",us.length+" city guides")+'<div class="wo-cityidx">'+us.map(citycard).join("")+'</div></section>';
  if (world.length) h+='<section class="wo-sec">'+sechead("Around the world",world.length+" city guides")+'<div class="wo-cityidx">'+world.map(citycard).join("")+'</div></section>';
  if (!list.length) h+='<div class="wo-empty" style="margin-top:20px"><h3>No guide for that city yet</h3><p>Help us start one by recommending a woman-owned business there.</p>'+(C.recommendUrl?'<a class="wo-btn wo-pri" href="'+esc(C.recommendUrl)+'" target="_blank" rel="noopener">Recommend a place</a>':'')+'</div>';
  return h+'</div>';
}

/* ---------- member deals: browsable by anyone, codes stay in the member community ---------- */
function memberPitch(){ return C.memberPitch || "Wanderful membership is $129 a year. One deal on a trip, a stay or a planning session can cover it."; }
function dealCta(){
  return '<div class="wo-quick">'+(C.joinUrl?'<a class="wo-btn wo-pri" href="'+esc(C.joinUrl)+'" target="_blank" rel="noopener">Become a member</a>':'')+
    (C.memberDealsUrl?'<a class="wo-btn" href="'+esc(C.memberDealsUrl)+'" target="_blank" rel="noopener">Members: get the codes</a>':'')+'</div>';
}
function viewDeals(){
  var all=DATA.filter(function(r){return r.member_deal;});
  var h='<div class="wo-in"><header class="wo-browsehead wo-dealhead"><span class="wo-eyebrow">'+ico("tag")+' Member deals</span>'+
    '<h1>Deals from <em class="t">woman-owned</em> businesses</h1>'+
    '<p>'+all.length+' woman-owned businesses offer something special to Wanderful members. '+esc(memberPitch())+'</p>'+
    '<div class="wo-dealwhat"><b>What\u2019s a member deal?</b><p>It\u2019s a discount or perk a woman-owned business offers Wanderful members: money off a trip, tour or stay, a free planning or coaching session, a percentage off travel gear, or a welcome gift when you book. Each business sets its own deal and terms, and you book directly with them. The deal is shown on every card below, so you can see what you\u2019d get before you click.</p></div>'+
    '<ol class="wo-dealsteps"><li><b>Browse</b><span>Anyone can see the deals.</span></li><li><b>Join</b><span>Become a Wanderful member.</span></li><li><b>Redeem</b><span>Codes and how to use them are in the member community.</span></li></ol>'+
    dealCta().replace('</div>$','')+'<p class="wo-small" style="margin-top:10px">Own a woman-owned business? <button class="wo-linkbtn" type="button" data-jump="wo-offerdeal">Offer members a deal</button></p></header>';
  if (!all.length) return h+'<div class="wo-empty"><h3>No deals yet</h3><p>Check back soon for new member deals.</p></div></div>';
  var places=all.filter(function(r){return r.listing_type==="Place";});
  if (places.length){
    var byCity={}; places.forEach(function(r){ var g=r.city_guide||"other"; (byCity[g]=byCity[g]||[]).push(r); });
    h+='<section class="wo-sec">'+sechead(places.length+(places.length===1?" place":" places"),"Deals you can use in person","Woman-owned places on the map with a member deal, by city.")+'</section>';
    Object.keys(byCity).sort(function(a,b){return byCity[b].length-byCity[a].length;}).forEach(function(g){
      h+='<section class="wo-sec" style="padding-top:0"><h3 class="wo-dealcity">'+(g!=="other"?'<button type="button" data-city="'+esc(g)+'">'+esc(cityName(g))+' '+ico("right")+'</button>':'Other places')+'</h3><div class="wo-grid">'+byCity[g].map(card).join("")+'</div></section>';
    });
  }
  TYPES.forEach(function(x){ if (x.id==="places") return; var rows=all.filter(x.test); if(!rows.length) return;
    h+='<section class="wo-sec">'+sechead(rows.length+(rows.length===1?" deal":" deals"),esc(x.label),"Use these from anywhere.")+'<div class="wo-grid">'+rows.map(card).join("")+'</div></section>'; });
  h+='<section class="wo-sec" id="wo-offerdeal">'+sechead("For business owners","Offer Wanderful members a deal","Woman-owned businesses can add a deal for free. It shows on your listing, on this page and on your city guide, and we share new deals with members in the Wanderful community.")+
    '<div class="wo-know">'+
      '<div><b>New to the map?</b><p>Add your business. The form asks if you\u2019d like to offer a member deal and how members redeem it.</p>'+(C.submitUrl?'<a class="wo-btn wo-pri wo-sm" href="'+esc(C.submitUrl)+'" target="_blank" rel="noopener">Add your business and a deal</a>':'')+'</div>'+
      '<div><b>Already listed?</b><p>Use the update form and tell us your deal and how members redeem it, like a code or \u201cmention Wanderful when you book.\u201d</p>'+(C.updateUrl?'<a class="wo-btn wo-sm" href="'+esc(C.updateUrl)+'" target="_blank" rel="noopener">Add a deal to my listing</a>':'')+'</div>'+
      '<div><b>What makes a good deal?</b><p>Something members can use: a set amount or percentage off, a free session or a gift. Codes stay private and only members see them.</p></div>'+
    '</div></section>';
  return h+'</div>';
}
/* city guide extras: deals strip, richer hub box, know-before-you-go */
function cityDeals(g, rows){
  var here=rows.filter(function(r){return r.member_deal;}), anywhere=DATA.filter(function(r){return r.member_deal && r.listing_type!=="Place";}).length;
  if (!here.length && !anywhere) return "";
  var h='<section class="wo-sec wo-citydeals"><div class="wo-dealband"><div><span class="wo-eyebrow" style="color:var(--gold)">'+ico("tag")+' Member deals</span>'+
    '<h2>'+(here.length?here.length+(here.length===1?' deal':' deals')+' in '+esc(cityName(g)):'Deals for your trip to '+esc(cityName(g)))+'</h2>'+
    '<p>'+(here.length?'Wanderful members save at these woman-owned places'+(anywhere?', plus '+anywhere+' more deals on trips, planners and travel gear you can use from anywhere':'')+'. ':'There are '+anywhere+' member deals on trips, planners and travel gear you can use from anywhere. ')+esc(memberPitch())+'</p>'+
    '<div class="wo-quick"><button class="wo-btn" type="button" data-go="deals">See all deals</button>'+(C.joinUrl?'<a class="wo-btn wo-pri" href="'+esc(C.joinUrl)+'" target="_blank" rel="noopener">Become a member</a>':'')+'</div></div>';
  if (here.length) h+='<div class="wo-dealrows">'+here.slice(0,6).map(function(r){return '<button type="button" class="wo-dealrow" data-open="'+esc(r.listing_id)+'"><b>'+esc(r.member_deal)+'</b><span>'+esc(r.name)+' \u00b7 '+esc(cat(r).short)+'</span></button>';}).join("")+'</div>';
  return h+'</div></section>';
}
function cityHub(g, c){
  var hp=hubPhoto(g), img=hp?'<img src="'+hp.src+'" alt="'+esc(hp.alt)+'" loading="lazy">':'';
  if (!c.local_hub_url) return '<div class="wo-hub'+(hp?' hasimg':'')+'">'+img+'<div><b>No Wanderful hub in '+esc(cityName(g))+' yet</b><p>Start one and host meetups at the places in this guide.</p></div>'+(C.startHubUrl?'<a class="wo-btn" href="'+esc(C.startHubUrl)+'" target="_blank" rel="noopener">Start a local hub</a>':'')+'</div>';
  return '<div class="wo-hub wo-hubbig'+(hp?' hasimg':'')+'">'+img+'<div><span class="wo-eyebrow">'+ico("user")+' Local hub</span><b>'+esc(c.local_hub_name||("Wanderful "+cityName(g)))+'</b>'+
    '<p>'+esc(c.hub_about||("Meet women who travel and live in "+cityName(g)+": meetups, local tips and travel buddies, in the Wanderful community."))+'</p>'+
    (c.next_meetup?'<p class="wo-meetup">'+ico("pin")+'<span><b>Next meetup</b> '+esc(c.next_meetup)+'</span></p>':'')+
    '</div><a class="wo-btn wo-pri" href="'+esc(url(c.local_hub_url))+'" target="_blank" rel="noopener">'+(c.next_meetup?'See the meetup':'Join the local hub')+'</a></div>';
}
function cityKnow(g, c){
  var items=[["Getting there",c.getting_there],["Getting around",c.getting_around],["Good to know",c.good_to_know]].filter(function(x){return x[1];});
  if (!items.length && !c.siren_guide_url) return "";
  return '<section class="wo-sec">'+sechead("Before you go","Know before you go")+'<div class="wo-know">'+
    items.map(function(x){return '<div><b>'+x[0]+'</b><p>'+esc(x[1])+'</p></div>';}).join("")+
    (c.siren_guide_url?'<a class="wo-sirenlink" href="'+esc(url(c.siren_guide_url))+'" target="_blank" rel="noopener"><span class="wo-eyebrow">Siren travel guide</span><b>Read the full '+esc(cityName(g))+' guide</b><span>Reporting on the women shaping travel here \u2192</span></a>':'')+
    '</div></section>';
}
function viewCity(){
  var g=S.city, c=CITIES[g]||{}, rows=sortRows(DATA.filter(function(r){return r.city_guide===g;})), color=cityColor(g);
  if (!rows.length) return '<div class="wo-in"><div class="wo-empty" style="margin-top:30px"><h3>We don\u2019t have a guide for '+esc(cityName(g))+' yet</h3><p>Recommend a woman-owned business there and we\u2019ll start one.</p><button class="wo-btn wo-pri" type="button" data-go="cities">See all city guides</button></div></div>';
  var secs=CITY_SECTIONS.map(function(s){return {s:s, rows:rows.filter(s.test)};}).filter(function(x){return x.rows.length;});
  var used={}; secs.forEach(function(x){x.rows=x.rows.filter(function(r){if(used[r.listing_id]) return false; used[r.listing_id]=1; return true;});});
  var rest=rows.filter(function(r){return !used[r.listing_id];}); if (rest.length) secs.push({s:{id:"more",title:"More woman-owned businesses"},rows:rest});
  var picks=rows.filter(function(r){return r.short_description;}).slice(0,3);
  var region=(rows.find(function(r){return r.listing_type==="Place";})||{}).region||"";
  var hoods=[]; rows.forEach(function(r){ if(r.city && hoods.indexOf(r.city)<0) hoods.push(r.city); });
  var h='<section class="wo-cityhero wo-night'+(c.hero_photo_url?' hasimg':'')+'" style="--cc:'+color+'">'+(c.hero_photo_url?coverImg(c.hero_photo_url):'')+mapArt(hash(g), hoods.length>1?hoods:rows.slice(0,6).map(function(r){return r.name;}), {left:true, labels:false})+'<div class="wo-in">'+
    '<div><button class="wo-back" type="button" data-go="cities">'+ico("left")+' All city guides</button><span class="wo-eyebrow" style="display:block">City guide'+(region?' \u00b7 '+esc(region):'')+'</span>'+
    '<h1>Woman-owned '+esc(cityName(g))+'</h1>'+
    '<p>'+esc(c.intro||("A guide to the women who own the places worth visiting in "+cityName(g)+". Save the ones you like, then open your list as a walking route."))+'</p>'+
    '<div class="wo-quick" style="margin-top:18px"><button class="wo-btn wo-pri" type="button" data-jump="wo-citymap-box">'+ico("map")+' Map this city</button><button class="wo-btn wo-ghost" type="button" data-act="sharecity">'+ico("link")+' Share guide</button></div></div>'+
    '<div class="wo-citystats">'+secs.slice(0,4).map(function(x){return '<button type="button" data-jump="sec-'+x.s.id+'"><b>'+x.rows.length+'</b><span>'+esc(x.s.title)+'</span></button>';}).join("")+'</div>'+
  '</div></section><div class="wo-in">';
  h+=cityHub(g,c);
  h+=cityDeals(g,rows);
  var mapped=rows.filter(geo).length, legend={};
  rows.forEach(function(r){ if(!geo(r)) return; var k=cat(r); legend[k.short]=legend[k.short]||{c:k.c,n:0}; legend[k.short].n++; });
  h+='<div class="wo-citycols"><aside class="wo-cityaside" id="wo-citymap-box" aria-label="Map of this guide"><div class="wo-cityside">'+
    '<div class="wo-sidehead"><span class="wo-eyebrow">Map</span><b>'+mapped+(mapped===1?' place':' places')+' on the map</b></div>'+
    '<div class="wo-legend">'+Object.keys(legend).map(function(k){return '<span><i style="background:'+legend[k].c+'"></i>'+esc(k)+' <em>'+legend[k].n+'</em></span>';}).join("")+'</div>'+
    '<div class="wo-citymap"><div class="wo-map" id="wo-citymap"></div></div>'+
    '<p class="wo-small">Tap a pin to see the place. Heart places to build a walking route.</p></div></aside><div class="wo-citylist">';
  if (picks.length>=2) h+='<section class="wo-sec">'+sechead("Start here","Three places to begin")+'<div class="wo-grid">'+picks.map(card).join("")+'</div></section>';
  secs.forEach(function(x){
    h+='<section class="wo-sec" id="sec-'+x.s.id+'">'+sechead(x.rows.length+(x.rows.length===1?" place":" places"),esc(x.s.title))+'<div class="wo-grid">'+x.rows.map(card).join("")+'</div></section>';
  });
  h+='</div></div>';
  h+=cityKnow(g,c);
  h+='<div id="wo-stories" data-city="'+esc(g)+'"></div>';
  h+='<p class="wo-partnerline">'+ico("globe")+'<span>Work with '+esc(cityName(g))+'\u2019s tourism board? <a href="'+esc(partnersUrl())+'">Partner with Wanderful</a> to tell the stories of its women-owned businesses.</span></p>';
  var others=CITYLIST.filter(function(x){return x.slug!==g;}).slice(0,8);
  h+='<section class="wo-sec">'+sechead("Keep exploring","More city guides")+'<div class="wo-car"><div class="wo-track">'+others.map(citycard).join("")+'</div></div></section></div>';
  return h;
}
function drawCityMap(){
  var m=makeMap("wo-citymap"); if(!m) return;
  var pts=DATA.filter(function(r){return r.city_guide===S.city && geo(r);});
  pts.forEach(function(r){ L.marker([r.lat,r.lng],{icon:pin(r),title:r.name}).bindPopup(popup(r)).addTo(m); });
  if (pts.length) m.fitBounds(L.latLngBounds(pts.map(function(r){return [r.lat,r.lng];})).pad(0.12),{maxZoom:14});
  setTimeout(function(){m.invalidateSize();},50);
}

/* ---------- my list + routes ---------- */
function orderStops(rows){
  var left=rows.slice(), out=[], cur=S.me?{lat:S.me.lat,lng:S.me.lng}:null;
  if (!cur){ out.push(left.shift()); cur=out[0]; }
  while(left.length){
    var bi=0,bd=Infinity; left.forEach(function(r,i){var d=geo(r)&&geo(cur)?km(cur.lat,cur.lng,r.lat,r.lng):1e9; if(d<bd){bd=d;bi=i;}});
    cur=left.splice(bi,1)[0]; out.push(cur);
  }
  return out;
}
function routeUrls(stops, mode){
  var urls=[], q=function(r){return encodeURIComponent(q4(r));};
  if (mode==="transit"){
    for (var i=0;i<stops.length-1;i++) urls.push({label:stops[i].name+" to "+stops[i+1].name, href:"https://www.google.com/maps/dir/?api=1&origin="+q(stops[i])+"&destination="+q(stops[i+1])+"&travelmode=transit"});
    return urls;
  }
  var chunk=10; // origin + 8 waypoints + destination keeps each link under Google's limits
  for (var s=0; s<stops.length-1; s+=chunk-1){
    var part=stops.slice(s, s+chunk); if (part.length<2) break;
    var wp=part.slice(1,-1).map(q).join("%7C");
    urls.push({label: (stops.length>chunk?"Part "+(urls.length+1)+": ":"")+part.length+" stops", href:"https://www.google.com/maps/dir/?api=1&origin="+q(part[0])+"&destination="+q(part[part.length-1])+(wp?"&waypoints="+wp:"")+"&travelmode="+mode});
  }
  return urls;
}
function emailFields(btn){
  return '<form class="wo-listform" novalidate><label class="wo-search"><span>'+ico("mail")+'</span><input name="email" type="email" required placeholder="you@example.com" aria-label="Email address" autocomplete="email"><button class="wo-btn wo-pri wo-sm" type="submit">'+btn+'</button></label>'+
    '<label class="wo-optin"><input name="optin" type="checkbox"> Also send me Wanderful\u2019s newsletter with new woman-owned places and member deals. Unsubscribe any time.</label><p class="wo-small" data-msg role="status"></p></form>';
}
function emailBox(){
  return '<section class="wo-emailme"><div><span class="wo-eyebrow">Take it with you</span><h3>Send it to your phone, or to a travel buddy</h3><p class="wo-small" style="color:#C8DDE2">Your list only lives on this device. Email it and you\u2019ll get a link that opens it anywhere, plus a walking route for each city. Planning with a friend? Send it to her too.</p></div>'+
    emailFields("Send my list")+'</section>';
}
/* after the 3rd heart: a small card asking once, at the moment the list is worth keeping */
function listNudge(){
  if (root.querySelector(".wo-nudge")) return;
  try{ if (localStorage.getItem("wo-nudged")) return; localStorage.setItem("wo-nudged","1"); }catch(e){}
  var d=document.createElement("div"); d.className="wo-nudge"; d.setAttribute("role","dialog"); d.setAttribute("aria-label","Send your list");
  d.innerHTML='<button class="wo-x" type="button" data-act="closenudge" aria-label="Not now">'+ico("close")+'</button><b>'+ico("heart")+' '+S.saved.length+' places saved</b><p>Want this list on your phone? We\u2019ll email it with a walking route.</p>'+emailFields("Send it")+'<button class="wo-linkbtn" type="button" data-act="closenudge">Not now</button>';
  var tt=root.querySelector(".wo-toast"); if(tt) tt.classList.remove("on");
  root.appendChild(d); setTimeout(function(){d.classList.add("on");},30);
}
function sendList(e){
  e.preventDefault();
  var f=e.target, em=f.querySelector('[name="email"]'), msg=f.querySelector("[data-msg]"), v=(em.value||"").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){ msg.textContent="Enter an email address like name@example.com."; em.focus(); return; }
  if (!C.listEndpoint || /^PASTE_/.test(C.listEndpoint)){ msg.textContent="On the live site, this emails you the list with route links. (The email service isn\u2019t connected in this preview.)"; return; }
  var body=new URLSearchParams({email:v, optin:f.querySelector('[name="optin"]').checked?"yes":"no", saved:S.saved.join("."), mode:S.mode, page:shareBase()});
  msg.textContent="Sending\u2026";
  fetch(C.listEndpoint,{method:"POST",mode:"no-cors",body:body}).then(function(){ msg.textContent="Sent. Check your inbox for your woman-owned list."; toast(ico("mail")+" List sent to "+esc(v)); var n=f.closest(".wo-nudge"); if(n) setTimeout(function(){n.remove();},1600); try{localStorage.setItem("wo-nudged","1");}catch(x){} },function(){ msg.textContent="That didn\u2019t send. Check your connection and try again."; });
}
function viewSaved(){
  var rows=S.saved.map(function(id){return BYID[id];}).filter(Boolean);
  var h='<div class="wo-in"><header class="wo-browsehead"><span class="wo-eyebrow">My list</span><h1>Your <em class="t">woman-owned</em> itinerary</h1></header>';
  if (!rows.length) return h+'<div class="wo-empty"><span style="color:var(--rose)">'+ico("heart")+'</span><h3>Nothing saved yet</h3><p>Tap the heart on any place to save it here. Your list groups places by city and turns each group into a walking route in Google Maps.</p><div class="wo-quick"><button class="wo-btn wo-pri" type="button" data-go="browse">Browse places</button><button class="wo-btn" type="button" data-act="surprise">Surprise me</button></div></div></div>';
  var groups={}, order=[];
  rows.forEach(function(r){var k=r.listing_type==="Online"?"_online":(r.city_guide||r.city||"_other"); if(!groups[k]){groups[k]=[]; order.push(k);} groups[k].push(r);});
  h+=emailBox();
  h+='<div class="wo-toolrow" style="margin:16px 0"><span class="wo-mono">Get around by</span><div class="wo-seg" role="group" aria-label="Travel mode">'+
     [["walking","Walking"],["transit","Transit"],["bicycling","Bike"],["driving","Car"]].map(function(m){return '<button type="button" data-mode="'+m[0]+'" aria-pressed="'+(S.mode===m[0])+'">'+m[1]+'</button>';}).join("")+'</div>'+
     '<button class="wo-btn wo-sm" type="button" data-act="sharelist">'+ico("link")+' Share my list</button><button class="wo-btn wo-sm" type="button" data-act="clearlist">Clear list</button></div><div style="display:grid;gap:18px">';
  order.forEach(function(k){
    var g=groups[k], title=k==="_online"?"Trip companies, planners and brands":k==="_other"?"Other places":"Woman-owned "+cityName(k);
    var mappable=g.filter(geo), stops=mappable.length>1?orderStops(mappable):mappable, links=k==="_online"?[]:routeUrls(stops,S.mode);
    h+='<section class="wo-savedgroup"><div class="wo-sechead"><div><span class="wo-eyebrow">'+g.length+' saved</span><h3>'+esc(title)+'</h3></div>'+(k[0]!=="_"&&CITYLIST.some(function(c){return c.slug===k;})?'<button class="wo-btn wo-sm" type="button" data-city="'+esc(k)+'">Open city guide</button>':'')+'</div>';
    if (links.length) h+='<div class="wo-route">'+ico("route")+'<div class="wo-legs">'+
       (S.mode==="transit"?'<span class="wo-small">Google Maps plans transit one leg at a time:</span>':'<span class="wo-small">Stops are in a sensible order'+(S.me?', starting nearest you':'')+'. Open the route in Google Maps:</span>')+
       links.map(function(l){return '<a href="'+esc(l.href)+'" target="_blank" rel="noopener">'+esc(l.label)+' \u2197</a>';}).join("")+'</div></div>';
    else if (k!=="_online" && g.length<2) h+='<p class="wo-small">Save one more place in '+esc(k==="_other"?"this area":cityName(k))+' to build a route.</p>';
    var list2=k==="_online"?g:(stops.concat(g.filter(function(r){return !geo(r);})));
    h+='<div style="display:grid;gap:8px">'+list2.map(function(r,i){return '<div class="wo-stop"><span class="n">'+(k==="_online"?"\u2022":i+1)+'</span>'+row(r,'<button class="wo-x" type="button" data-unsave="'+esc(r.listing_id)+'" aria-label="Remove '+esc(r.name)+'">'+ico("close")+'</button>')+'</div>';}).join("")+'</div></section>';
  });
  return h+'</div></div>';
}

/* ---------- detail sheet ---------- */
var sheetFrom=null;
function openDetail(id){
  var r=BYID[id]; if(!r) return; S.openId=id;
  var sh=root.querySelector(".wo-sheet"), sc=root.querySelector(".wo-scrim"), c=cat(r);
  var near=geo(r)?DATA.filter(function(x){return x!==r && geo(x) && x.listing_type!=="Online";}).map(function(x){x._n=km(r.lat,r.lng,x.lat,x.lng); return x;}).filter(function(x){return x._n<3;}).sort(function(a,b){return a._n-b._n;}).slice(0,5):[];
  var info=[];
  if (r.listing_type==="Place" && (r.address||r.city)) info.push('<div>'+ico("pin")+'<span>'+esc([r.address,r.city,r.region,r.zip].filter(Boolean).join(", "))+'</span></div>');
  if (r.listing_type==="Tour") info.push('<div>'+ico("pin")+'<span>Meets near '+esc(r.meets_near||r.city)+'. Check the website for the exact meeting point.</span></div>');
  if (r.founder) info.push('<div>'+ico("user")+'<span>Owned by '+esc(r.founder)+'</span></div>');
  if (r.accessibility) info.push('<div>'+ico("people")+'<span>'+esc(r.accessibility)+'</span></div>');
  if (r.date_added) info.push('<div>'+ico("clock")+'<span>On the map since '+esc(new Date(r.date_added+"T12:00:00").toLocaleDateString(undefined,{month:"long",year:"numeric"}))+'</span></div>');
  sh.innerHTML='<div class="head" style="--cc:'+c.c+'"><div class="wo-perf">'+stamp(r)+'</div><button class="close" type="button" data-close aria-label="Close">'+ico("close")+'</button>'+heart(r)+'</div>'+
   '<div class="content"><div style="display:grid;gap:6px">'+(r.isMember?'<span class="wo-hosttag">'+(C.logoUrl?'<img src="'+esc(C.logoUrl)+'" alt="">':'')+'Member Host</span>':'')+
     '<span class="wo-eyebrow" style="color:'+c.c+'">'+esc(c.short)+'</span><h2>'+esc(r.name)+'</h2><span class="wo-mono">'+esc(where(r))+'</span></div>'+
   '<div class="wo-chips">'+pills(r,8)+'</div>'+
   (r.short_description?'<p style="font-size:17px">'+esc(r.short_description)+'</p>':'')+
   (r.why_visit?'<p><b>Don\u2019t miss:</b> '+esc(r.why_visit)+'</p>':'')+
   (r.isMember&&r.member_bio?'<div class="wo-info"><p>'+esc(r.member_bio)+'</p></div>':'')+
   '<div class="acts">'+(r.listing_type==="Place"?'<a class="wo-btn wo-pri" href="'+esc(gdir(r))+'" target="_blank" rel="noopener">'+ico("near")+' Directions</a><a class="wo-btn" href="'+esc(gmaps(r))+'" target="_blank" rel="noopener">Hours and reviews on Google Maps</a>':'')+
     (r.website?'<a class="wo-btn'+(r.listing_type!=="Place"?' wo-pri':'')+'" href="'+esc(url(r.website))+'" target="_blank" rel="noopener">Website '+ico("ext")+'</a>':'')+
     (r.instagram?'<a class="wo-btn" href="'+esc(url(/instagram/.test(r.instagram)?r.instagram:"instagram.com/"+r.instagram.replace("@","")))+'" target="_blank" rel="noopener">Instagram</a>':'')+
     '<button class="wo-btn" type="button" data-share="'+esc(r.listing_id)+'">'+ico("link")+' Share</button></div>'+
   (r.member_deal?'<div class="wo-dealbox"><span class="wo-eyebrow" style="color:var(--gold)">Member deal</span><b>'+esc(r.member_deal)+'</b><p class="wo-small" style="color:var(--ink)">Wanderful members find the code in the member community.</p><div class="wo-quick">'+(C.memberDealsUrl?'<a class="wo-btn wo-pri wo-sm" href="'+esc(C.memberDealsUrl)+'" target="_blank" rel="noopener">Get the code</a>':'')+(C.joinUrl?'<a class="wo-btn wo-sm" href="'+esc(C.joinUrl)+'" target="_blank" rel="noopener">Become a member</a>':'')+'</div></div>':'')+
   (info.length?'<div class="wo-info">'+info.join("")+'</div>':'')+
   (geo(r)&&!useG(r)?'<div class="wo-minimap"><div class="wo-map" id="wo-minimap"></div></div>':'')+
   tipsBlock(r)+
   (near.length?'<div style="display:grid;gap:8px"><span class="wo-eyebrow">Woman-owned nearby</span>'+near.map(function(x){x._d=x._n; var hold=S.me; S.me=S.me||{}; var out=row(x); S.me=hold; return out;}).join("")+'</div>':'')+
   (r.city_guide&&CITYLIST.some(function(c){return c.slug===r.city_guide;})&&S.view!=="city"?'<button class="wo-btn" type="button" data-city="'+esc(r.city_guide)+'">'+ico("city")+' Open the '+esc(cityName(r.city_guide))+' guide</button>':'')+
   '<p class="wo-small">Hours and reviews come from Google Maps.</p>'+(C.updateUrl&&r.listing_type!=="Online"||C.updateUrl?'<p class="wo-small wo-claim">'+ico("user")+' <span>Own this business? <a href="'+esc(C.updateUrl)+'" target="_blank" rel="noopener">Update your listing</a> to add photos, your name and a deal for Wanderful members.</span></p>':'')+reportBlock(r)+'</div>';
  sh.hidden=false; sc.hidden=false; lift(true); sh.scrollTop=0;
  requestAnimationFrame(function(){sh.classList.add("on"); sc.classList.add("on");});
  sheetFrom=document.activeElement; setTimeout(function(){var b=sh.querySelector("[data-close]"); if(b) b.focus();},260);
  if (useG(r)) fillGPhoto(sh.querySelector(".head"), r);
  if (geo(r) && !useG(r)) setTimeout(function(){ var m=makeMap("wo-minimap",{zoomControl:false,dragging:!L.Browser.mobile}); if(!m) return; m.setView([r.lat,r.lng],15); L.marker([r.lat,r.lng],{icon:pin(r)}).addTo(m);
    near.forEach(function(x){L.marker([x.lat,x.lng],{icon:L.divIcon({className:"",html:'<div class="wo-pin" style="--cc:'+cat(x).c+';width:12px;height:12px;border-width:2px"></div>',iconSize:[12,12]}),title:x.name}).bindPopup(popup(x)).addTo(m);});
    m.invalidateSize(); },280);
  setHashQuiet("place-"+id);
}

/* ---------- living inside a Squarespace page ---------- */
/* The site header sits in its own layer. While a sheet is open, lift the sections that hold the app above it,
   then put them back. Also keep the sticky nav just under a fixed or sticky site header. */
var lifted=[];
function lift(on){
  if (on){ if (lifted.length) return;
    for (var el=root.parentElement; el && el!==document.body; el=el.parentElement){
      var cs=getComputedStyle(el);
      if (cs.position!=="static" || cs.zIndex!=="auto"){ lifted.push([el, el.style.zIndex, el.style.position]); el.style.zIndex="2147483000"; if(cs.position==="static") el.style.position="relative"; }
    }
  } else { lifted.forEach(function(x){ x[0].style.zIndex=x[1]; x[0].style.position=x[2]; }); lifted=[]; }
}
function siteHeader(){
  var c=document.querySelectorAll("#header, header.header, .header, header[role=banner], .Header, header");
  for (var i=0;i<c.length;i++){ if (!root.contains(c[i]) && c[i]!==root && !c[i].contains(root)){ var p=getComputedStyle(c[i]).position; if (p==="fixed"||p==="sticky") return c[i]; } }
  return null;
}
var hdrRaf=0;
function measureTop(){
  hdrRaf=0; var h=siteHeader(), t=0;
  if (h){ var r=h.getBoundingClientRect(); t=Math.max(0,Math.round(r.bottom)); if (getComputedStyle(h).visibility==="hidden"||r.height===0) t=0; }
  root.style.setProperty("--wo-top", t+"px");
}
/* Squarespace Fluid Engine gives a Code Block a fixed number of grid rows, sized when it was last edited.
   The directory's height changes with every view, so stack the section's blocks in auto-height rows instead. */
function fitBlock(){
  try{
    var blk=root.closest(".fe-block"), fe=blk&&blk.parentElement; if(!fe||!/fluid-engine/.test(fe.className)) return;
    var kids=[].slice.call(fe.children).filter(function(k){return /fe-block/.test(k.className);});
    kids.forEach(function(k){ k.style.gridRow=""; });
    fe.style.gridTemplateRows="";
    var starts=kids.map(function(k){return parseInt(getComputedStyle(k).gridRowStart,10)||1;});
    var uniq=starts.slice().sort(function(a,b){return a-b;}).filter(function(v,i,a){return i===0||v!==a[i-1];});
    kids.forEach(function(k,i){ var n=uniq.indexOf(starts[i])+1; k.style.gridRow=n+" / "+(n+1); });
    fe.style.gridTemplateRows="repeat("+uniq.length+", auto)";
  }catch(e){}
}
var fitT=0; window.addEventListener("resize",function(){ clearTimeout(fitT); fitT=setTimeout(fitBlock,200); });
setTimeout(fitBlock,0);
function queueTop(){ if(!hdrRaf) hdrRaf=requestAnimationFrame(measureTop); }
window.addEventListener("scroll",queueTop,{passive:true}); window.addEventListener("resize",queueTop); setTimeout(measureTop,0); setTimeout(measureTop,800);
function closeDetail(fromHash){
  var sh=root.querySelector(".wo-sheet"), sc=root.querySelector(".wo-scrim"); if(!sh||sh.hidden) return; S.openId=null;
  sh.classList.remove("on"); sc.classList.remove("on");
  setTimeout(function(){sh.hidden=true; sc.hidden=true; lift(false); if(maps["wo-minimap"]){try{maps["wo-minimap"].remove();}catch(e){} delete maps["wo-minimap"];}},250);
  if (!fromHash && /^#place-/.test(location.hash)) setHashQuiet(hashFor());
  if (sheetFrom && sheetFrom.focus) try{sheetFrom.focus();}catch(e){}
}

function tipsBlock(r){
  if (r.listing_type==="Online") return "";
  var t=(TIPS[r.listing_id]||[]).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
  return '<div class="wo-tips"><span class="wo-eyebrow">Traveler tips</span><h3 style="font-size:24px">'+(t.length?t.length+(t.length===1?" tip":" tips")+" from the community":"Been here? Leave the first tip")+'</h3>'+
    t.filter(function(x){return x.tip;}).slice(0,6).map(function(x){return '<blockquote class="wo-tip"><p>\u201c'+esc(x.tip)+'\u201d</p><span class="wo-mono">'+esc(x.name||"A Wanderful traveler")+(x.date?' \u00b7 '+esc(new Date(x.date+"T12:00:00").toLocaleDateString(undefined,{month:"short",year:"numeric"})):'')+'</span></blockquote>';}).join("")+
    (function(){ var ph=t.filter(function(x){return mediaUrl(x.photo_url);}); return ph.length?'<div class="wo-tgal">'+ph.slice(0,9).map(function(x){return '<figure><img src="'+esc(mediaUrl(x.photo_url))+'" alt="Traveler photo of '+esc(r.name)+'" loading="lazy"><figcaption>'+esc(x.name||"A Wanderful traveler")+'</figcaption></figure>';}).join("")+'</div>':''; })()+'<form class="wo-tipform" id="wo-tipform" data-id="'+esc(r.listing_id)+'" novalidate>'+
      '<label for="wo-tiptext" class="wo-small">'+(t.length?'Add your tip':'What to order, which room to ask for, the best time to go')+'</label>'+
      '<textarea id="wo-tiptext" maxlength="280" rows="3" placeholder="Ask for the window seat and get the cardamom bun."></textarea>'+
      '<label class="wo-photopick"><input id="wo-tipphoto" type="file" accept="image/*">'+ico("plus")+'<span id="wo-tipphotolbl">Add a photo (optional)</span></label>'+
      '<label class="wo-rights" id="wo-tiprights" hidden><input id="wo-tipok" type="checkbox"> I took this photo, and Wanderful can share it in the directory and on social with credit to my first name.</label>'+
      '<div class="wo-tiprow"><input id="wo-tipname" type="text" maxlength="40" placeholder="First name" aria-label="First name, shown with your tip" autocomplete="given-name">'+
      '<input id="wo-tipmail" type="email" placeholder="Email (private)" aria-label="Email, not shown" autocomplete="email">'+
      '<input id="wo-tiphp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">'+
      '<button class="wo-btn wo-pri wo-sm" type="submit">'+ico("chat")+' Share tip</button></div>'+
      '<p class="wo-small" id="wo-tipmsg" role="status">Our team reads every tip and photo before it appears.</p></form></div>';
}
function shrinkPhoto(file){
  /* resize in the browser so uploads stay small and fast: longest side 1600px, JPEG */
  return new Promise(function(res,rej){
    var img=new Image(), u=URL.createObjectURL(file);
    img.onload=function(){ var k=Math.min(1,1600/Math.max(img.width,img.height)), cv=document.createElement("canvas");
      cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k); cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
      URL.revokeObjectURL(u); res(cv.toDataURL("image/jpeg",0.82)); };
    img.onerror=function(){ URL.revokeObjectURL(u); rej(new Error("img")); }; img.src=u;
  });
}
function sendTip(e){
  e.preventDefault();
  var f=e.target, txt=document.getElementById("wo-tiptext"), msg=document.getElementById("wo-tipmsg"), v=(txt.value||"").trim();
  var file=(document.getElementById("wo-tipphoto").files||[])[0];
  if (document.getElementById("wo-tiphp").value) return;
  if (!file && v.length<8){ msg.textContent="Write a little more, or add a photo, so it\u2019s useful to the next traveler."; txt.focus(); return; }
  if (file && !document.getElementById("wo-tipok").checked){ msg.textContent="Please tick the box to confirm you took the photo."; return; }
  var r=BYID[f.getAttribute("data-id")]||{};
  if (!C.listEndpoint || /^PASTE_/.test(C.listEndpoint)){ msg.textContent="Thanks! On the live site this goes to the Wanderful team for review. (Sending isn\u2019t connected in this preview.)"; return; }
  msg.textContent=file?"Uploading your photo\u2026":"Sending\u2026";
  (file?shrinkPhoto(file):Promise.resolve("")).then(function(data){
    var body=new URLSearchParams({action:"tip", listing_id:r.listing_id||"", place:r.name||"", tip:v, name:document.getElementById("wo-tipname").value.trim(), email:document.getElementById("wo-tipmail").value.trim(), photo:data});
    return fetch(C.listEndpoint,{method:"POST",mode:"no-cors",body:body});
  }).then(function(){ f.reset(); document.getElementById("wo-tiprights").hidden=true; document.getElementById("wo-tipphotolbl").textContent="Add a photo (optional)";
    msg.textContent="Thank you! It will appear once our team has looked at it."; toast(ico("chat")+" Sent"); },
  function(){ msg.textContent="That didn\u2019t send. Please try again in a moment."; });
}



/* ---------- tourism boards and destinations ---------- */
function partnersUrl(){ return C.partnersUrl||"https://sheswanderful.com/collaborate"; }
function partnersBand(){
  return '<section class="wo-sec"><div class="wo-partners">'+ico("globe")+
    '<div><span class="wo-eyebrow">For tourism boards and destinations</span><h3>Tell the stories of the women-owned businesses in your destination</h3>'+
    '<p>Wanderful partners with destinations to spotlight the women behind their hotels, restaurants, shops and tours, through our creators, our community, Siren and this map.</p></div>'+
    '<a class="wo-btn wo-pri" href="'+esc(partnersUrl())+'">Partner with Wanderful</a></div></section>';
}
/* ---------- woman-owned trips band ---------- */
function tripsBand(){
  var url=C.tripsDirectoryUrl||"https://sheswanderful.com/woman-owned-trips", tp=tripPhotos();
  return '<section class="wo-sec"><div class="wo-trips">'+
    '<div class="txt"><span class="wo-eyebrow">Woman-owned trips</span><h2>Want to travel <em>with</em> women?</h2>'+
    '<p>Join a small-group trip run by a woman-owned company. Many are hosted by Wanderful members, and members get a deal on every trip.</p>'+
    '<div class="wo-quick"><a class="wo-btn wo-pri" href="'+esc(url)+'">Find a trip</a>'+(C.joinUrl?'<a class="wo-btn" href="'+esc(C.joinUrl)+'" target="_blank" rel="noopener">Become a member</a>':'')+'</div></div>'+
    (tp.length?'<div class="pics">'+tp.slice(0,3).map(function(x,i){return '<img class="p'+i+'" src="'+x.src+'" alt="'+esc(x.alt)+'" loading="lazy">';}).join("")+'</div>':'')+
    '</div></section>';
}
/* ---------- stories from Siren and the Wanderful blog (via the script, cached 3 hours) ---------- */
var STORIES=null;
function loadStories(){
  if (STORIES!==null || !C.listEndpoint || /^PASTE_/.test(C.listEndpoint)) return;
  STORIES=[];
  fetch(C.listEndpoint+"?action=stories").then(function(r){return r.json();}).then(function(d){
    STORIES=(Array.isArray(d)?d:[]).filter(function(x){return x && /^https?:/.test(x.link||"");});
    fillStories();
  }).catch(function(){});
}
function unent(t){ var a=document.createElement("textarea"); a.innerHTML=String(t||""); return a.value; }
function storyCard(x){
  return '<a class="wo-story" href="'+esc(x.link)+'" target="_blank" rel="noopener">'+
    (x.image&&/^https?:/.test(x.image)?'<img src="'+esc(x.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="noimg">'+ico("compass")+'</span>')+
    '<span class="src">'+esc(x.source||"Wanderful")+(x.date?' \u00b7 '+esc(x.date):'')+'</span><b>'+esc(unent(x.title))+'</b>'+(x.summary?'<span class="sum">'+esc(unent(x.summary))+'</span>':'')+'</a>';
}
function fillStories(){
  var box=document.getElementById("wo-stories"); if (!box || !STORIES || !STORIES.length) return;
  var city=box.getAttribute("data-city"), list=STORIES;
  if (city){ var n=cityName(city).toLowerCase(); list=STORIES.filter(function(x){ return (x.text||"").indexOf(n)>=0 || (x.title||"").toLowerCase().indexOf(n)>=0; }); }
  list=list.slice(0,3); if (!list.length) return;
  box.innerHTML='<section class="wo-sec">'+sechead("Stories",city?"Stories from "+esc(cityName(city)):"Read before you go",city?"":"New reporting from Siren by Wanderful and the Wanderful blog about the women shaping travel.")+'<div class="wo-stories">'+list.map(storyCard).join("")+'</div></section>';
}
/* ---------- report a problem: goes to the Reports tab, listing stays up until the team confirms ---------- */
function reportBlock(r){
  var opts=[["closed","It closed"],["moved","It moved"],["not-woman-owned","Not woman-owned"],["badge","Missing a badge (like LGBTQ+-owned)"],["wrong-info","Something else is wrong"]];
  return '<details class="wo-report"><summary>'+ico("flag")+' Report a problem with this listing</summary>'+
    '<form id="wo-reportform" data-id="'+esc(r.listing_id)+'" novalidate><fieldset><legend class="wo-small">What\u2019s wrong?</legend>'+
    opts.map(function(o,i){return '<label class="wo-radio"><input type="radio" name="wo-issue" value="'+o[0]+'"'+(i===0?'':'')+'> '+o[1]+'</label>';}).join("")+
    '</fieldset><textarea id="wo-reptext" maxlength="600" rows="3" placeholder="Anything that helps us fix it, like the new address or when it closed"></textarea>'+
    '<div class="wo-tiprow"><input id="wo-repmail" type="email" placeholder="Your email (optional, private)" aria-label="Your email, optional" autocomplete="email">'+
    '<input id="wo-rephp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">'+
    '<button class="wo-btn wo-sm" type="submit">Send report</button></div>'+
    '<p class="wo-small" id="wo-repmsg" role="status">The Wanderful team checks every report before changing a listing.</p></form></details>';
}
function sendReport(e){
  e.preventDefault();
  var f=e.target, msg=document.getElementById("wo-repmsg"), ch=f.querySelector('input[name="wo-issue"]:checked');
  if (document.getElementById("wo-rephp").value) return;
  if (!ch){ msg.textContent="Pick what\u2019s wrong first."; return; }
  var r=BYID[f.getAttribute("data-id")]||{}, det=(document.getElementById("wo-reptext").value||"").trim();
  if (!C.listEndpoint || /^PASTE_/.test(C.listEndpoint)){ msg.textContent="Thanks! On the live site this goes to the Wanderful team. (Reports aren\u2019t connected in this preview.)"; return; }
  var body=new URLSearchParams({action:"report", listing_id:r.listing_id||"", place:r.name||"", issue:ch.value, details:det, email:document.getElementById("wo-repmail").value.trim()});
  msg.textContent="Sending\u2026";
  fetch(C.listEndpoint,{method:"POST",mode:"no-cors",body:body}).then(function(){ f.reset(); msg.textContent="Thank you. Our team will check it and update the listing."; toast(ico("flag")+" Report sent"); },function(){ msg.textContent="That didn\u2019t send. Please try again in a moment."; });
}
/* ---------- add a place chooser ---------- */
function openAdd(){
  var sh=root.querySelector(".wo-sheet"), sc=root.querySelector(".wo-scrim");
  var link=function(href,title,sub,pri){ return href?'<a class="wo-addopt'+(pri?' pri':'')+'" href="'+esc(href)+'" target="_blank" rel="noopener"><b>'+title+'</b><span>'+sub+'</span>'+ico("ext")+'</a>':'<div class="wo-addopt off"><b>'+title+'</b><span>'+sub+'</span><em class="wo-small">Link not set up yet</em></div>'; };
  sh.innerHTML='<div class="content" style="padding-top:calc(24px + env(safe-area-inset-top,0px))"><button class="close" type="button" data-close aria-label="Close" style="position:absolute;right:20px;top:20px">'+ico("close")+'</button>'+
    (PH.marginnotes?'<img class="wo-addphoto" src="'+PH.marginnotes+'" alt="An owner behind the bar at Margin Notes Bookbar in El Paso">':'')+'<span class="wo-eyebrow">Add to the map</span><h2>Know a woman-owned spot?</h2><p class="wo-small">Every listing is free and reviewed by the Wanderful team before it goes live.</p>'+
    link(C.submitUrl,"I own the business","List it in about 5 minutes. Owners get the Owner verified badge and can add a member deal.",true)+
    link(C.recommendUrl,"I want to recommend a place","Takes a minute. We\u2019ll check it out and invite the owner to claim it.")+
    link(C.bulkUrl,"I know lots of places","Share a whole list at once, one place per line. We check each one.")+
    link(C.updateUrl,"Update or remove a listing","Moved, closed or something changed? Let us know.")+
    (C.joinUrl?'<div class="wo-offerline"><span>Entrepreneur members get a Member Host listing with a headshot, story and top placement.</span><a class="wo-btn wo-sm" href="'+esc(C.joinUrl)+'" target="_blank" rel="noopener">Become a member</a></div>':'')+'</div>';
  sh.hidden=false; sc.hidden=false; lift(true); requestAnimationFrame(function(){sh.classList.add("on"); sc.classList.add("on");}); S.openId="_add";
}

/* ================= routing ================= */
function hashFor(){ return S.view==="home"?"":S.view==="city"?"city-"+S.city:S.view; }
function setHashQuiet(h){
  try{ if (location.hash.replace(/^#/,"")!==h){ S.skipHash=h; if (h) location.hash=h; else history.replaceState(null,"",location.pathname+location.search); } }catch(e){ S.skipHash=null; }
}
function applyHash(h){
  if (h.indexOf("city-")===0){ S.view="city"; S.city=h.slice(5); }
  else if (["browse","map","cities","saved","deals"].indexOf(h)>=0) S.view=h;
  else if (h==="add"){ S.view=(root.getAttribute("data-view")||"home"); setTimeout(function(){ try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} openAdd(); }, 400); }
  else if (TYPES.some(function(t){return t.id===h;})){ S.view="browse"; S.type=h; }
  else S.view=(root.getAttribute("data-view")||"home");
}
function go(v){
  if (v==="add"){ openAdd(); return; }
  if (C.siteMode && location.pathname!=="/" && (v==="home"||!v||v==="browse"||v==="map"||v==="deals"||v==="saved"||v==="cities")){ location.href=(v==="cities"?"/cities/":"/"+(v&&v!=="home"?"#"+v:"")); return; }
  closeDetail(true); applyHash(v||""); render(true); setHashQuiet(v||"");
}
function route(){
  if (!S.ready) return;
  var hsh=location.hash.replace(/^#/,"");
  if (S.skipHash!=null){ var sk=S.skipHash; S.skipHash=null; if (sk===hsh) return; }
  if (hsh.indexOf("place-")===0){ if (!root.querySelector("#wo-view .wo-in, #wo-view .wo-cityhero")) { render(); } if (S.openId!==hsh.slice(6)) openDetail(hsh.slice(6)); return; }
  var wasOpen=!!S.openId; closeDetail(true);
  var pv=S.view, pc=S.city;
  applyHash(hsh);
  if (wasOpen && pv===S.view && pc===S.city && S.view!=="saved") return;
  render(true);
}
function render(scroll){
  var v=document.getElementById("wo-view"); if(!v) return;
  if (!S.ready){ v.innerHTML='<div class="wo-loading">Loading woman-owned places\u2026</div>'; return; }
  var html = S.view==="browse"?viewBrowse(): S.view==="map"?viewMap(): S.view==="cities"?viewCities(): S.view==="city"?viewCity(): S.view==="saved"?viewSaved(): S.view==="deals"?viewDeals(): viewHome();
  v.innerHTML=html; setNav();
  if (S.view==="map") drawBigMap();
  if (S.view==="home"){ drawHomeMap(); var sc=document.getElementById("wo-spotcard"), sr=sc&&BYID[sc.getAttribute("data-open")]; if (sr && useG(sr)) fillGPhoto(sc, sr); }
  if (S.view==="city") drawCityMap();
  if (S.view==="home"||S.view==="city"){ loadStories(); fillStories(); }
  var sort=document.getElementById("wo-sort"); if(sort) sort.value=S.sort;
  watchPhotos();
  if (scroll && root.getBoundingClientRect().top<0) root.scrollIntoView({behavior:"auto",block:"start"});
}

/* ================= events ================= */
function suggest(q){
  var box=document.getElementById("wo-sug"); if(!box) return;
  q=norm(q).trim(); if(q.length<2){box.hidden=true; return;}
  var cs=CITYLIST.filter(function(c){return norm(c.name).indexOf(q)>=0;}).slice(0,4);
  var ps=DATA.filter(function(r){return norm(r.name).indexOf(q)>=0;}).slice(0,6);
  var ks=PLACE_CATS.filter(function(k){return norm(CATS[k].short+" "+k).indexOf(q)>=0;}).slice(0,2);
  if(!cs.length&&!ps.length&&!ks.length){box.innerHTML='<button type="button" data-searchall="1">'+ico("search")+' Search everything for \u201c'+esc(q)+'\u201d</button>'; box.hidden=false; return;}
  box.innerHTML=cs.map(function(c){return '<button type="button" data-city="'+esc(c.slug)+'">'+ico("city")+esc(c.name)+'<small>'+c.n+' places</small></button>';}).join("")+
    ks.map(function(k){return '<button type="button" data-cat="'+esc(k)+'">'+ico(CATS[k].i)+esc(CATS[k].short)+'<small>category</small></button>';}).join("")+
    ps.map(function(r){return '<button type="button" data-open="'+esc(r.listing_id)+'">'+ico(cat(r).i)+esc(r.name)+'<small>'+esc(r.city||cat(r).short)+'</small></button>';}).join("")+
    '<button type="button" data-searchall="1">'+ico("search")+' See all results</button>';
  box.hidden=false;
}
function setMe(me, label){
  S.me=me; S.meLabel=label||"you"; S.sort="near";
  if (S.view==="home") { render(); var n=document.getElementById("wo-c-near"); if(n) n.scrollIntoView({behavior:"smooth",block:"center"}); }
  else if (S.view==="browse"||S.view==="map"||S.view==="saved") render();
  else go("browse");
  toast(ico("near")+" Sorted by distance from "+esc(S.meLabel));
}
function cityCenter(g){
  var pts=DATA.filter(function(r){return r.city_guide===g && geo(r);}); if(!pts.length) return null;
  var la=pts.map(function(r){return r.lat;}).sort(function(a,b){return a-b;}), ln=pts.map(function(r){return r.lng;}).sort(function(a,b){return a-b;});
  return {lat:la[Math.floor(la.length/2)], lng:ln[Math.floor(ln.length/2)]};
}
function pickArea(reason){
  var sh=root.querySelector(".wo-sheet"), sc=root.querySelector(".wo-scrim");
  sh.innerHTML='<div class="content" style="padding-top:calc(24px + env(safe-area-inset-top,0px))"><button class="close" type="button" data-close aria-label="Close" style="position:absolute;right:20px;top:20px">'+ico("close")+'</button>'+
    '<span class="wo-eyebrow">Near me</span><h2>Where are you?</h2><p class="wo-small">'+esc(reason)+' Pick the city you\u2019re in and we\u2019ll sort everything by distance from there.</p>'+
    '<label class="wo-search">'+ico("search")+'<input id="wo-areaq" type="search" placeholder="Find your city" aria-label="Find your city"></label><div id="wo-arealist" style="display:grid;gap:8px"></div></div>';
  function fill(q){ q=norm(q); document.getElementById("wo-arealist").innerHTML=CITYLIST.filter(function(c){return !q||norm(c.name+" "+c.region).indexOf(q)>=0;}).slice(0,30)
    .map(function(c){return '<button class="wo-row" type="button" data-area="'+esc(c.slug)+'" style="grid-template-columns:40px 1fr auto"><span style="color:'+cityColor(c.slug)+'">'+ico("city")+'</span><div><b>'+esc(c.name)+'</b><span>'+esc(c.region||c.country)+'</span></div><span class="wo-mono">'+c.n+'</span></button>';}).join(""); }
  fill(""); sh.hidden=false; sc.hidden=false; lift(true); requestAnimationFrame(function(){sh.classList.add("on"); sc.classList.add("on");}); S.openId="_area";
  document.getElementById("wo-areaq").addEventListener("input",function(e){fill(e.target.value);});
}
function nearMe(){
  if (S.me){ S.me=null; if(S.sort==="near") S.sort="featured"; render(); toast("Near me is off"); return; }
  if (!navigator.geolocation){ pickArea("Your browser isn\u2019t sharing your location."); return; }
  toast(ico("near")+" Finding woman-owned places near you\u2026");
  var done=false, fail=function(){ if(done) return; done=true; pickArea("We couldn\u2019t get your location here."); };
  setTimeout(fail, 8000);
  try{ navigator.geolocation.getCurrentPosition(function(p){ if(done) return; done=true; setMe({lat:p.coords.latitude,lng:p.coords.longitude},"you"); }, fail, {timeout:7000,maximumAge:300000}); }catch(e){ fail(); }
}
root.addEventListener("click",function(e){
  var t=e.target.closest("button, a, [data-open]"); if(!t||!root.contains(t)) return;
  var d=t.dataset;
  if (d.area){ var cc=cityCenter(d.area); closeDetail(true); if(cc) setMe(cc, cityName(d.area)); return; }
  if (d.heart){ e.preventDefault(); e.stopPropagation(); toggleSave(d.heart,t); return; }
  if (d.unsave){ e.preventDefault(); toggleSave(d.unsave); render(); return; }
  if (t.hasAttribute("data-close")){ closeDetail(); return; }
  if (d.open){ e.preventDefault(); openDetail(d.open); return; }
  if (d.go!==undefined){ e.preventDefault(); go(d.go); return; }
  if (d.city){ e.preventDefault(); if (C.siteMode && CITYLIST.some(function(c){return c.slug===d.city;})){ location.href="/"+d.city+"/"; return; } go("city-"+d.city); return; }
  if (d.cat){ e.preventDefault(); S.type="places"; S.cats={}; S.cats[d.cat]=true; S.q=""; S.shown=24; go("browse"); return; }
  if (d.type){ e.preventDefault(); S.type=d.type; S.cats={}; S.badges={}; S.shown=24; if(S.view==="browse") render(); else go("browse"); return; }
  if (d.fcat){ S.cats[d.fcat]=!S.cats[d.fcat]; S.shown=24; render(); return; }
  if (d.flag){ S[d.flag]=!S[d.flag]; S.shown=24; render(); return; }
  if (d.badge){ S.badges[d.badge]=!S.badges[d.badge]; S.shown=24; render(); return; }
  if (d.mode){ S.mode=d.mode; stored("wo-mode",S.mode); render(); return; }
  if (d.jump){ var el=document.getElementById(d.jump); if(el) el.scrollIntoView({behavior:"smooth"}); return; }
  if (d.scroll){ var tr=document.getElementById(d.scroll); if(tr) tr.scrollBy({left:(+d.dir)*tr.clientWidth*0.85,behavior:"smooth"}); return; }
  if (d.share){ copy(shareBase()+"#place-"+d.share); return; }
  if (d.searchall){ var i=document.getElementById("wo-hq"); S.q=i?i.value:S.q; S.type="places"; S.cats={}; go("browse"); return; }
  var a=d.act;
  if (a==="near") nearMe();
  else if (a==="surprise"){ var pool=DATA.filter(function(r){return r.short_description && r.listing_type!=="Online";}); openDetail(pool[Math.floor(Math.random()*pool.length)].listing_id); }
  else if (a==="more"){ S.shown+=36; render(); }
  else if (a==="clear"){ S.q=""; S.cats={}; S.badges={}; S.deal=false; S.member=false; render(); }
  else if (a==="closenudge"){ var nn=root.querySelector(".wo-nudge"); if(nn) nn.remove(); }
  else if (a==="sharelist"){ copy(shareBase()+(shareBase().indexOf("?")>=0?"&":"?")+"saved="+S.saved.join(".")); }
  else if (a==="clearlist"){ if (t.dataset.confirm){ S.saved=[]; saveList(); render(); toast("List cleared"); } else { t.dataset.confirm="1"; t.textContent="Tap again to clear"; setTimeout(function(){ if(t.isConnected){delete t.dataset.confirm; t.textContent="Clear list";} },3000); } }
  else if (a==="sharecity"){ copy(shareBase()+"#city-"+S.city); }
  else if (d.searchall===undefined && t.id==="wo-hgo"){ var hq=document.getElementById("wo-hq"); S.q=hq.value; S.type="places"; S.cats={}; S.shown=24; go("browse"); }
});
function shareBase(){ return C.shareUrl || (location.origin+location.pathname); }
root.addEventListener("keydown",function(e){
  if (e.key==="Escape") { closeDetail(); var s=document.getElementById("wo-sug"); if(s) s.hidden=true; }
  if ((e.key==="Enter"||e.key===" ") && e.target.matches && e.target.matches("[data-open][role=button]")){ e.preventDefault(); openDetail(e.target.dataset.open); }
  if (e.key==="Enter" && e.target.id==="wo-hq"){ S.q=e.target.value; S.type="places"; S.cats={}; S.shown=24; go("browse"); }
});
var tmr;
root.addEventListener("input",function(e){
  var id=e.target.id;
  if (id==="wo-hq") suggest(e.target.value);
  if (id==="wo-bq"){ clearTimeout(tmr); tmr=setTimeout(function(){ S.q=e.target.value; S.shown=24; var pos=e.target.selectionStart; render(); var n=document.getElementById("wo-bq"); if(n){n.focus(); try{n.setSelectionRange(pos,pos);}catch(x){}} },220); }
  if (id==="wo-cq"){ clearTimeout(tmr); tmr=setTimeout(function(){ S.cityq=e.target.value; render(); var n=document.getElementById("wo-cq"); if(n){n.focus(); n.setSelectionRange(n.value.length,n.value.length);} },180); }
});
root.addEventListener("submit",function(e){ if (e.target.classList && e.target.classList.contains("wo-listform")) sendList(e); if (e.target.id==="wo-tipform") sendTip(e); if (e.target.id==="wo-reportform") sendReport(e); });
root.addEventListener("change",function(e){
  if (e.target.id==="wo-tipphoto"){ var fl=e.target.files&&e.target.files[0]; document.getElementById("wo-tiprights").hidden=!fl; document.getElementById("wo-tipphotolbl").textContent=fl?fl.name:"Add a photo (optional)"; }
  if (e.target.id==="wo-sort"){ S.sort=e.target.value; if (S.sort==="near" && !S.me){ nearMe(); return; } render(); }
});
root.addEventListener("click",function(e){ if (e.target.classList && e.target.classList.contains("wo-scrim")) closeDetail(); });
document.addEventListener("click",function(e){ var s=document.getElementById("wo-sug"); if(s && !e.target.closest(".wo-searchbox")) s.hidden=true; });
window.addEventListener("hashchange",route);

/* ================= boot ================= */
root.setAttribute("data-palette", C.palette||"classic"); root.setAttribute("data-font", C.font||"young");
shell();
S.saved = (stored("wo-saved")||[]);
S.mode = stored("wo-mode") || "walking";
var params = new URLSearchParams(location.search);
if (params.get("saved")) params.get("saved").split(".").forEach(function(id){ if(id && S.saved.indexOf(id)<0) S.saved.push(id); });
/* womanownedmap.com: every city guide and place has its own page. Old links like #city-boston go there. */
if (C.siteMode){
  var oh=location.hash.replace(/^#/,"");
  if (oh.indexOf("city-")===0 && location.pathname==="/"){ location.replace("/"+oh.slice(5)+"/"); return; }
  if (oh.indexOf("place-")===0 && location.pathname==="/"){ location.replace("/places/"+oh.slice(6).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"/"); return; }
}
load().then(function(){
  S.ready=true;
  S.saved=S.saved.filter(function(id){return BYID[id];}); saveList();
  var city=root.getAttribute("data-city")||params.get("city"), tab=params.get("tab"), place=root.getAttribute("data-place")||params.get("place");
  if (!location.hash){
    if (city) { S.view="city"; S.city=city; render(); }
    else if (params.get("saved")) { S.view="saved"; render(); }
    else if (tab && TYPES.some(function(t){return t.id===tab;})) { S.view="browse"; S.type=tab; render(); }
    else { S.view=root.getAttribute("data-view")||"home"; render(); }
    if (place && BYID[place]) openDetail(place);
  } else route();
}).catch(function(err){
  var m=String(err&&err.message||err), why;
  if (m==="setup") why="The page is missing its data link. In the Code Block, paste the published CSV link of the Public Feed tab into listingsCsvUrl.";
  else if (m==="notcsv") why="The data link opens a web page instead of a CSV file. In Google Sheets use File > Share > Publish to web, pick the Public Feed tab and Comma-separated values (.csv), and paste that link.";
  else if (m==="columns") why="The CSV loaded but has no name column. Check that the Public Feed tab starts with the header row from the master sheet.";
  else if (/^http/.test(m)) why="Google Sheets returned an error ("+m+"). Check that the Public Feed tab is still published to the web.";
  else why="Something went wrong while building the page ("+m+"). Refresh to try again.";
  if (window.console) console.error("[Woman-Owned directory]", err);
  var v=document.getElementById("wo-view"); if(v) v.innerHTML='<div class="wo-in"><div class="wo-empty" style="margin-top:30px"><h3>The directory didn\u2019t load</h3><p>'+esc(why)+'</p></div></div>'; });
})();
