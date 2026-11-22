"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { compute } = require("./calc.js");

function state(overrides) {
  return {
    names: ["Person 1", "Person 2", "Person 3"],
    price: 10,
    cases: 50,
    print: 0,
    paid: [50, 0, 0],
    pct: [40, 40, 20],
    weeks: [{ sold: [1, 1, 1], eff: [1, 1, 1] }],
    ...overrides
  };
}

test("revenue below outstanding costs pays back proportionally and carries the balance", () => {
  const result = compute(state({
    paid: [80, 20, 0],
    weeks: [
      { sold: [1, 0, 0], eff: [1, 0, 0] },
      { sold: [1, 0, 0], eff: [1, 0, 0] }
    ]
  }));
  assert.equal(result.weeks[0].payback, 10);
  assert.equal(result.weeks[0].pool, 0);
  assert.equal(result.weeks[0].people[0].paidBack, 8);
  assert.equal(result.weeks[0].people[1].paidBack, 2);
  assert.equal(result.weeks[1].people[0].paidBack, 8);
  assert.equal(result.weeks[1].people[1].paidBack, 2);
  assert.equal(result.people[0].owed + result.people[1].owed, 80);
});

test("zero effort divides the effort share equally", () => {
  const result = compute(state({
    paid: [0, 0, 0],
    pct: [0, 100, 0],
    weeks: [{ sold: [1, 0, 0], eff: [0, 0, 0] }]
  }));
  assert.deepEqual(result.weeks[0].people.map((person) => person.effortShare), [10 / 3, 10 / 3, 10 / 3]);
});

test("zero total money invested divides the money share equally", () => {
  const result = compute(state({
    paid: [0, 0, 0],
    pct: [0, 0, 100],
    weeks: [{ sold: [1, 0, 0], eff: [0, 0, 0] }]
  }));
  assert.deepEqual(result.weeks[0].people.map((person) => person.moneyShare), [10 / 3, 10 / 3, 10 / 3]);
});

test("weekly payouts add up to revenue when all profit weights are distributed", () => {
  const result = compute(state({
    paid: [0, 0, 0],
    weeks: [
      { sold: [3, 2, 1], eff: [2, 1, 3] },
      { sold: [1, 2, 0], eff: [0, 0, 0] }
    ]
  }));
  for (const [index, week] of result.weeks.entries()) {
    const payoutTotal = week.people.reduce((sum, person) => sum + person.total, 0);
    assert.ok(Math.abs(payoutTotal - week.revenue) < 1e-10, `week ${index + 1} payouts should equal revenue`);
  }
  assert.ok(Math.abs(result.totalEarned - result.revenueTotal) < 1e-10);
});
