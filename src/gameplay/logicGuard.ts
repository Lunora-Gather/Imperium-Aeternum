// 兼容旧调用方。正式 processTurn 已负责输入隔离、报告生成和规则修复，
// 不再在引擎之后叠加第二套补偿逻辑。

export { processTurn as processTurnSafe } from '../engine/turn';
