import type { EvaluationReport } from "../types"

export function generateHtmlReport(report: EvaluationReport): string {
  const metricCard = (label: string, value: number, suffix = "%") => {
    const pct = (value * 100).toFixed(1)
    const color = value >= 0.8 ? "oklch(0.65 0.18 145)" : value >= 0.5 ? "oklch(0.7 0.18 80)" : "oklch(0.65 0.22 25)"
    return `<div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;border:1px solid #334155">
      <p style="color:#94a3b8;font-size:11px;margin:0 0 4px 0">${label}</p>
      <p style="color:${color};font-size:24px;font-weight:bold;margin:0;font-family:monospace">${pct}${suffix}</p>
    </div>`
  }

  const metricRow = (label: string, value: number) => {
    const pct = (value * 100).toFixed(1)
    const w = (value * 100).toFixed(0)
    return `<tr><td style="padding:6px 12px;color:#e2e8f0;font-size:12px">${label}</td>
      <td style="padding:6px 12px;text-align:right">
        <div style="background:#334155;border-radius:4px;height:8px;width:120px;display:inline-block;overflow:hidden">
          <div style="background:${value >= 0.8 ? '#22c55e' : value >= 0.5 ? '#eab308' : '#ef4444'};height:100%;width:${w}%;border-radius:4px"></div>
        </div>
        <span style="color:#e2e8f0;font-family:monospace;font-size:12px;margin-left:8px">${pct}%</span>
      </td></tr>`
  }

  const catRows = Object.entries(report.by_category).map(([cat, c]) =>
    `<tr><td style="padding:4px 12px;color:#e2e8f0;font-size:12px;text-transform:capitalize">${cat}</td>
      <td style="padding:4px 12px;color:#94a3b8;font-size:12px;text-align:center">${c.count}</td>
      <td style="padding:4px 12px;text-align:right;color:#e2e8f0;font-size:12px;font-family:monospace">${(c.overall * 100).toFixed(1)}%</td></tr>`
  ).join("")

  const diffRows = Object.entries(report.by_difficulty).map(([d, c]) =>
    `<tr><td style="padding:4px 12px;color:#e2e8f0;font-size:12px;text-transform:capitalize">${d}</td>
      <td style="padding:4px 12px;color:#94a3b8;font-size:12px;text-align:center">${c.count}</td>
      <td style="padding:4px 12px;text-align:right;color:#e2e8f0;font-size:12px;font-family:monospace">${(c.overall * 100).toFixed(1)}%</td></tr>`
  ).join("")

  const regressionRows = report.regressions.map((r) =>
    `<tr><td style="padding:4px 12px;color:#e2e8f0;font-size:11px">${r.question.slice(0, 60)}…</td>
      <td style="padding:4px 12px;color:#94a3b8;font-size:11px">${r.metric}</td>
      <td style="padding:4px 12px;text-align:right;color:#ef4444;font-size:11px;font-family:monospace">${(r.previous * 100).toFixed(1)}% → ${(r.current * 100).toFixed(1)}%</td></tr>`
  ).join("")

  const questionRows = report.results.map((r) =>
    `<div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid #334155">
      <p style="color:#e2e8f0;font-size:12px;font-weight:500;margin:0 0 6px 0">${r.question}</p>
      <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap">
        <span style="background:#334155;color:#94a3b8;padding:2px 8px;border-radius:4px;font-size:10px">${r.difficulty}</span>
        <span style="background:#334155;color:#94a3b8;padding:2px 8px;border-radius:4px;font-size:10px">${r.category}</span>
        <span style="background:#334155;color:#94a3b8;padding:2px 8px;border-radius:4px;font-size:10px">${r.latency_ms}ms</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px">
        ${["faithfulness","answer_relevance","citation_accuracy","context_recall","overall"].map((m) => {
          const v = r[m as keyof typeof r] as number
          const pct = (v * 100).toFixed(0)
          return `<div style="text-align:center">
            <div style="background:#0f172a;border-radius:4px;height:4px;overflow:hidden">
              <div style="background:${v >= 0.8 ? '#22c55e' : v >= 0.5 ? '#eab308' : '#ef4444'};height:100%;width:${pct}%;border-radius:4px"></div>
            </div>
            <p style="color:#64748b;font-size:8px;margin:2px 0 0 0;text-transform:capitalize">${m.replace("_"," ")}</p>
            <p style="color:#e2e8f0;font-size:10px;margin:0;font-family:monospace">${pct}%</p>
          </div>`
        }).join("")}
      </div>
      <p style="color:#94a3b8;font-size:10px;margin:6px 0 0 0;line-height:1.4">${r.answer.slice(0, 200)}</p>
    </div>`
  ).join("")

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>RAG Evaluation Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
body{background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:24px}
*{box-sizing:border-box}
@media print{body{padding:0}}
</style>
</head><body>
<div style="max-width:960px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
    <div><h1 style="font-size:20px;margin:0">RAG Evaluation Report</h1>
      <p style="color:#94a3b8;font-size:12px;margin:4px 0 0 0">${report.system} · ${report.model} · ${new Date(report.timestamp).toLocaleString()} · ${report.total_questions} questions</p></div>
    <div style="color:#64748b;font-size:28px">📊</div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:24px">
    ${metricCard("Faithfulness", report.aggregate.faithfulness)}
    ${metricCard("Answer Relevance", report.aggregate.answer_relevance)}
    ${metricCard("Numerical Accuracy", report.aggregate.numerical_accuracy)}
    ${metricCard("Citation Accuracy", report.aggregate.citation_accuracy)}
    ${metricCard("Context Recall", report.aggregate.context_recall)}
    ${metricCard("Overall", report.aggregate.overall)}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
    <div style="background:#1e293b;border-radius:12px;padding:16px;border:1px solid #334155">
      <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 12px 0">Radar · Metrics</p>
      <canvas id="radarChart" style="max-height:240px"></canvas>
    </div>
    <div style="background:#1e293b;border-radius:12px;padding:16px;border:1px solid #334155">
      <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 12px 0">Hero Stats</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="text-align:center"><p style="color:#64748b;font-size:10px;margin:0">Avg Latency</p><p style="color:#e2e8f0;font-size:18px;font-weight:bold;font-family:monospace;margin:4px 0">${report.aggregate.avg_latency_ms.toFixed(0)}ms</p></div>
        <div style="text-align:center"><p style="color:#64748b;font-size:10px;margin:0">Regressions</p><p style="color:#e2e8f0;font-size:18px;font-weight:bold;font-family:monospace;margin:4px 0">${report.regressions.length}</p></div>
        <div style="text-align:center"><p style="color:#64748b;font-size:10px;margin:0">Questions</p><p style="color:#e2e8f0;font-size:18px;font-weight:bold;font-family:monospace;margin:4px 0">${report.total_questions}</p></div>
        <div style="text-align:center"><p style="color:#64748b;font-size:10px;margin:0">Pass Rate</p><p style="color:#e2e8f0;font-size:18px;font-weight:bold;font-family:monospace;margin:4px 0">${(report.results.filter((r) => r.overall >= 0.7).length / report.total_questions * 100).toFixed(0)}%</p></div>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
    <div style="background:#1e293b;border-radius:12px;padding:16px;border:1px solid #334155">
      <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 8px 0">By Category</p>
      <table style="width:100%;border-collapse:collapse">${catRows}</table>
    </div>
    <div style="background:#1e293b;border-radius:12px;padding:16px;border:1px solid #334155">
      <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 8px 0">By Difficulty</p>
      <table style="width:100%;border-collapse:collapse">${diffRows}</table>
    </div>
  </div>

  ${report.regressions.length > 0 ? `
  <div style="background:#450a0a;border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid #7f1d1d">
    <p style="color:#fca5a5;font-size:13px;font-weight:500;margin:0 0 8px 0">🔴 Regressions (threshold: 10%)</p>
    <table style="width:100%;border-collapse:collapse">${regressionRows}</table>
  </div>` : ""}

  <div style="margin-bottom:24px">
    <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 12px 0">Per-Question Details</p>
    ${questionRows}
  </div>
</div>
<script>
new Chart(document.getElementById('radarChart'), {
  type:'radar',
  data:{labels:['Faithfulness','Answer Relevance','Numerical Accuracy','Citation Accuracy','Context Recall','Overall'],
    datasets:[{data:[${(report.aggregate.faithfulness*100).toFixed(1)},${(report.aggregate.answer_relevance*100).toFixed(1)},${(report.aggregate.numerical_accuracy*100).toFixed(1)},${(report.aggregate.citation_accuracy*100).toFixed(1)},${(report.aggregate.context_recall*100).toFixed(1)},${(report.aggregate.overall*100).toFixed(1)}],
      backgroundColor:'rgba(59,130,246,0.15)',borderColor:'rgba(59,130,246,0.8)',borderWidth:2,pointBackgroundColor:'#3b82f6',pointRadius:3}]},
  options:{plugins:{legend:{display:false}},scales:{r:{angleLines:{color:'#334155'},grid:{color:'#334155'},pointLabels:{color:'#94a3b8',font:{size:10}},ticks:{color:'#64748b',font:{size:9},backdropColor:'transparent',stepSize:20,callback:v=>v+'%'}},startAngle:90}}
})
</script>
</body></html>`
}
