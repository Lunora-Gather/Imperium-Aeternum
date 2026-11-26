import type { TurnReport } from '../types/game';

export function operatingNet(report: TurnReport): number {
  return report.income.tax + report.income.trade + report.income.building
    - report.expense.military - report.expense.corruption;
}
