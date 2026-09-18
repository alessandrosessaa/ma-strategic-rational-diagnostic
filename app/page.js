"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ma-rationale-diagnostic-v1";

const DIMENSIONS = [
  {
    id: "strategicFit",
    name: "Strategic fit",
    short: "Fit",
    description: "Does the transaction clearly advance the buyer's strategy?",
    statements: [
      "The deal directly supports a stated strategic priority.",
      "The target adds capabilities, customers, markets or assets that the buyer genuinely needs.",
      "The strategic logic is specific enough to explain why this target is preferable to a broad ambition."
    ],
    objective: "Validate a target that fills the clearly identified strategic gap."
  },
  {
    id: "valueCreation",
    name: "Value creation logic",
    short: "Value",
    description: "Is there a credible, evidence-backed path to economic value?",
    statements: [
      "The sources of value (for example, cost, revenue, capability or capital synergies) are explicit.",
      "The logic explains who will deliver the value, when, and through which actions.",
      "The expected value has been tested against execution costs, integration needs and the likely price paid."
    ],
    objective: "Prioritise a target with measurable value levers and a credible delivery path."
  },
  {
    id: "alternatives",
    name: "Alternatives considered",
    short: "Options",
    description: "Has acquisition been compared fairly with realistic alternatives?",
    statements: [
      "Build, partner, invest and do-nothing options have been considered where relevant.",
      "Acquisition offers a defensible advantage over the best alternative.",
      "The selected route is not being justified mainly by momentum, habit or executive preference."
    ],
    objective: "Show that acquiring the target beats the best realistic build, partner or wait option."
  },
  {
    id: "timing",
    name: "Timing & market context",
    short: "Timing",
    description: "Is this the right moment, given the market and the buyer's readiness?",
    statements: [
      "The market window, competitive dynamics and target availability are understood.",
      "The buyer has the organisational and financial capacity to act now.",
      "The rationale would remain coherent if timing or market conditions changed moderately."
    ],
    objective: "Select a target and timing that match market conditions and the buyer's readiness."
  },
  {
    id: "sponsorship",
    name: "Executive sponsorship & alignment",
    short: "Alignment",
    description: "Are the people needed to make the deal work aligned behind it?",
    statements: [
      "The executive sponsor has clear accountability and authority.",
      "Key business, finance and integration leaders share the same rationale and priorities.",
      "Important disagreements, incentives or resource conflicts have been surfaced and addressed."
    ],
    objective: "Confirm accountable executive sponsorship and cross-functional alignment before selecting a target."
  },
  {
    id: "risk",
    name: "Risk to thesis",
    short: "Risk",
    description: "Have the assumptions that could break the rationale been identified and tested?",
    statements: [
      "The few assumptions that matter most to the thesis are explicit.",
      "Evidence has been gathered to test those assumptions rather than merely restate them.",
      "There is a credible mitigation, contingency or walk-away response for material downside risks."
    ],
    objective: "Use target screening to test the assumptions that could invalidate the investment thesis."
  }
];

function blankDimension() {
  return { weight: 5, ratings: [3, 3, 3], notes: "", unmet: false, condition: "" };
}

function newDeal(index = 1) {
  return {
    id: crypto.randomUUID(),
    name: `Candidate deal ${index}`,
    company: "",
    trigger: "",
    updatedAt: new Date().toISOString(),
    dimensions: Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.id, blankDimension()]))
  };
}

function scoreDimension(data) {
  return data.ratings.reduce((sum, rating) => sum + Number(rating), 0) / data.ratings.length;
}

function analysis(deal) {
  const details = DIMENSIONS.map((dimension) => {
    const data = deal.dimensions[dimension.id];
    return { dimension, data, score: scoreDimension(data) };
  });
  const totalWeight = details.reduce((sum, item) => sum + Number(item.data.weight), 0);
  const weighted = totalWeight
    ? details.reduce((sum, item) => sum + item.score * Number(item.data.weight), 0) / totalWeight
    : 0;
  const weak = [...details].sort((a, b) => a.score - b.score).filter((item) => item.score < 3.5);
  const strongest = [...details].sort((a, b) => b.score * Number(b.data.weight) - a.score * Number(a.data.weight)).slice(0, 3);
  const dealbreakers = details.filter((item) => item.data.unmet);
  return { details, weighted, weak, strongest, dealbreakers };
}

