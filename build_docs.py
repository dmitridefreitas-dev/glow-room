# -*- coding: utf-8 -*-
"""Build static + interactive HTML for the Glow Room business plan."""
import markdown, re, pathlib

HERE = pathlib.Path(__file__).parent
MD = (HERE / "GlowUp_Business_Plan.md").read_text(encoding="utf-8")

body = markdown.markdown(
    MD,
    extensions=["tables", "fenced_code", "sane_lists", "attr_list"],
)

CSS = """
:root{
  --offwhite:#faf7f2; --ink:#2b2724; --rose:#c98a86; --sage:#9bae9b;
  --accent:#d98a5b; --line:#e7ded2; --muted:#6f675f; --card:#fffdf9;
}
*{box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact;}
html{-webkit-print-color-adjust:exact; print-color-adjust:exact;}
body{
  font-family:"Segoe UI",-apple-system,Helvetica,Arial,sans-serif;
  color:var(--ink); background:var(--offwhite); line-height:1.6;
  max-width:880px; margin:0 auto; padding:48px 56px; font-size:15.5px;
}
h1{font-size:27px; font-weight:700; letter-spacing:-.4px; margin:2.2em 0 .6em;
   padding-bottom:.25em; border-bottom:2px solid var(--rose); color:#1f1b18;}
h2{font-size:20px; font-weight:650; margin:1.6em 0 .5em; color:#332e29;}
h3{font-size:16.5px; font-weight:650; margin:1.3em 0 .4em; color:var(--accent);}
p{margin:.6em 0;}
a{color:var(--accent); text-decoration:none;}
ul,ol{margin:.5em 0 .9em 1.3em;}
li{margin:.25em 0;}
strong{color:#1f1b18;}
em{color:var(--muted);}
hr{border:none; border-top:1px solid var(--line); margin:2em 0;}
blockquote{border-left:3px solid var(--sage); background:var(--card);
  margin:1em 0; padding:.6em 1.1em; color:#3a352f; border-radius:0 6px 6px 0;}
table{border-collapse:collapse; width:100%; margin:1.1em 0; font-size:13.5px;
  background:var(--card); border-radius:8px; overflow:hidden;
  box-shadow:0 1px 3px rgba(80,60,40,.07);}
th{background:var(--ink); color:#fdf8f1; text-align:left; padding:9px 11px; font-weight:600;}
td{padding:8px 11px; border-top:1px solid var(--line); vertical-align:top;}
tr:nth-child(even) td{background:#fcf9f4;}
code{background:#f0e9df; padding:1px 5px; border-radius:4px; font-size:13px;}
div[style*="page-break"]{height:0;}
@media print{
  body{max-width:none; padding:0 14mm; font-size:11pt; background:#fff;}
  div[style*="page-break"]{page-break-after:always;}
  h1{page-break-after:avoid;} table,blockquote{page-break-inside:avoid;}
  .dash{break-inside:avoid;}
}
/* ---- interactive dashboard ---- */
.dash{background:linear-gradient(160deg,#fffdf9,#f7efe4); border:1px solid var(--line);
  border-radius:14px; padding:22px 24px; margin:1.4em 0 2em;
  box-shadow:0 4px 16px rgba(90,60,30,.10);}
.dash h2{margin-top:0;}
.dash .note{font-size:12.5px; color:var(--muted); margin:-.2em 0 1.2em;}
.controls{display:grid; grid-template-columns:1fr 1fr; gap:14px 26px;}
@media(max-width:680px){.controls{grid-template-columns:1fr;}}
.ctrl label{display:flex; justify-content:space-between; font-size:13px;
  font-weight:600; margin-bottom:3px;}
.ctrl label b{color:var(--accent); font-variant-numeric:tabular-nums;}
.ctrl input[type=range]{width:100%; accent-color:var(--rose); height:4px;}
.kpis{display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:20px 0 6px;}
@media(max-width:680px){.kpis{grid-template-columns:repeat(2,1fr);}}
.kpi{background:var(--card); border:1px solid var(--line); border-radius:10px;
  padding:12px 14px; text-align:center;}
.kpi .v{font-size:21px; font-weight:700; color:#1f1b18; font-variant-numeric:tabular-nums;}
.kpi .l{font-size:11.5px; color:var(--muted); margin-top:2px; line-height:1.3;}
.kpi.hi{background:var(--ink);} .kpi.hi .v{color:#ffd9b0;} .kpi.hi .l{color:#e6dccd;}
.sizes{font-size:13px; color:var(--muted); margin:10px 0 2px;}
.sizes b{color:var(--ink); font-variant-numeric:tabular-nums;}
.reset{margin-top:14px; font-size:12.5px; background:var(--rose); color:#fff;
  border:none; padding:7px 14px; border-radius:7px; cursor:pointer;}
.scenario-tag{display:inline-block; padding:2px 10px; border-radius:20px;
  font-size:12px; font-weight:600; margin-left:8px; background:var(--sage); color:#fff;}
"""

