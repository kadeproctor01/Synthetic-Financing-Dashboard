:root {
  --ink: #18201f;
  --muted: #64706d;
  --line: #d7ddda;
  --surface: #f7f8f6;
  --panel: #ffffff;
  --accent: #1f766d;
  --accent-strong: #14544d;
  --danger: #9f2f2f;
  --warning: #8b6b18;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--surface);
  color: var(--ink);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input {
  font: inherit;
}

.shell {
  min-height: 100svh;
  padding: 24px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
}

.inputPanel,
.results {
  background: var(--panel);
  border: 1px solid var(--line);
}

.inputPanel {
  min-height: calc(100svh - 48px);
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
}

.results {
  min-height: calc(100svh - 48px);
  padding: 28px;
  overflow: hidden;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  font-size: 36px;
  line-height: 1.05;
}

h2 {
  font-size: 20px;
}

.subtle {
  color: var(--muted);
  line-height: 1.5;
}

.form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 7px;
  color: #35413f;
  font-size: 13px;
  font-weight: 700;
}

input {
  width: 100%;
  border: 1px solid var(--line);
  background: #fbfcfb;
  color: var(--ink);
  padding: 12px 11px;
  outline: none;
}

input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(31, 118, 109, 0.15);
}

button {
  border: 0;
  background: var(--accent);
  color: white;
  padding: 13px 16px;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: 0.62;
  cursor: wait;
}

.method {
  border-top: 1px solid var(--line);
  padding-top: 20px;
}

.method p {
  margin-bottom: 0;
}

.empty {
  min-height: calc(100svh - 106px);
  display: grid;
  align-content: center;
  justify-items: start;
}

.statusRow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}

.statusRow span {
  border: 1px solid var(--line);
  padding: 7px 9px;
  color: var(--muted);
  font-size: 12px;
}

.selected {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
  gap: 28px;
  padding-bottom: 26px;
  border-bottom: 1px solid var(--line);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  border-left: 3px solid var(--accent);
  padding: 8px 0 8px 12px;
}

.metric span {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

.metric strong {
  display: block;
  margin-top: 5px;
  font-size: 18px;
}

.tableWrap {
  margin-top: 26px;
  overflow-x: auto;
}

.tableHeader {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 12px;
}

.tableHeader span {
  color: var(--muted);
  font-size: 13px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th,
td {
  text-align: left;
  border-bottom: 1px solid var(--line);
  padding: 12px 10px;
  font-size: 13px;
  white-space: nowrap;
}

th {
  color: var(--muted);
  font-weight: 700;
}

.pill {
  display: inline-flex;
  min-width: 72px;
  justify-content: center;
  padding: 5px 8px;
  border: 1px solid var(--line);
  font-size: 11px;
  font-weight: 700;
}

.pill.valid {
  color: var(--accent-strong);
  border-color: rgba(31, 118, 109, 0.45);
}

.pill.warning,
.pill.stale {
  color: var(--warning);
  border-color: rgba(139, 107, 24, 0.45);
}

.pill.invalid,
.banner.danger {
  color: var(--danger);
  border-color: rgba(159, 47, 47, 0.45);
}

.banner {
  border: 1px solid var(--line);
  padding: 12px;
  margin-bottom: 18px;
  font-weight: 700;
}

.legGrid {
  margin-top: 26px;
  display: grid;
  gap: 10px;
}

.leg {
  display: grid;
  grid-template-columns: 64px 70px 1fr 80px;
  gap: 8px;
  align-items: center;
  border-bottom: 1px solid var(--line);
  padding: 10px 0;
  font-size: 13px;
}

@media (max-width: 920px) {
  .shell {
    padding: 12px;
  }

  .workspace,
  .selected {
    grid-template-columns: 1fr;
  }

  .inputPanel,
  .results {
    min-height: auto;
  }

  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  h1 {
    font-size: 30px;
  }

  .metrics {
    grid-template-columns: 1fr;
  }
}
