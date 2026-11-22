(function (root) {
  "use strict";

  function compute(state) {
    const peopleCount = 3;
    const paid = state.paid.map((amount) => Number(amount) || 0);
    const owed = paid.slice();
    const pct = state.pct.map((amount) => Number(amount) || 0);
    const pctSum = pct.reduce((sum, amount) => sum + amount, 0) || 1;
    const weights = pct.map((amount) => amount / pctSum);
    const totalPaid = paid.reduce((sum, amount) => sum + amount, 0);
    const overall = paid.map(() => ({ totalEarned: 0, piecesSold: 0 }));
    let revenueTotal = 0;

    const weeks = state.weeks.map((week) => {
      const sold = week.sold.map((amount) => Number(amount) || 0);
      const effort = week.eff.map((amount) => Number(amount) || 0);
      const soldTotal = sold.reduce((sum, amount) => sum + amount, 0);
      const effortTotal = effort.reduce((sum, amount) => sum + amount, 0);
      const revenue = soldTotal * state.price;
      const owedTotal = owed.reduce((sum, amount) => sum + amount, 0);
      const paybackTotal = Math.min(revenue, owedTotal);
      const pool = revenue - paybackTotal;
      const people = sold.map((pieces, index) => {
        const paidBack = owedTotal > 0 ? paybackTotal * owed[index] / owedTotal : 0;
        owed[index] -= paidBack;

        const salesShare = soldTotal > 0
          ? pool * weights[0] * pieces / soldTotal
          : 0;
        const effortShare = effortTotal > 0
          ? pool * weights[1] * effort[index] / effortTotal
          : pool * weights[1] / peopleCount;
        const moneyShare = totalPaid > 0
          ? pool * weights[2] * paid[index] / totalPaid
          : pool * weights[2] / peopleCount;
        const total = paidBack + salesShare + effortShare + moneyShare;

        overall[index].totalEarned += total;
        overall[index].piecesSold += pieces;
        return { paidBack, salesShare, effortShare, moneyShare, total };
      });

      revenueTotal += revenue;
      return {
        revenue,
        payback: paybackTotal,
        pool,
        soldTotal,
        effortTotal,
        topSellerIndex: soldTotal > 0 ? sold.indexOf(Math.max.apply(null, sold)) : -1,
        people
      };
    });

    return {
      weeks,
      people: overall.map((person, index) => ({
        totalEarned: person.totalEarned,
        piecesSold: person.piecesSold,
        owed: Math.max(0, owed[index])
      })),
      revenueTotal,
      totalEarned: overall.reduce((sum, person) => sum + person.totalEarned, 0)
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { compute };
  } else {
    root.computePayouts = compute;
  }
}(typeof globalThis === "undefined" ? this : globalThis));