function labelFor(score) {
  if (score >= 4.25) return "Well-supported";
  if (score >= 3.5) return "Promising, but test further";
  if (score >= 2.5) return "Partly supported";
  return "Weakly supported";
}

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [ready, setReady] = useState(false);
  const importRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.deals?.length) {
        setDeals(saved.deals);
        setActiveId(saved.activeId || saved.deals[0].id);
        setCompareIds(saved.compareIds || []);
      } else {
        const first = newDeal();
        setDeals([first]);
        setActiveId(first.id);
      }
    } catch {
      const first = newDeal();
      setDeals([first]);
      setActiveId(first.id);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && deals.length) localStorage.setItem(STORAGE_KEY, JSON.stringify({ deals, activeId, compareIds }));
  }, [deals, activeId, compareIds, ready]);

  const active = deals.find((deal) => deal.id === activeId) || deals[0];
  const result = useMemo(() => (active ? analysis(active) : null), [active]);
  const compared = deals.filter((deal) => compareIds.includes(deal.id));

  function updateDeal(change) {
    setDeals((current) => current.map((deal) => deal.id === active.id ? { ...deal, ...change, updatedAt: new Date().toISOString() } : deal));
  }

  function updateDimension(id, change) {
    updateDeal({ dimensions: { ...active.dimensions, [id]: { ...active.dimensions[id], ...change } } });
  }

  function addDeal() {
    const deal = newDeal(deals.length + 1);
    setDeals((current) => [...current, deal]);
    setActiveId(deal.id);
  }

  function duplicateDeal() {
    const copy = structuredClone(active);
    copy.id = crypto.randomUUID();
    copy.name = `${active.name} — copy`;
    copy.updatedAt = new Date().toISOString();
    setDeals((current) => [...current, copy]);
    setActiveId(copy.id);
  }

  function deleteDeal() {
    if (deals.length === 1 || !window.confirm(`Delete “${active.name}”? This cannot be undone.`)) return;
    const remaining = deals.filter((deal) => deal.id !== active.id);
    setDeals(remaining);
    setActiveId(remaining[0].id);
    setCompareIds((current) => current.filter((id) => id !== active.id));
  }

  function toggleCompare(id) {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ deals, activeId, compareIds }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ma-rationale-diagnostic.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.deals) || !data.deals.length) throw new Error();
        setDeals(data.deals);
        setActiveId(data.activeId || data.deals[0].id);
        setCompareIds(data.compareIds || []);
      } catch { window.alert("That file is not a valid diagnostic export."); }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  if (!ready || !active || !result) return <main className="loading">Loading your diagnostic…</main>;

  return (
    <main>
      <header className="hero">
        <div><p className="eyebrow">M&A decision tool</p><h1>Strategic Rationale<br /><em>Diagnostic</em></h1></div>
        <p className="hero-copy">Test how coherent and well-supported a deal rationale is. This is not a prediction of whether the transaction will succeed.</p>
      </header>

      <nav className="deal-nav" aria-label="Candidate deals">
        <div className="tabs">{deals.map((deal) => <button key={deal.id} onClick={() => setActiveId(deal.id)} className={deal.id === active.id ? "tab active" : "tab"}>{deal.name}</button>)}</div>
        <button className="button ghost" onClick={addDeal}>+ New candidate</button>
      </nav>

      <section className="intro-grid">
        <div className="card identity-card">
          <label>Candidate deal name<input value={active.name} onChange={(event) => updateDeal({ name: event.target.value })} placeholder="e.g. Project Atlas" /></label>
          <label>Buyer / target (optional)<input value={active.company} onChange={(event) => updateDeal({ company: event.target.value })} placeholder="e.g. Acquirer → Target" /></label>
          <label>Business context or trigger<textarea value={active.trigger} onChange={(event) => updateDeal({ trigger: event.target.value })} placeholder="What changed? What opportunity or problem has triggered this discussion?" /></label>
          <div className="actions"><button className="text-button" onClick={duplicateDeal}>Duplicate</button><button className="text-button danger" onClick={deleteDeal}>Delete</button></div>
        </div>
        <ScoreCard result={result} />
      </section>

      {result.dealbreakers.length > 0 && <section className="dealbreaker"><strong>Potential dealbreaker{result.dealbreakers.length > 1 ? "s" : ""}:</strong> {result.dealbreakers.map((item) => <span key={item.dimension.id}> {item.dimension.name}{item.data.condition ? ` — ${item.data.condition}` : ""}.</span>)}</section>}

      <section className="section-heading"><p className="eyebrow">The six lenses</p><h2>Rate each statement, then give the dimension the weight it deserves.</h2><p>1 = unsupported or incoherent · 3 = partly supported · 5 = strongly evidenced and coherent</p></section>
      <section className="dimensions">{DIMENSIONS.map((dimension) => <DimensionCard key={dimension.id} dimension={dimension} data={active.dimensions[dimension.id]} score={result.details.find((item) => item.dimension.id === dimension.id).score} onChange={(change) => updateDimension(dimension.id, change)} />)}</section>

      <section className="outcomes">
        <div className="card feedback"><p className="eyebrow">What needs attention</p><h2>Plain-language feedback</h2>{result.weak.length ? <ul>{result.weak.map((item) => <li key={item.dimension.id}><strong>{item.dimension.name} ({item.score.toFixed(1)}/5):</strong> {feedback(item)}</li>)}</ul> : <p className="positive">All dimensions are at least reasonably supported. Focus next on testing the stated assumptions and keeping the evidence current.</p>}</div>
        <div className="card objectives"><p className="eyebrow">Target-screening objectives</p><h2>What the eventual target must prove</h2><ol>{result.strongest.map((item) => <li key={item.dimension.id}>{item.dimension.objective}</li>)}</ol></div>
      </section>

      <section className="comparison card"><div><p className="eyebrow">Candidate comparison</p><h2>Compare deals side by side</h2><p>Select two or more candidates. The same scoring framework makes trade-offs visible.</p></div><div className="compare-picker">{deals.map((deal) => <label key={deal.id} className="check"><input type="checkbox" checked={compareIds.includes(deal.id)} onChange={() => toggleCompare(deal.id)} /> {deal.name}</label>)}</div>{compared.length >= 2 && <Comparison deals={compared} />}</section>

      <footer><button className="button ghost" onClick={exportData}>Export analyses</button><button className="button ghost" onClick={() => importRef.current?.click()}>Import analyses</button><input ref={importRef} className="visually-hidden" type="file" accept="application/json" onChange={importData} /><span>Saved automatically in this browser.</span></footer>
    </main>
  );
}

