"use strict";
(function () {
  const N = (id, label, value, help, min) => ({ id, label, value, help: help || "", kind: "number", min: min === undefined ? null : min });
  const T = (id, label, value, help) => ({ id, label, value, help: help || "", kind: "text" });
  const S = (id, label, value, choices, help) => ({ id, label, value, choices, help: help || "", kind: "select" });
  const tests = [
    { id:"upv", cat:"Non-Destructive Testing", title:"Ultrasonic Pulse Velocity (UPV)", desc:"Calculate the measured pulse velocity from transducer path length and corrected transit time.", formula:"Velocity (km/s) = path length (mm) ÷ time (µs)", fields:[N("l","Path length (mm)",300,"Actual transmission path, not necessarily member thickness.",0),N("t","Corrected travel time (µs)",80,"Apply instrument zero and coupling corrections before entry.",0)], caution:"UPV is not compressive strength. Concrete quality grading requires the correct IS 516 edition/amendment, test geometry and measured conditions." },
    { id:"rebound", cat:"Non-Destructive Testing", title:"Rebound Hammer Statistics", desc:"Summarise rebound numbers without inventing a concrete-strength correlation.", formula:"Mean = Σ RN / n; sample SD = √[Σ(RN − mean)²/(n − 1)]", fields:[T("values","Rebound readings (RN)","28, 30, 31, 29, 32, 30, 31, 29, 30, 30","Enter the complete set for one designated test area.")], caution:"A rebound number alone cannot be converted into MPa without a validated relationship for that concrete and instrument, appropriate orientation and surface corrections. Discard readings only under the governing test method, not automatically." },
    { id:"halfcell",cat:"Non-Destructive Testing",title:"Half-Cell Potential Survey Summary",desc:"Summarise copper/copper-sulfate reference-electrode readings for a corrosion survey.",formula:"Survey mean, min/max, and counts in commonly used CSE potential bands",fields:[T("values","Potentials relative to Cu/CuSO₄ (mV)","-170, -240, -310, -390, -360, -180","Input signed millivolts, already measured/referenced to CSE.")],caution:"These are only historical ASTM C876 screening bands: more positive than −200 mV, −200 to −350 mV, and more negative than −350 mV. Potential is not corrosion rate or measured section loss. Moisture, oxygen, continuity and reference-electrode type alter interpretation."},
    { id:"surf",cat:"Non-Destructive Testing",title:"Surface Wenner Resistivity",desc:"Calculate a simple four-point Wenner apparent resistivity for a concrete surface.",formula:"ρapp = 2π × spacing (m) × voltage/current (Ω)",fields:[N("a","Probe spacing (mm)",50,"Equal collinear probe spacing.",0),N("v","Voltage difference (mV)",25,"Absolute measured magnitude.",0),N("i","Applied current (mA)",5,"Use the same instrument reading pair.",0)],caution:"Finite member size, edge effects, reinforcement, cover, saturation and electrode contact require corrections/interpretation under the applicable procedure; this is not an automatic corrosion-rate or durability rating."},
    { id:"carbon",cat:"Non-Destructive Testing",title:"Carbonation Depth & Cover Comparison",desc:"Compare measured carbonation fronts with a separately measured concrete cover depth.",formula:"Estimated uncarbonated cover margin = measured cover − largest carbonation depth",fields:[N("cover","Measured cover (mm)",35,"Use location-matched cover where possible.",0),T("values","Carbonation depths (mm)","12, 15, 14, 16","Multiple phenolphthalein depth readings.")],caution:"This is geometric comparison only. A negative margin is not a direct measurement of steel corrosion. Phenolphthalein interpretation and location matching matter."},
    { id:"cover",cat:"Non-Destructive Testing",title:"Rebar Cover Measurement Summary",desc:"Summarise cover-meter readings and compare with a user-entered reference value.",formula:"Mean, minimum and number of readings below the entered reference",fields:[T("values","Cover readings (mm)","32, 35, 31, 38, 34"),N("nom","Reference cover (mm)",35,"Comparison only; enter value from approved drawings.",0)],caution:"Electromagnetic cover measurements may be influenced by bar size, spacing, layering and calibration. This comparison is not a structural acceptance verdict."},
    { id:"core",cat:"Non-Destructive Testing",title:"Concrete Core Raw Compressive Stress",desc:"Calculate failure load divided by circular core area and report the length-to-diameter ratio.",formula:"Raw stress (MPa) = P (N) ÷ [πd²/4] (mm²)",fields:[N("p","Failure load (kN)",290,"",0),N("d","Core diameter (mm)",100,"Measured diameter, not just nominal.",0),N("l","Prepared core length (mm)",180,"Used for L/D only.",0)],caution:"Raw stress is not automatically corrected core strength. Follow IS 516 (Part 4) for end preparation, L/D, reinforcement, moisture, extraction damage, corrections and acceptance interpretation."},
    { id:"wenner",cat:"ERT & Electrical Resistivity",title:"Soil Resistivity: Wenner Array",desc:"Calculate apparent resistivity from four equally spaced collinear electrodes.",formula:"ρapp (Ω·m) = 2πa × (ΔV/I), where a is in metres",fields:[N("a","Equal electrode spacing a (m)",5,"A—M—N—B, each neighbour separated by a.",0),N("v","Potential ΔV (mV)",12,"Magnitude; use signed raw data only after checking polarity.",0),N("i","Injected current I (mA)",20,"",0)],caution:"An apparent value is not the resistivity of a single soil layer and cannot identify depth or groundwater directly. Confirm geometry, interference, cables and contact conditions."},
    { id:"schl",cat:"ERT & Electrical Resistivity",title:"Soil Resistivity: Schlumberger Array",desc:"Calculate the symmetric Schlumberger geometric factor and apparent resistivity.",formula:"K = π[(AB/2)² − (MN/2)²] ÷ MN; ρapp = K × ΔV/I",fields:[N("ab","Outer current-electrode separation AB (m)",20,"",0),N("mn","Inner potential-electrode separation MN (m)",2,"Must be smaller than AB.",0),N("v","Potential ΔV (mV)",10,"",0),N("i","Current I (mA)",20,"",0)],caution:"This assumes a symmetric, collinear A–M–N–B arrangement. Use actual spacing and survey sign convention. It does not generate an inversion model."},
    { id:"dipole",cat:"ERT & Electrical Resistivity",title:"ERT: Dipole–Dipole Apparent Resistivity",desc:"Compute apparent resistivity for a conventional equal-length collinear dipole–dipole array.",formula:"K = πa·n(n+1)(n+2); ρapp = K × ΔV/I",fields:[N("a","Dipole length a (m)",5,"Both current and potential dipoles must have this length.",0),N("n","Separation factor n",2,"Integer number of a-spacings between B and M.",1),N("v","Potential ΔV (mV)",9,"",0),N("i","Current I (mA)",20,"",0)],caution:"Use geometry A–B–M–N, with AB=a, BM=n×a, MN=a. Only apparent resistivity is computed; pseudosection coordinates and 2D/3D inversion are separate tasks."},
    { id:"four",cat:"ERT & Electrical Resistivity",title:"ERT: Any Four Collinear Electrodes",desc:"Calculate the geometric factor directly from measured electrode coordinates.",formula:"K = 2π / |1/AM − 1/BM − 1/AN + 1/BN|; ρapp = K × ΔV/I",fields:[N("xa","Current electrode A position (m)",0),N("xb","Current electrode B position (m)",15),N("xm","Potential electrode M position (m)",5),N("xn","Potential electrode N position (m)",10),N("v","Potential ΔV magnitude (mV)",14,"",0),N("i","Current magnitude (mA)",20,"",0)],caution:"Only valid for a homogeneous half-space point-electrode geometrical assumption and accurate in-line coordinates. Arrays with topography, off-line electrodes or reciprocal sign conventions need their full electrode model and QA checks."},
    { id:"compress",cat:"Construction Materials",title:"Concrete, Brick & Paver Compression",desc:"Compute a raw compressive stress for a rectangular loaded specimen.",formula:"Compressive stress (N/mm²) = failure load (kN) × 1000 ÷ loaded area (mm²)",fields:[N("p","Failure load (kN)",640,"",0),N("b","Loaded width (mm)",150,"",0),N("l","Loaded length (mm)",150,"",0)],caution:"This is raw force/area only. Cubes, masonry units, pavers and AAC can require different conditioning, capping, net-area definitions and corrections. No blanket IS-grade pass/fail is implied."},
    { id:"flex",cat:"Construction Materials",title:"Concrete Beam Flexural Strength",desc:"Calculate third-point loading modulus of rupture for a rectangular beam.",formula:"Modulus of rupture = P×L /(b×d²), using TOTAL applied load P",fields:[N("p","Total failure load P (kN)",32,"Two equal third-point loads together.",0),N("l","Support span L (mm)",450,"",0),N("b","Beam width b (mm)",150,"",0),N("d","Beam depth d (mm)",150,"",0)],caution:"This formula applies to symmetrical third-point loading with the fracture inside the middle third. Other failure locations and central-point loading need different treatment under the actual testing standard."},
    { id:"steel",cat:"Construction Materials",title:"Reinforcement Steel: Tensile Calculations",desc:"Compute nominal stresses and elongation from loads, bar diameter and gauge lengths.",formula:"σ = Load (N)/[πd²/4]; elongation (%) = (Lf−L0)/L0×100",fields:[N("d","Nominal bar diameter (mm)",16,"Confirm whether nominal or measured area is applicable.",0),N("py","Yield/proof load (kN)",110,"",0),N("pu","Maximum tensile load (kN)",145,"",0),N("l0","Initial gauge length (mm)",80,"",0),N("lf","Final gauge length (mm)",100,"",0)],caution:"Reporting yield, proof strength, elongation and conformity to a steel grade requires the appropriate test procedure, area basis, gauge length and IS 1608/IS 1786 requirements. Nominal-area values are informational."},
    { id:"absorb",cat:"Construction Materials",title:"Water Absorption: Bricks, Pavers, Aggregate",desc:"Find absorption percentage relative to oven-dry mass.",formula:"Water absorption (%) = (wet − dry) ÷ dry × 100",fields:[N("dry","Oven-dry mass (g)",1800,"",0),N("wet","Post-immersion / SSD mass (g)",1960,"",0)],caution:"Required immersion duration, temperature, drying, SSD condition and acceptance limits depend on the tested material and its applicable test standard."},
    { id:"aggsg",cat:"Construction Materials",title:"Coarse Aggregate: Specific Gravity",desc:"Calculate oven-dry bulk, saturated-surface-dry bulk and apparent relative density.",formula:"Bulk OD=A/(B−C); Bulk SSD=B/(B−C); Apparent=A/(A−C)",fields:[N("a","A: Oven-dry mass in air (g)",2500,"",0),N("b","B: Saturated-surface-dry mass in air (g)",2525,"",0),N("c","C: SSD mass submerged in water (g)",1560,"",0)],caution:"For coarse aggregate only. Follow the relevant IS 2386 (Part 3) procedure and use the correct measured SSD and underwater mass definitions. Temperature and water-density effects may matter."},
    { id:"bulk",cat:"Construction Materials",title:"Bulk Density / Unit Weight",desc:"Calculate density from a net specimen/sample mass and its volume.",formula:"Density (kg/m³) = mass (g)/volume (cm³) × 1000",fields:[N("m","Net mass (g)",1704,"Exclude measuring container.",0),N("v","Occupied volume (cm³)",1000,"Includes voids for a bulk-aggregate test.",0)],caution:"Dry, rodded, loose and in-situ bulk-density methods are not interchangeable. Follow the applicable material-specific procedure and container calibration."},
    { id:"agg-loss",cat:"Construction Materials",title:"Aggregate Crushing / Impact / LA Abrasion %",desc:"Calculate the mass percentage for fines or loss, according to the specified test.",formula:"Mass percentage = designated fines or lost mass ÷ original test-sample mass × 100",fields:[S("kind","Test","Crushing value",["Crushing value","Aggregate impact value","Los Angeles abrasion"],"Enter the appropriate mass for the selected method."),N("initial","Original sample mass (g)",3000,"",0),N("loss","Prescribed fines / abrasion loss mass (g)",550,"",0)],caution:"For ACV/AIV, use mass passing the specified sieve after the standard crushing/impact process; for LA abrasion, use the standard-defined loss from the abrasion procedure. Apparatus, sieve, charge and grading vary. The shared percentage arithmetic does not mean the tests are interchangeable."},
    { id:"sieve",cat:"Construction Materials",title:"Sieve Gradation / % Passing",desc:"Calculate cumulative retained and passing percentages from masses on individual sieves.",formula:"% retained = mass on sieve/total × 100; % passing = 100 − cumulative % retained",fields:[T("rows","Sieve (mm), retained mass (g) — one per line","20, 0\n10, 75\n4.75, 180\n2.36, 240\n1.18, 110\nPan, 45","List sieves in descending order, last row Pan.")],caution:"This provides arithmetic only. Grading limits, fineness modulus and aggregate-size classification depend on the correct IS sieve series, designated fractions and test standard."},
    { id:"cement",cat:"Construction Materials",title:"Cement: Standard Consistency Percentage",desc:"Calculate water added as a percentage of cement mass.",formula:"Water-to-cement mass (%) = water mass ÷ cement mass × 100",fields:[N("water","Water mass (g)",120,"",0),N("cement","Cement sample mass (g)",400,"",0)],caution:"The Vicat normal-consistency result also requires the proper penetration criterion and apparatus/procedure. This arithmetic alone does not establish standard consistency."},
    { id:"sound",cat:"Construction Materials",title:"Cement: Le Chatelier Expansion",desc:"Calculate simple gauge-point expansion from initial and final readings.",formula:"Expansion (mm) = final separation − initial separation",fields:[N("initial","Initial needle separation (mm)",3,"",0),N("final","Final needle separation (mm)",5,"",0)],caution:"Testing, heating cycle, specimen preparation and limits must comply with the relevant IS 4031 soundness procedure. This is only the reading difference."},
    { id:"moisture",cat:"Soil / Geotechnical",title:"Soil Moisture Content",desc:"Calculate gravimetric water content using tare, wet+tare and dry+tare weights.",formula:"w (%) = (wet+tin − dry+tin) ÷ (dry+tin − tin) × 100",fields:[N("tin","Empty container (g)",30,"",0),N("wet","Container + wet soil (g)",110,"",0),N("dry","Container + dried soil (g)",100,"",0)],caution:"Oven-drying temperature, duration and handling depend on soil and material type. This is the arithmetic step under the applicable IS 2720 procedure."},
    { id:"atterberg",cat:"Soil / Geotechnical",title:"Atterberg Plasticity Index",desc:"Calculate the plasticity index and check input consistency.",formula:"PI (%) = Liquid limit (%) − Plastic limit (%)",fields:[N("ll","Liquid limit LL (%)",45,"",0),N("pl","Plastic limit PL (%)",23,"",0)],caution:"An isolated PI does not fully classify soil or predict safe bearing capacity. LL and PL must be established by their proper laboratory procedures; NP soils need separate reporting."},
    { id:"spt",cat:"Soil / Geotechnical",title:"SPT N-Value From Penetration Blows",desc:"Sum the recorded blows for the second and third 150 mm penetration increments.",formula:"Uncorrected N = blows (150–300 mm) + blows (300–450 mm)",fields:[N("b1","First 150 mm (seating) blows",6,"Excluded from N.",0),N("b2","Second 150 mm blows",11,"",0),N("b3","Third 150 mm blows",14,"",0)],caution:"Only for a complete standard 450 mm penetration. Partial penetration, refusal, gravel obstruction and unusually high blows require proper field reporting. This is the uncorrected N: energy, overburden and dilatancy corrections are NOT applied."}
  ];
  const byId = Object.fromEntries(tests.map(x => [x.id, x]));
  const menu = document.getElementById("menu");
  const tool = document.getElementById("tool");
  const fmt = (v, d=3) => Number(v).toLocaleString("en-IN", {maximumFractionDigits:d,minimumFractionDigits:0});
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const mean = a => a.reduce((x,y)=>x+y,0)/a.length;
  const metric = (name, value) => ({ name, value });
  const failure = message => { throw new Error(message); };
  const positive = (v, name) => {if (!Number.isFinite(v) || v<=0) failure(name+" must be greater than zero.");return v;};
  function nums(text, name, minCount) {
    const raw=String(text).trim().split(/[,;\s]+/).filter(Boolean);
    const arr=raw.map(x=>Number(x));
    if(arr.length<(minCount||1) || arr.some(x=>!Number.isFinite(x)))failure("Enter valid numeric values for "+name+".");
    return arr;
  }
  function stats(a) {
    const m=mean(a),sd=a.length>1?Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1)):0;
    return {m,sd,min:Math.min(...a),max:Math.max(...a)};
  }
  function calc(id,v) {
    const m=[],notes=[],tables=[];
    let x,y,z,a,b,c,d,k,arr,s;
    switch(id) {
      case "upv":
        m.push(metric("Pulse velocity",fmt(positive(v.l,"Length")/positive(v.t,"Transit time"))+" km/s"));
        m.push(metric("Velocity",fmt(v.l/v.t*1000,1)+" m/s"));
        break;
      case "rebound":
        arr=nums(v.values,"rebound readings",2);
        if(arr.some(q=>q<0||q>100))failure("Rebound readings must be between 0 and 100 RN.");
        s=stats(arr);
        m.push(metric("Readings",arr.length),metric("Mean rebound number",fmt(s.m,2)+" RN"),metric("Sample standard deviation",fmt(s.sd,2)+" RN"),metric("Range",fmt(s.min)+"–"+fmt(s.max)+" RN"));
        break;
      case "halfcell":
        arr=nums(v.values,"half-cell potentials",1);
        if(arr.some(q=>q<-2000||q>2000))failure("Check potential values, expressed in mV.");
        s=stats(arr);
        m.push(metric("Mean vs CSE",fmt(s.m,1)+" mV"),metric("More positive than −200",arr.filter(q=>q>-200).length),metric("−350 to −200",arr.filter(q=>q>=-350&&q<=-200).length),metric("More negative than −350",arr.filter(q=>q<-350).length));
        notes.push("Counts are numerical bands only—not a statistically valid site corrosion probability.");
        break;
      case "surf":
        x=positive(v.a,"Probe spacing")/1000; y=positive(v.i,"Current");z=2*Math.PI*x*(v.v/y);
        m.push(metric("Resistance ΔV/I",fmt(v.v/y)+" Ω"),metric("Apparent surface resistivity",fmt(z)+" Ω·m"),metric("Equivalent",fmt(z*100)+" kΩ·cm"));
        break;
      case "carbon":
        arr=nums(v.values,"carbonation depths",1);
        if(arr.some(q=>q<0))failure("Carbonation depth cannot be negative.");
        x=positive(v.cover,"Concrete cover");
        s=stats(arr);m.push(metric("Mean carbonation depth",fmt(s.m)+" mm"),metric("Maximum depth",fmt(s.max)+" mm"),metric("Cover minus maximum depth",fmt(x-s.max)+" mm"),metric("Number of readings",arr.length));
        break;
      case "cover":
        arr=nums(v.values,"cover readings",1);
        if(arr.some(q=>q<0))failure("Cover readings cannot be negative.");
        s=stats(arr);
        m.push(metric("Mean cover",fmt(s.m)+" mm"),metric("Minimum cover",fmt(s.min)+" mm"),metric("Below reference",arr.filter(q=>q<v.nom).length+" of "+arr.length),metric("Mean minus reference",fmt(s.m-v.nom)+" mm"));
        break;
      case "core":
        x=positive(v.d,"Core diameter");y=positive(v.p,"Failure load");z=positive(v.l,"Core length");a=Math.PI*x*x/4;
        m.push(metric("Loaded area",fmt(a,1)+" mm²"),metric("Raw compressive stress",fmt(y*1000/a)+" MPa"),metric("L/D ratio",fmt(z/x)));
        break;
      case "wenner":
        x=positive(v.a,"Wenner spacing"); y=positive(v.i,"Current");a=2*Math.PI*x;
        m.push(metric("Array geometric factor K",fmt(a)+" m"),metric("Measured resistance",fmt(v.v/y)+" Ω"),metric("Apparent soil resistivity",fmt(a*v.v/y)+" Ω·m"));
        break;
      case "schl":
        x=positive(v.ab,"AB separation");y=positive(v.mn,"MN separation");z=positive(v.i,"Current");
        if(y>=x)failure("AB must be greater than MN for this symmetric array.");
        a=Math.PI*((x/2)**2-(y/2)**2)/y;
        m.push(metric("Geometric factor K",fmt(a)+" m"),metric("Measured resistance",fmt(v.v/z)+" Ω"),metric("Apparent resistivity",fmt(a*v.v/z)+" Ω·m"));
        break;
      case "dipole":
        x=positive(v.a,"Dipole length");y=positive(v.n,"Separation factor");z=positive(v.i,"Current");
        if(!Number.isInteger(y))failure("n must be a positive whole number.");
        a=Math.PI*x*y*(y+1)*(y+2);
        m.push(metric("Geometric factor K",fmt(a)+" m"),metric("Measured resistance",fmt(v.v/z)+" Ω"),metric("Apparent resistivity",fmt(a*v.v/z)+" Ω·m"));
        break;
      case "four":
        arr=[v.xa,v.xb,v.xm,v.xn];
        if(new Set(arr).size!==4)failure("All four electrode coordinates must be distinct.");
        x=1/Math.abs(v.xa-v.xm)-1/Math.abs(v.xb-v.xm)-1/Math.abs(v.xa-v.xn)+1/Math.abs(v.xb-v.xn);
        if(!Number.isFinite(x)||Math.abs(x)<1e-12)failure("Degenerate electrode geometry. Change coordinates.");
        k=2*Math.PI/Math.abs(x);
        m.push(metric("Geometric factor |K|",fmt(k)+" m"),metric("Measured |ΔV/I|",fmt(Math.abs(v.v)/positive(v.i,"Current"))+" Ω"),metric("Apparent resistivity magnitude",fmt(k*Math.abs(v.v)/v.i)+" Ω·m"));
        notes.push("The sign of the measured potential depends on electrode order and sign convention; this result intentionally displays magnitudes.");
        break;
      case "compress":
        x=positive(v.p,"Failure load");y=positive(v.b,"Loaded width");z=positive(v.l,"Loaded length");
        m.push(metric("Loaded area",fmt(y*z)+" mm²"),metric("Raw compressive stress",fmt(1000*x/(y*z))+" MPa"));
        break;
      case "flex":
        x=positive(v.p,"Load");y=positive(v.l,"Span");z=positive(v.b,"Width");a=positive(v.d,"Depth");
        m.push(metric("Third-point modulus of rupture",fmt(x*1000*y/(z*a*a))+" MPa"));
        break;
      case "steel":
        x=positive(v.d,"Diameter"); y=positive(v.py,"Yield load");z=positive(v.pu,"Ultimate load");a=positive(v.l0,"Initial gauge length");b=positive(v.lf,"Final gauge length");
        if(z<y)failure("Maximum force cannot be smaller than the yield/proof force.");
        if(b<a)failure("Final gauge length should not be shorter than initial gauge length.");
        c=Math.PI*x*x/4;
        m.push(metric("Nominal bar area",fmt(c,2)+" mm²"),metric("Nominal yield/proof stress",fmt(y*1000/c)+" MPa"),metric("Nominal UTS",fmt(z*1000/c)+" MPa"),metric("Total elongation",fmt(100*(b-a)/a)+" %"));
        break;
      case "absorb":
        x=positive(v.dry,"Dry mass");y=positive(v.wet,"Wet/SSD mass");
        if(y<x)failure("Wet/SSD mass cannot be less than dry mass for this calculation.");
        m.push(metric("Water mass absorbed",fmt(y-x)+" g"),metric("Absorption",fmt(100*(y-x)/x)+" %"));
        break;
      case "aggsg":
        a=positive(v.a,"Dry mass");b=positive(v.b,"SSD mass");c=positive(v.c,"Submerged mass");
        if(!(b>=a && c<a && c<b))failure("Check mass conditions: B ≥ A > C for the input definitions.");
        m.push(metric("Bulk relative density (OD)",fmt(a/(b-c))),metric("Bulk relative density (SSD)",fmt(b/(b-c))),metric("Apparent relative density",fmt(a/(a-c))),metric("Water absorption",fmt(100*(b-a)/a)+" %"));
        break;
      case "bulk":
        x=positive(v.m,"Net mass");y=positive(v.v,"Volume");
        m.push(metric("Bulk density",fmt(1000*x/y)+" kg/m³"),metric("Bulk density",fmt(x/y)+" g/cm³"));
        break;
      case "agg-loss":
        x=positive(v.initial,"Original mass");y=v.loss;
        if(y<0||y>x)failure("Fines/loss mass must be between zero and original mass.");
        m.push(metric(v.kind+" arithmetic",fmt(100*y/x)+" %"),metric("Mass retained after designated loss",fmt(x-y)+" g"));
        break;
      case "sieve":
        arr=String(v.rows).trim().split(/\r?\n/).map(q=>q.trim()).filter(Boolean);
        if(arr.length<2)failure("Enter at least two rows, including a Pan row.");
        let parsed=arr.map((q,i)=>{
          const parts=q.split(",");if(parts.length!==2)failure("Sieve row "+(i+1)+" must have 'sieve size, mass'.");
          const size=parts[0].trim();const mass=Number(parts[1].trim());
          if(!size||!Number.isFinite(mass)||mass<0)failure("Sieve row "+(i+1)+" contains an invalid size or mass.");
          return {size,mass};
        });
        if(parsed.at(-1).size.toLowerCase()!=="pan")failure("The last sieve row must be Pan.");
        for(let j=0;j<parsed.length-1;j++){if(!Number.isFinite(Number(parsed[j].size))||Number(parsed[j].size)<=0)failure("Use numeric sieve sizes before the Pan row.");if(j>0&&Number(parsed[j].size)>=Number(parsed[j-1].size))failure("Enter sieve sizes in descending order.");}
        x=parsed.reduce((sum,row)=>sum+row.mass,0);positive(x,"Total mass");
        let cumulative=0;
        let table="<table><thead><tr><th>Sieve</th><th>Mass retained</th><th>% retained</th><th>Cumulative %</th><th>% passing</th></tr></thead><tbody>";
        parsed.forEach(row=>{
          cumulative+=row.mass/x*100;
          table+="<tr><td>"+esc(row.size)+"</td><td>"+fmt(row.mass)+" g</td><td>"+fmt(row.mass/x*100,2)+"%</td><td>"+fmt(cumulative,2)+"%</td><td>"+fmt(Math.max(0,100-cumulative),2)+"%</td></tr>";
        });
        tables.push(table+"</tbody></table>");
        m.push(metric("Total sample mass",fmt(x)+" g"),metric("Recorded fractions",parsed.length));
        break;
      case "cement":
        x=positive(v.water,"Water mass");y=positive(v.cement,"Cement mass");
        m.push(metric("Water / cement",fmt(100*x/y)+" %"),metric("Water/cement mass ratio",fmt(x/y)));
        break;
      case "sound":
        if(v.final<v.initial)failure("Final separation cannot be smaller than initial separation in this expansion example.");
        m.push(metric("Le Chatelier expansion",fmt(v.final-v.initial)+" mm"));
        break;
      case "moisture":
        x=v.wet-v.dry;y=v.dry-v.tin;
        if(x<0||y<=0)failure("Verify that wet+container ≥ dry+container > empty container.");
        m.push(metric("Mass of water",fmt(x)+" g"),metric("Dry soil mass",fmt(y)+" g"),metric("Moisture content",fmt(100*x/y)+" %"));
        break;
      case "atterberg":
        if(v.ll<v.pl)failure("Liquid limit should not be below plastic limit; check measurements.");
        m.push(metric("Liquid limit",fmt(v.ll)+" %"),metric("Plastic limit",fmt(v.pl)+" %"),metric("Plasticity index",fmt(v.ll-v.pl)+" %"));
        break;
      case "spt":
        if([v.b1,v.b2,v.b3].some(q=>!Number.isInteger(q)||q<0))failure("SPT blows must be non-negative whole numbers.");
        m.push(metric("Seating blows (0–150 mm)",v.b1),metric("Uncorrected N-value",v.b2+v.b3+" blows"),metric("Total recorded blows",v.b1+v.b2+v.b3));
        break;
      default: failure("Unknown calculator.");
    }
    return {metrics:m,notes,tables};
  }
  function initMenu() {
    const categories=[...new Set(tests.map(x=>x.cat))];
    menu.innerHTML="";
    categories.forEach(cat=>{
      const head=document.createElement("div");head.className="category";head.textContent=cat;menu.append(head);
      tests.filter(t=>t.cat===cat).forEach(t=>{
        const el=document.createElement("button");el.type="button";el.className="navbutton";el.dataset.id=t.id;el.textContent=t.title;el.onclick=()=>{location.hash=t.id;show(t.id);document.getElementById("tool").scrollIntoView({behavior:"smooth",block:"start"});};menu.append(el);
      });
    });
  }
  function fieldMarkup(field) {
    const label="<label for='field-"+esc(field.id)+"'>"+esc(field.label)+"</label>";
    const tip=field.help?"<div class='hint'>"+esc(field.help)+"</div>":"";
    const wide=field.kind==="text"?"wide":"";
    let ctrl="";
    if(field.kind==="text")ctrl="<textarea spellcheck='false' id='field-"+esc(field.id)+"'>"+esc(field.value)+"</textarea>";
    else if(field.kind==="select")ctrl="<select id='field-"+esc(field.id)+"'>"+field.choices.map(z=>"<option"+(z===field.value?" selected":"")+">"+esc(z)+"</option>").join("")+"</select>";
    else ctrl="<input type='number' step='any' id='field-"+esc(field.id)+"' value='"+esc(field.value)+"'"+(field.min!==null?" min='"+esc(field.min)+"'":"")+">";
    return "<div class='"+wide+"'>"+label+ctrl+tip+"</div>";
  }
  function show(id) {
    const t=byId[id]||tests[0];if(id!==t.id)location.hash=t.id;
    document.querySelectorAll(".navbutton").forEach(b=>b.classList.toggle("active",b.dataset.id===t.id));
    tool.innerHTML="<div class='tag'>"+esc(t.cat)+"</div><h2>"+esc(t.title)+"</h2><p class='sub'>"+esc(t.desc)+"</p><p><strong>Formula:</strong> "+esc(t.formula)+"</p><div class='formgrid'>"+t.fields.map(fieldMarkup).join("")+"</div><button class='calc' type='button' id='run'>Calculate</button><div id='results' class='output' aria-live='polite'>Enter the measured readings and select Calculate.</div><div class='notice'><strong>Test limitation:</strong> "+esc(t.caution)+"</div>";
    document.getElementById("run").onclick=()=>run(t);
    run(t);
  }
  function run(t) {
    const target=document.getElementById("results");
    try {
      const inputs={};
      t.fields.forEach(f=>{
        let value=document.getElementById("field-"+f.id).value;
        if(f.kind==="number"){if(value.trim()==="")failure("Enter "+f.label+".");value=Number(value);if(!Number.isFinite(value))failure("Enter a valid number for "+f.label+".");if(f.min!==null&&value<f.min)failure(f.label+" is below the permitted entry range.");}
        inputs[f.id]=value;
      });
      const result=calc(t.id,inputs);
      target.innerHTML="<h3>Calculated results</h3><div class='metrics'>"+result.metrics.map(m=>"<div class='metric'><small>"+esc(m.name)+"</small><b>"+esc(m.value)+"</b></div>").join("")+"</div>"+result.tables.map(t=>"<div class='scroll' style='margin-top:15px'>"+t+"</div>").join("")+result.notes.map(q=>"<div class='notes'>"+esc(q)+"</div>").join("");
    } catch(e) {target.innerHTML="<div class='error'>"+esc(e.message)+"</div>";}
  }
  initMenu();
  const wanted=location.hash.replace("#","");
  show(byId[wanted]?wanted:tests[0].id);
  window.addEventListener("hashchange",()=>{const id=location.hash.replace("#","");if(byId[id])show(id);});
  window.GTSMCalculator={calculate:calc,tests:tests.map(t=>({id:t.id,title:t.title,cat:t.cat}))};
})();