DASH = """
<div class="dash" id="model">
  <h2>Live Financial Model <span class="scenario-tag" id="scenarioTag">Base case</span></h2>
  <p class="note">Drag any slider to change the assumptions — every figure below updates instantly.
  This interactive model works in the HTML version; the PDF shows a static snapshot of the base case.</p>
  <div class="controls">
    <div class="ctrl"><label>Glow Up price <b id="glowPriceL">$18</b></label>
      <input type="range" id="glowPrice" min="9" max="30" step="1" value="18"></div>
    <div class="ctrl"><label>Platform &amp; processing fee <b id="feeL">7%</b></label>
      <input type="range" id="fee" min="3" max="12" step="0.5" value="7"></div>
    <div class="ctrl"><label>Cohort 1 buyers <b id="c1L">100</b></label>
      <input type="range" id="c1" min="25" max="1000" step="25" value="100"></div>
    <div class="ctrl"><label>Growth per cohort <b id="growthL">50%</b></label>
      <input type="range" id="growth" min="0" max="150" step="5" value="50"></div>
    <div class="ctrl"><label>Membership price / mo <b id="memPriceL">$9</b></label>
      <input type="range" id="memPrice" min="5" max="20" step="1" value="9"></div>
    <div class="ctrl"><label>Year-end subscribers <b id="subsL">300</b></label>
      <input type="range" id="subs" min="0" max="2000" step="25" value="300"></div>
    <div class="ctrl"><label>Phone Detox price <b id="pdPriceL">$12</b></label>
      <input type="range" id="pdPrice" min="5" max="25" step="1" value="12"></div>
    <div class="ctrl"><label>Phone Detox buyers / yr <b id="pdBuyersL">250</b></label>
      <input type="range" id="pdBuyers" min="0" max="3000" step="25" value="250"></div>
  </div>

  <div class="sizes">Resulting cohort sizes (4 launches): <b id="sizesOut"></b>
    &nbsp;|&nbsp; Net per Glow Up sale: <b id="netSale"></b></div>

  <div class="kpis">
    <div class="kpi"><div class="v" id="kGlow"></div><div class="l">Glow Up cohorts (net / yr)</div></div>
    <div class="kpi"><div class="v" id="kMem"></div><div class="l">Membership (net / yr)</div></div>
    <div class="kpi"><div class="v" id="kPd"></div><div class="l">Phone Detox (net / yr)</div></div>
    <div class="kpi hi"><div class="v" id="kTotal"></div><div class="l">Total Y1 revenue (net)</div></div>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="v" id="kOpex"></div><div class="l">Est. operating costs</div></div>
    <div class="kpi"><div class="v" id="kEbitda"></div><div class="l">Approx. EBITDA</div></div>
    <div class="kpi"><div class="v" id="kMargin"></div><div class="l">EBITDA margin</div></div>
    <div class="kpi"><div class="v" id="kBand"></div><div class="l">Scenario band</div></div>
  </div>

  <h3 style="margin-bottom:.3em;">Unit economics at current price &amp; fee</h3>
  <table id="unitTbl">
    <thead><tr><th>Units / cohort</th><th>Gross</th><th>Platform fee</th><th>Net revenue</th><th>Contribution</th></tr></thead>
    <tbody></tbody>
  </table>
  <button class="reset" id="resetBtn">Reset to base case</button>
</div>
"""

