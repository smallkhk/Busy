import { clockParts, formatNaira } from '../engine/clock';
import { admissible, CLASSES, cgpaOf, degreeClass, gradPay, LECTURES_PER_LEVEL, levelName, MAX_STUDY, NO_SCHOOL, PASS_GP, programmeById, PROGRAMMES, RUNS_COST } from '../content/school';
import { useGame } from '../store/game';

/** UniAbuja student portal: JAMB result, admission list, fees, lectures, results and your certificate. */
export function SchoolApp() {
  const sc = useGame((s) => s.school ?? NO_SCHOOL);
  const money = useGame((s) => s.money);
  const day = useGame((s) => clockParts(s.time).day);
  const g = useGame.getState();
  const p = programmeById(sc.programme);
  const go = () => g.headTo('uniabuja');
  const cgpa = cgpaOf(sc.results);

  // Graduated: certificate
  if (sc.graduated && p) {
    const cls = degreeClass(sc.graduated.cgpa);
    return (
      <>
        <div className="balance school-cert">
          <div className="muted small">University of Abuja certifies that</div>
          <div className="school-title">🎓 {p.name}</div>
          <div>{cls.name} · CGPA {sc.graduated.cgpa.toFixed(2)}</div>
        </div>
        <p className="small">💼 Your graduate job: <b>{p.job.label}</b> pays {formatNaira(gradPay(p.job.pay, sc))} for {cls.name}. Find am for Jobs app. The bank graduate trainee job don open too.</p>
      </>
    );
  }

  // Not admitted yet: JAMB and the admission list
  if (!p) {
    const can = admissible(sc.jamb);
    return (
      <>
        <div className="balance">
          <div className="muted small">JAMB (UTME) score</div>
          <div className="school-title">{sc.jamb ? `${sc.jamb} / 400` : 'Never write am'}</div>
          <div className="muted small">Write JAMB for the CBT centre at UniAbuja admin block. Higher CV (lectures, reading, courses) = better score.</div>
          <button className="primary" style={{ marginTop: 8, width: '100%' }} onClick={go}>🧭 Waka go UniAbuja</button>
        </div>
        <div className="love-section">📋 Admission list (cut-off marks)</div>
        <div className="list">
          {PROGRAMMES.map((x) => {
            const ok = can.some((c) => c.id === x.id);
            return (
              <div key={x.id} className="contact">
                <div className="contact-head">
                  <span className="contact-emoji">{x.emoji}</span>
                  <span className="action-body">
                    <span>{x.name}</span>
                    <span className="muted small">Cut-off {x.cutoff} · {x.years} years · {formatNaira(x.fees)}/session</span>
                    <span className="small">After: {x.job.label.replace(/ \(.*\)$/, '')} · ~{formatNaira(x.job.pay)}</span>
                  </span>
                </div>
                <button className={ok ? 'primary' : 'ghost'} disabled={!ok} onClick={() => g.admit(x.id)}>
                  {ok ? '✅ Accept admission' : sc.jamb ? `Need ${x.cutoff - (sc.jamb ?? 0)} more marks` : 'Write JAMB first'}
                </button>
              </div>
            );
          })}
        </div>
        {sc.jamb !== undefined && (
          <button className="ghost" style={{ width: '100%' }} disabled={money < RUNS_COST} onClick={g.sortAdmission}>
            🤫 "Sort" admission with connection · {formatNaira(RUNS_COST)} (e fit be scam o)
          </button>
        )}
      </>
    );
  }

  // Student
  const strike = sc.strikeUntil !== undefined && day <= sc.strikeUntil;
  return (
    <>
      <div className="balance">
        <div className="muted small">{p.emoji} {p.name}</div>
        <div className="school-title">{sc.finalist ? 'Final year done 🎉' : `${levelName(sc.level)} of ${p.years * 100}L`}</div>
        <div className="muted small">CGPA {cgpa.toFixed(2)} · on track for {degreeClass(cgpa).name}</div>
        {strike && <div className="small school-strike">✊🏾 ASUU strike till Day {sc.strikeUntil}. No lectures or exams. Library dey open.</div>}
      </div>

      {sc.finalist ? (
        <p className="small">🎓 Go UniAbuja admin block for <b>Convocation</b> to collect your degree.</p>
      ) : (
        <div className="list">
          <div className="contact">
            <span>💳 School fees ({levelName(sc.level)})</span>
            {sc.feesPaid ? (
              <span className="muted small">✅ Paid</span>
            ) : (
              <button className="primary" disabled={money < p.fees} onClick={g.payFees}>Pay {formatNaira(p.fees)}</button>
            )}
          </div>
          <div className="contact">
            <span>📝 Lectures attended {sc.lectures}/{LECTURES_PER_LEVEL}</span>
            <div className="bar thin"><div className="fill good" style={{ width: `${(sc.lectures / LECTURES_PER_LEVEL) * 100}%` }} /></div>
          </div>
          <div className="contact">
            <span>📖 Library reading {sc.study}/{MAX_STUDY}</span>
            <div className="bar thin"><div className="fill good" style={{ width: `${(sc.study / MAX_STUDY) * 100}%` }} /></div>
            <span className="muted small">More lectures and reading = better grade. Below GP {PASS_GP} na carryover.</span>
          </div>
        </div>
      )}
      <button className="primary" style={{ width: '100%' }} onClick={go}>🧭 Waka go UniAbuja</button>

      {sc.results.length > 0 && (
        <>
          <div className="love-section">📄 Results</div>
          <div className="list">
            {sc.results.map((gp, i) => (
              <div key={i} className="contact">
                <span>Exam {i + 1}</span>
                <span className={gp < PASS_GP ? 'school-fail' : 'muted small'}>GP {gp.toFixed(2)}{gp < PASS_GP ? ' · carryover' : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="muted small">Classes of degree: {CLASSES.map((c) => `${c.name} ${c.min ? `≥${c.min}` : ''}`).join(' · ')}</p>
    </>
  );
}
