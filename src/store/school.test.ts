import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activityById } from '../content/activities';
import { cgpaOf, degreeClass, examGrade, gradPay, jambScore, LECTURES_PER_LEVEL, programmeById, schoolBlock } from '../content/school';
import { blockReason, useGame } from './game';

const done = (id: string) => {
  // Run an activity to the end the way the game does: start it, then finish it
  const a = activityById(id)!;
  useGame.setState({ place: 'uniabuja', pos: a.spot ?? [0, 0], target: null, route: [], active: null, time: 3 * 1440 + 10 * 60 });
  useGame.getState().choose(id);
  for (let i = 0; i < 5 && useGame.getState().target; i++) useGame.getState().arrive(useGame.getState().target!);
  const act = useGame.getState().active;
  expect(act?.id, `${id}: ${blockReason(a, useGame.getState())}`).toBe(id);
  useGame.setState({ active: { ...act!, remaining: 0.01 } });
  useGame.getState().tick(1);
};

describe('UniAbuja', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.getState().start('Ada', '#222');
    useGame.setState({ money: 5_000_000, nextEventCheck: Infinity, time: 3 * 1440 + 10 * 60, minigame: null });
  });
  afterEach(() => vi.restoreAllMocks());

  it('JAMB scores go up with CV and stay within 100–400', () => {
    expect(jambScore(0, () => 0)).toBe(140);
    expect(jambScore(40, () => 1)).toBe(370);
    expect(jambScore(999, () => 1)).toBeLessThanOrEqual(400);
  });

  it('exam grade rewards attendance and reading', () => {
    const lazy = examGrade({ lectures: 1, study: 0 }, 0, () => 0.5);
    const serious = examGrade({ lectures: LECTURES_PER_LEVEL, study: 3 }, 50, () => 0.5);
    expect(serious).toBeGreaterThan(lazy);
    expect(serious).toBeLessThanOrEqual(5);
  });

  it('class of degree and graduate pay', () => {
    expect(degreeClass(4.6).name).toBe('First Class');
    expect(degreeClass(3.0).name).toBe('Second Class Lower');
    expect(gradPay(50000, { level: 4, feesPaid: true, lectures: 0, study: 0, results: [], graduated: { programme: 'cs', cgpa: 4.7 } })).toBe(67500);
    expect(cgpaOf([4, 1, 3])).toBe(3.5);
  });

  it('no lectures without admission and fees; strike blocks lectures, not library', () => {
    expect(schoolBlock(undefined, 'lecture', 1)).toMatch(/admission/);
    const sc = { programme: 'cs' as const, level: 1, feesPaid: false, lectures: 0, study: 0, results: [] };
    expect(schoolBlock(sc, 'lecture', 1)).toMatch(/fees/);
    expect(schoolBlock({ ...sc, feesPaid: true, strikeUntil: 5 }, 'lecture', 3)).toMatch(/ASUU/);
    expect(schoolBlock({ ...sc, feesPaid: true, strikeUntil: 5 }, 'study', 3)).toBeUndefined();
  });

  it('from JAMB to convocation to a graduate job', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    useGame.setState({ cv: 40 });
    done('jamb');
    const jamb = useGame.getState().school!.jamb!;
    expect(jamb).toBeGreaterThanOrEqual(200);
    useGame.getState().admit('cs');
    const p = programmeById('cs')!;
    for (let level = 1; level <= p.years; level++) {
      useGame.getState().payFees();
      expect(useGame.getState().school!.feesPaid).toBe(true);
      for (let i = 0; i < LECTURES_PER_LEVEL; i++) done('uni-lecture');
      for (let i = 0; i < 3; i++) done('library-read');
      done('uni-exam');
    }
    expect(useGame.getState().school!.finalist).toBe(true);
    done('convocation');
    const sc = useGame.getState().school!;
    expect(sc.graduated?.programme).toBe('cs');
    expect(degreeClass(sc.graduated!.cgpa).name).toBe('First Class');
    expect(useGame.getState().skills).toContain('degree');
    expect(blockReason(activityById('grad-cs')!, { ...useGame.getState(), time: 4 * 1440 + 8 * 60 })).toBeFalsy();
    expect(blockReason(activityById('grad-law')!, { ...useGame.getState(), time: 4 * 1440 + 8 * 60 })).toMatch(/LL.B/);
  });

  it('a bad exam means carryover: same level, pay fees again', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    // All lectures but no library, no luck: GP 1.25
    useGame.setState({ fitness: 0, school: { jamb: 300, programme: 'law', level: 2, feesPaid: true, lectures: LECTURES_PER_LEVEL, study: 0, results: [3] } });
    done('uni-exam');
    const after = useGame.getState().school!;
    expect(after.results).toEqual([3, 1.25]);
    expect(after.level).toBe(2);
    expect(after.feesPaid).toBe(false);
    expect(after.lectures).toBe(0);
  });
});
