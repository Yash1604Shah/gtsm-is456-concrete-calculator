const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "toolbox.js"), "utf8");
const store = {
  menu: { innerHTML: "", append() {} },
  tool: { innerHTML: "" },
  run: {},
  results: { innerHTML: "" },
  "field-l": { value: "300" },
  "field-t": { value: "80" },
};
const document = {
  getElementById(id) {
    if (!store[id]) store[id] = { value: "", innerHTML: "", addEventListener(){} };
    return store[id];
  },
  querySelectorAll() { return []; },
  createElement() { return { dataset: {}, classList: {toggle(){}}, append(){} }; }
};
const window = { addEventListener(){} };
vm.runInNewContext(source, { document, window, location:{hash:"#upv"}, console, Number, Math, Set, Object });
const tools = window.GTSMCalculator;
assert.ok(tools,"Calculation API should be exported for test");
assert.equal(tools.tests.length,23);
const val=(id, data, label) => {
  const result=tools.calculate(id, data);
  const found=result.metrics.find(x=>x.name===label);
  assert.ok(found,label+" missing on "+id);
  return parseFloat(String(found.value).replace(/,/g,""));
};
const close=(a,b,t=0.006)=>assert.ok(Math.abs(a-b)<=t,a+" ≠ "+b);
close(val("upv",{l:300,t:80},"Pulse velocity"),3.75);
close(val("wenner",{a:5,v:12,i:20},"Apparent soil resistivity"),2*Math.PI*5*.6);
close(val("schl",{ab:20,mn:2,v:10,i:20},"Apparent resistivity"),Math.PI*99/2*.5);
close(val("dipole",{a:5,n:2,v:9,i:20},"Apparent resistivity"),Math.PI*5*24*.45);
close(val("four",{xa:0,xb:15,xm:5,xn:10,v:12,i:20},"Apparent resistivity magnitude"),Math.PI*10*.6);
close(val("surf",{a:50,v:25,i:5},"Equivalent"),(2*Math.PI*.05*5)/10);
close(val("core",{p:290,d:100,l:180},"Raw compressive stress"),290000/(Math.PI*10000/4));
close(val("compress",{p:640,b:150,l:150},"Raw compressive stress"),640000/22500);
close(val("flex",{p:32,l:450,b:150,d:150},"Third-point modulus of rupture"),32000*450/(150*22500));
close(val("steel",{d:16,py:110,pu:145,l0:80,lf:100},"Total elongation"),25);
close(val("absorb",{dry:1800,wet:1960},"Absorption"),160/1800*100);
close(val("aggsg",{a:2500,b:2525,c:1560},"Bulk relative density (OD)"),2500/965);
close(val("bulk",{m:1704,v:1000},"Bulk density"),1704);
close(val("agg-loss",{kind:"Crushing value",initial:3000,loss:550},"Crushing value arithmetic"),550/3000*100);
close(val("cement",{water:120,cement:400},"Water / cement"),30);
close(val("sound",{initial:3,final:5},"Le Chatelier expansion"),2);
close(val("moisture",{tin:30,wet:110,dry:100},"Moisture content"),10/70*100);
close(val("atterberg",{ll:45,pl:23},"Plasticity index"),22);
close(val("spt",{b1:6,b2:11,b3:14},"Uncorrected N-value"),25);
assert.ok(tools.calculate("sieve",{rows:"20, 0\n10, 75\n4.75, 180\n2.36, 240\n1.18, 110\nPan, 45"}).tables[0].includes("100%"));
assert.equal(tools.calculate("halfcell",{values:"-170, -240, -310, -390, -360, -180"}).metrics.find(x=>x.name==="More negative than −350").value,2);
assert.throws(()=>tools.calculate("schl",{ab:3,mn:4,i:1,v:1}));
assert.throws(()=>tools.calculate("four",{xa:0,xb:0,xm:2,xn:3,v:1,i:1}));
assert.throws(()=>tools.calculate("moisture",{tin:30,wet:50,dry:55}));
console.log("PASS — 23 GTSM calculators are registered; 23 numerical, input-validation and output checks passed.");
