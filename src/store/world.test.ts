import { beforeEach, describe, expect, it } from 'vitest';
import { CELL_X, HOME_CELLS, PLACE_CELLS } from '../content/worldmap';
import { HOME_PARK, live, useGame } from './game';

/** Walk the planned route to the end, as the avatar would. */
function walkAll() {
  for (let i = 0; i < 50 && useGame.getState().target; i++) useGame.getState().arrive(useGame.getState().target!);
}

describe('walking and driving round Abuja', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.getState().start('Ada', '#222');
    live.pos = null;
    useGame.setState({ area: 'kubwa', place: 'street', pos: [0, 2], nextEventCheck: Infinity, active: null });
  });

  it('crossing a block edge moves you onto the road and shifts your position', () => {
    useGame.getState().shiftCell(1, 0);
    const s = useGame.getState();
    expect(s.place).toBe('road');
    expect(s.cell).toEqual([HOME_CELLS.kubwa[0] + 1, HOME_CELLS.kubwa[1]]);
    expect(s.pos).toEqual([-CELL_X, 2]);
    expect(s.near).toBe('street');
  });

  it('walking into a place block puts you in that place', () => {
    // From Kubwa (0,0): one block east, then one south is Jabi (1,1)
    useGame.getState().shiftCell(1, 0);
    useGame.getState().shiftCell(0, 1);
    expect(PLACE_CELLS.jabi).toEqual([1, 1]);
    expect(useGame.getState().place).toBe('jabi');
    expect(useGame.getState().cell).toBeNull();
  });

  it('you cannot walk off the edge of the city', () => {
    useGame.getState().shiftCell(-1, 0);
    expect(useGame.getState().place).toBe('street');
  });

  it('get in the car at your gate, drive, burn fuel, and park on the road', () => {
    useGame.setState({ car: { id: 'corolla', condition: 100, fuel: 20 }, pos: HOME_PARK });
    useGame.getState().enterCar();
    expect(useGame.getState().driving).toBe(true);
    useGame.getState().walkTo(30, 7);
    walkAll();
    const s = useGame.getState();
    expect(s.car!.fuel!).toBeLessThan(20);
    useGame.getState().parkCar();
    const p = useGame.getState();
    expect(p.driving).toBe(false);
    expect(p.parked?.cell).toEqual(HOME_CELLS.kubwa);
  });

  it('when the car is far, you walk to it first', () => {
    useGame.setState({ car: { id: 'corolla', condition: 100, fuel: 20 }, pos: [10, 2] });
    useGame.getState().enterCar();
    expect(useGame.getState().driving).toBe(false);
    expect(useGame.getState().pending).toBe('__car');
    walkAll();
    expect(useGame.getState().driving).toBe(true);
  });

  it('no fuel, no driving', () => {
    useGame.setState({ car: { id: 'corolla', condition: 100, fuel: 0 }, pos: HOME_PARK });
    useGame.getState().enterCar();
    expect(useGame.getState().driving).toBe(false);
  });
});
