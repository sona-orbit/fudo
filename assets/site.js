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


  // ---- 創作區預覽：場景捲進畫面才載入圖、開始動；臉偶爾東張西望；切換時間與季節
  var scenes = document.querySelectorAll(".sn");
  function seen(el){
    el.classList.add("seen");
    var urls = {};   // 圖都到了才露出臉，免得先看到飄在空中的眼睛
    Array.prototype.forEach.call(el.querySelectorAll(".sn-in"), function(i){ var m = /url\("?([^")]+)"?\)/.exec(getComputedStyle(i).backgroundImage); if (m) urls[m[1]] = 1; });
    Promise.all(Object.keys(urls).map(function(u){ var im = new Image(); im.src = u; return im.decode ? im.decode().catch(function(){}) : Promise.resolve(); }))
      .then(function(){ el.classList.add("ready"); });
    Array.prototype.forEach.call(el.querySelectorAll(".sn-face i"), function(i){ i.style.setProperty("--bd", (-Math.random()*5.5).toFixed(2) + "s"); });
  }
  if ("IntersectionObserver" in window) {
    var snIO = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { seen(e.target); snIO.unobserve(e.target); } }); }, {rootMargin: "300px 0px"});
    Array.prototype.forEach.call(scenes, function(s){ snIO.observe(s); });
  } else Array.prototype.forEach.call(scenes, seen);
  if (!reduce && scenes.length) (function look(){
    setTimeout(function(){
      var faces = document.querySelectorAll(".sn.seen .sn-face");
      if (faces.length && !document.hidden) {
        var f = rnd(faces), dir = rnd(["l","r","u"]), was = ["l","r","u"].filter(function(c){ return f.classList.contains(c); });
        was.forEach(function(c){ f.classList.remove(c); }); f.classList.add(dir);
        setTimeout(function(){ f.classList.remove(dir); was.forEach(function(c){ f.classList.add(c); }); }, 1200 + Math.random()*900);
      }
      look();
    }, 1400 + Math.random()*2200);
  })();
  Array.prototype.forEach.call(document.querySelectorAll(".seg[data-for]"), function(g){
    var target = document.getElementById(g.dataset.for);
    g.addEventListener("click", function(e){
      var b = e.target.closest("button"); if (!b || !target) return;
      g.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      if (b.hasAttribute("data-time")) target.setAttribute("data-time", b.dataset.time);
      if (b.hasAttribute("data-season")) {
        target.setAttribute("data-season", b.dataset.season);
        if (b.dataset.season === "summer") {   // 夏螢只在夜裡
          target.setAttribute("data-time", "night");
          document.querySelectorAll('.seg[data-for="' + g.dataset.for + '"] [data-time]').forEach(function(x){ x.setAttribute("aria-pressed", x.dataset.time === "night" ? "true" : "false"); });
        }
      }
    });
  });

  // ---- 擺擺看（創作區預覽）：拖動、疊上去、戴上、拖到底下拿掉；鍵盤：方向鍵移動、Delete 拿掉
  Array.prototype.forEach.call(document.querySelectorAll(".play[data-play]"), function(box){
    var D = JSON.parse(box.dataset.play), stage = box.querySelector(".play-stage"), layer = box.querySelector(".play-layer");
    var trash = box.querySelector(".play-trash"), toastEl = box.querySelector(".play-toast");
    var wrap = box.closest(".play-wrap"), WH = 3/4, items = [], nid = 1, drag = null, hot = null;
    var WEAR = {"deco-glasses-round": "face", "deco-kasa": "head"};
    function isStone(a){ return a.indexOf("stone-") === 0; }
    function isChar(a){ return a === "flame-sit" || a.indexOf("twin-") === 0; }
    function h(it){ return it.w * D.ar[it.a] * WH; }
    function byId(id){ return items.filter(function(i){ return i.id === id; })[0]; }
    function host(it){ return it.att ? byId(it.att.host) : null; }
    function anchor(o, slot){
      var hh = h(o), f = D.face[o.a];
      if (slot === "face" && f) return {x: o.x, b: o.b + hh*(1 - f[0])};
      return {x: o.x, b: o.b + hh*0.93};
    }
    function place(it){
      var o = host(it); if (!o) return it;
      var an = anchor(o, it.att.slot), w = it.att.rw*o.w, hh = w*D.ar[it.a]*WH;
      return {x: an.x + it.att.dx*o.w, b: (it.att.slot === "face" && D.face[o.a] ? an.b - hh/2 : an.b - hh*0.25), w: w};
    }
    function zkey(it){ var o = host(it); return o ? zkey(o) + 0.5 : 100 - it.b; }
    function face(a){
      var f = D.face[a]; if (!f) return "";
      var e = '<i style="width:' + (f[1]*100).toFixed(2) + '%"></i>';
      var s = '<span class="sn-face" style="top:' + (f[0]*100).toFixed(1) + '%;gap:' + (f[2]*100).toFixed(2) + '%">' + e + e + '</span>';
      if (f[3]) s += '<span class="sn-mouth" style="top:' + ((f[0] + 0.84*f[1]/D.ar[a])*100).toFixed(1) + '%;width:' + (f[1]*42).toFixed(2) + '%"></span>';
      return s;
    }
    function reset(){
      nid = 1; items = D.start.map(function(s){ return {id: nid++, a: s[0], x: s[1], b: s[2], w: s[3], att: null}; });
      items[1].b = items[0].b + h(items[0]) - 0.6;   // 靜疊在底岩上
      render();
    }
    function render(){
      var focusId = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.id;
      layer.innerHTML = "";
      items.slice().sort(function(p, q){ return zkey(p) - zkey(q); }).forEach(function(it){
        var p = place(it), d = document.createElement("div"), hh = p.w*D.ar[it.a]*WH;
        d.className = "play-it" + (drag && drag.id === it.id ? " drag" : "") + (hot === it.id ? " hot" : "");
        d.dataset.id = it.id; d.tabIndex = 0; d.setAttribute("role", "button");
        d.setAttribute("aria-label", D.names[it.a] || it.a);
        d.style.cssText = "left:" + (p.x - p.w/2) + "%;bottom:" + p.b + "%;width:" + p.w + "%;height:" + hh + "%";
        d.innerHTML = '<div class="sn-in sn-a-' + it.a + '">' + face(it.a) + "</div>";
        var px = stage.clientWidth*p.w/100;
        if (px < 44) { var m = (44 - px)/2; d.style.padding = m + "px"; d.style.margin = (-m) + "px"; d.style.boxSizing = "content-box"; }
        layer.appendChild(d);
      });
      if (focusId) { var f = layer.querySelector('[data-id="' + focusId + '"]'); if (f) f.focus({preventScroll: true}); }
    }
    function toast(t){ toastEl.textContent = t; toastEl.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function(){ toastEl.classList.remove("on"); }, 2200); }
    function pt(e){ var r = stage.getBoundingClientRect(); return {x: (e.clientX - r.left)/r.width*100, b: (r.bottom - e.clientY)/r.height*100}; }
    function target(it){
      var best = null;
      if (WEAR[it.a]) {
        var slot = WEAR[it.a], ph = h(it), cb = it.b + (slot === "face" ? ph/2 : ph*0.25);
        items.forEach(function(o){
          if (o === it || o.att || !(isChar(o.a) || isStone(o.a))) return;
          var s = slot === "face" && !D.face[o.a] ? "head" : slot, an = anchor(o, s), d = Math.hypot(it.x - an.x, (cb - an.b)/WH);
          if (d < Math.max(8, o.w*0.45) && (!best || d < best.d)) best = {o: o, d: d, slot: s};
        });
      } else if (isStone(it.a) || isChar(it.a)) {
        items.forEach(function(o){
          if (o === it || !isStone(o.a)) return;
          var top = o.b + h(o) - 0.6, dx = Math.abs(it.x - o.x);
          if (dx < o.w*0.42 && it.b > top - 7 && it.b < top + 9 && (!best || Math.abs(it.b - top) < best.d)) best = {o: o, d: Math.abs(it.b - top), top: top};
        });
      }
      return best;
    }
    function drop(it, p){
      if (p.b < 12) {
        items = items.filter(function(i){ return i !== it && !(i.att && i.att.host === it.id); });
        toast(D.msg.msg_removed); return;
      }
      var t = target(it);
      if (t && t.top != null) { it.b = t.top; it.x = t.o.x + (it.x - t.o.x)*0.3; toast(D.msg.msg_stack); }
      else if (t && t.slot) { it.att = {host: t.o.id, slot: t.slot, dx: 0, rw: Math.min(1.2, it.w/t.o.w*0.9)}; toast(D.msg.msg_wear); }
    }
    stage.addEventListener("pointerdown", function(e){
      var el = e.target.closest(".play-it"); if (!el || drag) return;
      e.preventDefault();
      var it = byId(+el.dataset.id);
      if (it.att) { var p0 = place(it); it.x = p0.x; it.b = p0.b; it.w = p0.w; it.att = null; toast(D.msg.msg_off); }
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      var p = pt(e); drag = {id: it.id, pid: e.pointerId, sx: p.x, sb: p.b, x: it.x, b: it.b};
      stage.classList.add("dragging"); render();
    });
    stage.addEventListener("pointermove", function(e){
      if (!drag || e.pointerId !== drag.pid) return;
      var it = byId(drag.id), p = pt(e);
      it.x = Math.max(0, Math.min(100, drag.x + p.x - drag.sx)); it.b = Math.max(-5, Math.min(95, drag.b + p.b - drag.sb));
      var t = target(it); hot = t ? t.o.id : null;
      trash.classList.toggle("over", p.b < 12); render();
    });
    function end(e){
      if (!drag || e.pointerId !== drag.pid) return;
      var it = byId(drag.id); drag = null; hot = null;
      drop(it, pt(e)); stage.classList.remove("dragging"); trash.classList.remove("over"); render();
    }
    stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
    layer.addEventListener("keydown", function(e){
      var el = e.target.closest(".play-it"); if (!el) return;
      var it = byId(+el.dataset.id), step = e.shiftKey ? 6 : 2, k = e.key;
      if (k === "Delete" || k === "Backspace") { e.preventDefault(); items = items.filter(function(i){ return i !== it && !(i.att && i.att.host === it.id); }); toast(D.msg.msg_removed); render(); var n = layer.querySelector(".play-it"); if (n) n.focus(); return; }
      var dx = k === "ArrowLeft" ? -step : k === "ArrowRight" ? step : 0, db = k === "ArrowUp" ? step : k === "ArrowDown" ? -step : 0;
      if (!dx && !db) return;
      e.preventDefault();
      if (it.att) { var p0 = place(it); it.x = p0.x; it.b = p0.b; it.w = p0.w; it.att = null; }
      it.x = Math.max(0, Math.min(100, it.x + dx)); it.b = Math.max(14, Math.min(95, it.b + db));
      render();
    });
    wrap.querySelector(".play-adds").addEventListener("click", function(e){
      var b = e.target.closest("button"); if (!b) return;
      var a = b.dataset.add, w = a === "stone-base" ? 34 : isStone(a) ? 24 : 16;
      var it = {id: nid++, a: a, x: 50 + (Math.random()*16 - 8), b: 40 + Math.random()*10, w: w, att: null};
      items.push(it); render();
      var n = layer.querySelector('[data-id="' + it.id + '"]'); if (n) n.focus({preventScroll: true});
    });
    wrap.querySelector(".play-reset").addEventListener("click", reset);
    addEventListener("resize", render);
    reset();
  });

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
