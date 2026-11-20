// 語言選單：點外面或按 Esc 收起
(function(){
  var d=document.querySelector(".langs");if(!d)return;
  document.addEventListener("click",function(e){if(d.open&&!d.contains(e.target))d.open=false});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&d.open){d.open=false;d.querySelector("summary").focus()}});
})();
