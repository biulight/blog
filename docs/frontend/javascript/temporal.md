---
title: Temporal：现代日期、时间与时区 API
description: 使用 Temporal 正确表达日期、时刻、时区和日历，并逐步在前端采用。
sidebar_position: 3
---

# Temporal：现代日期、时间与时区 API

当应用要处理“某地的 9:30”“下个月的同一天”或夏令时切换时，`Temporal` 比 `Date` 更适合表达业务含义：日期、时刻、时区和日历分别使用不同类型，避免无意中把业务日期转换到另一天。

`Temporal` 是独立的现代时间 API 专题，并非 [ES2026 的 8 项 ECMA-262 新能力](./es2026)。标准提案与实现进度以 [TC39 Temporal 仓库](https://github.com/tc39/proposal-temporal)为准；上线前必须按目标运行时实际测试。

## 先选对时间类型

| 业务含义 | 使用的类型 | 示例 |
| --- | --- | --- |
| 唯一时间点，例如事件日志 | `Temporal.Instant` | `2026-08-23T01:30:00Z` |
| 只表示日期，例如生日、账期 | `Temporal.PlainDate` | `2026-08-23` |
| 不带时区的当地日期和时间，例如表单输入 | `Temporal.PlainDateTime` | `2026-08-23T09:30` |
| 已知时区的当地时间，例如上海会议 | `Temporal.ZonedDateTime` | `2026-08-23T09:30+08:00[Asia/Shanghai]` |
| 两个时间的间隔 | `Temporal.Duration` | `{ days: 3, hours: 2 }` |

时间点的保存、排序和跨时区传输使用 `Instant`；“只是某一天”的业务字段使用 `PlainDate`，不要先创建 `Date` 再格式化。

## 常用写法

### 业务日期：避免时区偏移

```js
const billingDate = Temporal.PlainDate.from('2026-08-23');
const nextMonth = billingDate.add({ months: 1 });

console.log(nextMonth.toString()); // 2026-09-23
```

`PlainDate` 没有时区和具体时刻，适合账期、生日和假期；它不会因浏览器或服务器所在时区不同而偏移一天。

### 带时区的预约：保留当地墙上时间

```js
const appointment = Temporal.ZonedDateTime.from(
  '2026-08-23T09:30:00+08:00[Asia/Shanghai]',
);

console.log(appointment.toInstant().toString());
// 2026-08-23T01:30:00Z
```

IANA 时区标识（如 `Asia/Shanghai`）用于处理历史规则和夏令时；偏移量用于校验输入的具体瞬间。对于会切换夏令时的地区，不要用固定 `+08:00` 一类偏移量代替时区标识。

### 显示时再本地化

```js
const instant = Temporal.Instant.from('2026-08-23T01:30:00Z');

const text = instant.toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  dateStyle: 'full',
  timeStyle: 'short',
});
```

在 API 与数据库边界保存或传输 `Instant`，仅在界面边界传入目标 `timeZone` 与语言区域格式化。

## 与 `Intl.Locale` 配合

`Intl.Locale` 的区域信息接口属于独立的 ECMA-402 国际化标准。它可查询周起始日、周末、文本方向、偏好的日历和时区，适用于日历组件与多语言界面。

```js
const locale = new Intl.Locale('zh-CN');

console.log(locale.getWeekInfo());
// 例如：{ firstDay: 1, weekend: [6, 7], minimalDays: 1 }

console.log(locale.getTextInfo());
// { direction: 'ltr' }
```

可用方法包括 `getCalendars()`、`getCollations()`、`getHourCycles()`、`getNumberingSystems()`、`getTextInfo()`、`getTimeZones()` 和 `getWeekInfo()`。它们的区域数据来自运行时实现，不应把某一个地区的返回值硬编码为全局业务规则。[Intl Locale Info 提案](https://github.com/tc39/proposal-intl-locale-info)说明了 API 范围。

## 兼容性与渐进采用

截至 2026-08-23，Temporal 提案仓库列出的已发布实现包括 Firefox 139、Chrome 144 与 Node.js 26；Safari 尚未列为已发布实现。面向多个浏览器版本时应先检测，再决定是否加载 polyfill：

```js
export async function getTemporal() {
  if ('Temporal' in globalThis) return globalThis.Temporal;

  const { Temporal } = await import('@js-temporal/polyfill');
  return Temporal;
}
```

这要求项目已安装 `@js-temporal/polyfill`，且构建工具能处理动态导入。不要在未确认支持范围时直接替换所有 `Date` 调用。

## 迁移建议

1. 为新字段先定义语义：日期、当地时间、带时区时间或唯一瞬间。
2. API 的时间点使用 ISO 8601 UTC 字符串；日期字段使用 `YYYY-MM-DD`，并注明它不含时区。
3. 对夏令时地区测试春季跳过时间、秋季重复时间，以及跨月、跨年运算。
4. 在与现有库或平台 API 交互时才转换 `Date`，避免在业务层混用两套时间语义。

## 相关资料

- [Temporal 提案与运行时实现状态](https://github.com/tc39/proposal-temporal)
- [Temporal API 概览（MDN）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)
- [ECMA-402 国际化规范](https://402.ecma-international.org/)