function ScoreCard({ result }) {
  return <aside className="score-card"><p className="eyebrow">Rationale strength</p><div className="score-number">{result.weighted.toFixed(1)}<span>/5</span></div><strong>{labelFor(result.weighted)}</strong><p>Weighted by your priorities. A flagged condition remains a concern regardless of this score.</p><div className="mini-bars">{result.details.map((item) => <div key={item.dimension.id}><span>{item.dimension.short}</span><i><b style={{ width: `${item.score * 20}%` }} /></i><em>{item.score.toFixed(1)}</em></div>)}</div></aside>;
}

function DimensionCard({ dimension, data, score, onChange }) {
  return <article className="dimension-card"><div className="dimension-top"><div><p className="eyebrow">{dimension.name}</p><p>{dimension.description}</p></div><div className="dimension-score">{score.toFixed(1)}<span>/5</span></div></div><label className="weight">Relative importance <output>{data.weight}/10</output><input type="range" min="0" max="10" value={data.weight} onChange={(event) => onChange({ weight: Number(event.target.value) })} /></label><div className="statements">{dimension.statements.map((statement, index) => <div className="statement" key={statement}><p>{statement}</p><div className="rating" aria-label={`Rating for ${statement}`}>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} onClick={() => { const ratings = [...data.ratings]; ratings[index] = rating; onChange({ ratings }); }} className={data.ratings[index] === rating ? "selected" : ""}>{rating}</button>)}</div></div>)}</div><label>Evidence, supporting facts or doubts<textarea value={data.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="What evidence supports this? What remains uncertain?" /></label><div className={data.unmet ? "condition active" : "condition"}><label className="check"><input type="checkbox" checked={data.unmet} onChange={(event) => onChange({ unmet: event.target.checked })} /> An essential condition or assumption is unmet</label>{data.unmet && <input value={data.condition} onChange={(event) => onChange({ condition: event.target.value })} placeholder="State the condition that could stop the deal" />}</div></article>;
}

function feedback(item) {
  const examples = {
    strategicFit: "The link from transaction to strategy is still too general. Name the capability or market gap and why this target uniquely addresses it.",
    valueCreation: "The value story needs a more practical bridge from claimed synergies to owners, timing, costs and the price being paid.",
    alternatives: "The acquisition case has not yet clearly beaten realistic options such as building, partnering, investing or waiting.",
    timing: "Test whether the market window and the buyer's financial and organisational readiness genuinely support acting now.",
    sponsorship: "Clarify who owns the outcome and resolve any misalignment among the leaders needed to fund and execute the transaction.",
    risk: "Make the assumptions that could invalidate the thesis explicit, then gather evidence and define a response if they fail."
  };
  return examples[item.dimension.id];
}

function Comparison({ deals }) {
  return <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Rationale strength</th>{DIMENSIONS.map((dimension) => <th key={dimension.id}>{dimension.short}</th>)}<th>Flags</th></tr></thead><tbody>{deals.map((deal) => { const result = analysis(deal); return <tr key={deal.id}><th>{deal.name}</th><td><strong>{result.weighted.toFixed(1)}/5</strong><br /><small>{labelFor(result.weighted)}</small></td>{result.details.map((item) => <td key={item.dimension.id}>{item.score.toFixed(1)}</td>)}<td>{result.dealbreakers.length ? `${result.dealbreakers.length} flagged` : "None"}</td></tr>; })}</tbody></table></div>;
}