JS = """
<script>
(function(){
  var ids=["glowPrice","fee","c1","growth","memPrice","subs","pdPrice","pdBuyers"];
  var defaults={glowPrice:18,fee:7,c1:100,growth:50,memPrice:9,subs:300,pdPrice:12,pdBuyers:250};
  var $=function(id){return document.getElementById(id);};
  function money(n){return "$"+Math.round(n).toLocaleString("en-US");}
  function recompute(){
    var price=+$("glowPrice").value, fee=+$("fee").value/100,
        c1=+$("c1").value, g=+$("growth").value/100,
        mPrice=+$("memPrice").value, subs=+$("subs").value,
        pdP=+$("pdPrice").value, pdB=+$("pdBuyers").value;
    $("glowPriceL").textContent="$"+price;
    $("feeL").textContent=(+$("fee").value)+"%";
    $("c1L").textContent=c1.toLocaleString();
    $("growthL").textContent=(+$("growth").value)+"%";
    $("memPriceL").textContent="$"+mPrice;
    $("subsL").textContent=subs.toLocaleString();
    $("pdPriceL").textContent="$"+pdP;
    $("pdBuyersL").textContent=pdB.toLocaleString();

    var sizes=[c1]; for(var i=1;i<4;i++){sizes.push(Math.round(sizes[i-1]*(1+g)));}
    var netSale=price*(1-fee);
    var glowAnnual=sizes.reduce(function(a,s){return a+s*netSale;},0);
    var pdAnnual=pdB*pdP*(1-fee);
    var memAnnual=(subs/2)*12*mPrice*(1-fee);   // linear ramp 0->subs over the year
    var total=glowAnnual+pdAnnual+memAnnual;
    var opex=3000+ (subs>500?1500:0) + (total>80000?2000:0);
    var ebitda=total-opex;
    var margin= total>0 ? (ebitda/total*100) : 0;

    $("sizesOut").textContent=sizes.join(" \\u2192 ");
    $("netSale").textContent=money(netSale);
    $("kGlow").textContent=money(glowAnnual);
    $("kMem").textContent=money(memAnnual);
    $("kPd").textContent=money(pdAnnual);
    $("kTotal").textContent=money(total);
    $("kOpex").textContent=money(opex);
    $("kEbitda").textContent=money(ebitda);
    $("kMargin").textContent=Math.round(margin)+"%";

    var band, tag;
    if(total<55000){band="Conservative"; tag="Conservative";}
    else if(total<=110000){band="Base"; tag="Base case";}
    else {band="Optimistic"; tag="Optimistic";}
    $("kBand").textContent=band;
    $("scenarioTag").textContent=tag;

    var units=[100,500,1000,5000], tb=$("unitTbl").querySelector("tbody"); tb.innerHTML="";
    units.forEach(function(u){
      var gross=u*price, f=gross*fee, net=gross-f;
      var r="<tr><td>"+u.toLocaleString()+"</td><td>"+money(gross)+"</td><td>"+money(f)+
            "</td><td>"+money(net)+"</td><td>"+money(net)+"</td></tr>";
      tb.insertAdjacentHTML("beforeend",r);
    });
  }
  ids.forEach(function(id){$(id).addEventListener("input",recompute);});
  $("resetBtn").addEventListener("click",function(){
    ids.forEach(function(id){$(id).value=defaults[id];}); recompute();
  });
  recompute();
})();
</script>
"""

def page(title, body_html, interactive):
    head = ("<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            "<title>" + title + "</title><style>" + CSS + "</style></head><body>")
    html = body_html
    if interactive:
        # inject dashboard right after the Section 11 heading
        html = re.sub(r"(<h1[^>]*>Section 11[^<]*</h1>)", r"\1" + DASH, html, count=1)
    tail = (JS if interactive else "") + "</body></html>"
    return head + html + tail

(HERE / "GlowUp_Business_Plan.html").write_text(
    page("The Glow Room — Business Plan", body, False), encoding="utf-8")
(HERE / "GlowUp_Business_Plan_V2.html").write_text(
    page("The Glow Room — Business Plan (Interactive)", body, True), encoding="utf-8")
print("OK: wrote GlowUp_Business_Plan.html and GlowUp_Business_Plan_V2.html")
