(function(){
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  function rnd(a){return a[Math.floor(Math.random()*a.length)]}
  function later(ms){return new Promise(function(r){setTimeout(r,ms)})}

  // 語言選單：點外面或按 Esc 收起
  var langs = document.querySelector(".langs");
  if (langs) {
    document.addEventListener("click", function(e){ if (langs.open && !langs.contains(e.target)) langs.open = false; });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape" && langs.open) { langs.open = false; langs.querySelector("summary").focus(); } });
  }

  // ---- 塔的小動作（照 App 的 Home.swift react／randomBeats）
  function pieces(tw){ return Array.prototype.slice.call(tw.querySelectorAll(".pc")); }
  function eyes(pc){ return Array.prototype.slice.call(pc.querySelectorAll(".eye")); }
  function shut(pc, which, ms){
    var e = eyes(pc); if (which === "wink") e = e.slice(1);
    e.forEach(function(x){ x.classList.add("shut"); });
    return later(ms).then(function(){ e.forEach(function(x){ x.classList.remove("shut"); }); });
  }
  function look(pc, dx, dy){
    eyes(pc).forEach(function(e){
      var m = parseFloat(e.style.getPropertyValue("--m")) || 3;
      e.querySelector(".pupil").style.transform = (dx || dy) ? "translate(" + dx*m + "px," + dy*m + "px)" : "";
    });
  }
  function move(pc, cls){
    var b = pc.querySelector(".bd"); if (reduce || !b) return later(0);
    b.classList.remove("shake","squash","hop"); void b.offsetWidth; b.classList.add(cls);
    return later(600).then(function(){ b.classList.remove(cls); });
  }
  function glow(tw, ms){
    var g = tw.querySelector(".glow"); if (!g) return later(0);
    g.classList.add("bright"); return later(ms).then(function(){ g.classList.remove("bright"); });
  }
  function react(tw, pc){
    var all = pieces(tw), i = all.indexOf(pc);
    all.forEach(function(o, j){ if (j !== i) look(o, 0, j < i ? 1 : -1); });   // 上面的往下看、下面的往上看
    var done;
    if (pc.dataset.w === "flame" && Math.random() < 1/6) done = glow(tw, 700);
    else switch (Math.floor(Math.random()*5)) {
      case 0: done = Promise.all([move(pc,"shake"), shut(pc,"both",420)]); break;
      case 1: done = Promise.all([move(pc,"squash"), shut(pc,"both",200)]); break;
      case 2: look(pc,0,-1); done = Promise.all([move(pc,"hop"), later(250).then(function(){ return shut(pc,"wink",380); })]); break;
      case 3: done = shut(pc,"both",110).then(function(){ return later(110); }).then(function(){ return shut(pc,"both",110); }); break;
      default: done = Promise.all([move(pc,"shake"), shut(pc,"wink",600)]);
    }
    return done.then(function(){ return later(500); }).then(function(){ all.forEach(function(o){ look(o,0,0); }); });
  }
  function idle(tw){
    var all = pieces(tw), p = rnd(all);
    switch (Math.floor(Math.random()*9)) {
      case 0: return shut(p,"both",160);
      case 1: return shut(p,"both",120).then(function(){ return later(120); }).then(function(){ return shut(p,"both",120); });
      case 2: look(p,-1,0); return later(700).then(function(){ look(p,1,0); return later(700); }).then(function(){ look(p,0,0); });
      case 3: var d = rnd([[-1,0],[1,0],[0,-1],[0,1]]); all.forEach(function(o){ look(o,d[0],d[1]); }); return later(1300).then(function(){ all.forEach(function(o){ look(o,0,0); }); });
      case 4: return shut(p,"wink",550);
      case 5: look(p,0,-1); return move(p,"hop").then(function(){ look(p,0,0); });
      case 6: return all.reduce(function(a, o){ return a.then(function(){ return shut(o,"both",130); }); }, later(0));
      case 7: return glow(tw, 900);
      default: all.forEach(function(o){ eyes(o).forEach(function(e){ e.classList.add("shut"); }); });
               return later(450).then(function(){ all.forEach(function(o){ eyes(o).forEach(function(e){ e.classList.remove("shut"); }); }); });
    }
  }
  function alive(tw){
    var busy = false, seen = true;
    tw.addEventListener("click", function(e){
      if (tw.closest(".stage") && root.classList.contains("rite-on")) return;
      var pc = e.target.closest(".pc"); if (!pc || busy) return;
      busy = true; react(tw, pc).then(function(){ busy = false; });
    });
    if (reduce) return;
    if ("IntersectionObserver" in window) new IntersectionObserver(function(es){ seen = es[0].isIntersecting; }).observe(tw);
    (function loop(){
      setTimeout(function(){
        if (seen && !busy && !document.hidden && !root.classList.contains("rite-on")) { busy = true; idle(tw).then(function(){ busy = false; }); }
        loop();
      }, 2500 + Math.random()*4500);
    })();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tower.live"), alive);

  // ---- 開場（只有首頁、第一次來；html.rite-on 由 <head> 裡的小腳本加上）
  var replay = document.querySelectorAll(".replay");
  Array.prototype.forEach.call(replay, function(a){
    a.addEventListener("click", function(e){
      try { localStorage.removeItem("fudo.opened"); } catch (x) {}
      if (a.pathname === location.pathname) { e.preventDefault(); location.hash = "opening"; location.reload(); }
    });
  });
  if (!root.classList.contains("rite-on")) return;

  var stage = document.querySelector(".hero .stage"), tw = stage.querySelector(".tower");
  var skip = document.querySelector(".rite-skip"), hint = document.getElementById("rite-hint");
  var hidden = Array.prototype.slice.call(document.querySelectorAll(".top, .skip, main > section:not(.hero), .foot, .hero-core > :not(.stage)"));
  hidden.forEach(function(el){ el.inert = true; });
  stage.tabIndex = 0;
  stage.setAttribute("role", "button");
  stage.setAttribute("aria-label", stage.dataset.label);
  stage.setAttribute("aria-describedby", "rite-hint");
  var taps = 0, holdTimer = null, t0 = 0, armed = false, busy = false, over = false;
  if (reduce) root.classList.add("rite-hinted");

  function finish(){
    if (over) return; over = true;
    root.classList.remove("rite-on", "rite-lift", "rite-hinted");
    hidden.forEach(function(el){ el.inert = false; });
    ["tabindex","role","aria-label","aria-describedby"].forEach(function(a){ stage.removeAttribute(a); });
    root.style.removeProperty("--rite-dy");
    try { localStorage.setItem("fudo.opened", "1"); } catch (x) {}
    if (location.hash === "#opening") history.replaceState(null, "", location.pathname + location.search);
  }
  function reveal(){
    if (armed) return; armed = true;
    stage.classList.remove("holding");
    if (reduce) { finish(); return; }
    root.classList.add("rite-lift");
    setTimeout(finish, 3900);
  }
  function startHold(){
    if (armed || holdTimer) return;
    t0 = Date.now(); stage.classList.add("holding");
    holdTimer = setTimeout(function(){ holdTimer = null; reveal(); }, 800);
  }
  function endHold(tapTarget){
    if (armed) return;
    var short = Date.now() - t0 < 300;
    clearTimeout(holdTimer); holdTimer = null; stage.classList.remove("holding");
    if (short) {
      taps++; if (taps >= 3) root.classList.add("rite-hinted");
      if (!busy && !reduce) {
        var pc = (tapTarget && tapTarget.closest && tapTarget.closest(".pc")) || stage.querySelector(".pc-flame");
        busy = true; react(tw, pc).then(function(){ busy = false; });
      }
    }
  }
  stage.addEventListener("pointerdown", function(e){ if (e.button > 0) return; e.preventDefault(); try { stage.setPointerCapture(e.pointerId); } catch (x) {} startHold(); });
  stage.addEventListener("pointerup", function(e){ endHold(document.elementFromPoint(e.clientX, e.clientY)); });
  stage.addEventListener("pointercancel", function(){ endHold(null); taps--; });
  stage.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  stage.addEventListener("keydown", function(e){
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) startHold(); }
  });
  stage.addEventListener("keyup", function(e){ if (e.key === " " || e.key === "Enter") { e.preventDefault(); endHold(null); } });
  skip.addEventListener("click", function(){ finish(); var h = document.querySelector(".hero h1"); if (h) h.focus(); });
  addEventListener("pageshow", function(e){ if (e.persisted && over) root.classList.remove("rite-on"); });
})();
