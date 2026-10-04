import { CARS, carById, repairCost, RESALE } from '../content/cars';
import { formatNaira } from '../engine/clock';
import { useGame } from '../store/game';

export function CarsApp() {
  const car = useGame((s) => s.car);
  const money = useGame((s) => s.money);
  const buy = useGame((s) => s.buyCar);
  const sell = useGame((s) => s.sellCar);
  const repair = useGame((s) => s.repairCar);
  const mine = car ? carById(car.id) : undefined;
  const tradeIn = mine ? Math.round(mine.price * RESALE) : 0;
  return (
    <>
      {mine && car ? (
        <div className="balance">
          <div className="muted small">Your car</div>
          <div className="balance-amt" style={{ fontSize: 22 }}>{mine.emoji} {mine.name}</div>
          <div className="small">Condition {car.condition}%</div>
          <div className="bar thin"><div className={`fill ${car.condition < 40 ? 'bad' : car.condition < 70 ? 'mid' : 'good'}`} style={{ width: `${car.condition}%` }} /></div>
          <div className="share-buttons">
            <button className="primary" disabled={car.condition >= 100 || money < repairCost(car.condition)} onClick={repair}>🔧 Service {formatNaira(repairCost(car.condition))}</button>
            <button className="ghost" onClick={sell}>🤝 Sell</button>
          </div>
          <div className="muted small">Drive anywhere from 🗺️ Map (you pay only fuel), or do "Drive for ride app" for 💼 Jobs.</div>
        </div>
      ) : (
        <p className="muted small">Own car mean say: no more bus, real Packaging 👔, and you fit drive for ride app make money. But fuel, VIO and mechanic go dey find you 😅</p>
      )}
      <div className="list">
        {CARS.filter((c) => c.id !== car?.id).map((c) => {
          const cost = c.price - tradeIn;
          return (
            <button key={c.id} className="action" disabled={cost > money} onClick={() => buy(c.id)}>
              <span className="action-emoji">{c.emoji}</span>
              <span className="action-body">
                <span>{c.name}</span>
                <span className="muted small">{c.blurb}</span>
                <span className="muted small">{formatNaira(c.price)}{mine ? ` · pay ${formatNaira(cost)} after trade-in` : ''} · 👔 +{c.packaging - (mine?.packaging ?? 0)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
